import type { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import type { NotificationEntity } from "../../domain/entities/Notification";

export class GetNotificationsUseCase {
  constructor(private readonly repo: INotificationRepository) {}

  async execute(userId: string, schoolId: string): Promise<NotificationEntity[]> {
    return this.repo.getUserNotifications(userId, schoolId);
  }
}
