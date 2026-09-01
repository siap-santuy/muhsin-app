import type { INotificationRepository } from "../../domain/repositories/INotificationRepository";

export class MarkAllNotificationsReadUseCase {
  constructor(private readonly repo: INotificationRepository) {}

  async execute(userId: string, schoolId: string): Promise<void> {
    return this.repo.markAllAsRead(userId, schoolId);
  }
}
