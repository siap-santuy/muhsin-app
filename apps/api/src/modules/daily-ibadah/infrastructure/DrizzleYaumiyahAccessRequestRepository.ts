import type { Db } from "../../../db/client";
import {
  yaumiyahAccessRequests,
  users,
  classes,
  studentClassEnrollment,
  studentTeacherMapping,
} from "../../../db/schema";
import { eq, and, lte, gte, desc, inArray, sql } from "drizzle-orm";
import type {
  IYaumiyahAccessRequestRepository,
  YaumiyahAccessRequestWithStudent,
} from "../domain/repositories/IYaumiyahAccessRequestRepository";
import type { YaumiyahAccessRequestEntity } from "../domain/entities/YaumiyahAccessRequest";

export class DrizzleYaumiyahAccessRequestRepository implements IYaumiyahAccessRequestRepository {
  constructor(private readonly db: Db) {}

  async create(entity: YaumiyahAccessRequestEntity): Promise<YaumiyahAccessRequestEntity> {
    const rows = await this.db
      .insert(yaumiyahAccessRequests)
      .values({
        id: entity.id,
        schoolId: entity.schoolId,
        studentId: entity.studentId,
        startDate: entity.startDate,
        endDate: entity.endDate,
        reason: entity.reason,
        status: entity.status,
        reviewedBy: entity.reviewedBy,
        reviewedAt: entity.reviewedAt,
        rejectionNote: entity.rejectionNote,
        expiresAt: entity.expiresAt,
        isDirectGrant: entity.isDirectGrant,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      })
      .returning();

    return this.toDomain(rows[0]);
  }

  async findById(id: string, schoolId: string): Promise<YaumiyahAccessRequestEntity | null> {
    const rows = await this.db
      .select()
      .from(yaumiyahAccessRequests)
      .where(
        and(
          eq(yaumiyahAccessRequests.id, id),
          eq(yaumiyahAccessRequests.schoolId, schoolId)
        )
      )
      .limit(1);

    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async findActiveApproved(
    studentId: string,
    date: string,
    schoolId: string
  ): Promise<YaumiyahAccessRequestEntity | null> {
    const now = new Date();
    const rows = await this.db
      .select()
      .from(yaumiyahAccessRequests)
      .where(
        and(
          eq(yaumiyahAccessRequests.schoolId, schoolId),
          eq(yaumiyahAccessRequests.studentId, studentId),
          eq(yaumiyahAccessRequests.status, "approved"),
          lte(yaumiyahAccessRequests.startDate, date),
          gte(yaumiyahAccessRequests.endDate, date),
          gte(yaumiyahAccessRequests.expiresAt, now)
        )
      )
      .orderBy(desc(yaumiyahAccessRequests.expiresAt))
      .limit(1);

    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async findPendingOverlap(
    studentId: string,
    startDate: string,
    endDate: string,
    schoolId: string
  ): Promise<YaumiyahAccessRequestEntity | null> {
    const rows = await this.db
      .select()
      .from(yaumiyahAccessRequests)
      .where(
        and(
          eq(yaumiyahAccessRequests.schoolId, schoolId),
          eq(yaumiyahAccessRequests.studentId, studentId),
          eq(yaumiyahAccessRequests.status, "pending"),
          lte(yaumiyahAccessRequests.startDate, endDate),
          gte(yaumiyahAccessRequests.endDate, startDate)
        )
      )
      .limit(1);

    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async listByStudent(studentId: string, schoolId: string): Promise<YaumiyahAccessRequestEntity[]> {
    const rows = await this.db
      .select()
      .from(yaumiyahAccessRequests)
      .where(
        and(
          eq(yaumiyahAccessRequests.schoolId, schoolId),
          eq(yaumiyahAccessRequests.studentId, studentId)
        )
      )
      .orderBy(desc(yaumiyahAccessRequests.createdAt));

    return rows.map((r) => this.toDomain(r));
  }

  async listPendingBySchool(
    schoolId: string,
    teacherId?: string
  ): Promise<YaumiyahAccessRequestWithStudent[]> {
    let allowedStudentIds: string[] | null = null;

    if (teacherId) {
      const teacherMappings = await this.db
        .select({ studentId: studentTeacherMapping.studentId })
        .from(studentTeacherMapping)
        .where(
          and(
            eq(studentTeacherMapping.schoolId, schoolId),
            eq(studentTeacherMapping.teacherId, teacherId)
          )
        );

      allowedStudentIds = teacherMappings.map((m) => m.studentId);
      if (allowedStudentIds.length === 0) {
        return [];
      }
    }

    const conditions = [
      eq(yaumiyahAccessRequests.schoolId, schoolId),
      eq(yaumiyahAccessRequests.status, "pending"),
    ];

    if (allowedStudentIds && allowedStudentIds.length > 0) {
      conditions.push(inArray(yaumiyahAccessRequests.studentId, allowedStudentIds));
    }

    const rows = await this.db
      .select({
        request: yaumiyahAccessRequests,
        studentName: users.name,
        className: classes.name,
      })
      .from(yaumiyahAccessRequests)
      .innerJoin(users, eq(users.id, yaumiyahAccessRequests.studentId))
      .leftJoin(
        studentClassEnrollment,
        and(
          eq(studentClassEnrollment.studentId, yaumiyahAccessRequests.studentId),
          eq(studentClassEnrollment.schoolId, schoolId)
        )
      )
      .leftJoin(classes, eq(classes.id, studentClassEnrollment.classId))
      .where(and(...conditions))
      .orderBy(desc(yaumiyahAccessRequests.createdAt));

    return rows.map((r) => ({
      ...this.toDomain(r.request),
      studentName: r.studentName,
      className: r.className ?? null,
    }));
  }

  async update(entity: YaumiyahAccessRequestEntity): Promise<YaumiyahAccessRequestEntity> {
    const rows = await this.db
      .update(yaumiyahAccessRequests)
      .set({
        status: entity.status,
        reviewedBy: entity.reviewedBy,
        reviewedAt: entity.reviewedAt,
        rejectionNote: entity.rejectionNote,
        expiresAt: entity.expiresAt,
        updatedAt: entity.updatedAt,
      })
      .where(
        and(
          eq(yaumiyahAccessRequests.id, entity.id),
          eq(yaumiyahAccessRequests.schoolId, entity.schoolId)
        )
      )
      .returning();

    return this.toDomain(rows[0]);
  }

  private toDomain(row: typeof yaumiyahAccessRequests.$inferSelect): YaumiyahAccessRequestEntity {
    return {
      id: row.id,
      schoolId: row.schoolId,
      studentId: row.studentId,
      startDate: row.startDate,
      endDate: row.endDate,
      reason: row.reason,
      status: row.status as any,
      reviewedBy: row.reviewedBy,
      reviewedAt: row.reviewedAt ? new Date(row.reviewedAt) : null,
      rejectionNote: row.rejectionNote,
      expiresAt: row.expiresAt ? new Date(row.expiresAt) : null,
      isDirectGrant: row.isDirectGrant,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
