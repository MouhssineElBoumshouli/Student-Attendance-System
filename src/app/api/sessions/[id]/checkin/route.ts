import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isWithinGeofence } from "@/lib/geo/validate";
import { selfCheckinSchema, parseBody } from "@/lib/validations";
import { requireApiRole } from "@/lib/api-auth";
import { isSessionOpen } from "@/lib/session-status";
import crypto from "crypto";

/**
 * POST /api/sessions/[id]/checkin
 *
 * Self check-in via the "Je suis là" button. No QR token required — the
 * student opens the app inside the room, taps the button, and the app
 * sends GPS + device fingerprint + selfie.
 *
 * Four verification layers run in parallel; FAILING ANY OF THEM DOES NOT
 * REJECT THE CHECK-IN. Instead, the attendance is recorded as
 * "non vérifié" with the failed-flag set, and the professor reviews it
 * at the end of class. This avoids punishing honest students with
 * unreliable indoor GPS or first-time device usage.
 *
 *   L1 — GPS geofence (room.radius)
 *   L2 — Trusted device binding (first check-in binds, later compares)
 *   L3 — One device per session (different student, same fingerprint
 *        within the same session → both flagged)
 *   L4 — Selfie capture (no automatic match; stored for prof review)
 *
 * Routes for both students and professors. Role is read from the JWT.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiRole(["STUDENT", "PROFESSOR"]);
  if ("error" in auth) return auth.error;

  const { id: sessionId } = await params;

  try {
    const body = await req.json();
    const parsed = parseBody(selfCheckinSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { latitude, longitude, deviceInfo, selfie } = parsed.data;

    // ── 1. Session must exist and be in its active window ─────────────
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { room: true },
    });
    if (!session) {
      return NextResponse.json(
        { error: "Séance non trouvée" },
        { status: 404 }
      );
    }
    if (!isSessionOpen(session)) {
      return NextResponse.json(
        { error: "Cette séance n'est pas active" },
        { status: 400 }
      );
    }

    // ── 2. Verification layers (collect flags, don't fail) ────────────
    const flags: string[] = [];
    let verified = true;
    let geoDistance: number | null = null;

    // L1 — GPS geofence
    if (latitude == null || longitude == null) {
      flags.push("GPS_UNAVAILABLE");
      verified = false;
    } else {
      const geo = isWithinGeofence(
        latitude,
        longitude,
        session.room.latitude,
        session.room.longitude,
        session.room.radius
      );
      geoDistance = geo.distance;
      if (!geo.withinRange) {
        flags.push("GPS_OUT_OF_RANGE");
        verified = false;
      }
    }

    // L4 — Selfie (only flag, never reject)
    if (!selfie) {
      flags.push("NO_SELFIE");
      verified = false;
    }

    const deviceHash = deviceInfo
      ? crypto.createHash("sha256").update(deviceInfo).digest("hex").substring(0, 16)
      : null;

    // L3 — One device per session
    if (deviceHash) {
      const sameDeviceOther = await prisma.attendance.findFirst({
        where: {
          sessionId,
          deviceHash,
          status: { in: ["PRESENT", "LATE"] },
          ...(auth.session.user.studentId
            ? { studentId: { not: auth.session.user.studentId } }
            : {}),
        },
      });
      if (sameDeviceOther) {
        flags.push("DEVICE_SHARED");
        verified = false;
      }
    }

    // ── 3. Late/On-time determination ─────────────────────────────────
    const now = new Date();
    const sessionStart = new Date(session.startTime);
    const lateThresholdMs = 15 * 60 * 1000;
    const isLate = now.getTime() - sessionStart.getTime() > lateThresholdMs;
    const newStatus = isLate ? "LATE" : "PRESENT";
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;

    // ── 4. Branch on role ─────────────────────────────────────────────
    if (auth.session.user.role === "PROFESSOR") {
      const professorId = auth.session.user.professorId;
      if (session.professorId !== professorId) {
        return NextResponse.json(
          { error: "Cette séance ne vous appartient pas" },
          { status: 403 }
        );
      }
      if (session.professorStatus === "PRESENT" || session.professorStatus === "LATE") {
        return NextResponse.json(
          { error: "Présence déjà enregistrée", alreadyPresent: true },
          { status: 409 }
        );
      }

      // L2 — Trusted device binding (for professor)
      if (professorId && deviceHash) {
        const profRecord = await prisma.professor.findUnique({
          where: { id: professorId },
          select: { trustedDeviceHash: true },
        });
        if (!profRecord?.trustedDeviceHash) {
          await prisma.professor.update({
            where: { id: professorId },
            data: { trustedDeviceHash: deviceHash, trustedDeviceAt: now },
          });
        } else if (profRecord.trustedDeviceHash !== deviceHash) {
          flags.push("DEVICE_MISMATCH");
          verified = false;
        }
      }

      await prisma.session.update({
        where: { id: sessionId },
        data: {
          professorStatus: newStatus,
          professorScannedAt: now,
          professorLatitude: latitude ?? null,
          professorLongitude: longitude ?? null,
          professorDeviceHash: deviceHash,
          professorVerified: verified,
          professorVerificationFlags: flags.length > 0 ? flags.join(",") : null,
          professorSelfie: selfie || null,
        },
      });
      return NextResponse.json({
        success: true,
        role: "PROFESSOR",
        status: newStatus,
        verified,
        flags,
        distance: geoDistance,
        message: verified
          ? `Présence enregistrée${isLate ? " (en retard)" : ""}`
          : "Présence enregistrée — sera vérifiée par votre tableau de bord",
      });
    }

    // ─── Student branch ───────────────────────────────────────────────
    const studentId = auth.session.user.studentId;
    if (!studentId) {
      return NextResponse.json(
        { error: "Compte étudiant introuvable" },
        { status: 403 }
      );
    }

    // L2 — Trusted device binding (for student)
    if (deviceHash) {
      const stuRecord = await prisma.student.findUnique({
        where: { id: studentId },
        select: { trustedDeviceHash: true },
      });
      if (!stuRecord?.trustedDeviceHash) {
        await prisma.student.update({
          where: { id: studentId },
          data: { trustedDeviceHash: deviceHash, trustedDeviceAt: now },
        });
      } else if (stuRecord.trustedDeviceHash !== deviceHash) {
        flags.push("DEVICE_MISMATCH");
        verified = false;
      }
    }

    // Enrollment check + already-present check
    const existing = await prisma.attendance.findUnique({
      where: { sessionId_studentId: { sessionId, studentId } },
    });
    if (!existing) {
      const enrolled = await prisma.studentGroup.findFirst({
        where: {
          studentId,
          group: { courses: { some: { courseId: session.courseId } } },
        },
      });
      if (!enrolled) {
        return NextResponse.json(
          { error: "Vous n'êtes pas inscrit à ce cours" },
          { status: 403 }
        );
      }
    } else if (existing.status === "PRESENT" || existing.status === "LATE") {
      return NextResponse.json(
        { error: "Présence déjà enregistrée", alreadyPresent: true },
        { status: 409 }
      );
    }

    await prisma.attendance.upsert({
      where: { sessionId_studentId: { sessionId, studentId } },
      create: {
        sessionId,
        studentId,
        status: newStatus,
        scannedAt: now,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        deviceHash,
        ipAddress,
        verified,
        verificationFlags: flags.length > 0 ? flags.join(",") : null,
        selfiePhoto: selfie || null,
      },
      update: {
        status: newStatus,
        scannedAt: now,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        deviceHash,
        ipAddress,
        verified,
        verificationFlags: flags.length > 0 ? flags.join(",") : null,
        selfiePhoto: selfie || null,
      },
    });

    return NextResponse.json({
      success: true,
      role: "STUDENT",
      status: newStatus,
      verified,
      flags,
      distance: geoDistance,
      message: verified
        ? `Présence enregistrée${isLate ? " (en retard)" : ""}`
        : "Présence enregistrée — sera vérifiée par votre professeur",
    });
  } catch (error) {
    console.error("Self check-in error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement" },
      { status: 500 }
    );
  }
}
