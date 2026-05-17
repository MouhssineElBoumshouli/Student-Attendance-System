import crypto from "crypto";
import { TOKEN_LENGTH } from "./constants";

/**
 * Generate a time-based QR token using HMAC-SHA256.
 * Similar to TOTP but adapted for attendance.
 *
 * The returned `timestamp` is the start of the current rotation window
 * (counter * intervalSec) so that the QR payload is stable for the full
 * window — the QR image doesn't have to re-render every poll.
 */
export function generateQrToken(
  secret: string,
  intervalSec: number
): { token: string; timestamp: number; expiresAt: number } {
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / intervalSec);
  const windowStart = counter * intervalSec;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(counter.toString());
  const token = hmac.digest("hex").substring(0, TOKEN_LENGTH);

  const expiresAt = (counter + 1) * intervalSec * 1000;

  return { token, timestamp: windowStart, expiresAt };
}

/**
 * Generate a new cryptographically random secret for a session.
 * @returns Hex-encoded 32-byte secret
 */
export function generateSessionSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}
