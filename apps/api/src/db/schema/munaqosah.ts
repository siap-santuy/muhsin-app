import {
  pgTable,
  uuid,
  text,
  integer,
  date,
  time,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { schools, users } from "./tenancy";
import { academicPeriods } from "./periods";

// --- Munaqosah Periods ---

export const munaqosahPeriodStatus = ["draft", "buka", "tutup"] as const;

export const munaqosahPeriods = pgTable("munaqosah_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  academicPeriodId: uuid("academic_period_id")
    .notNull()
    .references(() => academicPeriods.id),
  nama: text("nama").notNull(),
  tanggalMulai: date("tanggal_mulai").notNull(),
  tanggalSelesai: date("tanggal_selesai").notNull(),
  status: text("status", { enum: munaqosahPeriodStatus })
    .notNull()
    .default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Munaqosah Examiners (Pool Penguji per Periode) ---

export const munaqosahExaminers = pgTable("munaqosah_examiners", {
  id: uuid("id").defaultRandom().primaryKey(),
  munaqosahPeriodId: uuid("munaqosah_period_id")
    .notNull()
    .references(() => munaqosahPeriods.id),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => users.id),
  kapasitasSiswa: integer("kapasitas_siswa").notNull(),
  assignedBy: uuid("assigned_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Munaqosah Requests (Pengajuan dari Guru) ---

export const munaqosahRequestStatus = [
  "diajukan",
  "disetujui",
  "dijadwalkan",
  "lulus",
  "tidak_lulus",
  "ditolak",
] as const;

export const munaqosahRequests = pgTable("munaqosah_requests", {
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
  juzKe: integer("juz_ke").notNull(), // 1-30
  status: text("status", { enum: munaqosahRequestStatus })
    .notNull()
    .default("diajukan"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Munaqosah Assignments (Penjadwalan & Hasil Ujian) ---

export const munaqosahHasil = ["belum", "lulus", "tidak_lulus"] as const;

export const munaqosahAssignments = pgTable("munaqosah_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => munaqosahRequests.id),
  periodId: uuid("period_id")
    .notNull()
    .references(() => munaqosahPeriods.id),
  examinerTeacherId: uuid("examiner_teacher_id")
    .notNull()
    .references(() => users.id),
  jadwalTanggal: date("jadwal_tanggal").notNull(),
  jadwalWaktu: time("jadwal_waktu"),
  scores: jsonb("scores"), // {tajwid, kelancaran}
  hasil: text("hasil", { enum: munaqosahHasil }).notNull().default("belum"),
  catatanPenguji: text("catatan_penguji"),
  assignedBy: uuid("assigned_by")
    .notNull()
    .references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// --- Types ---

export type MunaqosahPeriod = typeof munaqosahPeriods.$inferSelect;
export type MunaqosahExaminer = typeof munaqosahExaminers.$inferSelect;
export type MunaqosahRequest = typeof munaqosahRequests.$inferSelect;
export type MunaqosahAssignment = typeof munaqosahAssignments.$inferSelect;
