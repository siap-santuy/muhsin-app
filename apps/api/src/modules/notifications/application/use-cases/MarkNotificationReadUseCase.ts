import type { INotificationRepository } from "../../domain/repositories/INotificationRepository";

export class MarkNotificationReadUseCase {
  constructor(private readonly repo: INotificationRepository) {}

  async execute(id: string, userId: string, schoolId: string): Promise<void> {
    return this.repo.markAsRead(id, userId, schoolId);
  }
}
