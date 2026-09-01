import { describe, it, expect, beforeEach } from "bun:test";
import { GetNotificationsUseCase } from "../modules/notifications/application/use-cases/GetNotificationsUseCase";
import { MarkNotificationReadUseCase } from "../modules/notifications/application/use-cases/MarkNotificationReadUseCase";
import { MarkAllNotificationsReadUseCase } from "../modules/notifications/application/use-cases/MarkAllNotificationsReadUseCase";
import type { INotificationRepository } from "../modules/notifications/domain/repositories/INotificationRepository";
import type { NotificationEntity } from "../modules/notifications/domain/entities/Notification";

describe("Notifications Module UseCases", () => {
  let mockNotifications: NotificationEntity[];
  let repo: INotificationRepository;

  beforeEach(() => {
    mockNotifications = [
      {
        id: "notif-1",
        schoolId: "school-1",
        userId: "user-1",
        title: "Pengingat Yaumiyah",
        message: "Isi yaumiyah hari ini",
        type: "yaumiyah",
        isRead: false,
        createdAt: new Date(),
      },
      {
        id: "notif-2",
        schoolId: "school-1",
        userId: "user-1",
        title: "Sistem",
        message: "Update berhasil",
        type: "system",
        isRead: false,
        createdAt: new Date(),
      },
    ];

    repo = {
      getUserNotifications: async (userId, schoolId) =>
        mockNotifications.filter((n) => n.userId === userId && n.schoolId === schoolId),
      markAsRead: async (id, userId, schoolId) => {
        const item = mockNotifications.find(
          (n) => n.id === id && n.userId === userId && n.schoolId === schoolId
        );
        if (item) item.isRead = true;
      },
      markAllAsRead: async (userId, schoolId) => {
        mockNotifications.forEach((n) => {
          if (n.userId === userId && n.schoolId === schoolId) n.isRead = true;
        });
      },
      createNotification: async (data) => {
        const item: NotificationEntity = {
          ...data,
          id: `notif-${mockNotifications.length + 1}`,
          createdAt: new Date(),
        };
        mockNotifications.push(item);
        return item;
      },
      seedInitialNotifications: async (userId, schoolId) => {
        return mockNotifications.filter((n) => n.userId === userId && n.schoolId === schoolId);
      },
    };
  });

  it("GetNotificationsUseCase returns user notifications", async () => {
    const useCase = new GetNotificationsUseCase(repo);
    const result = await useCase.execute("user-1", "school-1");
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Pengingat Yaumiyah");
  });

  it("MarkNotificationReadUseCase marks single notification as read", async () => {
    const useCase = new MarkNotificationReadUseCase(repo);
    await useCase.execute("notif-1", "user-1", "school-1");
    expect(mockNotifications[0].isRead).toBe(true);
    expect(mockNotifications[1].isRead).toBe(false);
  });

  it("MarkAllNotificationsReadUseCase marks all as read", async () => {
    const useCase = new MarkAllNotificationsReadUseCase(repo);
    await useCase.execute("user-1", "school-1");
    expect(mockNotifications[0].isRead).toBe(true);
    expect(mockNotifications[1].isRead).toBe(true);
  });
});
