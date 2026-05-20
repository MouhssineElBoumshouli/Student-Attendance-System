import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL_DOMAIN = "@eidia.ueuromed.org";

// ─── Roster (small, entirely new) ─────────────────────────────────────────
const PROFESSORS = [
  {
    firstName: "Hicham",
    lastName: "Tazi",
    employeeId: "PROF-RO-101",
    role: "Recherche Opérationnelle",
  },
  {
    firstName: "Latifa",
    lastName: "Mansouri",
    employeeId: "PROF-MATH-102",
    role: "Mathématiques",
  },
  {
    firstName: "Youssef",
    lastName: "Berrada",
    employeeId: "PROF-INFO-103",
    role: "Informatique",
  },
];

const STUDENTS = [
  ["Imane", "Saidi"],
  ["Karim", "Ouali"],
  ["Salma", "Benkirane"],
  ["Mehdi", "Rahmani"],
  ["Yasmine", "Lemrabet"],
  ["Anas", "Chakir"],
  ["Houda", "Mekouar"],
  ["Tarik", "Bouhassoun"],
  ["Fatima", "Daoudi"],
  ["Omar", "Sefrioui"],
  ["Nadia", "Lazrak"],
  ["Reda", "Tahiri"],
  ["Sara", "Filali"],
  ["Younes", "Bennis"],
  ["Hajar", "Mansoor"],
  ["Ismail", "Hakimi"],
  ["Lina", "Belkacem"],
  ["Marouane", "Aziz"],
  ["Soukaina", "Rifi"],
  ["Adil", "Cherradi"],
];

function emailFor(first: string, last: string): string {
  return (
    first.toLowerCase().replace(/[^a-z]/g, "") +
    "." +
    last.toLowerCase().replace(/[^a-z]/g, "") +
    EMAIL_DOMAIN
  );
}

async function main() {
  console.log("Seeding database with fresh roster…");

  // ─── Clean slate ────────────────────────────────────────────────────────
  await prisma.attendance.deleteMany();
  await prisma.session.deleteMany();
  await prisma.courseGroup.deleteMany();
  await prisma.course.deleteMany();
  await prisma.studentGroup.deleteMany();
  await prisma.student.deleteMany();
  await prisma.professor.deleteMany();
  await prisma.room.deleteMany();
  await prisma.group.deleteMany();
  await prisma.program.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
  console.log("  Cleared previous data");

  const hash = await bcrypt.hash("password123", 10);

  // ─── Admin ──────────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      email: "admin@eidia.ueuromed.org",
      passwordHash: hash,
      firstName: "Admin",
      lastName: "EIDIA",
      role: "ADMIN",
    },
  });

  // ─── Department / Program ───────────────────────────────────────────────
  const eidia = await prisma.department.create({
    data: {
      name: "École d'Ingénierie Digitale et d'Intelligence Artificielle",
      code: "EIDIA",
    },
  });
  const gi = await prisma.program.create({
    data: { name: "Génie Informatique", code: "GI", departmentId: eidia.id },
  });

  // ─── Groups ─────────────────────────────────────────────────────────────
  const groupA = await prisma.group.create({
    data: { name: "GI-S5-A", programId: gi.id, semester: 5 },
  });
  const groupB = await prisma.group.create({
    data: { name: "GI-S5-B", programId: gi.id, semester: 5 },
  });

  // ─── Rooms (UEMF campus) ────────────────────────────────────────────────
  await prisma.room.create({
    data: {
      name: "Amphi A",
      building: "Bâtiment Principal",
      latitude: 34.0531,
      longitude: -4.9998,
      radius: 150,
      capacity: 250,
    },
  });
  await prisma.room.create({
    data: {
      name: "Salle 204",
      building: "Bâtiment B",
      latitude: 34.0533,
      longitude: -4.9996,
      radius: 80,
      capacity: 40,
    },
  });
  await prisma.room.create({
    data: {
      name: "Labo Informatique 1",
      building: "Bâtiment EIDIA",
      latitude: 34.0529,
      longitude: -4.9999,
      radius: 60,
      capacity: 30,
    },
  });

  // ─── Professors ─────────────────────────────────────────────────────────
  const profs = [];
  for (const p of PROFESSORS) {
    const user = await prisma.user.create({
      data: {
        email: emailFor(p.firstName, p.lastName),
        passwordHash: hash,
        firstName: p.firstName,
        lastName: p.lastName,
        role: "PROFESSOR",
        professor: {
          create: { employeeId: p.employeeId, departmentId: eidia.id },
        },
      },
      include: { professor: true },
    });
    profs.push({ ...p, id: user.professor!.id, email: user.email });
  }

  // ─── Students ───────────────────────────────────────────────────────────
  const studentIds: string[] = [];
  for (let i = 0; i < STUDENTS.length; i++) {
    const [first, last] = STUDENTS[i];
    const user = await prisma.user.create({
      data: {
        email: emailFor(first, last),
        passwordHash: hash,
        firstName: first,
        lastName: last,
        role: "STUDENT",
        student: {
          create: {
            studentId: `STU-${String(i + 1).padStart(3, "0")}`,
            enrollmentYear: 2024,
          },
        },
      },
      include: { student: true },
    });
    studentIds.push(user.student!.id);
  }

  // Half in group A, half in group B
  const half = Math.ceil(studentIds.length / 2);
  for (let i = 0; i < studentIds.length; i++) {
    await prisma.studentGroup.create({
      data: {
        studentId: studentIds[i],
        groupId: i < half ? groupA.id : groupB.id,
      },
    });
  }

  // ─── Courses (each prof has one, RO covers both groups) ─────────────────
  await prisma.course.create({
    data: {
      name: "Recherche Opérationnelle",
      code: "RO-501",
      programId: gi.id,
      professorId: profs[0].id, // Hicham Tazi
      semester: 5,
      academicYear: "2025-2026",
      totalHours: 42,
      groups: { create: [{ groupId: groupA.id }, { groupId: groupB.id }] },
    },
  });
  await prisma.course.create({
    data: {
      name: "Mathématiques Appliquées",
      code: "MATH-501",
      programId: gi.id,
      professorId: profs[1].id, // Latifa Mansouri
      semester: 5,
      academicYear: "2025-2026",
      totalHours: 36,
      groups: { create: [{ groupId: groupA.id }, { groupId: groupB.id }] },
    },
  });
  await prisma.course.create({
    data: {
      name: "Algorithmique Avancée",
      code: "ALGO-501",
      programId: gi.id,
      professorId: profs[2].id, // Youssef Berrada
      semester: 5,
      academicYear: "2025-2026",
      totalHours: 30,
      groups: { create: [{ groupId: groupA.id }] },
    },
  });

  console.log("\n✅ Seed completed.");
  console.log(`   ${profs.length} professors, ${studentIds.length} students, 2 groups, 3 courses\n`);

  console.log("--- Login credentials (password for all : password123) ---\n");
  console.log("ADMIN");
  console.log("  admin@eidia.ueuromed.org\n");
  console.log("PROFESSORS");
  for (const p of profs) {
    console.log(`  ${p.email.padEnd(45)}  (${p.firstName} ${p.lastName} — ${p.role})`);
  }
  console.log("\nSTUDENTS (group A — first half)");
  for (let i = 0; i < half; i++) {
    const [first, last] = STUDENTS[i];
    console.log(`  ${emailFor(first, last).padEnd(45)}  (${first} ${last})`);
  }
  console.log("\nSTUDENTS (group B — second half)");
  for (let i = half; i < STUDENTS.length; i++) {
    const [first, last] = STUDENTS[i];
    console.log(`  ${emailFor(first, last).padEnd(45)}  (${first} ${last})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
