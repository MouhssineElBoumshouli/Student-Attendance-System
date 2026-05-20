import { prisma } from "@/lib/prisma";

/**
 * Materialize a ScheduleRule into actual Session rows.
 *
 * For every date between startDate and endDate (inclusive) whose dayOfWeek
 * matches the rule, create one Session at that date + startTime/endTime,
 * in the rule's room, for the rule's course/professor.
 *
 * Idempotent: skips a date if a session already exists for the same
 * course on the same calendar day.
 *
 * Also pre-creates ABSENT attendance rows for every student enrolled in
 * a group of the course, so the prof has a complete roster from day one.
 */
export async function materializeRule(ruleId: string): Promise<{
  created: number;
  skipped: number;
}> {
  const rule = await prisma.scheduleRule.findUnique({
    where: { id: ruleId },
    include: {
      course: {
        include: {
          groups: { include: { group: { include: { students: { select: { studentId: true } } } } } },
        },
      },
    },
  });
  if (!rule) throw new Error(`ScheduleRule ${ruleId} not found`);

  // Collect enrolled student IDs once
  const studentIds = new Set<string>();
  for (const cg of rule.course.groups) {
    for (const sg of cg.group.students) studentIds.add(sg.studentId);
  }

  let created = 0;
  let skipped = 0;

  const start = new Date(rule.startDate);
  const end = new Date(rule.endDate);

  // Walk day by day from start to end
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== rule.dayOfWeek) continue;

    const [sh, sm] = rule.startTime.split(":").map(Number);
    const [eh, em] = rule.endTime.split(":").map(Number);
    const sessionDate = new Date(d);
    sessionDate.setHours(0, 0, 0, 0);
    const startDt = new Date(d);
    startDt.setHours(sh, sm, 0, 0);
    const endDt = new Date(d);
    endDt.setHours(eh, em, 0, 0);

    // Skip if a session already exists for this course on this calendar day
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);
    const existing = await prisma.session.findFirst({
      where: {
        courseId: rule.courseId,
        date: { gte: dayStart, lte: dayEnd },
      },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const session = await prisma.session.create({
      data: {
        courseId: rule.courseId,
        professorId: rule.course.professorId,
        roomId: rule.roomId,
        scheduleRuleId: rule.id,
        date: sessionDate,
        startTime: startDt,
        endTime: endDt,
        status: "SCHEDULED",
      },
    });

    if (studentIds.size > 0) {
      await prisma.attendance.createMany({
        data: Array.from(studentIds).map((studentId) => ({
          sessionId: session.id,
          studentId,
          status: "ABSENT",
        })),
        skipDuplicates: true,
      });
    }
    created++;
  }

  return { created, skipped };
}
