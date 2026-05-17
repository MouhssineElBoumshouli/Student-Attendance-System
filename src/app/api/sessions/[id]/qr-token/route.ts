import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQrToken } from "@/lib/qr/generate";
import { requireApiRole } from "@/lib/api-auth";

/**
 * GET /api/sessions/[id]/qr-token
 *
 * Returns the current QR token for an active session. Only the session's
 * owning professor (or an admin) may read it — otherwise students could
 * fetch the live token directly and skip the camera.
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
    select: { qrSecret: true, qrRotationSec: true, status: true, professorId: true },
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

  if (session.status !== "ACTIVE" || !session.qrSecret) {
    return NextResponse.json({ closed: true, reason: "Session terminée" });
  }

  const { token, timestamp, expiresAt } = generateQrToken(
    session.qrSecret,
    session.qrRotationSec
  );

  const payload = JSON.stringify({
    s: id,
    t: token,
    ts: timestamp,
  });

  return NextResponse.json({
    payload,
    expiresAt,
    intervalSec: session.qrRotationSec,
  });
}
