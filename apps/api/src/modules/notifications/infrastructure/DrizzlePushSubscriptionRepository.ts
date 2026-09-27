import type { Db } from "../../../db/client";
import { pushSubscriptions } from "../../../db/schema";
import { eq, and } from "drizzle-orm";
import type { IPushSubscriptionRepository, SavePushSubscriptionInput } from "../domain/repositories/IPushSubscriptionRepository";
import type { PushSubscriptionEntity } from "../domain/entities/PushSubscription";

export class DrizzlePushSubscriptionRepository implements IPushSubscriptionRepository {
  constructor(private readonly db: Db) {}

  async upsert(input: SavePushSubscriptionInput): Promise<PushSubscriptionEntity> {
    const now = new Date();
    const rows = await this.db
      .insert(pushSubscriptions)
      .values({
        schoolId: input.schoolId,
        userId: input.userId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent ?? null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          schoolId: input.schoolId,
          userId: input.userId,
          p256dh: input.p256dh,
          auth: input.auth,
          userAgent: input.userAgent ?? null,
          updatedAt: now,
        },
      })
      .returning();
    return this.toDomain(rows[0]);
  }

  async removeByEndpoint(endpoint: string, userId: string, schoolId: string): Promise<void> {
    await this.db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, endpoint),
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.schoolId, schoolId)
        )
      );
  }

  async listByUser(userId: string, schoolId: string): Promise<PushSubscriptionEntity[]> {
    const rows = await this.db
      .select()
      .from(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.schoolId, schoolId)));
    return rows.map((r) => this.toDomain(r));
  }

  async deleteByEndpoint(endpoint: string): Promise<void> {
    await this.db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  private toDomain(row: typeof pushSubscriptions.$inferSelect): PushSubscriptionEntity {
    return {
      id: row.id,
      schoolId: row.schoolId,
      userId: row.userId,
      endpoint: row.endpoint,
      p256dh: row.p256dh,
      auth: row.auth,
      userAgent: row.userAgent,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
