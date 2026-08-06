import { pgTable, uuid } from "drizzle-orm/pg-core";
import { schools, users, classes } from "./tenancy";
import { academicPeriods } from "./periods";

// ponytail: natural-key uniqueness (student_id+class_id+period dll) belum di-enforce
// via composite PK; ditambahkan sebagai unique index saat modul sekolah dibangun.
export const studentClassEnrollment = pgTable("student_class_enrollment", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => users.id),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  academicPeriodId: uuid("academic_period_id")
    .notNull()
    .references(() => academicPeriods.id),
});

export const studentTeacherMapping = pgTable("student_teacher_mapping", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => users.id),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => users.id),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
});

export const parentStudentMapping = pgTable("parent_student_mapping", {
  id: uuid("id").defaultRandom().primaryKey(),
  parentId: uuid("parent_id")
    .notNull()
    .references(() => users.id),
  studentId: uuid("student_id")
    .notNull()
    .references(() => users.id),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
});

export type StudentClassEnrollment = typeof studentClassEnrollment.$inferSelect;
export type StudentTeacherMapping = typeof studentTeacherMapping.$inferSelect;
export type ParentStudentMapping = typeof parentStudentMapping.$inferSelect;
