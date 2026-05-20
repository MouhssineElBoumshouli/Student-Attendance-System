import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { effectiveStatus } from "@/lib/session-status";

/**
 * GET /api/analytics/anomalies?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns three datasets useful for the admin/director to audit
 * compliance:
 *
 *   1. sessionsWithoutProfessor: sessions in the window where the
 *      session has effectively ended but the professor never tapped in.
 *      Students may or may not have been there — that's a separate
 *      signal in the same row.
 *
 *   2. professorAbsenceRanking: per-professor count of COMPLETED
 *      sessions where they didn't check in.
 *
 *   3. sessionsWithoutStudents: sessions where the professor DID check
 *      in but zero students were recorded present/late. Could indicate
 *      an empty class, a room change, or a forgotten cancellation.
 */
export async function GET(req: NextRequest) {
  const auth = await requireApiRole(["ADMIN"]);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  // Default range: last 30 days
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(now.getDate() - 30);
  const from = fromStr ? new Date(fromStr) : defaultFrom;
  const to = toStr ? new Date(toStr) : now;
  // Make `to` inclusive
  const toEndOfDay = new Date(to);
  toEndOfDay.setHours(23, 59, 59, 999);

  // Pull all sessions in the window with the data we need
  const sessions = await prisma.session.findMany({
    where: {
      date: { gte: from, lte: toEndOfDay },
    },
    include: {
      course: { select: { name: true, code: true } },
      room: { select: { name: true } },
      professor: { include: { user: { select: { firstName: true, lastName: true } } } },
      _count: { select: { attendances: true } },
      attendances: {
        select: { status: true },
      },
    },
    orderBy: { date: "desc" },
  });

  // Only count sessions that have effectively COMPLETED (not still active)
  const completedSessions = sessions
    .map((s) => ({ ...s, effectiveStatus: effectiveStatus(s) }))
    .filter((s) => s.effectiveStatus === "COMPLETED");

  // (1) Sessions where professor was absent
  const sessionsWithoutProfessor = completedSessions
    .filter((s) => s.professorStatus === "ABSENT")
    .map((s) => {
      const studentsPresent = s.attendances.filter(
        (a) => a.status === "PRESENT" || a.status === "LATE"
      ).length;
      return {
        id: s.id,
        date: s.date,
        startTime: s.startTime,
        course: s.course,
        room: s.room,
        professor: {
          firstName: s.professor.user.firstName,
          lastName: s.professor.user.lastName,
        },
        studentsPresent,
        studentsTotal: s.attendances.length,
      };
    });

  // (2) Ranking: each professor's count of completed sessions where they were absent
  const profAbsenceMap = new Map<
    string,
    { firstName: string; lastName: string; total: number; absent: number }
  >();
  for (const s of completedSessions) {
    const key = s.professorId;
    const cur = profAbsenceMap.get(key) ?? {
      firstName: s.professor.user.firstName,
      lastName: s.professor.user.lastName,
      total: 0,
      absent: 0,
    };
    cur.total += 1;
    if (s.professorStatus === "ABSENT") cur.absent += 1;
    profAbsenceMap.set(key, cur);
  }
  const professorAbsenceRanking = Array.from(profAbsenceMap.entries())
    .map(([professorId, v]) => ({
      professorId,
      firstName: v.firstName,
      lastName: v.lastName,
      totalSessions: v.total,
      absences: v.absent,
      absenceRate:
        v.total > 0 ? Math.round((v.absent / v.total) * 100) : 0,
    }))
    .sort((a, b) => b.absences - a.absences);

  // (3) Sessions where prof was present but no students checked in
  const sessionsWithoutStudents = completedSessions
    .filter((s) => {
      const profCheckedIn =
        s.professorStatus === "PRESENT" || s.professorStatus === "LATE";
      const anyStudent = s.attendances.some(
        (a) => a.status === "PRESENT" || a.status === "LATE"
      );
      return profCheckedIn && !anyStudent && s.attendances.length > 0;
    })
    .map((s) => ({
      id: s.id,
      date: s.date,
      startTime: s.startTime,
      course: s.course,
      room: s.room,
      professor: {
        firstName: s.professor.user.firstName,
        lastName: s.professor.user.lastName,
      },
      enrolledCount: s.attendances.length,
    }));

  // High-level summary
  const summary = {
    windowStart: from,
    windowEnd: toEndOfDay,
    completedSessions: completedSessions.length,
    sessionsWithoutProfCount: sessionsWithoutProfessor.length,
    sessionsWithoutStudentCount: sessionsWithoutStudents.length,
  };

  return NextResponse.json({
    summary,
    sessionsWithoutProfessor,
    professorAbsenceRanking,
    sessionsWithoutStudents,
  });
}
