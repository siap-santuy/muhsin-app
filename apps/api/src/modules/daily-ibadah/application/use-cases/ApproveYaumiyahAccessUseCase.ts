import type { IYaumiyahAccessRequestRepository } from "../../domain/repositories/IYaumiyahAccessRequestRepository";
import type { YaumiyahAccessRequestEntity } from "../../domain/entities/YaumiyahAccessRequest";
import type { INotificationRepository } from "../../../notifications/domain/repositories/INotificationRepository";
import type { SendPushToUserUseCase } from "../../../notifications/application/use-cases/SendPushToUserUseCase";
import { assertYaumiyahGrantDatePolicy } from "../../domain/services/YaumiyahAccessPolicy";

export interface ApproveYaumiyahAccessInput {
  requestId: string;
  schoolId: string;
  reviewerId: string;
  reviewerRole: string;
  durationHours?: number; // default 24 jam
  todayDate?: Date;
}

export class ApproveYaumiyahAccessUseCase {
  constructor(
    private readonly repo: IYaumiyahAccessRequestRepository,
    private readonly notificationRepo?: INotificationRepository,
    private readonly pushToUser?: SendPushToUserUseCase
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

    // Validasi otorisasi & batas tanggal berdasarkan peran
    if (input.reviewerRole === "teacher") {
      assertYaumiyahGrantDatePolicy("teacher", request.startDate, request.endDate, input.todayDate);

      if (this.repo.isStudentAssignedToTeacher) {
        const isAssigned = await this.repo.isStudentAssignedToTeacher(
          request.studentId,
          input.reviewerId,
          input.schoolId
        );
        if (!isAssigned) {
          throw new Error("Guru hanya dapat mengelola permohonan santri di kelas binaan");
        }
      }
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

    const dateRange =
      request.startDate === request.endDate
        ? request.startDate
        : `${request.startDate} s.d ${request.endDate}`;
    const title = "Izin Susulan Yaumiyah Disetujui";
    const message = `Permohonan izin susulan tanggal ${dateRange} telah DISETUJUI. Akses pengisian terbuka selama ${durationHours} jam ke depan. Segera isi ibadahmu!`;

    if (this.notificationRepo) {
      try {
        await this.notificationRepo.createNotification({
          schoolId: input.schoolId,
          userId: request.studentId,
          title,
          message,
          type: "yaumiyah",
          isRead: false,
        });
      } catch {
        // Notif best-effort
      }
    }

    if (this.pushToUser) {
      try {
        await this.pushToUser.execute({
          userId: request.studentId,
          schoolId: input.schoolId,
          payload: {
            title,
            body: `Izin susulan tanggal ${dateRange} telah disetujui (aktif ${durationHours} jam). Segera isi!`,
            url: "#/yaumiyah",
          },
        });
      } catch {
        // Push best-effort
      }
    }

    return saved;
  }
}
