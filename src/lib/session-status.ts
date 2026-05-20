/**
 * Session status derivation.
 *
 * The database column `Session.status` is now used only for explicit overrides
 * (mainly "CANCELLED"). For SCHEDULED / ACTIVE / COMPLETED, status is computed
 * from the current clock time relative to startTime and endTime.
 *
 * Why: removes the need for a cron job to flip status, removes the manual
 * "Activer" / "Terminer" buttons from the happy path, and guarantees the
 * status is always consistent with the schedule.
 */

// How long before startTime the session opens for scans (gives the prof
// a moment to set up the room before students arrive)
export const ACTIVE_OPEN_OFFSET_MS = 5 * 60 * 1000; // 5 minutes early

// How long after endTime the session stays open (catches late finishers
// and gives the system a buffer to record everyone before closing)
export const ACTIVE_CLOSE_BUFFER_MS = 10 * 60 * 1000; // 10 minutes late

export type SessionStatus =
  | "SCHEDULED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";

export interface SessionTiming {
  startTime: Date | string;
  endTime: Date | string;
  /** The raw status field from the DB. Only "CANCELLED" is honored. */
  status?: string | null;
}

/**
 * Compute the current effective status of a session.
 */
export function effectiveStatus(
  session: SessionTiming,
  now: Date = new Date()
): SessionStatus {
  // Cancellation is the only DB-stored status we still respect
  if (session.status === "CANCELLED") return "CANCELLED";

  const start = new Date(session.startTime).getTime();
  const end = new Date(session.endTime).getTime();
  const t = now.getTime();

  if (t < start - ACTIVE_OPEN_OFFSET_MS) return "SCHEDULED";
  if (t > end + ACTIVE_CLOSE_BUFFER_MS) return "COMPLETED";
  return "ACTIVE";
}

/**
 * Is the session currently accepting scans?
 * Convenience predicate — equivalent to effectiveStatus() === "ACTIVE".
 */
export function isSessionOpen(
  session: SessionTiming,
  now: Date = new Date()
): boolean {
  return effectiveStatus(session, now) === "ACTIVE";
}

/**
 * Add `effectiveStatus` to a session object for sending to the client.
 */
export function withEffectiveStatus<T extends SessionTiming>(
  session: T,
  now: Date = new Date()
): T & { effectiveStatus: SessionStatus } {
  return { ...session, effectiveStatus: effectiveStatus(session, now) };
}
