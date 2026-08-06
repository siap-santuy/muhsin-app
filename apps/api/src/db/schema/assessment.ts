import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { schools } from "./tenancy";
import { academicPeriods } from "./periods";

export const assessmentCategories = pgTable("assessment_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  academicPeriodId: uuid("academic_period_id")
    .notNull()
    .references(() => academicPeriods.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  icon: text("icon"),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assessmentSubcategories = pgTable("assessment_subcategories", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => assessmentCategories.id),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  scoreFields: jsonb("score_fields").notNull(),
  referenceShape: jsonb("reference_shape"),
  gradingScale: jsonb("grading_scale").notNull(),
  includeInRanking: boolean("include_in_ranking").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AssessmentCategory = typeof assessmentCategories.$inferSelect;
export type NewAssessmentCategory = typeof assessmentCategories.$inferInsert;
export type AssessmentSubcategory = typeof assessmentSubcategories.$inferSelect;
export type NewAssessmentSubcategory = typeof assessmentSubcategories.$inferInsert;
