import type { Db } from "../../../db/client";
import {
  users,
  classes,
  studentClassEnrollment,
  parentStudentMapping,
  parentViews,
  dailyIbadah,
  setoranEntries,
  teacherClasses,
  notifications,
} from "../../../db/schema";
import { eq, and, desc, gte, lt, sql } from "drizzle-orm";
import type { IActivityRepository, RecordParentViewInput } from "../domain/repositories/IActivityRepository";
import type { StudentActivityRow, TeacherActivityRow } from "../domain/entities/Activity";

export class DrizzleActivityRepository implements IActivityRepository {
  constructor(private readonly db: Db) {}

  async getStudentActivity(schoolId: string, date: string, classId?: string): Promise<StudentActivityRow[]> {
    const conditions = [eq(users.schoolId, schoolId), eq(users.role, "student")];
    if (classId) conditions.push(eq(studentClassEnrollment.classId, classId));

    const rows = await this.db
      .select({
        studentId: users.id,
        studentName: users.name,
        className: classes.name,
      })
      .from(users)
      .leftJoin(
        studentClassEnrollment,
        and(eq(studentClassEnrollment.studentId, users.id), eq(studentClassEnrollment.schoolId, schoolId))
      )
      .leftJoin(classes, eq(classes.id, studentClassEnrollment.classId))
      .where(and(...conditions));

    const studentIds = rows.map((r) => r.studentId);
    if (studentIds.length === 0) return [];

    const ibadahRows = await this.db
      .select({ studentId: dailyIbadah.studentId, status: dailyIbadah.status })
      .from(dailyIbadah)
      .where(
        and(
          eq(dailyIbadah.schoolId, schoolId),
          eq(dailyIbadah.date, date),
          sql`${dailyIbadah.studentId} IN (${sql.join(studentIds.map((id) => sql`${id}`), sql`, `)})`
        )
      );
    const ibadahMap = new Map(ibadahRows.map((r) => [r.studentId, r.status as string]));

    const viewRows = await this.db
      .select({
        studentId: parentViews.studentId,
        parentId: parentViews.parentId,
        parentName: users.name,
        source: parentViews.source,
        viewedAt: parentViews.viewedAt,
      })
      .from(parentViews)
      .leftJoin(users, eq(users.id, parentViews.parentId))
      .where(
        and(
          eq(parentViews.schoolId, schoolId),
          sql`${parentViews.studentId} IN (${sql.join(studentIds.map((id) => sql`${id}`), sql`, `)})`
        )
      )
      .orderBy(desc(parentViews.viewedAt));

    const viewMap = new Map<string, (typeof viewRows)[0]>();
    for (const v of viewRows) {
      if (!viewMap.has(v.studentId)) viewMap.set(v.studentId, v);
    }

    return rows.map((r) => {
      const status = ibadahMap.get(r.studentId);
      const view = viewMap.get(r.studentId);
      return {
        studentId: r.studentId,
        studentName: r.studentName,
        className: r.className ?? null,
        yaumiyahStatus: status === "submitted" ? "submitted" : status === "draft" ? "draft" : "missing",
        parentLastViewAt: view?.viewedAt ?? null,
        parentLastSource: (view?.source as any) ?? null,
        parentName: view?.parentName ?? null,
      };
    });
  }

  async getTeacherActivity(schoolId: string, date: string): Promise<TeacherActivityRow[]> {
    const teachers = await this.db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(and(eq(users.schoolId, schoolId), eq(users.role, "teacher")));

    const result: TeacherActivityRow[] = [];
    for (const t of teachers) {
      const assigned = await this.db
        .select({ id: classes.id, name: classes.name })
        .from(teacherClasses)
        .innerJoin(classes, eq(classes.id, teacherClasses.classId))
        .where(and(eq(teacherClasses.teacherId, t.id), eq(teacherClasses.schoolId, schoolId)));

      const lastRows = await this.db
        .select({ createdAt: setoranEntries.createdAt })
        .from(setoranEntries)
        .where(and(eq(setoranEntries.teacherId, t.id), eq(setoranEntries.schoolId, schoolId)))
        .orderBy(desc(setoranEntries.createdAt))
        .limit(1);

      const todayRows = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(setoranEntries)
        .where(
          and(
            eq(setoranEntries.teacherId, t.id),
            eq(setoranEntries.schoolId, schoolId),
            eq(setoranEntries.date, date)
          )
        );

      const countToday = Number(todayRows[0]?.count ?? 0);
      result.push({
        teacherId: t.id,
        teacherName: t.name,
        classes: assigned,
        lastAssessmentAt: lastRows[0]?.createdAt ?? null,
        assessedToday: countToday > 0,
        countToday,
      });
    }
    return result;
  }

  async recordParentView(input: RecordParentViewInput): Promise<void> {
    await this.db.insert(parentViews).values({
      schoolId: input.schoolId,
      parentId: input.parentId,
      studentId: input.studentId,
      source: input.source,
    });
  }

  async findChildIdsByParent(parentId: string, schoolId: string): Promise<string[]> {
    const rows = await this.db
      .select({ studentId: parentStudentMapping.studentId })
      .from(parentStudentMapping)
      .where(and(eq(parentStudentMapping.parentId, parentId), eq(parentStudentMapping.schoolId, schoolId)));
    return rows.map((r) => r.studentId);
  }

  async findParentIdsByStudent(studentId: string, schoolId: string): Promise<string[]> {
    const rows = await this.db
      .select({ parentId: parentStudentMapping.parentId })
      .from(parentStudentMapping)
      .where(and(eq(parentStudentMapping.studentId, studentId), eq(parentStudentMapping.schoolId, schoolId)));
    return rows.map((r) => r.parentId);
  }

  async findRecentReminder(targetUserId: string, schoolId: string, title: string, since: Date): Promise<boolean> {
    const rows = await this.db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, targetUserId),
          eq(notifications.schoolId, schoolId),
          eq(notifications.title, title),
          gte(notifications.createdAt, since)
        )
      )
      .limit(1);
    return rows.length > 0;
  }

  async purgeOldParentViews(olderThan: Date, schoolId?: string): Promise<number> {
    const conditions = [lt(parentViews.viewedAt, olderThan)];
    if (schoolId) conditions.push(eq(parentViews.schoolId, schoolId));
    const deleted = await this.db.delete(parentViews).where(and(...conditions)).returning({ id: parentViews.id });
    return deleted.length;
  }
}
