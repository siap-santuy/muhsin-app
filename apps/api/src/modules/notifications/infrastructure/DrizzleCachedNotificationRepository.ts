import type { Db } from "../../../db/client";
import { notifications } from "../../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import type Redis from "ioredis";
import type { INotificationRepository } from "../domain/repositories/INotificationRepository";
import type { NotificationEntity, NotificationType } from "../domain/entities/Notification";

const CACHE_TTL_SECONDS = 300; // 5 minutes
const KEY_PREFIX = "notif:";

export class DrizzleCachedNotificationRepository implements INotificationRepository {
  constructor(
    private readonly db: Db,
    private readonly redis: Redis
  ) {}

  private getCacheKey(schoolId: string, userId: string): string {
    return `${KEY_PREFIX}${schoolId}:${userId}`;
  }

  private async invalidateCache(schoolId: string, userId: string): Promise<void> {
    try {
      await this.redis.del(this.getCacheKey(schoolId, userId));
    } catch {
      // Redis fail safe
    }
  }

  async getUserNotifications(userId: string, schoolId: string): Promise<NotificationEntity[]> {
    const key = this.getCacheKey(schoolId, userId);

    // 1. Try Redis cache first
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        }));
      }
    } catch {
      // Proceed to DB on Redis cache miss/error
    }

    // 2. Query Postgres
    const rows = await this.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.schoolId, schoolId)))
      .orderBy(desc(notifications.createdAt));

    // If no notifications exist yet, seed initial defaults for this user
    if (rows.length === 0) {
      return this.seedInitialNotifications(userId, schoolId);
    }

    const domainList: NotificationEntity[] = rows.map((r) => ({
      id: r.id,
      schoolId: r.schoolId,
      userId: r.userId,
      title: r.title,
      message: r.message,
      type: r.type as NotificationType,
      isRead: r.isRead,
      createdAt: r.createdAt,
    }));

    // 3. Save to Redis
    try {
      await this.redis.set(key, JSON.stringify(domainList), "EX", CACHE_TTL_SECONDS);
    } catch {
      // Ignore Redis set error
    }

    return domainList;
  }

  async markAsRead(id: string, userId: string, schoolId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId),
          eq(notifications.schoolId, schoolId)
        )
      );

    await this.invalidateCache(schoolId, userId);
  }

  async markAllAsRead(userId: string, schoolId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.schoolId, schoolId)
        )
      );

    await this.invalidateCache(schoolId, userId);
  }

  async createNotification(
    data: Omit<NotificationEntity, "id" | "createdAt">
  ): Promise<NotificationEntity> {
    const inserted = (
      await this.db
        .insert(notifications)
        .values({
          schoolId: data.schoolId,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          isRead: data.isRead,
        })
        .returning()
    )[0];

    await this.invalidateCache(data.schoolId, data.userId);

    return {
      id: inserted.id,
      schoolId: inserted.schoolId,
      userId: inserted.userId,
      title: inserted.title,
      message: inserted.message,
      type: inserted.type as NotificationType,
      isRead: inserted.isRead,
      createdAt: inserted.createdAt,
    };
  }

  async seedInitialNotifications(userId: string, schoolId: string): Promise<NotificationEntity[]> {
    const defaults = [
      {
        schoolId,
        userId,
        title: "Pengingat Ibadah Yaumiyah",
        message: "Jangan lupa untuk mengisi jurnal ibadah harian hari ini sebelum pukul 21.00 WIB.",
        type: "yaumiyah" as NotificationType,
        isRead: false,
      },
      {
        schoolId,
        userId,
        title: "Sistem Terhubung ke Database PostgreSQL & Redis",
        message: "Seluruh pencatatan setoran & ibadah yaumiyah kini tersimpan secara real-time dan aman.",
        type: "system" as NotificationType,
        isRead: false,
      },
      {
        schoolId,
        userId,
        title: "Periode Akademik Aktif",
        message: "Tahun ajaran 2026/2027 semester ganjil aktif.",
        type: "raport" as NotificationType,
        isRead: true,
      },
    ];

    const insertedRows = await this.db.insert(notifications).values(defaults).returning();

    const domainList: NotificationEntity[] = insertedRows.map((r) => ({
      id: r.id,
      schoolId: r.schoolId,
      userId: r.userId,
      title: r.title,
      message: r.message,
      type: r.type as NotificationType,
      isRead: r.isRead,
      createdAt: r.createdAt,
    }));

    try {
      await this.redis.set(this.getCacheKey(schoolId, userId), JSON.stringify(domainList), "EX", CACHE_TTL_SECONDS);
    } catch {
      // Ignore
    }

    return domainList;
  }
}
