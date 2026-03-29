import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSessionSecret } from "@/lib/qr/generate";

/**
 * POST /api/sessions/[id]/activate
 *
 * Activates a session:
 * 1. Generates a cryptographic secret for QR token rotation
 * 2. Sets session status to ACTIVE
 * 3. Pre-creates ABSENT attendance records for all enrolled students
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    return NextResponse.json({ error: "Seance non trouvee" }, { status: 404 });
  }

  if (session.status === "ACTIVE") {
    return NextResponse.json({ error: "Seance deja active" }, { status: 400 });
  }

  if (session.status === "COMPLETED" || session.status === "CANCELLED") {
    return NextResponse.json({ error: "Seance terminee ou annulee" }, { status: 400 });
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

  // Update session to ACTIVE and pre-create attendance records
  await prisma.$transaction([
    prisma.session.update({
      where: { id },
      data: { status: "ACTIVE", qrSecret },
    }),
    // Delete any existing attendance records (in case of re-activation)
    prisma.attendance.deleteMany({ where: { sessionId: id } }),
    // Create ABSENT records for all enrolled students
    ...Array.from(studentIds).map((studentId) =>
      prisma.attendance.create({
        data: {
          sessionId: id,
          studentId,
          status: "ABSENT",
        },
      })
    ),
  ]);

  return NextResponse.json({
    success: true,
    studentCount: studentIds.size,
    message: `Seance activee avec ${studentIds.size} etudiants`,
  });
}
