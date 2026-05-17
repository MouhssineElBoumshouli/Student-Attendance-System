import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDepartmentSchema, parseBody } from "@/lib/validations";
import { requireApiAuth, requireApiRole } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const departments = await prisma.department.findMany({
    include: { _count: { select: { programs: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(departments);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiRole(["ADMIN"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = parseBody(createDepartmentSchema, body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { name, code } = parsed.data;

    const department = await prisma.department.create({
      data: { name, code: code.toUpperCase() },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      return NextResponse.json({ error: "Ce code existe déjà" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireApiRole(["ADMIN"]);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  await prisma.department.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
