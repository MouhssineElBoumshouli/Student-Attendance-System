import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth, requireApiRole } from "@/lib/api-auth";
import { effectiveStatus } from "@/lib/session-status";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      course: {
        include: {
          groups: {
            include: {
              group: {
                include: {
                  students: {
                    include: { student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } },
                  },
                },
              },
            },
          },
        },
      },
      room: true,
      professor: { include: { user: { select: { firstName: true, lastName: true } } } },
      attendances: {
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { student: { user: { lastName: "asc" } } },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Séance non trouvée" }, { status: 404 });
  }

  return NextResponse.json({
    ...session,
    effectiveStatus: effectiveStatus(session),
  });
}

/**
 * PATCH only allows status changes to CANCELLED or back to SCHEDULED.
 * Sensitive fields (qrSecret, professorId, roomId, courseId) cannot be
 * mutated via this endpoint.
 */
const ALLOWED_STATUSES = ["SCHEDULED", "CANCELLED"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiRole(["ADMIN", "PROFESSOR"]);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const existing = await prisma.session.findUnique({
    where: { id },
    select: { professorId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Séance non trouvée" }, { status: 404 });
  }
  if (
    auth.session.user.role === "PROFESSOR" &&
    existing.professorId !== auth.session.user.professorId
  ) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const status = body?.status;
  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "Seul le statut (SCHEDULED, CANCELLED) peut être modifié ici" },
      { status: 400 }
    );
  }

  const session = await prisma.session.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(session);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiRole(["ADMIN", "PROFESSOR"]);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const existing = await prisma.session.findUnique({
    where: { id },
    select: { professorId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Séance non trouvée" }, { status: 404 });
  }
  if (
    auth.session.user.role === "PROFESSOR" &&
    existing.professorId !== auth.session.user.professorId
  ) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  await prisma.session.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
