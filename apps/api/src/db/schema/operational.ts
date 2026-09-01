import {
  pgTable,
  uuid,
  text,
  boolean,
  date,
  jsonb,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { schools, users } from "./tenancy";
import { assessmentSubcategories } from "./assessment";

// --- Daily Ibadah (Yaumiyah Siswa) ---

export const ibadahStatus = ["draft", "submitted"] as const;
export type IbadahStatus = (typeof ibadahStatus)[number];

export const dailyIbadah = pgTable(
  "daily_ibadah",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id),
    date: date("date").notNull(),
    status: text("status", { enum: ibadahStatus }).notNull().default("draft"),
    submittedAt: timestamp("submitted_at"),
    tilawah: jsonb("tilawah"), // {surah_start, ayat_start, surah_end, ayat_end} | null
    sholatFardhu: jsonb("sholat_fardhu"), // {subuh, dzuhur, ashar, maghrib, isya} enum per waktu
    sholatRawatib: jsonb("sholat_rawatib"), // string[]
    tahajud: boolean("tahajud").notNull().default(false),
    dhuha: boolean("dhuha").notNull().default(false),
    puasaSunnah: text("puasa_sunnah"), // senin|kamis|daud|ayamul_bidh | null
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    unqStudentDate: unique("daily_ibadah_student_date_school")
      .on(t.studentId, t.date, t.schoolId),
  })
);

// --- Setoran Entries (Generik per Sub-kategori) ---

export const setoranEntries = pgTable("setoran_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  subcategoryId: uuid("subcategory_id")
    .notNull()
    .references(() => assessmentSubcategories.id),
  studentId: uuid("student_id")
    .notNull()
    .references(() => users.id),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => users.id),
  date: date("date").notNull(),
  referenceStart: jsonb("reference_start"), // {surah, ayat} atau {halaman}
  referenceEnd: jsonb("reference_end"),
  scores: jsonb("scores").notNull(), // {field_key: number} sesuai score_fields
  keterangan: text("keterangan"), // sakit|izin|alpha|hadir_tidak_setor|null
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Evaluasi Bulanan (Naratif Guru) ---

export const evaluasiBulanan = pgTable("evaluasi_bulanan", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  studentId: uuid("student_id")
    .notNull()
    .references(() => users.id),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => users.id),
  subcategoryId: uuid("subcategory_id")
    .notNull()
    .references(() => assessmentSubcategories.id),
  bulan: text("bulan").notNull(), // YYYY-MM
  catatan: text("catatan"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Hafalan Targets (Target Bulanan Ziyadah) ---

export const hafalanTargets = pgTable("hafalan_targets", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  studentId: uuid("student_id")
    .notNull()
    .references(() => users.id),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => users.id),
  bulan: text("bulan").notNull(), // YYYY-MM
  targetSurahStart: text("target_surah_start"),
  targetAyatStart: text("target_ayat_start"),
  targetSurahEnd: text("target_surah_end"),
  targetAyatEnd: text("target_ayat_end"),
  catatan: text("catatan"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Notifications ---

export const notificationType = ["yaumiyah", "setoran", "system", "raport"] as const;
export type NotificationType = (typeof notificationType)[number];

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: notificationType }).notNull().default("system"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Types ---

export type DailyIbadah = typeof dailyIbadah.$inferSelect;
export type NewDailyIbadah = typeof dailyIbadah.$inferInsert;
export type SetoranEntry = typeof setoranEntries.$inferSelect;
export type NewSetoranEntry = typeof setoranEntries.$inferInsert;
export type EvaluasiBulanan = typeof evaluasiBulanan.$inferSelect;
export type HafalanTarget = typeof hafalanTargets.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
