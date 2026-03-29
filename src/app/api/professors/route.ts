import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const professors = await prisma.professor.findMany({
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      _count: { select: { courses: true } },
    },
    orderBy: { user: { lastName: "asc" } },
  });
  return NextResponse.json(professors);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, employeeId, departmentId, password } = body;

    if (!firstName || !lastName || !email || !employeeId) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password || "uemf2024", 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role: "PROFESSOR",
        professor: {
          create: { employeeId, departmentId: departmentId || null },
        },
      },
      include: {
        professor: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      return NextResponse.json({ error: "Email ou matricule deja utilise" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const professor = await prisma.professor.findUnique({ where: { id } });
  if (!professor) return NextResponse.json({ error: "Non trouve" }, { status: 404 });

  await prisma.user.delete({ where: { id: professor.userId } });
  return NextResponse.json({ success: true });
}
