import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSessionSecret } from "@/lib/qr/generate";
import { DEFAULT_ROTATION_SEC } from "@/lib/qr/constants";
import { requireApiRole } from "@/lib/api-auth";

/**
 * POST /api/sessions/[id]/activate
 *
 * Activates a session:
 * 1. Generates a cryptographic secret for QR token rotation
 * 2. Sets session status to ACTIVE
 * 3. Pre-creates ABSENT attendance records for any enrolled student that
 *    doesn't already have one (preserves prior scans on re-activation).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiRole(["ADMIN", "PROFESSOR"]);
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
                  students: { select: { studentId: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Séance non trouvée" }, { status: 404 });
  }

  // A professor can only activate their own sessions.
  if (
    auth.session.user.role === "PROFESSOR" &&
    session.professorId !== auth.session.user.professorId
  ) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (session.status === "ACTIVE") {
    return NextResponse.json({ error: "Séance déjà active" }, { status: 400 });
  }

  if (session.status === "COMPLETED" || session.status === "CANCELLED") {
    return NextResponse.json({ error: "Séance terminée ou annulée" }, { status: 400 });
  }

  // Generate secret for HMAC-based QR tokens
  const qrSecret = generateSessionSecret();

  // Collect all unique student IDs from the course's groups
  const studentIds = new Set<string>();
  for (const courseGroup of session.course.groups) {
    for (const studentGroup of courseGroup.group.students) {
      studentIds.add(studentGroup.studentId);
    }
  }

  await prisma.$transaction([
    prisma.session.update({
      where: { id },
      data: { status: "ACTIVE", qrSecret, qrRotationSec: DEFAULT_ROTATION_SEC },
    }),
    // Insert ABSENT rows for newly-enrolled students only; skipDuplicates
    // preserves any existing attendance from a prior activation cycle.
    prisma.attendance.createMany({
      data: Array.from(studentIds).map((studentId) => ({
        sessionId: id,
        studentId,
        status: "ABSENT",
      })),
      skipDuplicates: true,
    }),
  ]);

  return NextResponse.json({
    success: true,
    studentCount: studentIds.size,
    message: `Séance activée avec ${studentIds.size} étudiants`,
  });
}
