import type { Db } from "../../../db/client";
import { users, teacherClasses, classes, studentTeacherMapping } from "../../../db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { ITeacherRepository } from "../domain/repositories/ITeacherRepository";
import type { TeacherListItem } from "../domain/entities/Teacher";

export class DrizzleTeacherRepository implements ITeacherRepository {
  constructor(private readonly db: Db) {}

  async findBySchool(schoolId: string): Promise<TeacherListItem[]> {
    const teacherRows = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      })
      .from(users)
      .where(and(eq(users.schoolId, schoolId), eq(users.role, "teacher")));

    const result: TeacherListItem[] = [];

    for (const t of teacherRows) {
      // Get assigned classes
      const assignedClasses = await this.db
        .select({
          id: classes.id,
          name: classes.name,
        })
        .from(teacherClasses)
        .innerJoin(classes, eq(classes.id, teacherClasses.classId))
        .where(
          and(
            eq(teacherClasses.teacherId, t.id),
            eq(teacherClasses.schoolId, schoolId)
          )
        );

      // Get student count
      const studentCountRes = await this.db
        .select({ count: sql<number>`count(distinct ${studentTeacherMapping.studentId})` })
        .from(studentTeacherMapping)
        .where(
          and(
            eq(studentTeacherMapping.teacherId, t.id),
            eq(studentTeacherMapping.schoolId, schoolId)
          )
        );

      result.push({
        id: t.id,
        name: t.name,
        email: t.email,
        phone: t.phone,
        classes: assignedClasses,
        studentCount: Number(studentCountRes[0]?.count ?? 0),
      });
    }

    return result;
  }

  async findById(id: string, schoolId: string): Promise<TeacherListItem | null> {
    const rows = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      })
      .from(users)
      .where(
        and(
          eq(users.id, id),
          eq(users.schoolId, schoolId),
          eq(users.role, "teacher")
        )
      )
      .limit(1);

    const t = rows[0];
    if (!t) return null;

    const assignedClasses = await this.db
      .select({
        id: classes.id,
        name: classes.name,
      })
      .from(teacherClasses)
      .innerJoin(classes, eq(classes.id, teacherClasses.classId))
      .where(
        and(
          eq(teacherClasses.teacherId, t.id),
          eq(teacherClasses.schoolId, schoolId)
        )
      );

    const studentCountRes = await this.db
      .select({ count: sql<number>`count(distinct ${studentTeacherMapping.studentId})` })
      .from(studentTeacherMapping)
      .where(
        and(
          eq(studentTeacherMapping.teacherId, t.id),
          eq(studentTeacherMapping.schoolId, schoolId)
        )
      );

    return {
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      classes: assignedClasses,
      studentCount: Number(studentCountRes[0]?.count ?? 0),
    };
  }
}
