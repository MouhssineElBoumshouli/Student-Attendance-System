import crypto from "crypto";
import { TOKEN_LENGTH, TOKEN_TOLERANCE_WINDOWS, MAX_CLOCK_SKEW_SEC } from "./constants";

/**
 * Validate a QR token submitted by a student.
 *
 * Checks both the current time window and previous windows
 * (controlled by TOKEN_TOLERANCE_WINDOWS) to handle:
 * - Students scanning at the boundary between two windows
 * - Minor clock skew between server and client
 *
 * @param secret - The session's secret
 * @param intervalSec - Rotation interval in seconds
 * @param submittedToken - The token the student scanned
 * @param clientTimestamp - The timestamp from the student's device (seconds)
 * @returns true if the token is valid
 */
export function validateQrToken(
  secret: string,
  intervalSec: number,
  submittedToken: string,
  clientTimestamp: number
): boolean {
  const now = Math.floor(Date.now() / 1000);

  // Check clock skew
  if (Math.abs(now - clientTimestamp) > MAX_CLOCK_SKEW_SEC) {
    return false;
  }

  const serverCounter = Math.floor(now / intervalSec);

  // Check current window + tolerance windows back
  for (let i = 0; i <= TOKEN_TOLERANCE_WINDOWS; i++) {
    const counter = serverCounter - i;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(counter.toString());
    const expected = hmac.digest("hex").substring(0, TOKEN_LENGTH);

    // Timing-safe comparison to prevent timing attacks
    if (
      submittedToken.length === expected.length &&
      crypto.timingSafeEqual(
        Buffer.from(submittedToken),
        Buffer.from(expected)
      )
    ) {
      return true;
    }
  }

  return false;
}
