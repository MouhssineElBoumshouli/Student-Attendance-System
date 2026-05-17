import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth, requireApiRole } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const groups = await prisma.group.findMany({
    include: {
      program: { include: { department: true } },
      _count: { select: { students: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiRole(["ADMIN"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { name, programId, semester } = body;

    if (!name || !programId || !semester) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    const group = await prisma.group.create({
      data: { name, programId, semester: parseInt(semester) },
      include: { program: { include: { department: true } } },
    });

    return NextResponse.json(group, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireApiRole(["ADMIN"]);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  await prisma.group.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
