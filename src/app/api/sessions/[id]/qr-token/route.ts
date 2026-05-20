import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQrToken, generateSessionSecret } from "@/lib/qr/generate";
import { DEFAULT_ROTATION_SEC } from "@/lib/qr/constants";
import { requireApiRole } from "@/lib/api-auth";
import { effectiveStatus } from "@/lib/session-status";

/**
 * GET /api/sessions/[id]/qr-token
 *
 * Returns the current QR token for a session that's in its active window.
 * Status is derived from clock time (see session-status.ts). The QR secret
 * is generated lazily on the first call within the active window and stored
 * for the remainder of the session.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiRole(["ADMIN", "PROFESSOR"]);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const session = await prisma.session.findUnique({
    where: { id },
    select: {
      qrSecret: true,
      qrRotationSec: true,
      status: true,
      startTime: true,
      endTime: true,
      professorId: true,
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Séance non trouvée" }, { status: 404 });
  }

  if (
    auth.session.user.role === "PROFESSOR" &&
    session.professorId !== auth.session.user.professorId
  ) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const status = effectiveStatus(session);
  if (status !== "ACTIVE") {
    return NextResponse.json({
      closed: true,
      reason: status === "CANCELLED" ? "Séance annulée" : `Séance ${status.toLowerCase()}`,
      effectiveStatus: status,
    });
  }

  // Lazy-create secret on first qr-token call within the active window
  let qrSecret = session.qrSecret;
  let rotationSec = session.qrRotationSec;
  if (!qrSecret) {
    qrSecret = generateSessionSecret();
    rotationSec = DEFAULT_ROTATION_SEC;
    await prisma.session.update({
      where: { id },
      data: { qrSecret, qrRotationSec: rotationSec },
    });
  }

  const { token, timestamp, expiresAt } = generateQrToken(
    qrSecret,
    rotationSec
  );

  const payload = JSON.stringify({
    s: id,
    t: token,
    ts: timestamp,
  });

  return NextResponse.json({
    payload,
    expiresAt,
    intervalSec: rotationSec,
  });
}
