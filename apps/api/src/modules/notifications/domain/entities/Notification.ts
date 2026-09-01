export type NotificationType = "yaumiyah" | "setoran" | "system" | "raport";

export interface NotificationEntity {
  id: string;
  schoolId: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
}
