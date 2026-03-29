import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateQrToken } from "@/lib/qr/validate";
import { isWithinGeofence } from "@/lib/geo/validate";
import crypto from "crypto";

/**
 * GET /api/sessions/[id]/attendance
 * Returns the attendance list for a session.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
 * Validates: token, geolocation, uniqueness, device fingerprint.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  try {
    const body = await req.json();
    const { token, timestamp, latitude, longitude, studentId, deviceInfo } = body;

    if (!token || !timestamp || !studentId) {
      return NextResponse.json(
        { error: "Donnees manquantes" },
        { status: 400 }
      );
    }

    // 1. Check session exists and is active
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { room: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Seance non trouvee" },
        { status: 404 }
      );
    }

    if (session.status !== "ACTIVE" || !session.qrSecret) {
      return NextResponse.json(
        { error: "Cette seance n'est pas active" },
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
        { error: "QR code expire ou invalide. Veuillez re-scanner." },
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
        { error: "Vous n'etes pas inscrit a cette seance" },
        { status: 403 }
      );
    }

    if (attendance.status === "PRESENT") {
      return NextResponse.json(
        { error: "Presence deja enregistree", alreadyPresent: true },
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
          status: "PRESENT",
        },
      });

      if (sameDevice) {
        // Flag both but still record — professor will review
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
        latitude: latitude || null,
        longitude: longitude || null,
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
        ? "Presence enregistree (en retard)"
        : "Presence enregistree avec succes",
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
 * Professor manually updates a student's attendance status.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const body = await req.json();
  const { attendanceId, status } = body;

  if (!attendanceId || !status) {
    return NextResponse.json({ error: "Donnees manquantes" }, { status: 400 });
  }

  const validStatuses = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const attendance = await prisma.attendance.update({
    where: { id: attendanceId, sessionId },
    data: { status, verified: true },
  });

  return NextResponse.json(attendance);
}
