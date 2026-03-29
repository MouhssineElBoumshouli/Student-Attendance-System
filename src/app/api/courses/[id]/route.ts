import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.courseGroup.deleteMany({ where: { courseId: id } });
  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
