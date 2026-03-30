import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQrToken } from "@/lib/qr/generate";

/**
 * GET /api/sessions/[id]/qr-token
 *
 * Returns the current QR token for an active session.
 * The professor's browser polls this endpoint every few seconds
 * to get the latest rotating token.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await prisma.session.findUnique({
    where: { id },
    select: { qrSecret: true, qrRotationSec: true, status: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Séance non trouvée" }, { status: 404 });
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
