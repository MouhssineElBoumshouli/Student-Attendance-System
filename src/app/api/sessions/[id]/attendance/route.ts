import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateQrToken } from "@/lib/qr/validate";
import { isWithinGeofence } from "@/lib/geo/validate";
import { submitAttendanceSchema, updateAttendanceSchema, parseBody } from "@/lib/validations";
import { requireApiAuth, requireApiRole } from "@/lib/api-auth";
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
 * Student scans QR code and submits attendance.
 * The studentId is taken from the authenticated session — the client
 * cannot mark someone else present by submitting a different id.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiRole(["STUDENT"]);
  if ("error" in auth) return auth.error;

  const studentId = auth.session.user.studentId;
  if (!studentId) {
    return NextResponse.json(
      { error: "Compte étudiant introuvable" },
      { status: 403 }
    );
  }

  const { id: sessionId } = await params;

  try {
    const body = await req.json();
    const parsed = parseBody(submitAttendanceSchema, body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error },
        { status: 400 }
      );
    }

    const { token, timestamp, latitude, longitude, deviceInfo } = parsed.data;

    // 1. Check session exists and is active
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

    if (session.status !== "ACTIVE" || !session.qrSecret) {
      return NextResponse.json(
        { error: "Cette séance n'est pas active" },
        { status: 400 }
      );
    }

    // 2. Validate QR token (HMAC check)
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

    // 3. Check student has an attendance record for this session
    const attendance = await prisma.attendance.findUnique({
      where: {
        sessionId_studentId: { sessionId, studentId },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Vous n'êtes pas inscrit à cette séance" },
        { status: 403 }
      );
    }

    if (attendance.status === "PRESENT" || attendance.status === "LATE") {
      return NextResponse.json(
        { error: "Présence déjà enregistrée", alreadyPresent: true },
        { status: 409 }
      );
    }

    // 4. Geolocation check
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
      // No GPS provided — mark as unverified but still record
      verified = false;
    }

    // 5. Device fingerprint
    const deviceHash = deviceInfo
      ? crypto.createHash("sha256").update(deviceInfo).digest("hex").substring(0, 16)
      : null;

    // 6. Check for device sharing (same device hash for different students in same session)
    if (deviceHash) {
      const sameDevice = await prisma.attendance.findFirst({
        where: {
          sessionId,
          deviceHash,
          studentId: { not: studentId },
          status: { in: ["PRESENT", "LATE"] },
        },
      });

      if (sameDevice) {
        // Flag as unverified but still record — professor will review
        verified = false;
      }
    }

    // 7. Determine status (PRESENT or LATE)
    const now = new Date();
    const sessionStart = new Date(session.startTime);
    const lateThresholdMs = 15 * 60 * 1000; // 15 minutes
    const isLate = now.getTime() - sessionStart.getTime() > lateThresholdMs;

    // 8. Update attendance record
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;

    await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        status: isLate ? "LATE" : "PRESENT",
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
      status: isLate ? "LATE" : "PRESENT",
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

  // Look up first to verify the record belongs to this session — Prisma's
  // `update.where` only accepts a unique input so we can't filter on
  // `sessionId` directly.
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
