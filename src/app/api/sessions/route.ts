import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionSchema, parseBody } from "@/lib/validations";
import { requireApiAuth, requireApiRole } from "@/lib/api-auth";
import { effectiveStatus } from "@/lib/session-status";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const professorId = searchParams.get("professorId");
  const courseId = searchParams.get("courseId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (professorId) where.professorId = professorId;
  if (courseId) where.courseId = courseId;
  if (status) where.status = status;

  const sessions = await prisma.session.findMany({
    where,
    include: {
      course: { select: { name: true, code: true } },
      room: { select: { name: true, building: true } },
      professor: { include: { user: { select: { firstName: true, lastName: true } } } },
      _count: { select: { attendances: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(
    sessions.map((s) => ({ ...s, effectiveStatus: effectiveStatus(s) }))
  );
}

export async function POST(req: NextRequest) {
  const auth = await requireApiRole(["ADMIN", "PROFESSOR"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = parseBody(createSessionSchema, body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { courseId, professorId, roomId, date, startTime, endTime } = parsed.data;

    // A professor can only create sessions for themselves.
    if (
      auth.session.user.role === "PROFESSOR" &&
      professorId !== auth.session.user.professorId
    ) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Build start/end as local-time datetimes; the session date is the
    // local-time day of the start time so display stays consistent.
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    if (
      isNaN(startDateTime.getTime()) ||
      isNaN(endDateTime.getTime()) ||
      endDateTime <= startDateTime
    ) {
      return NextResponse.json(
        { error: "L'heure de fin doit être après l'heure de début" },
        { status: 400 }
      );
    }

    const session = await prisma.session.create({
      data: {
        courseId,
        professorId,
        roomId,
        date: startDateTime,
        startTime: startDateTime,
        endTime: endDateTime,
        status: "SCHEDULED",
      },
      include: {
        course: { select: { name: true, code: true } },
        room: { select: { name: true, building: true } },
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
