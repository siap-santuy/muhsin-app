import type { IYaumiyahAccessRequestRepository } from "../../domain/repositories/IYaumiyahAccessRequestRepository";
import type { YaumiyahAccessRequestEntity } from "../../domain/entities/YaumiyahAccessRequest";
import type { INotificationRepository } from "../../../notifications/domain/repositories/INotificationRepository";
import type { SendPushToUserUseCase } from "../../../notifications/application/use-cases/SendPushToUserUseCase";
import { assertYaumiyahGrantDatePolicy } from "../../domain/services/YaumiyahAccessPolicy";

export interface GrantYaumiyahAccessInput {
  schoolId: string;
  studentId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason?: string;
  durationHours?: number; // default 24
  granterId: string;
  granterRole: string;
  todayDate?: Date;
}

export class GrantYaumiyahAccessUseCase {
  constructor(
    private readonly repo: IYaumiyahAccessRequestRepository,
    private readonly notificationRepo?: INotificationRepository,
    private readonly pushToUser?: SendPushToUserUseCase
  ) {}

  async execute(input: GrantYaumiyahAccessInput): Promise<YaumiyahAccessRequestEntity> {
    if (input.granterRole !== "teacher" && input.granterRole !== "koordinator_ttq") {
      throw new Error("Hanya guru atau koordinator yang berwenang memberikan akses langsung");
    }

    assertYaumiyahGrantDatePolicy(input.granterRole, input.startDate, input.endDate, input.todayDate);

    if (input.granterRole === "teacher" && this.repo.isStudentAssignedToTeacher) {
      const isAssigned = await this.repo.isStudentAssignedToTeacher(
        input.studentId,
        input.granterId,
        input.schoolId
      );
      if (!isAssigned) {
        throw new Error("Guru hanya dapat membuka akses untuk santri di kelas binaan");
      }
    }

    const now = new Date();
    const durationHours = input.durationHours ?? 24;
    const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    const entity: YaumiyahAccessRequestEntity = {
      id: crypto.randomUUID(),
      schoolId: input.schoolId,
      studentId: input.studentId,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason?.trim() || "Akses dibuka langsung oleh Guru/Koordinator",
      status: "approved",
      reviewedBy: input.granterId,
      reviewedAt: now,
      expiresAt,
      isDirectGrant: true,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.repo.create(entity);

    const dateRange =
      input.startDate === input.endDate
        ? input.startDate
        : `${input.startDate} s.d ${input.endDate}`;
    const title = "Akses Izin Susulan Yaumiyah Dibuka";
    const message = `Akses susulan yaumiyah tanggal ${dateRange} telah dibuka selama ${durationHours} jam. Segera isi ibadahmu!`;

    if (this.notificationRepo) {
      try {
        await this.notificationRepo.createNotification({
          schoolId: input.schoolId,
          userId: input.studentId,
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
          userId: input.studentId,
          schoolId: input.schoolId,
          payload: {
            title,
            body: message,
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
