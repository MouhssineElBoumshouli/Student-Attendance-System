import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateQrToken } from "@/lib/qr/validate";
import { isWithinGeofence } from "@/lib/geo/validate";
import { submitAttendanceSchema, updateAttendanceSchema, parseBody } from "@/lib/validations";
import { requireApiAuth, requireApiRole } from "@/lib/api-auth";
import { isSessionOpen } from "@/lib/session-status";
import crypto from "crypto";

/**
 * GET /api/sessions/[id]/attendance
 * Returns the attendance list for a session.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const attendances = await prisma.attendance.findMany({
    where: { sessionId: id },
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
    orderBy: { student: { user: { lastName: "asc" } } },
  });

  return NextResponse.json(attendances);
}

/**
 * POST /api/sessions/[id]/attendance
 *
 * Single endpoint that handles BOTH student and professor check-in.
 * The role is read from the JWT session, never from the body.
 *
 *   - STUDENT  → flips their own Attendance row to PRESENT/LATE
 *   - PROFESSOR → flips the Session's professorStatus to PRESENT/LATE
 *                 (only if it's their own session)
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
    const parsed = parseBody(submitAttendanceSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { token, timestamp, latitude, longitude, deviceInfo } = parsed.data;

    // ── 1. Session must exist and be in its active window ──────────────
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
    if (!isSessionOpen(session) || !session.qrSecret) {
      return NextResponse.json(
        { error: "Cette séance n'est pas active" },
        { status: 400 }
      );
    }

    // ── 2. QR token validation (same for prof and student) ─────────────
    const isTokenValid = validateQrToken(
      session.qrSecret,
      session.qrRotationSec,
      token,
      timestamp
    );
    if (!isTokenValid) {
      return NextResponse.json(
        { error: "QR code expiré ou invalide. Veuillez re-scanner." },
        { status: 400 }
      );
    }

    // ── 3. GPS geofence check (shared logic) ───────────────────────────
    let verified = true;
    let geoDistance: number | null = null;
    if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
      const geo = isWithinGeofence(
        latitude,
        longitude,
        session.room.latitude,
        session.room.longitude,
        session.room.radius
      );
      verified = geo.withinRange;
      geoDistance = geo.distance;
    } else {
      verified = false;
    }

    const deviceHash = deviceInfo
      ? crypto.createHash("sha256").update(deviceInfo).digest("hex").substring(0, 16)
      : null;
    const now = new Date();
    const sessionStart = new Date(session.startTime);
    const lateThresholdMs = 15 * 60 * 1000;
    const isLate = now.getTime() - sessionStart.getTime() > lateThresholdMs;
    const newStatus = isLate ? "LATE" : "PRESENT";

    // ── 4. Branch on role: professor vs student ────────────────────────
    if (auth.session.user.role === "PROFESSOR") {
      // Professor can only check in for their own session
      if (session.professorId !== auth.session.user.professorId) {
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
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          professorStatus: newStatus,
          professorScannedAt: now,
          professorLatitude: latitude ?? null,
          professorLongitude: longitude ?? null,
          professorDeviceHash: deviceHash,
          professorVerified: verified,
        },
      });
      return NextResponse.json({
        success: true,
        role: "PROFESSOR",
        status: newStatus,
        verified,
        distance: geoDistance,
        message: isLate
          ? "Présence enregistrée (en retard)"
          : "Présence enregistrée avec succès",
      });
    }

    // ── 5. Student branch ──────────────────────────────────────────────
    const studentId = auth.session.user.studentId;
    if (!studentId) {
      return NextResponse.json(
        { error: "Compte étudiant introuvable" },
        { status: 403 }
      );
    }

    // The attendance row may not exist yet if the session was generated
    // lazily — upsert covers both cases.
    const existing = await prisma.attendance.findUnique({
      where: { sessionId_studentId: { sessionId, studentId } },
    });

    if (!existing) {
      // Verify the student is actually enrolled in a group of this course
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

    // Device-sharing detection
    if (deviceHash) {
      const sameDevice = await prisma.attendance.findFirst({
        where: {
          sessionId,
          deviceHash,
          studentId: { not: studentId },
          status: { in: ["PRESENT", "LATE"] },
        },
      });
      if (sameDevice) verified = false;
    }

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;

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
      },
      update: {
        status: newStatus,
        scannedAt: now,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        deviceHash,
        ipAddress,
        verified,
      },
    });

    return NextResponse.json({
      success: true,
      role: "STUDENT",
      status: newStatus,
      verified,
      distance: geoDistance,
      message: isLate
        ? "Présence enregistrée (en retard)"
        : "Présence enregistrée avec succès",
    });
  } catch (error) {
    console.error("Attendance error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sessions/[id]/attendance
 * Professor or admin manually overrides a student's attendance status.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiRole(["ADMIN", "PROFESSOR"]);
  if ("error" in auth) return auth.error;

  const { id: sessionId } = await params;
  const body = await req.json();
  const parsed = parseBody(updateAttendanceSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { attendanceId, status } = parsed.data;

  const existing = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: { session: { select: { professorId: true } } },
  });
  if (!existing || existing.sessionId !== sessionId) {
    return NextResponse.json({ error: "Présence introuvable" }, { status: 404 });
  }
  if (
    auth.session.user.role === "PROFESSOR" &&
    existing.session.professorId !== auth.session.user.professorId
  ) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const updated = await prisma.attendance.update({
    where: { id: attendanceId },
    data: { status, verified: true },
  });
  return NextResponse.json(updated);
}
