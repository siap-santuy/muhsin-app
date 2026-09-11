import type { IMunaqosahRepository } from "../../domain/repositories/IMunaqosahRepository";
import type { INotificationRepository } from "../../../notifications/domain/repositories/INotificationRepository";

export class ScheduleMunaqosahUseCase {
  constructor(
    private readonly repo: IMunaqosahRepository,
    private readonly notifications: INotificationRepository
  ) {}

  async execute(params: {
    requestId: string;
    periodId: string;
    examinerTeacherId: string;
    jadwalTanggal: string;
    jadwalWaktu?: string;
    assignedBy: string;
    schoolId: string;
  }) {
    const assignmentId = await this.repo.createAssignment({
      requestId: params.requestId,
      periodId: params.periodId,
      examinerTeacherId: params.examinerTeacherId,
      jadwalTanggal: params.jadwalTanggal,
      jadwalWaktu: params.jadwalWaktu,
      assignedBy: params.assignedBy,
    });

    await this.repo.updateRequestStatus(
      params.requestId,
      params.schoolId,
      "dijadwalkan"
    );

    try {
      const detail = await this.repo.getRequestDetail(params.requestId, params.schoolId);
      if (detail) {
        const parentIds = await this.repo.findParentIdsByStudent(detail.studentId, params.schoolId);
        const waktu = params.jadwalWaktu ? ` pukul ${params.jadwalWaktu}` : "";
        const title = `Jadwal Munaqosah Juz ${detail.juzKe}`;
        const message = `${detail.studentName} dijadwalkan munaqosah Juz ${detail.juzKe} pada ${params.jadwalTanggal}${waktu}.`;
        const recipients = [...new Set([detail.studentId, ...parentIds])];
        await Promise.all(
          recipients.map((userId) =>
            this.notifications.createNotification({
              schoolId: params.schoolId,
              userId,
              title,
              message,
              type: "munaqosah",
              isRead: false,
            })
          )
        );
      }
    } catch {
      // ponytail: notif best-effort; jadwal tetap sukses walau notif gagal. Upgrade ke outbox/queue saat butuh retry.
    }

    return assignmentId;
  }
}
