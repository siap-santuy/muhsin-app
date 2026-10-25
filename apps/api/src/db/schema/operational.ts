import {
  pgTable,
  uuid,
  text,
  boolean,
  date,
  jsonb,
  timestamp,
  unique,
  index,
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
  substitutedForTeacherId: uuid("substituted_for_teacher_id").references(() => users.id),
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

export const hafalanTargets = pgTable(
  "hafalan_targets",
  {
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
  },
  (t) => ({
    unqStudentMonthSchool: unique("hafalan_targets_student_month_school").on(
      t.studentId,
      t.bulan,
      t.schoolId
    ),
  })
);

// --- Notifications ---

export const notificationType = ["yaumiyah", "setoran", "system", "raport", "munaqosah"] as const;
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

// --- Parent Views (Ortu Buka Dashboard/Raport Anak) ---

export const parentViewSource = ["dashboard", "raport"] as const;
export type ParentViewSource = (typeof parentViewSource)[number];

export const parentViews = pgTable(
  "parent_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => users.id),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id),
    source: text("source", { enum: parentViewSource }).notNull(),
    viewedAt: timestamp("viewed_at").defaultNow().notNull(),
  },
  (t) => ({
    idxStudentViewed: index("parent_views_student_viewed_idx").on(
      t.schoolId,
      t.studentId,
      t.viewedAt
    ),
    idxParentViewed: index("parent_views_parent_viewed_idx").on(
      t.schoolId,
      t.parentId,
      t.viewedAt
    ),
  })
);

// --- Push Subscriptions (Alamat Device Web Push) ---

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    idxUserSubs: index("push_subscriptions_user_idx").on(t.schoolId, t.userId),
  })
);

// --- Yaumiyah Access Requests (Permohonan / Pemberian Akses Input Lampau H-2+) ---

export const yaumiyahRequestStatus = ["pending", "approved", "rejected"] as const;
export type YaumiyahRequestStatus = (typeof yaumiyahRequestStatus)[number];

export const yaumiyahAccessRequests = pgTable(
  "yaumiyah_access_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id),
    startDate: date("start_date").notNull(), // Format YYYY-MM-DD
    endDate: date("end_date").notNull(),     // Format YYYY-MM-DD
    reason: text("reason").notNull(),
    status: text("status", { enum: yaumiyahRequestStatus }).notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionNote: text("rejection_note"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isDirectGrant: boolean("is_direct_grant").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxSchoolStudent: index("yaumiyah_access_req_school_student_idx").on(t.schoolId, t.studentId),
    idxSchoolStatus: index("yaumiyah_access_req_school_status_idx").on(t.schoolId, t.status),
  })
);

// --- Password Reset Requests (Permohonan Reset Password Pengguna) ---

export const passwordResetStatus = ["pending", "resolved", "rejected"] as const;
export type PasswordResetStatus = (typeof passwordResetStatus)[number];

export const passwordResetRequests = pgTable(
  "password_reset_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    identifier: text("identifier").notNull(),
    status: text("status", { enum: passwordResetStatus }).notNull().default("pending"),
    resolvedBy: uuid("resolved_by").references(() => users.id),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    rejectionNote: text("rejection_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxSchoolStatus: index("password_reset_req_school_status_idx").on(t.schoolId, t.status),
    idxSchoolUser: index("password_reset_req_school_user_idx").on(t.schoolId, t.userId),
  })
);

// --- Types ---

export type DailyIbadah = typeof dailyIbadah.$inferSelect;
export type NewDailyIbadah = typeof dailyIbadah.$inferInsert;
export type SetoranEntry = typeof setoranEntries.$inferSelect;
export type NewSetoranEntry = typeof setoranEntries.$inferInsert;
export type EvaluasiBulanan = typeof evaluasiBulanan.$inferSelect;
export type HafalanTarget = typeof hafalanTargets.$inferSelect;
export type ParentView = typeof parentViews.$inferSelect;
export type NewParentView = typeof parentViews.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type YaumiyahAccessRequest = typeof yaumiyahAccessRequests.$inferSelect;
export type NewYaumiyahAccessRequest = typeof yaumiyahAccessRequests.$inferInsert;
export type PasswordResetRequest = typeof passwordResetRequests.$inferSelect;
export type NewPasswordResetRequest = typeof passwordResetRequests.$inferInsert;
