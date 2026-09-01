import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const schoolJenjang = ["SD", "SMP", "SMA", "MA"] as const;
export type SchoolJenjang = (typeof schoolJenjang)[number];

export const subscriptionTier = ["small", "medium", "large"] as const;
export type SubscriptionTier = (typeof subscriptionTier)[number];

export const userRole = ["koordinator_ttq", "teacher", "parent", "student"] as const;
export type UserRole = (typeof userRole)[number];

export const schools = pgTable("schools", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  jenjang: text("jenjang", { enum: schoolJenjang }).notNull(),
  npsn: text("npsn"),
  address: text("address"),
  // FKs tanpa .references() untuk hindari import sirkular tenancy↔periods;
  // referensi didaftarkan di migration (FK ke academic_periods.id).
  activeAcademicPeriodId: uuid("active_academic_period_id"),
  subscriptionTier: text("subscription_tier", { enum: subscriptionTier })
    .notNull()
    .default("small"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  role: text("role", { enum: userRole }).notNull(),
  name: text("name").notNull(),
  username: text("username"),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const classes = pgTable("classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  name: text("name").notNull(),
  jenjangLevel: text("jenjang_level"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
