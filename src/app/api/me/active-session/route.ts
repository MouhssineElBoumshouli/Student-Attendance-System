import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";
import { isSessionOpen, effectiveStatus } from "@/lib/session-status";

/**
 * GET /api/me/active-session
 *
 * Returns the session (if any) that is currently in its active window AND
 * that the connected user is involved in:
 *   - STUDENT  → enrolled in a group of the session's course
 *   - PROFESSOR → owns the session
 *   - ADMIN    → returns nothing (admins don't check in)
 *
 * Used by the /checkin page to surface the "Je suis là" button without
 * the user having to navigate or pick a session manually.
 */
export async function GET() {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const now = new Date();
  // Look at sessions whose endTime is reasonably close to now (avoid
  // scanning the full history).
  const windowStart = new Date(now.getTime() - 30 * 60 * 1000); // 30 min ago
  const windowEnd = new Date(now.getTime() + 30 * 60 * 1000);   // 30 min from now

  if (auth.session.user.role === "PROFESSOR") {
    const professorId = auth.session.user.professorId;
    if (!professorId) return NextResponse.json({ session: null });

    const candidates = await prisma.session.findMany({
      where: {
        professorId,
        startTime: { gte: windowStart, lte: windowEnd },
        status: { not: "CANCELLED" },
      },
      include: {
        course: { select: { name: true, code: true } },
        room: { select: { name: true, building: true } },
      },
      orderBy: { startTime: "asc" },
    });

    const active = candidates.find((s) => isSessionOpen(s, now));
    if (!active) return NextResponse.json({ session: null });

    return NextResponse.json({
      session: {
        ...active,
        effectiveStatus: effectiveStatus(active, now),
        alreadyCheckedIn:
          active.professorStatus === "PRESENT" || active.professorStatus === "LATE",
      },
    });
  }

  if (auth.session.user.role === "STUDENT") {
    const studentId = auth.session.user.studentId;
    if (!studentId) return NextResponse.json({ session: null });

    // Find courses the student is enrolled in
    const enrollment = await prisma.studentGroup.findMany({
      where: { studentId },
      select: { groupId: true },
    });
    const groupIds = enrollment.map((e) => e.groupId);
    if (groupIds.length === 0) return NextResponse.json({ session: null });

    const candidates = await prisma.session.findMany({
      where: {
        course: { groups: { some: { groupId: { in: groupIds } } } },
        startTime: { gte: windowStart, lte: windowEnd },
        status: { not: "CANCELLED" },
      },
      include: {
        course: { select: { name: true, code: true } },
        room: { select: { name: true, building: true } },
        attendances: {
          where: { studentId },
          select: { status: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    const active = candidates.find((s) => isSessionOpen(s, now));
    if (!active) return NextResponse.json({ session: null });

    const mine = active.attendances[0];
    return NextResponse.json({
      session: {
        ...active,
        effectiveStatus: effectiveStatus(active, now),
        alreadyCheckedIn:
          mine?.status === "PRESENT" || mine?.status === "LATE",
      },
    });
  }

  return NextResponse.json({ session: null });
}
