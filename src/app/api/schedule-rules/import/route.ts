import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { materializeRule } from "@/lib/schedule";

/**
 * POST /api/schedule-rules/import
 *
 * Accepts a CSV body. Expected columns (case-insensitive, any order):
 *   course_code   — e.g. "RO-501"
 *   room_name     — e.g. "Amphi A"
 *   day_of_week   — 0..6 (0 = dimanche) OR a name (lundi, mardi, …)
 *   start_time    — "HH:MM"
 *   end_time      — "HH:MM"
 *   start_date    — "YYYY-MM-DD"
 *   end_date      — "YYYY-MM-DD"
 *
 * Lines starting with # are treated as comments and ignored.
 */
const DAY_TO_NUM: Record<string, number> = {
  dim: 0, dimanche: 0, sun: 0, sunday: 0, "0": 0,
  lun: 1, lundi: 1, mon: 1, monday: 1, "1": 1,
  mar: 2, mardi: 2, tue: 2, tuesday: 2, "2": 2,
  mer: 3, mercredi: 3, wed: 3, wednesday: 3, "3": 3,
  jeu: 4, jeudi: 4, thu: 4, thursday: 4, "4": 4,
  ven: 5, vendredi: 5, fri: 5, friday: 5, "5": 5,
  sam: 6, samedi: 6, sat: 6, saturday: 6, "6": 6,
};

function parseCsvLine(line: string): string[] {
  // Simple RFC 4180-ish parser supporting quoted fields with escaped quotes
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cur += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === "," || c === ";") { result.push(cur); cur = ""; }
      else { cur += c; }
    }
  }
  result.push(cur);
  return result.map((s) => s.trim());
}

export async function POST(req: NextRequest) {
  const auth = await requireApiRole(["ADMIN"]);
  if ("error" in auth) return auth.error;

  try {
    const csv = await req.text();
    if (!csv.trim()) {
      return NextResponse.json({ error: "Fichier vide" }, { status: 400 });
    }

    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "Le CSV doit contenir un en-tête et au moins une ligne" },
        { status: 400 }
      );
    }

    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const idx = (name: string) => headers.indexOf(name);
    const required = ["course_code", "room_name", "day_of_week", "start_time", "end_time", "start_date", "end_date"];
    for (const r of required) {
      if (idx(r) === -1) {
        return NextResponse.json(
          { error: `Colonne manquante : ${r}` },
          { status: 400 }
        );
      }
    }

    // Pre-fetch courses and rooms for lookup
    const courses = await prisma.course.findMany({ select: { id: true, code: true } });
    const rooms = await prisma.room.findMany({ select: { id: true, name: true } });
    const courseByCode = new Map(courses.map((c) => [c.code.toUpperCase(), c.id]));
    const roomByName = new Map(rooms.map((r) => [r.name.toLowerCase(), r.id]));

    const results: { line: number; status: string; detail?: string }[] = [];
    const createdRuleIds: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const fields = parseCsvLine(lines[i]);
      const courseCode = fields[idx("course_code")].toUpperCase();
      const roomName = fields[idx("room_name")].toLowerCase();
      const dayRaw = fields[idx("day_of_week")].toLowerCase();
      const startTime = fields[idx("start_time")];
      const endTime = fields[idx("end_time")];
      const startDate = fields[idx("start_date")];
      const endDate = fields[idx("end_date")];

      const courseId = courseByCode.get(courseCode);
      const roomId = roomByName.get(roomName);
      const dayOfWeek = DAY_TO_NUM[dayRaw];

      if (!courseId) {
        results.push({ line: i + 1, status: "skipped", detail: `Cours inconnu : ${courseCode}` });
        continue;
      }
      if (!roomId) {
        results.push({ line: i + 1, status: "skipped", detail: `Salle inconnue : ${fields[idx("room_name")]}` });
        continue;
      }
      if (dayOfWeek === undefined) {
        results.push({ line: i + 1, status: "skipped", detail: `Jour invalide : ${dayRaw}` });
        continue;
      }
      if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
        results.push({ line: i + 1, status: "skipped", detail: "Format d'heure invalide" });
        continue;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        results.push({ line: i + 1, status: "skipped", detail: "Format de date invalide" });
        continue;
      }

      const rule = await prisma.scheduleRule.create({
        data: {
          courseId,
          roomId,
          dayOfWeek,
          startTime,
          endTime,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          active: true,
        },
      });
      createdRuleIds.push(rule.id);
      results.push({ line: i + 1, status: "created" });
    }

    // Materialize all created rules
    let totalSessionsCreated = 0;
    for (const ruleId of createdRuleIds) {
      const r = await materializeRule(ruleId);
      totalSessionsCreated += r.created;
    }

    return NextResponse.json({
      rulesCreated: createdRuleIds.length,
      sessionsCreated: totalSessionsCreated,
      results,
    });
  } catch (error) {
    console.error("Schedule CSV import error:", error);
    return NextResponse.json({ error: "Erreur lors de l'import" }, { status: 500 });
  }
}
