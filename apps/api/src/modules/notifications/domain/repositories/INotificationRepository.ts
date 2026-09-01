import type { NotificationEntity } from "../entities/Notification";

export interface INotificationRepository {
  getUserNotifications(userId: string, schoolId: string): Promise<NotificationEntity[]>;
  markAsRead(id: string, userId: string, schoolId: string): Promise<void>;
  markAllAsRead(userId: string, schoolId: string): Promise<void>;
  createNotification(data: Omit<NotificationEntity, "id" | "createdAt">): Promise<NotificationEntity>;
  seedInitialNotifications(userId: string, schoolId: string): Promise<NotificationEntity[]>;
}
