import {
  pgTable,
  uuid,
  text,
  integer,
  date,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { schools, users } from "./tenancy";

// --- Student Gamification (Level, EXP, Streak) ---

export const studentGamification = pgTable("student_gamification", {
  studentId: uuid("student_id")
    .primaryKey()
    .references(() => users.id),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  level: integer("level").notNull().default(1),
  totalExp: integer("total_exp").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActivityDate: date("last_activity_date"),
});

// --- EXP Transactions (Audit Log) ---

export const expSourceType = [
  "daily_ibadah",
  "setoran",
  "streak_bonus",
  "munaqosah",
] as const;
export type ExpSourceType = (typeof expSourceType)[number];

export const expTransactions = pgTable("exp_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  studentId: uuid("student_id")
    .notNull()
    .references(() => users.id),
  sourceType: text("source_type", { enum: expSourceType }).notNull(),
  sourceId: uuid("source_id"), // FK ke daily_ibadah.id atau setoran_entries.id
  expAmount: integer("exp_amount").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Student Achievements (Munaqosah Juz) ---

export const achievementType = ["munaqosah_juz"] as const;

export const studentAchievements = pgTable("student_achievements", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  studentId: uuid("student_id")
    .notNull()
    .references(() => users.id),
  achievementType: text("achievement_type", { enum: achievementType }).notNull(),
  juzKe: integer("juz_ke"), // 1-30, nullable (hanya untuk munaqosah_juz)
  sourceId: uuid("source_id"), // FK munaqosah_assignments
  earnedAt: timestamp("earned_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- EXP Rules (Konfigurasi Bobot per Sekolah) ---

export const expRules = pgTable("exp_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  sourceType: text("source_type").notNull(), // daily_ibadah | setoran | streak_bonus | munaqosah
  ruleKey: text("rule_key").notNull(), // mis. BA, MA, BT, MT, H, T, ziyadah_submit, streak_7
  expValue: integer("exp_value").notNull(),
});

// --- Ibadah Grading Scale (Konversi Akumulasi Ibadah → Huruf) ---

export const ibadahAspect = [
  "sholat_fardhu",
  "sholat_rawatib",
  "tahajud_dhuha_tilawah",
  "puasa_sunnah",
] as const;
export type IbadahAspect = (typeof ibadahAspect)[number];

export const ibadahGradingScale = pgTable("ibadah_grading_scale", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  aspect: text("aspect", { enum: ibadahAspect }).notNull(),
  scale: jsonb("scale").notNull(), // [{min, max, letter}]
  penaltyRule: jsonb("penalty_rule"), // {trigger: "any_T", penalty_points: -100}
});

// --- Types ---

export type StudentGamification = typeof studentGamification.$inferSelect;
export type ExpTransaction = typeof expTransactions.$inferSelect;
export type StudentAchievement = typeof studentAchievements.$inferSelect;
export type ExpRule = typeof expRules.$inferSelect;
export type IbadahGradingScale = typeof ibadahGradingScale.$inferSelect;
