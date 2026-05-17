import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth, requireApiRole } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const rooms = await prisma.room.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(rooms);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiRole(["ADMIN"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { name, building, latitude, longitude, radius, capacity } = body;

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "Nom et coordonnees GPS requis" }, { status: 400 });
    }

    const room = await prisma.room.create({
      data: {
        name,
        building: building || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: radius ? parseInt(radius) : 100,
        capacity: capacity ? parseInt(capacity) : null,
      },
    });

    return NextResponse.json(room, { status: 201 });
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

  await prisma.room.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
