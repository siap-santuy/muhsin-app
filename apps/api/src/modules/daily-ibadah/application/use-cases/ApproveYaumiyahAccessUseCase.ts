import type { IYaumiyahAccessRequestRepository } from "../../domain/repositories/IYaumiyahAccessRequestRepository";
import type { YaumiyahAccessRequestEntity } from "../../domain/entities/YaumiyahAccessRequest";
import type { INotificationRepository } from "../../../notifications/domain/repositories/INotificationRepository";

export interface ApproveYaumiyahAccessInput {
  requestId: string;
  schoolId: string;
  reviewerId: string;
  reviewerRole: string;
  durationHours?: number; // default 24 jam
}

export class ApproveYaumiyahAccessUseCase {
  constructor(
    private readonly repo: IYaumiyahAccessRequestRepository,
    private readonly notificationRepo?: INotificationRepository
  ) {}

  async execute(input: ApproveYaumiyahAccessInput): Promise<YaumiyahAccessRequestEntity> {
    if (input.reviewerRole !== "teacher" && input.reviewerRole !== "koordinator_ttq") {
      throw new Error("Hanya guru pembina atau koordinator yang berwenang menyetujui permohonan");
    }

    const request = await this.repo.findById(input.requestId, input.schoolId);
    if (!request) {
      throw new Error("Permohonan akses tidak ditemukan");
    }

    if (request.status !== "pending") {
      throw new Error(`Permohonan sudah berstatus ${request.status}`);
    }

    const now = new Date();
    const durationHours = input.durationHours ?? 24;
    const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    const updated: YaumiyahAccessRequestEntity = {
      ...request,
      status: "approved",
      reviewedBy: input.reviewerId,
      reviewedAt: now,
      expiresAt,
      updatedAt: now,
    };

    const saved = await this.repo.update(updated);

    if (this.notificationRepo) {
      try {
        const dateRange =
          request.startDate === request.endDate
            ? request.startDate
            : `${request.startDate} s.d ${request.endDate}`;
        await this.notificationRepo.createNotification({
          schoolId: input.schoolId,
          userId: request.studentId,
          title: "Izin Susulan Yaumiyah Disetujui",
          message: `Permohonan izin susulan tanggal ${dateRange} telah DISETUJUI. Akses pengisian terbuka selama ${durationHours} jam ke depan. Segera isi ibadahmu!`,
          type: "yaumiyah",
          isRead: false,
        });
      } catch {
        // Notif best-effort
      }
    }

    return saved;
  }
}
