import { z } from "zod";

// ─── Department ──────────────────────────────────────────────
export const createDepartmentSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  code: z.string().min(2, "Le code doit contenir au moins 2 caractères").max(10),
});

// ─── Program ─────────────────────────────────────────────────
export const createProgramSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(10),
  departmentId: z.string().cuid(),
});

// ─── Group ───────────────────────────────────────────────────
export const createGroupSchema = z.object({
  name: z.string().min(1).max(50),
  programId: z.string().cuid(),
  semester: z.coerce.number().int().min(1).max(10).optional(),
});

// ─── Room ────────────────────────────────────────────────────
export const createRoomSchema = z.object({
  name: z.string().min(1).max(50),
  building: z.string().max(50).optional().default(""),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(10).max(5000).default(100),
  capacity: z.coerce.number().int().min(1).optional(),
});

// ─── Professor ───────────────────────────────────────────────
export const createProfessorSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email("Email invalide"),
  employeeId: z.string().min(1).max(20),
  departmentId: z.string().optional(),
});

// ─── Student ─────────────────────────────────────────────────
export const createStudentSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email("Email invalide"),
  studentId: z.string().min(1).max(20),
  enrollmentYear: z.coerce.number().int().min(2000).max(2100),
  groupId: z.string().optional(),
});

// ─── Course ──────────────────────────────────────────────────
export const createCourseSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(10),
  programId: z.string().cuid(),
  professorId: z.string().cuid(),
  semester: z.coerce.number().int().min(1).max(10).optional(),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, "Format: 2025-2026").optional(),
  totalHours: z.coerce.number().int().min(1).optional(),
  groupIds: z.array(z.string().cuid()).optional(),
});

// ─── Session ─────────────────────────────────────────────────
export const createSessionSchema = z.object({
  courseId: z.string().cuid(),
  professorId: z.string().cuid(),
  roomId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide"),
});

// ─── Schedule Rule ───────────────────────────────────────────
export const createScheduleRuleSchema = z.object({
  courseId: z.string().cuid(),
  roomId: z.string().cuid(),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
});

// ─── Attendance submission ───────────────────────────────────
// studentId comes from the authenticated session, not the request body.
export const submitAttendanceSchema = z.object({
  token: z.string().min(1),
  timestamp: z.number().int().positive(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  deviceInfo: z.string().optional(),
});

// ─── Self check-in (no QR token, app-driven) ─────────────────
export const selfCheckinSchema = z.object({
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  deviceInfo: z.string().optional(),
  // Front-camera selfie, base64-encoded JPEG/PNG data URL
  // (e.g. "data:image/jpeg;base64,/9j/..."). Optional — accepted but
  // flagged as "non vérifié" if missing.
  selfie: z.string().max(500_000).optional(),
});

// ─── Attendance manual update ────────────────────────────────
export const updateAttendanceSchema = z.object({
  attendanceId: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
});

// ─── Utility: parse and return formatted errors ──────────────
export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown):
  { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return { success: false, error: firstError?.message || "Données invalides" };
  }
  return { success: true, data: result.data };
}
