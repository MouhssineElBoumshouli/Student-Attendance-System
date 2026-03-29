import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const courses = await prisma.course.findMany({
    include: {
      professor: { include: { user: { select: { firstName: true, lastName: true } } } },
      program: { include: { department: true } },
      groups: { include: { group: true } },
      _count: { select: { sessions: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, code, programId, professorId, semester, academicYear, totalHours, groupIds } = body;

    if (!name || !code || !programId || !professorId || !semester || !academicYear) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        name,
        code: code.toUpperCase(),
        programId,
        professorId,
        semester: parseInt(semester),
        academicYear,
        totalHours: totalHours ? parseInt(totalHours) : null,
        groups: groupIds?.length
          ? { create: groupIds.map((gId: string) => ({ groupId: gId })) }
          : undefined,
      },
      include: {
        professor: { include: { user: { select: { firstName: true, lastName: true } } } },
        program: true,
        groups: { include: { group: true } },
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      return NextResponse.json({ error: "Ce code de cours existe deja" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
