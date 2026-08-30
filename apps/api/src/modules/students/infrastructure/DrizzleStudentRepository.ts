import type { Db } from "../../../db/client";
import {
  users,
  classes,
  studentClassEnrollment,
  studentTeacherMapping,
  studentGamification,
} from "../../../db/schema";
import { eq, and } from "drizzle-orm";
import type { IStudentRepository } from "../domain/repositories/IStudentRepository";
import type { StudentListItem } from "../domain/entities/Student";

export class DrizzleStudentRepository implements IStudentRepository {
  constructor(private readonly db: Db) {}

  async findBySchool(schoolId: string): Promise<StudentListItem[]> {
    const rows = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        className: classes.name,
        classId: classes.id,
        level: studentGamification.level,
        totalExp: studentGamification.totalExp,
        currentStreak: studentGamification.currentStreak,
      })
      .from(users)
      .leftJoin(
        studentClassEnrollment,
        and(
          eq(studentClassEnrollment.studentId, users.id),
          eq(studentClassEnrollment.schoolId, schoolId)
        )
      )
      .leftJoin(classes, eq(classes.id, studentClassEnrollment.classId))
      .leftJoin(
        studentGamification,
        and(
          eq(studentGamification.studentId, users.id),
          eq(studentGamification.schoolId, schoolId)
        )
      )
      .where(and(eq(users.schoolId, schoolId), eq(users.role, "student")));

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      className: r.className ?? null,
      classId: r.classId ?? null,
      teacherName: null,
      teacherId: null,
      level: r.level ?? 1,
      totalExp: r.totalExp ?? 0,
      currentStreak: r.currentStreak ?? 0,
    }));
  }

  async findByTeacher(
    teacherId: string,
    schoolId: string
  ): Promise<StudentListItem[]> {
    const rows = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        className: classes.name,
        classId: classes.id,
        level: studentGamification.level,
        totalExp: studentGamification.totalExp,
        currentStreak: studentGamification.currentStreak,
      })
      .from(studentTeacherMapping)
      .innerJoin(users, eq(users.id, studentTeacherMapping.studentId))
      .leftJoin(classes, eq(classes.id, studentTeacherMapping.classId))
      .leftJoin(
        studentGamification,
        and(
          eq(studentGamification.studentId, users.id),
          eq(studentGamification.schoolId, schoolId)
        )
      )
      .where(
        and(
          eq(studentTeacherMapping.teacherId, teacherId),
          eq(studentTeacherMapping.schoolId, schoolId)
        )
      );

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      className: r.className ?? null,
      classId: r.classId ?? null,
      teacherName: null,
      teacherId,
      level: r.level ?? 1,
      totalExp: r.totalExp ?? 0,
      currentStreak: r.currentStreak ?? 0,
    }));
  }

  async findById(id: string, schoolId: string): Promise<StudentListItem | null> {
    const rows = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        className: classes.name,
        classId: classes.id,
        level: studentGamification.level,
        totalExp: studentGamification.totalExp,
        currentStreak: studentGamification.currentStreak,
      })
      .from(users)
      .leftJoin(
        studentClassEnrollment,
        and(
          eq(studentClassEnrollment.studentId, users.id),
          eq(studentClassEnrollment.schoolId, schoolId)
        )
      )
      .leftJoin(classes, eq(classes.id, studentClassEnrollment.classId))
      .leftJoin(
        studentGamification,
        and(
          eq(studentGamification.studentId, users.id),
          eq(studentGamification.schoolId, schoolId)
        )
      )
      .where(
        and(
          eq(users.id, id),
          eq(users.schoolId, schoolId),
          eq(users.role, "student")
        )
      )
      .limit(1);

    const r = rows[0];
    if (!r) return null;

    return {
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      className: r.className ?? null,
      classId: r.classId ?? null,
      teacherName: null,
      teacherId: null,
      level: r.level ?? 1,
      totalExp: r.totalExp ?? 0,
      currentStreak: r.currentStreak ?? 0,
    };
  }
}
