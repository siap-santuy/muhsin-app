import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { schools } from "./tenancy";

export const academicPeriods = pgTable("academic_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  tahunAjaran: text("tahun_ajaran").notNull(),
  semester: text("semester").notNull(),
  isLocked: boolean("is_locked").notNull().default(false),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AcademicPeriod = typeof academicPeriods.$inferSelect;
export type NewAcademicPeriod = typeof academicPeriods.$inferInsert;
