import type { IActivityRepository } from "../../domain/repositories/IActivityRepository";
import type { INotificationRepository } from "../../../notifications/domain/repositories/INotificationRepository";
import type { SendPushToUserUseCase } from "../../../notifications/application/use-cases/SendPushToUserUseCase";
import type { IDailyIbadahRepository } from "../../../daily-ibadah/domain/repositories/IDailyIbadahRepository";
import { AlreadyFilledError, ReminderRateLimitedError } from "../../domain/errors/ActivityErrors";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const REMIND_STUDENT_TITLE = "Pengingat dari Orang Tua";

export class RemindStudentUseCase {
  constructor(
    private readonly activityRepo: IActivityRepository,
    private readonly notifications: INotificationRepository,
    private readonly dailyIbadahRepo: IDailyIbadahRepository,
    private readonly pushToUser?: SendPushToUserUseCase
  ) {}

  async execute(params: { schoolId: string; parentId: string; studentId?: string }): Promise<{ reminded: boolean }> {
    let childId = params.studentId;
    if (!childId) {
      const childIds = await this.activityRepo.findChildIdsByParent(params.parentId, params.schoolId);
      childId = childIds[0];
    }
    if (!childId) {
      throw new Error("Data anak tidak ditemukan");
    }
    const childIds = await this.activityRepo.findChildIdsByParent(params.parentId, params.schoolId);
    if (!childIds.includes(childId)) {
      throw new Error("Akses ditolak: bukan anak Anda");
    }
    const today = new Date().toISOString().slice(0, 10);
    const ibadah = await this.dailyIbadahRepo.findByStudentAndDate(childId, today, params.schoolId);
    if (ibadah?.status === "submitted") throw new AlreadyFilledError();
    const recent = await this.activityRepo.findRecentReminder(childId, params.schoolId, REMIND_STUDENT_TITLE, startOfToday());
    if (recent) throw new ReminderRateLimitedError();
    const message = "Orang tuamu mengingatkan: jangan lupa isi jurnal ibadah harian hari ini.";
    await this.notifications.createNotification({
      schoolId: params.schoolId,
      userId: childId,
      title: REMIND_STUDENT_TITLE,
      message,
      type: "yaumiyah",
      isRead: false,
    });
    if (this.pushToUser) {
      await this.pushToUser.execute({
        userId: childId,
        schoolId: params.schoolId,
        payload: { title: REMIND_STUDENT_TITLE, body: message, url: "#/yaumiyah" },
      }).catch(() => {});
    }
    return { reminded: true };
  }
}
