import type { IYaumiyahAccessRequestRepository } from "../../domain/repositories/IYaumiyahAccessRequestRepository";
import type { YaumiyahAccessRequestEntity } from "../../domain/entities/YaumiyahAccessRequest";
import type { INotificationRepository } from "../../../notifications/domain/repositories/INotificationRepository";

export interface RejectYaumiyahAccessInput {
  requestId: string;
  schoolId: string;
  reviewerId: string;
  reviewerRole: string;
  rejectionNote?: string | null;
}

export class RejectYaumiyahAccessUseCase {
  constructor(
    private readonly repo: IYaumiyahAccessRequestRepository,
    private readonly notificationRepo?: INotificationRepository
  ) {}

  async execute(input: RejectYaumiyahAccessInput): Promise<YaumiyahAccessRequestEntity> {
    if (input.reviewerRole !== "teacher" && input.reviewerRole !== "koordinator_ttq") {
      throw new Error("Hanya guru pembina atau koordinator yang berwenang menolak permohonan");
    }

    const request = await this.repo.findById(input.requestId, input.schoolId);
    if (!request) {
      throw new Error("Permohonan akses tidak ditemukan");
    }

    if (request.status !== "pending") {
      throw new Error(`Permohonan sudah berstatus ${request.status}`);
    }

    const now = new Date();
    const rejectionNote = input.rejectionNote?.trim() || "Permohonan tidak disetujui";
    const updated: YaumiyahAccessRequestEntity = {
      ...request,
      status: "rejected",
      reviewedBy: input.reviewerId,
      reviewedAt: now,
      rejectionNote,
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
          title: "Izin Susulan Yaumiyah Ditolak",
          message: `Permohonan izin susulan tanggal ${dateRange} DITOLAK: "${rejectionNote}".`,
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
