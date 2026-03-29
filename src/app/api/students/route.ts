import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const students = await prisma.student.findMany({
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      groups: { include: { group: { include: { program: true } } } },
    },
    orderBy: { user: { lastName: "asc" } },
  });
  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, studentId, enrollmentYear, groupId, password } = body;

    if (!firstName || !lastName || !email || !studentId) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password || "uemf2024", 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role: "STUDENT",
        student: {
          create: {
            studentId,
            enrollmentYear: enrollmentYear ? parseInt(enrollmentYear) : new Date().getFullYear(),
            ...(groupId
              ? { groups: { create: { groupId } } }
              : {}),
          },
        },
      },
      include: {
        student: { include: { groups: { include: { group: true } } } },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      return NextResponse.json({ error: "Email ou numero etudiant deja utilise" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return NextResponse.json({ error: "Non trouve" }, { status: 404 });

  await prisma.user.delete({ where: { id: student.userId } });
  return NextResponse.json({ success: true });
}
