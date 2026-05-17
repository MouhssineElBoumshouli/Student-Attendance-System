import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";

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

  if (role === "ADMIN") {
    const [studentCount, professorCount, courseCount, activeSessions] =
      await Promise.all([
        prisma.student.count(),
        prisma.professor.count(),
        prisma.course.count(),
        prisma.session.count({ where: { status: "ACTIVE" } }),
      ]);

    return NextResponse.json({
      students: studentCount,
      professors: professorCount,
      courses: courseCount,
      activeSessions,
    });
  }

  if (role === "PROFESSOR" && professorId) {
    const [courseCount, monthSessions, attendanceStats] = await Promise.all([
      prisma.course.count({ where: { professorId } }),
      prisma.session.count({
        where: {
          professorId,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.attendance.groupBy({
        by: ["status"],
        where: {
          session: { professorId, status: "COMPLETED" },
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
    const attendances = await prisma.attendance.findMany({
      where: { studentId },
      select: { status: true },
    });

    const total = attendances.length;
    const present = attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    const monthPresent = await prisma.attendance.count({
      where: {
        studentId,
        status: { in: ["PRESENT", "LATE"] },
        session: {
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
    });

    return NextResponse.json({
      attendanceRate: rate,
      monthPresent,
      total,
    });
  }

  return NextResponse.json({});
}
