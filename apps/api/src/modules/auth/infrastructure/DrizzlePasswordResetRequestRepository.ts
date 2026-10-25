import type { Db } from "../../../db/client";
import { passwordResetRequests, users } from "../../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import type {
  IPasswordResetRequestRepository,
  PasswordResetRequestWithUser,
} from "../domain/repositories/IPasswordResetRequestRepository";
import type { PasswordResetRequestEntity } from "../domain/entities/PasswordResetRequest";

export class DrizzlePasswordResetRequestRepository implements IPasswordResetRequestRepository {
  constructor(private readonly db: Db) {}

  async create(entity: PasswordResetRequestEntity): Promise<PasswordResetRequestEntity> {
    const rows = await this.db
      .insert(passwordResetRequests)
      .values({
        id: entity.id,
        schoolId: entity.schoolId,
        userId: entity.userId,
        identifier: entity.identifier,
        status: entity.status,
        resolvedBy: entity.resolvedBy,
        resolvedAt: entity.resolvedAt,
        rejectionNote: entity.rejectionNote,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      })
      .returning();

    return this.toDomain(rows[0]);
  }

  async findById(id: string, schoolId: string): Promise<PasswordResetRequestEntity | null> {
    const rows = await this.db
      .select()
      .from(passwordResetRequests)
      .where(and(eq(passwordResetRequests.id, id), eq(passwordResetRequests.schoolId, schoolId)))
      .limit(1);

    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async findPendingByUserId(userId: string, schoolId: string): Promise<PasswordResetRequestEntity | null> {
    const rows = await this.db
      .select()
      .from(passwordResetRequests)
      .where(
        and(
          eq(passwordResetRequests.userId, userId),
          eq(passwordResetRequests.schoolId, schoolId),
          eq(passwordResetRequests.status, "pending")
        )
      )
      .limit(1);

    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async listPendingBySchool(schoolId: string): Promise<PasswordResetRequestWithUser[]> {
    const rows = await this.db
      .select({
        request: passwordResetRequests,
        userName: users.name,
        userRole: users.role,
        userEmail: users.email,
        userPhone: users.phone,
      })
      .from(passwordResetRequests)
      .innerJoin(users, eq(users.id, passwordResetRequests.userId))
      .where(
        and(
          eq(passwordResetRequests.schoolId, schoolId),
          eq(passwordResetRequests.status, "pending")
        )
      )
      .orderBy(desc(passwordResetRequests.createdAt));

    return rows.map((r) => ({
      ...this.toDomain(r.request),
      userName: r.userName,
      userRole: r.userRole,
      userEmail: r.userEmail,
      userPhone: r.userPhone,
    }));
  }

  async update(entity: PasswordResetRequestEntity): Promise<PasswordResetRequestEntity> {
    const rows = await this.db
      .update(passwordResetRequests)
      .set({
        status: entity.status,
        resolvedBy: entity.resolvedBy,
        resolvedAt: entity.resolvedAt,
        rejectionNote: entity.rejectionNote,
        updatedAt: entity.updatedAt,
      })
      .where(
        and(
          eq(passwordResetRequests.id, entity.id),
          eq(passwordResetRequests.schoolId, entity.schoolId)
        )
      )
      .returning();

    return this.toDomain(rows[0]);
  }

  private toDomain(row: typeof passwordResetRequests.$inferSelect): PasswordResetRequestEntity {
    return {
      id: row.id,
      schoolId: row.schoolId,
      userId: row.userId,
      identifier: row.identifier,
      status: row.status as any,
      resolvedBy: row.resolvedBy,
      resolvedAt: row.resolvedAt ? new Date(row.resolvedAt) : null,
      rejectionNote: row.rejectionNote,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
