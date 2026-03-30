import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionSchema, parseBody } from "@/lib/validations";

export async function GET(req: NextRequest) {
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

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = parseBody(createSessionSchema, body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { courseId, professorId, roomId, date, startTime, endTime } = parsed.data;

    const session = await prisma.session.create({
      data: {
        courseId,
        professorId,
        roomId,
        date: new Date(date),
        startTime: new Date(`${date}T${startTime}`),
        endTime: new Date(`${date}T${endTime}`),
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
