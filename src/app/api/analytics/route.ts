import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";
import {
  ACTIVE_OPEN_OFFSET_MS,
  ACTIVE_CLOSE_BUFFER_MS,
} from "@/lib/session-status";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const professorId = searchParams.get("professorId");
  const studentId = searchParams.get("studentId");

  // A user can only request analytics for themselves (admins get everything).
  if (auth.session.user.role === "PROFESSOR" && professorId !== auth.session.user.professorId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (auth.session.user.role === "STUDENT" && studentId !== auth.session.user.studentId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (role === "ADMIN" && auth.session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const now = new Date();
  // Session status is derived from clock time (see lib/session-status.ts),
  // so "currently active" and "already finished" are time-range queries,
  // not status-column lookups.
  const activeWindow = {
    startTime: { lte: new Date(now.getTime() + ACTIVE_OPEN_OFFSET_MS) },
    endTime: { gte: new Date(now.getTime() - ACTIVE_CLOSE_BUFFER_MS) },
    status: { not: "CANCELLED" },
  };
  // A session counts toward attendance stats only once its active window
  // has fully closed — otherwise the semester's pre-created ABSENT rows
  // (from schedule-rule materialization) would tank every rate to ~0.
  const finishedSession = {
    endTime: { lt: new Date(now.getTime() - ACTIVE_CLOSE_BUFFER_MS) },
    status: { not: "CANCELLED" },
  };

  if (role === "ADMIN") {
    const [studentCount, professorCount, courseCount, activeSessions] =
      await Promise.all([
        prisma.student.count(),
        prisma.professor.count(),
        prisma.course.count(),
        prisma.session.count({ where: activeWindow }),
      ]);

    return NextResponse.json({
      students: studentCount,
      professors: professorCount,
      courses: courseCount,
      activeSessions,
    });
  }

  if (role === "PROFESSOR" && professorId) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [courseCount, monthSessions, attendanceStats] = await Promise.all([
      prisma.course.count({ where: { professorId } }),
      prisma.session.count({
        where: {
          professorId,
          date: { gte: monthStart, lte: now },
          status: { not: "CANCELLED" },
        },
      }),
      prisma.attendance.groupBy({
        by: ["status"],
        where: {
          session: { professorId, ...finishedSession },
        },
        _count: true,
      }),
    ]);

    const totalAtt = attendanceStats.reduce((s, a) => s + a._count, 0);
    const presentAtt = attendanceStats
      .filter((a) => a.status === "PRESENT" || a.status === "LATE")
      .reduce((s, a) => s + a._count, 0);
    const rate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

    return NextResponse.json({
      courses: courseCount,
      monthSessions,
      attendanceRate: rate,
    });
  }

  if (role === "STUDENT" && studentId) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [attendances, monthPresent] = await Promise.all([
      prisma.attendance.findMany({
        where: { studentId, session: finishedSession },
        select: { status: true },
      }),
      prisma.attendance.count({
        where: {
          studentId,
          status: { in: ["PRESENT", "LATE"] },
          session: {
            date: { gte: monthStart },
            status: { not: "CANCELLED" },
          },
        },
      }),
    ]);

    const total = attendances.length;
    const present = attendances.filter(
      (a) => a.status === "PRESENT" || a.status === "LATE"
    ).length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return NextResponse.json({
      attendanceRate: rate,
      monthPresent,
      total,
    });
  }

  return NextResponse.json({});
}
