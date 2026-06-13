import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { ACTIVE_CLOSE_BUFFER_MS } from "@/lib/session-status";

/**
 * GET /api/me/history
 *
 * Returns the connected student's attendance history in one query —
 * replaces the old client-side loop that fetched every session's
 * attendance list one request at a time.
 *
 * Only sessions whose active window has fully closed are returned:
 * future sessions materialized by schedule rules carry pre-created
 * ABSENT rows that aren't "history" yet.
 */
export async function GET() {
  const auth = await requireApiRole(["STUDENT"]);
  if ("error" in auth) return auth.error;

  const studentId = auth.session.user.studentId;
  if (!studentId) {
    return NextResponse.json({ error: "Compte étudiant introuvable" }, { status: 403 });
  }

  const closedBefore = new Date(Date.now() - ACTIVE_CLOSE_BUFFER_MS);

  const records = await prisma.attendance.findMany({
    where: {
      studentId,
      session: {
        endTime: { lt: closedBefore },
        status: { not: "CANCELLED" },
      },
    },
    select: {
      id: true,
      status: true,
      scannedAt: true,
      verified: true,
      session: {
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          course: { select: { name: true, code: true } },
          room: { select: { name: true } },
        },
      },
    },
    orderBy: { session: { date: "desc" } },
  });

  return NextResponse.json(records);
}
