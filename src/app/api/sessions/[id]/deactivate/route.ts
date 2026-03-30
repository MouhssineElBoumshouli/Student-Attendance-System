import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/sessions/[id]/deactivate
 *
 * Deactivates a session:
 * 1. Sets status to COMPLETED
 * 2. Clears the QR secret (tokens become permanently invalid)
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await prisma.session.findUnique({ where: { id } });

  if (!session) {
    return NextResponse.json({ error: "Séance non trouvée" }, { status: 404 });
  }

  if (session.status !== "ACTIVE") {
    return NextResponse.json({ error: "La séance n'est pas active" }, { status: 400 });
  }

  // Get attendance stats before deactivating
  const stats = await prisma.attendance.groupBy({
    by: ["status"],
    where: { sessionId: id },
    _count: true,
  });

  await prisma.session.update({
    where: { id },
    data: {
      status: "COMPLETED",
      qrSecret: null, // Invalidate all tokens
    },
  });

  const present = stats.find((s) => s.status === "PRESENT")?._count || 0;
  const total = stats.reduce((sum, s) => sum + s._count, 0);

  return NextResponse.json({
    success: true,
    stats: { present, total, rate: total > 0 ? Math.round((present / total) * 100) : 0 },
    message: `Séance terminée : ${present}/${total} présents`,
  });
}
