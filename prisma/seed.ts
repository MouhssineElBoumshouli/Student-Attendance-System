import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
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

  const hash = await bcrypt.hash("password123", 10);

  // ─── Admin ───
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@ueuromed.org",
      passwordHash: hash,
      firstName: "Admin",
      lastName: "UEMF",
      role: "ADMIN",
    },
  });
  console.log("  Created admin:", adminUser.email);

  // ─── Departments ───
  const eidia = await prisma.department.create({
    data: {
      name: "Ecole d'Ingenierie Digitale et d'Intelligence Artificielle",
      code: "EIDIA",
    },
  });

  const fsjp = await prisma.department.create({
    data: {
      name: "Faculte des Sciences Juridiques et Politiques",
      code: "FSJP",
    },
  });

  console.log("  Created 2 departments");

  // ─── Programs ───
  const gi = await prisma.program.create({
    data: {
      name: "Genie Informatique",
      code: "GI",
      departmentId: eidia.id,
    },
  });

  const ia = await prisma.program.create({
    data: {
      name: "Intelligence Artificielle et Science des Donnees",
      code: "IASD",
      departmentId: eidia.id,
    },
  });

  const droit = await prisma.program.create({
    data: {
      name: "Droit des Affaires",
      code: "DA",
      departmentId: fsjp.id,
    },
  });

  console.log("  Created 3 programs");

  // ─── Groups ───
  const giS5A = await prisma.group.create({
    data: { name: "GI-S5-A", programId: gi.id, semester: 5 },
  });
  const giS5B = await prisma.group.create({
    data: { name: "GI-S5-B", programId: gi.id, semester: 5 },
  });
  const iaS5 = await prisma.group.create({
    data: { name: "IASD-S5", programId: ia.id, semester: 5 },
  });
  const daS3 = await prisma.group.create({
    data: { name: "DA-S3", programId: droit.id, semester: 3 },
  });

  console.log("  Created 4 groups");

  // ─── Rooms (UEMF campus coordinates: ~34.0531, -4.9998) ───
  const amphiA = await prisma.room.create({
    data: {
      name: "Amphi A",
      building: "Batiment Principal",
      latitude: 34.0531,
      longitude: -4.9998,
      radius: 150,
      capacity: 200,
    },
  });

  const salle204 = await prisma.room.create({
    data: {
      name: "Salle 204",
      building: "Batiment B",
      latitude: 34.0533,
      longitude: -4.9996,
      radius: 80,
      capacity: 40,
    },
  });

  const labInfo = await prisma.room.create({
    data: {
      name: "Labo Informatique 1",
      building: "Batiment EIDIA",
      latitude: 34.0529,
      longitude: -4.9999,
      radius: 60,
      capacity: 30,
    },
  });

  console.log("  Created 3 rooms");

  // ─── Professors ───
  const profAhmed = await prisma.user.create({
    data: {
      email: "ahmed.benali@ueuromed.org",
      passwordHash: hash,
      firstName: "Ahmed",
      lastName: "Benali",
      role: "PROFESSOR",
      professor: {
        create: { employeeId: "PROF-001", departmentId: eidia.id },
      },
    },
    include: { professor: true },
  });

  const profFatima = await prisma.user.create({
    data: {
      email: "fatima.zahrae@ueuromed.org",
      passwordHash: hash,
      firstName: "Fatima",
      lastName: "Zahrae",
      role: "PROFESSOR",
      professor: {
        create: { employeeId: "PROF-002", departmentId: eidia.id },
      },
    },
    include: { professor: true },
  });

  const profKarim = await prisma.user.create({
    data: {
      email: "karim.idrissi@ueuromed.org",
      passwordHash: hash,
      firstName: "Karim",
      lastName: "Idrissi",
      role: "PROFESSOR",
      professor: {
        create: { employeeId: "PROF-003", departmentId: fsjp.id },
      },
    },
    include: { professor: true },
  });

  console.log("  Created 3 professors");

  // ─── Students ───
  const studentNames = [
    { first: "Mouhssine", last: "Elhassouni", email: "mouhssine.elhassouni@ueuromed.org" },
    { first: "Yassine", last: "Amrani", email: "yassine.amrani@ueuromed.org" },
    { first: "Sara", last: "Bennani", email: "sara.bennani@ueuromed.org" },
    { first: "Khalid", last: "Tazi", email: "khalid.tazi@ueuromed.org" },
    { first: "Nour", last: "Elhadi", email: "nour.elhadi@ueuromed.org" },
    { first: "Omar", last: "Fassi", email: "omar.fassi@ueuromed.org" },
    { first: "Imane", last: "Alaoui", email: "imane.alaoui@ueuromed.org" },
    { first: "Amine", last: "Berrada", email: "amine.berrada@ueuromed.org" },
    { first: "Hajar", last: "Chraibi", email: "hajar.chraibi@ueuromed.org" },
    { first: "Reda", last: "Mansouri", email: "reda.mansouri@ueuromed.org" },
    { first: "Salma", last: "Ouazzani", email: "salma.ouazzani@ueuromed.org" },
    { first: "Mehdi", last: "Filali", email: "mehdi.filali@ueuromed.org" },
    { first: "Zineb", last: "Kettani", email: "zineb.kettani@ueuromed.org" },
    { first: "Hamza", last: "Bouzidi", email: "hamza.bouzidi@ueuromed.org" },
    { first: "Ghita", last: "Lahlou", email: "ghita.lahlou@ueuromed.org" },
    { first: "Ayoub", last: "Senhaji", email: "ayoub.senhaji@ueuromed.org" },
    { first: "Meriem", last: "Tadlaoui", email: "meriem.tadlaoui@ueuromed.org" },
    { first: "Adil", last: "Cherkaoui", email: "adil.cherkaoui@ueuromed.org" },
    { first: "Fatima-Zahra", last: "Rifi", email: "fatimazahra.rifi@ueuromed.org" },
    { first: "Soufiane", last: "Jamai", email: "soufiane.jamai@ueuromed.org" },
  ];

  const students: { id: string; studentId: string }[] = [];

  for (let i = 0; i < studentNames.length; i++) {
    const s = studentNames[i];
    const user = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash: hash,
        firstName: s.first,
        lastName: s.last,
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
    students.push({ id: user.student!.id, studentId: user.student!.studentId });
  }

  console.log(`  Created ${students.length} students`);

  // ─── Assign students to groups ───
  // First 6 students -> GI-S5-A
  // Next 6 -> GI-S5-B
  // Next 4 -> IASD-S5
  // Last 4 -> DA-S3
  const groupAssignments = [
    ...students.slice(0, 6).map((s) => ({ studentId: s.id, groupId: giS5A.id })),
    ...students.slice(6, 12).map((s) => ({ studentId: s.id, groupId: giS5B.id })),
    ...students.slice(12, 16).map((s) => ({ studentId: s.id, groupId: iaS5.id })),
    ...students.slice(16, 20).map((s) => ({ studentId: s.id, groupId: daS3.id })),
  ];

  for (const assignment of groupAssignments) {
    await prisma.studentGroup.create({ data: assignment });
  }

  console.log("  Assigned students to groups");

  // ─── Courses ───
  const ro = await prisma.course.create({
    data: {
      name: "Recherche Operationnelle",
      code: "RO-501",
      programId: gi.id,
      professorId: profAhmed.professor!.id,
      semester: 5,
      academicYear: "2025-2026",
      totalHours: 42,
      groups: {
        create: [{ groupId: giS5A.id }, { groupId: giS5B.id }],
      },
    },
  });

  const ml = await prisma.course.create({
    data: {
      name: "Machine Learning",
      code: "ML-501",
      programId: ia.id,
      professorId: profFatima.professor!.id,
      semester: 5,
      academicYear: "2025-2026",
      totalHours: 36,
      groups: {
        create: [{ groupId: iaS5.id }],
      },
    },
  });

  const algo = await prisma.course.create({
    data: {
      name: "Algorithmique Avancee",
      code: "ALGO-501",
      programId: gi.id,
      professorId: profFatima.professor!.id,
      semester: 5,
      academicYear: "2025-2026",
      totalHours: 30,
      groups: {
        create: [{ groupId: giS5A.id }],
      },
    },
  });

  const droitAff = await prisma.course.create({
    data: {
      name: "Droit Commercial",
      code: "DC-301",
      programId: droit.id,
      professorId: profKarim.professor!.id,
      semester: 3,
      academicYear: "2025-2026",
      totalHours: 40,
      groups: {
        create: [{ groupId: daS3.id }],
      },
    },
  });

  console.log("  Created 4 courses");

  console.log("\nSeed completed successfully!");
  console.log("\n--- Login Credentials ---");
  console.log("Admin:     admin@ueuromed.org / password123");
  console.log("Professor: ahmed.benali@ueuromed.org / password123");
  console.log("Professor: fatima.zahrae@ueuromed.org / password123");
  console.log("Student:   mouhssine.elhassouni@ueuromed.org / password123");
  console.log("(All accounts use password: password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
