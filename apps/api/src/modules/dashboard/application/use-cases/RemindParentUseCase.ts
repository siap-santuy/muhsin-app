import type { IActivityRepository } from "../../domain/repositories/IActivityRepository";
import type { INotificationRepository } from "../../../notifications/domain/repositories/INotificationRepository";
import type { SendPushToUserUseCase } from "../../../notifications/application/use-cases/SendPushToUserUseCase";
import { ReminderRateLimitedError } from "../../domain/errors/ActivityErrors";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const REMIND_PARENT_TITLE = "Pengingat Pantauan Anak";

export class RemindParentUseCase {
  constructor(
    private readonly activityRepo: IActivityRepository,
    private readonly notifications: INotificationRepository,
    private readonly pushToUser?: SendPushToUserUseCase
  ) {}

  async execute(params: { schoolId: string; studentId: string; studentName?: string }): Promise<{ reminded: number }> {
    const parentIds = await this.activityRepo.findParentIdsByStudent(params.studentId, params.schoolId);
    if (parentIds.length === 0) {
      throw new Error("Orang tua siswa tidak ditemukan");
    }
    const since = startOfToday();
    for (const parentId of parentIds) {
      const recent = await this.activityRepo.findRecentReminder(parentId, params.schoolId, REMIND_PARENT_TITLE, since);
      if (recent) throw new ReminderRateLimitedError();
    }
    const name = params.studentName ?? "Ananda";
    const message = `Mohon pantau progres ${name} hari ini di dashboard/raport.`;
    await Promise.all(
      parentIds.map((parentId) =>
        this.notifications.createNotification({
          schoolId: params.schoolId,
          userId: parentId,
          title: REMIND_PARENT_TITLE,
          message,
          type: "raport",
          isRead: false,
        })
      )
    );
    if (this.pushToUser) {
      await Promise.all(
        parentIds.map((parentId) =>
          this.pushToUser!.execute({
            userId: parentId,
            schoolId: params.schoolId,
            payload: { title: REMIND_PARENT_TITLE, body: message, url: "#/raport" },
          }).catch(() => {})
        )
      );
    }
    return { reminded: parentIds.length };
  }
}
