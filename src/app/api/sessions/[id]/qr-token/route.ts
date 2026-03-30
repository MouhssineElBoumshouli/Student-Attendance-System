import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQrToken } from "@/lib/qr/generate";

/**
 * GET /api/sessions/[id]/qr-token
 *
 * Server-Sent Events (SSE) endpoint that streams rotating QR tokens.
 * The professor's browser connects to this and re-renders the QR code
 * each time a new token arrives.
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

  if (!session || session.status !== "ACTIVE" || !session.qrSecret) {
    return new Response(
      JSON.stringify({ error: "Séance non active" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const secret = session.qrSecret;
  const intervalSec = session.qrRotationSec;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendToken = () => {
        try {
          const { token, timestamp, expiresAt } = generateQrToken(secret, intervalSec);

          const payload = JSON.stringify({
            s: id,           // session ID
            t: token,        // HMAC token
            ts: timestamp,   // current timestamp (seconds)
          });

          const data = `data: ${JSON.stringify({ payload, expiresAt, intervalSec })}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          controller.close();
        }
      };

      // Send first token immediately
      sendToken();

      // Then send a new token every intervalSec seconds
      const interval = setInterval(sendToken, intervalSec * 1000);

      // Also check if session is still active every 30 seconds
      const statusCheck = setInterval(async () => {
        try {
          const current = await prisma.session.findUnique({
            where: { id },
            select: { status: true },
          });

          if (!current || current.status !== "ACTIVE") {
            const closeMsg = `data: ${JSON.stringify({ closed: true, reason: "Session terminée" })}\n\n`;
            controller.enqueue(encoder.encode(closeMsg));
            clearInterval(interval);
            clearInterval(statusCheck);
            controller.close();
          }
        } catch {
          // Ignore errors, will retry on next check
        }
      }, 30000);

      // Cleanup on abort
      _req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        clearInterval(statusCheck);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
