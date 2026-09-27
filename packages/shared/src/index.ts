import { z } from "zod";

// --- Auth Schemas ---

export const userRoleSchema = z.enum([
  "koordinator_ttq",
  "teacher",
  "parent",
  "student",
]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const loginInputSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(8),
  schoolId: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const refreshTokenInputSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenInputSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  role: userRoleSchema,
  name: z.string(),
  email: z.string().email(),
  username: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  birthPlace: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const loginOutputSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  user: authUserSchema,
});
export type LoginOutput = z.infer<typeof loginOutputSchema>;

export const refreshTokenOutputSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
});
export type RefreshTokenOutput = z.infer<typeof refreshTokenOutputSchema>;

// --- Gamification Schemas ---

export const gamificationSummarySchema = z.object({
  studentId: z.string(),
  schoolId: z.string(),
  level: z.number(),
  totalExp: z.number(),
  currentStreak: z.number(),
  longestStreak: z.number(),
  lastActivityDate: z.string().nullable(),
});
export type GamificationSummary = z.infer<typeof gamificationSummarySchema>;

// --- Daily Ibadah Schemas ---

export const sholatFardhuSchema = z.object({
  subuh: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
  dzuhur: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
  ashar: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
  maghrib: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
  isya: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
});
export type SholatFardhu = z.infer<typeof sholatFardhuSchema>;

export const tilawahSchema = z.object({
  surahStart: z.number().int().min(1).max(114),
  ayatStart: z.number().int().min(1),
  surahEnd: z.number().int().min(1).max(114),
  ayatEnd: z.number().int().min(1),
});
export type Tilawah = z.infer<typeof tilawahSchema>;

export const dailyIbadahInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sholatFardhu: sholatFardhuSchema.optional().nullable(),
  sholatRawatib: z.array(z.string()).optional().nullable(),
  tahajud: z.boolean().optional(),
  dhuha: z.boolean().optional(),
  puasaSunnah: z.string().optional().nullable(),
  tilawah: tilawahSchema.optional().nullable(),
});
export type DailyIbadahInput = z.infer<typeof dailyIbadahInputSchema>;

// --- User Profile Schemas ---

export const updateProfileInputSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().max(30).optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  birthPlace: z.string().max(100).optional().nullable(),
  birthDate: z.string().optional().nullable(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

export const userProfileSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  role: userRoleSchema,
  name: z.string(),
  email: z.string(),
  username: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  birthPlace: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  phone: z.string().nullable(),
  createdAt: z.string(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

// --- Setoran Schemas ---

export const createSetoranInputSchema = z.object({
  subcategoryId: z.string().uuid(),
  studentId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  referenceStart: z.record(z.any()).optional().nullable(),
  referenceEnd: z.record(z.any()).optional().nullable(),
  scores: z.record(z.number().min(0).max(100)),
  keterangan: z.string().optional().nullable(),
  scoreFieldKeys: z.array(z.string()),
  substitutedForTeacherId: z.string().uuid().optional().nullable(),
});
export type CreateSetoranInput = z.infer<typeof createSetoranInputSchema>;

export const correctSetoranInputSchema = z.object({
  targetSubcategoryId: z.string().uuid(),
  scores: z.record(z.number().min(0).max(100)),
  referenceStart: z.record(z.any()).optional().nullable(),
  referenceEnd: z.record(z.any()).optional().nullable(),
  keterangan: z.string().optional().nullable(),
  scoreFieldKeys: z.array(z.string()),
});
export type CorrectSetoranInput = z.infer<typeof correctSetoranInputSchema>;

// --- Activity & Remind Schemas ---

export const parentViewSourceSchema = z.enum(["dashboard", "raport"]);
export type ParentViewSource = z.infer<typeof parentViewSourceSchema>;

export const koorStudentActivityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  classId: z.string().uuid().optional(),
});
export type KoorStudentActivityQuery = z.infer<typeof koorStudentActivityQuerySchema>;

export const remindParentInputSchema = z.object({
  studentId: z.string().uuid(),
});
export type RemindParentInput = z.infer<typeof remindParentInputSchema>;

export const remindStudentInputSchema = z.object({
  studentId: z.string().uuid().optional(),
});
export type RemindStudentInput = z.infer<typeof remindStudentInputSchema>;

// --- Surah Reference ---
export * from "./surah";

