import type { IYaumiyahAccessRequestRepository } from "../../domain/repositories/IYaumiyahAccessRequestRepository";
import type { YaumiyahAccessRequestEntity } from "../../domain/entities/YaumiyahAccessRequest";
import type { INotificationRepository } from "../../../notifications/domain/repositories/INotificationRepository";
import type { SendPushToUserUseCase } from "../../../notifications/application/use-cases/SendPushToUserUseCase";

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
    private readonly notificationRepo?: INotificationRepository,
    private readonly pushToUser?: SendPushToUserUseCase
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

    if (input.reviewerRole === "teacher" && this.repo.isStudentAssignedToTeacher) {
      const isAssigned = await this.repo.isStudentAssignedToTeacher(
        request.studentId,
        input.reviewerId,
        input.schoolId
      );
      if (!isAssigned) {
        throw new Error("Guru hanya dapat mengelola permohonan santri di kelas binaan");
      }
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

    const dateRange =
      request.startDate === request.endDate
        ? request.startDate
        : `${request.startDate} s.d ${request.endDate}`;
    const title = "Izin Susulan Yaumiyah Ditolak";
    const message = `Permohonan izin susulan tanggal ${dateRange} DITOLAK: "${rejectionNote}".`;

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
            body: `Permohonan izin susulan tanggal ${dateRange} ditolak: "${rejectionNote}".`,
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
