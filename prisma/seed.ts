import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Raw class roster. Source: "code .txt" / classroom directory.
// Parser below splits on the email convention `firstname.lastname@…`:
// strip accents/spaces/punctuation from the first column, walk forward until
// the lowercased letters match the email's local-part prefix.
// ─────────────────────────────────────────────────────────────────────────────

const RAW_ROSTER = `
Ibtissame Malika Abdallah Tocha — ibtissamemalika.abdallahtocha
Yanis Lahcene Abdellaoui — yanislahcene.abdellaoui
El Mehdi Abounnahr — elmehdi.abounnahr
Mehdi Achbouni — mehdi.achbouni
Ayoub Ach-Chajai — ayoub.achchajai
Mehdi Addou — mehdi.addou
Rabab Agoujim — rabab.agoujim
Yasmine Agouni — yasmine.agouni
Ikram Al Metalsi — ikram.almetalsi
Rim Alami — rim.alami
Maria Alj — maria.alj
Nivinne Allali — nivinne.allali
Mohamed Zaccaria Amchou — mohamedzaccaria.amchou
Sirin-Fadime Arli — sirinfadime.arli
Ibtissam Arramach — ibtissam.arramach
Cassandra Attal — cassandra.attal
Kenza Azouagh — kenza.azouagh
Johnny's Ber'nt Badara Mouiri — johnnysbernt.badaramouiri
Meryam Baibbout — meryam.baibbout
Anas Baiddou — anas.baiddou
Ambre Balarni — ambre.balarni
Fatima Zahra Barji — fatimazahra.barji
Yaya Barry — yaya.barry
Célia Leila Belkhadir — celialeila.belkhadir
Meriem Belounis — meriem.belounis
Nisrine Benali — nisrine.benali
Mohammed Amine Benchriet — mohammedamine.benchriet
Yahya Bendidi — yahya.bendidi
Yasmine Bennani — yasmine.bennani
Sara Benslimane — sara.benslimane
Nour Benzoubara — nour.benzoubara
Yassine Beqqache — yassine.beqqache
Zineb Berrada — zineb.berrada
Nada Bouab — nada.bouab
Assia Bouabdellaoui — assia.bouabdellaoui
Kenza Bouchara — kenza.bouchara
Ahmed Boudrika — ahmed.boudrika
Doha Bougrine — doha.bougrine
Othmane Bouhaddou — othmane.bouhaddou
Sara Bouhrida — sara.bouhrida
Alexis Bouisset — alexis.bouisset
Anas Boukasba — anas.boukasba
Mohammed Wassim Boukhari — mohammedwassim.boukhari
Zahira Boulanouar — zahira.boulanouar
Dina Boumaiz — dina.boumaiz
Salma Boumtira — salma.boumtira
Mohammed Boutaleb — mohammed.boutaleb
Islame Chadli — islame.chadli
Rihab Chahid — rihab.chahid
Norah Chedemail — norah.chedemail
Ikrame Chennouf — ikrame.chennouf
Maïssa Dahmani — maissa.dahmani
Chaimae Danoun — chaimae.danoun
Adamou Danzabe Puissance — adamou.danzabepuissance
Sarah Dardour — sarah.dardour
Doha Dbich — doha.dbich
Majdolin Dbilij — majdolin.dbilij
Victor de Macedo — victor.demacedo
Agathe de Novais — agathe.denovais
Abdon Sinclair Dekoïsset — abdonsinclair.dekoisset
Omar Dernani — omar.dernani
Mohamed Karim Diabaté — mohamedkarim.diabate
Ines Diouri — ines.diouri
Sarah Dje — sarah.dje
Oussama Djedid — oussama.djedid
Mamadou Lamine Drame — mamadoulamine.drame
Sara Driouch — sara.driouch
Aya Driouche — aya.driouche
Wallen Dyby — wallen.dyby
Salma Eddouh — salma.eddouh
Alex Nehemie Ehouman — alexnehemie.ehouman
Radwa El Adoui — radwa.eladoui
Kawthar El Allaoui — kawthar.elallaoui
Marouane El Allaoui — marouane.elallaoui
Mohamed El Badri — mohamed.elbadri
Mouhssine El Boumshouli — mouhssine.elboumshouli
Sami El Fenni — sami.elfenni
Yasmine El Gourchale — yasmine.elgourchale
Firdawss El Hayouni — firdawss.elhayouni
Léa El Hor — lea.elhor
Aya El Iysaouy — aya.eliysaouy
Younes El Khiari — younes.elkhiari
Nouhaila El Mantari — nouhaila.elmantari
Yahya El Marrasse — yahya.elmarrasse
Adam El Melouki — adam.elmelouki
Salma El Messaoudi — salma.elmessaoudi
Hind El Messaouri — hind.elmessaouri
Mariame El Mfadal — mariame.elmfadal
Hafsa El Omri — hafsa.elomri
Zineddine El Ouazzani — zineddine.elouazzani
Rayane Elfakir — rayane.elfakir
Johanny Placide Engandzas — johannyplacide.engandzas
Halima Ensari — halima.ensari
Malak Er-Rami — malak.errami
Yassine Essaghir — yassine.essaghir
Rosette Etoumbakoundou — rosette.etoumbakoundou
Walid Ezzahi — walid.ezzahi
Inès Ezzahraoui — ines.ezzahraoui
Balssam Fadili — balssam.fadili
Jamal Fadl — jamal.fadl
Dîna Fishar — dina.fishar
Yahya Guennouni — yahya.guennouni
Kilian Haddad — kilian.haddad
Aïda Hajib — aida.hajib
Mohamed Amine Hajji — mohamedamine.hajji
Yassine Hamda Benchekroun — yassine.hamdabenchekroun
Ghita Hamdi — ghita.hamdi
Khalil Hbid — khalil.hbid
Youssef Houasli — youssef.houasli
Milan Pascal Houssay — milanpascal.houssay
Caroline Illouz Macias — caroline.illouzmacias
Oualid Jaber — oualid.jaber
Rochdi Jaber — rochdi.jaber
Amine Jalane — amine.jalane
Fayçal Kaci — faycal.kaci
Wiame Kamal — wiame.kamal
Assia Karoum — assia.karoum
Annie Baker Kengni Tsafack — anniebaker.kengnitsafack
Ouiame Khadiri — ouiame.khadiri
Aya Khalaki — aya.khalaki
Houssam Khanfri — houssam.khanfri
Raghde Knoun — raghde.knoun
Hawa Koita Sako — hawa.koitasako
Crystal Kouassi — crystal.kouassi
Mohamed Said Lafdach — mohamedsaid.lafdach
Ayman Lahlou — ayman.lahlou
Ziad Lahsaini — ziad.lahsaini
Adnan Lahyani — adnan.lahyani
Chirine Laksir — chirine.laksir
Kenza Lamkahkah — kenza.lamkahkah
Zineb Laraki — zineb.laraki
Yendoupab Lare — yendoupab.lare
Badr Lasri — badr.lasri
Carla Le Dortz — carla.ledortz
Salma Lebbar — salma.lebbar
Iness Josette Lehmad — inessjosette.lehmad
Richy Rodnin Lendoye — richyrodnin.lendoye
Kenza Lhasnaoui — kenza.lhasnaoui
Hamza Lhassani — hamza.lhassani
Loan Maillet — loan.maillet
Marouane Majrar — marouane.majrar
Fatima Zahrae Mariouch — fatimazahrae.mariouch
Hope Emmanuelle P Mbazoghe Oke — hopeemmanuellep.mbazogheoke
Maymouna Meherzi — maymouna.meherzi
Yousra Mehigueni — yousra.mehigueni
Samia Mejrade — samia.mejrade
Douae Menai — douae.menai
Imane Mouh — imane.mouh
Rim Nadif — rim.nadif
Axel Jacques Cedric Aka N'Cho — axeljacquescedricaka.ncho
Dayana Ngatse — dayana.ngatse
Dayana Vanité Iona Ngatse — dayanavaniteiona.ngatse
Ikhlas Nhaila — ikhlas.nhaila
Marie-Eve Niang Raïta — marieeve.niangraita
Sorel Herman Nsogo Ndamba — sorelherman.nsogondamba
Kelvyne Nephetali Ntselembory — kelvynenephetali.ntselembory
Christma G Jonathanne Nzang V Bitegue — christmagjonathanne.nzangvbitegue
Hind Oudich — hind.oudich
Yassir Oufqir — yassir.oufqir
Wissem Naila Oulmane — wissemnaila.oulmane
Fabien Bruno Ovono Ngoua — fabienbruno.ovonongoua
Emma Andrée Catherine Plessiet — emmaandreecatherine.plessiet
Clotilde Poupot — clotilde.poupot
Emilio Marius Rakotomalala — emiliomarius.rakotomalala
Kenza Reekmans — kenza.reekmans
Marwa Reffouh — marwa.reffouh
Nour Lou Renault Attik — nourlou.renaultattik
Marwa Rhoujjati — marwa.rhoujjati
Majd Rida — majd.rida
Fatima Sahel — fatima.sahel
Aya Salam — aya.salam
Abdou-Rahamane Sama Mamane — abdourahamane.samamamane
Aïssatou Kadissa Sombé Roukia Sayore — aissatoukadissasomberoukia.sayore
Nabil Sbais — nabil.sbais
Isrâ Segame — isra.segame
Abdoul Karim Sidibe — abdoulkarim.sidibe
Hamza Smlali — hamza.smlali
Manelle Soffi — manelle.soffi
Nada Solaiman — nada.solaiman
Souleymane Sonko — souleymane.sonko
Meryem Souari — meryem.souari
Makita Suguri — makita.suguri
Kahina Suihli — kahina.suihli
Iness Taghzouti — iness.taghzouti
Youna Tahtah — youna.tahtah
Adam Talbi — adam.talbi
Lowena Wivine Tapoyo — lowenawivine.tapoyo
Dong Chadwick Tchala — dongchadwick.tchala
Mohamed Abdelaziz Touimi Benjelloun — mohamedabdelaziz.touimibenjelloun
Anas Touzi — anas.touzi
Jeanne Uranchimeg — jeanne.uranchimeg
Lina-Rose Vanwaelscappel — linarose.vanwaelscappel
Irwin Polycarpe Vinga — irwinpolycarpe.vinga
Penci Jostine Youndji Eyimba — pencijostine.youndjieyimba
Muskan Zahid Mahmood Noor — muskan.zahidmahmoodnoor
Fadoua Zayani — fadoua.zayani
Mohammed Zemmouri — mohammed.zemmouri
Mohammed Zeroual — mohammed.zeroual
Wendpouire Daryl Romaric Zombre — wendpouiredarylromaric.zombre
Asmaa Zouhri — asmaa.zouhri
Aicha Zouine — aicha.zouine
`;

const EMAIL_DOMAIN = "@eidia.ueuromed.org";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .replace(/[^a-z]/g, "");         // strip spaces, hyphens, apostrophes
}

interface ParsedStudent {
  firstName: string;
  lastName: string;
  email: string;
}

function parseRoster(raw: string): ParsedStudent[] {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => {
    const m = line.match(/^(.+?)\s+—\s+(\S+)$/);
    if (!m) throw new Error(`Malformed roster line: ${line}`);
    const [, fullName, emailLocal] = m;
    const [firstSlug] = emailLocal.split(".");

    // Walk through the display name accumulating normalized letters until
    // they match the email's first-name slug; that's where the split is.
    let acc = "";
    let splitIdx = fullName.length;
    for (let i = 0; i < fullName.length; i++) {
      acc += normalize(fullName[i]);
      if (acc === firstSlug) {
        splitIdx = i + 1;
        break;
      }
    }

    return {
      firstName: fullName.slice(0, splitIdx).trim(),
      lastName: fullName.slice(splitIdx).trim(),
      email: emailLocal + EMAIL_DOMAIN,
    };
  });
}

async function main() {
  console.log("Seeding database with real EIDIA roster…");

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
  console.log("  ✓ Admin");

  // ─── Department ─────────────────────────────────────────────────────────
  const eidia = await prisma.department.create({
    data: {
      name: "École d'Ingénierie Digitale et d'Intelligence Artificielle",
      code: "EIDIA",
    },
  });
  console.log("  ✓ Department EIDIA");

  // ─── Programs ───────────────────────────────────────────────────────────
  const gi = await prisma.program.create({
    data: { name: "Génie Informatique", code: "GI", departmentId: eidia.id },
  });
  const iasd = await prisma.program.create({
    data: {
      name: "Intelligence Artificielle et Science des Données",
      code: "IASD",
      departmentId: eidia.id,
    },
  });
  console.log("  ✓ 2 programs (GI, IASD)");

  // ─── Groups (8 groups of ~25, alphabetically split) ─────────────────────
  const groupSpecs = [
    { name: "GI-S5-A", programId: gi.id },
    { name: "GI-S5-B", programId: gi.id },
    { name: "GI-S5-C", programId: gi.id },
    { name: "GI-S5-D", programId: gi.id },
    { name: "IASD-S5-A", programId: iasd.id },
    { name: "IASD-S5-B", programId: iasd.id },
    { name: "IASD-S5-C", programId: iasd.id },
    { name: "IASD-S5-D", programId: iasd.id },
  ];
  const groups = [];
  for (const spec of groupSpecs) {
    const g = await prisma.group.create({
      data: { name: spec.name, programId: spec.programId, semester: 5 },
    });
    groups.push(g);
  }
  console.log("  ✓ 8 groups");

  // ─── Rooms (UEMF campus coordinates) ────────────────────────────────────
  const amphiA = await prisma.room.create({
    data: {
      name: "Amphi A",
      building: "Bâtiment Principal",
      latitude: 34.0531,
      longitude: -4.9998,
      radius: 150,
      capacity: 250,
    },
  });
  const amphiB = await prisma.room.create({
    data: {
      name: "Amphi B",
      building: "Bâtiment Principal",
      latitude: 34.0532,
      longitude: -4.9997,
      radius: 150,
      capacity: 250,
    },
  });
  const salle204 = await prisma.room.create({
    data: {
      name: "Salle 204",
      building: "Bâtiment B",
      latitude: 34.0533,
      longitude: -4.9996,
      radius: 80,
      capacity: 40,
    },
  });
  const labInfo = await prisma.room.create({
    data: {
      name: "Labo Informatique 1",
      building: "Bâtiment EIDIA",
      latitude: 34.0529,
      longitude: -4.9999,
      radius: 60,
      capacity: 30,
    },
  });
  console.log("  ✓ 4 rooms");

  // ─── Professors ─────────────────────────────────────────────────────────
  const profAhmed = await prisma.user.create({
    data: {
      email: "ahmed.elhilalialaoui@eidia.ueuromed.org",
      passwordHash: hash,
      firstName: "Ahmed",
      lastName: "El Hilali Alaoui",
      role: "PROFESSOR",
      professor: {
        create: { employeeId: "PROF-RO-001", departmentId: eidia.id },
      },
    },
    include: { professor: true },
  });
  const profSara = await prisma.user.create({
    data: {
      email: "sara.bakkali@eidia.ueuromed.org",
      passwordHash: hash,
      firstName: "Sara",
      lastName: "Bakkali",
      role: "PROFESSOR",
      professor: {
        create: { employeeId: "PROF-RSE-002", departmentId: eidia.id },
      },
    },
    include: { professor: true },
  });
  const profMouiha = await prisma.user.create({
    data: {
      email: "abderazzak.mouiha@eidia.ueuromed.org",
      passwordHash: hash,
      firstName: "Abderazzak",
      lastName: "Mouiha",
      role: "PROFESSOR",
      professor: {
        create: { employeeId: "PROF-MFA-003", departmentId: eidia.id },
      },
    },
    include: { professor: true },
  });
  const profAbadi = await prisma.user.create({
    data: {
      email: "asmae.abadi@eidia.ueuromed.org",
      passwordHash: hash,
      firstName: "Asmae",
      lastName: "Abadi",
      role: "PROFESSOR",
      professor: {
        create: { employeeId: "PROF-GIN-004", departmentId: eidia.id },
      },
    },
    include: { professor: true },
  });
  console.log("  ✓ 4 professors");

  // ─── Students ───────────────────────────────────────────────────────────
  const roster = parseRoster(RAW_ROSTER);
  console.log(`  ↪ Parsed ${roster.length} students from roster`);

  const studentIds: string[] = [];
  for (let i = 0; i < roster.length; i++) {
    const s = roster[i];
    const user = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash: hash,
        firstName: s.firstName,
        lastName: s.lastName,
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
  console.log(`  ✓ ${studentIds.length} students`);

  // ─── Assign students to groups (~25 per group, alphabetical) ────────────
  const groupSize = Math.ceil(roster.length / groups.length);
  for (let i = 0; i < studentIds.length; i++) {
    const groupIdx = Math.min(Math.floor(i / groupSize), groups.length - 1);
    await prisma.studentGroup.create({
      data: { studentId: studentIds[i], groupId: groups[groupIdx].id },
    });
  }
  console.log("  ✓ Students assigned to groups (alphabetical)");

  // ─── Courses ────────────────────────────────────────────────────────────
  // RO covers ALL groups — this is the demo course (and OR is foundational).
  await prisma.course.create({
    data: {
      name: "Recherche Opérationnelle",
      code: "RO-501",
      programId: gi.id,
      professorId: profAhmed.professor!.id,
      semester: 5,
      academicYear: "2025-2026",
      totalHours: 42,
      groups: { create: groups.map((g) => ({ groupId: g.id })) },
    },
  });
  // Robotics — GI only
  await prisma.course.create({
    data: {
      name: "Robotique et Systèmes Embarqués",
      code: "RSE-501",
      programId: gi.id,
      professorId: profSara.professor!.id,
      semester: 5,
      academicYear: "2025-2026",
      totalHours: 36,
      groups: { create: groups.slice(0, 4).map((g) => ({ groupId: g.id })) },
    },
  });
  // Mathematics — all groups
  await prisma.course.create({
    data: {
      name: "Mathématiques Fondamentales et Appliquées",
      code: "MFA-501",
      programId: gi.id,
      professorId: profMouiha.professor!.id,
      semester: 5,
      academicYear: "2025-2026",
      totalHours: 48,
      groups: { create: groups.map((g) => ({ groupId: g.id })) },
    },
  });
  // Industrial engineering — IASD only
  await prisma.course.create({
    data: {
      name: "Génie Industriel",
      code: "GIN-501",
      programId: iasd.id,
      professorId: profAbadi.professor!.id,
      semester: 5,
      academicYear: "2025-2026",
      totalHours: 30,
      groups: { create: groups.slice(4, 8).map((g) => ({ groupId: g.id })) },
    },
  });
  console.log("  ✓ 4 courses");

  console.log("\n✅ Seed completed.");
  console.log("\n--- Login Credentials (all use password: password123) ---");
  console.log("Admin       admin@eidia.ueuromed.org");
  console.log("Professeurs :");
  console.log("  ahmed.elhilalialaoui@eidia.ueuromed.org  (RO, directeur académique EIDIA)");
  console.log("  sara.bakkali@eidia.ueuromed.org           (Robotique)");
  console.log("  abderazzak.mouiha@eidia.ueuromed.org      (Mathématiques)");
  console.log("  asmae.abadi@eidia.ueuromed.org            (Génie Industriel)");
  console.log("Étudiant de démo :");
  console.log("  mouhssine.elboumshouli@eidia.ueuromed.org (GI-S5-D)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
