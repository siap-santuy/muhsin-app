import type { IYaumiyahAccessRequestRepository } from "../../domain/repositories/IYaumiyahAccessRequestRepository";
import type { YaumiyahAccessRequestEntity } from "../../domain/entities/YaumiyahAccessRequest";
import type { INotificationRepository } from "../../../notifications/domain/repositories/INotificationRepository";
import type { SendPushToUserUseCase } from "../../../notifications/application/use-cases/SendPushToUserUseCase";
import { assertYaumiyahGrantDatePolicy } from "../../domain/services/YaumiyahAccessPolicy";

export interface GrantBulkYaumiyahAccessInput {
  schoolId: string;
  studentIds: string[];
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason?: string;
  durationHours?: number; // default 24
  granterId: string;
  granterRole: string;
  todayDate?: Date;
}

export class GrantBulkYaumiyahAccessUseCase {
  constructor(
    private readonly repo: IYaumiyahAccessRequestRepository,
    private readonly notificationRepo?: INotificationRepository,
    private readonly pushToUser?: SendPushToUserUseCase
  ) {}

  async execute(input: GrantBulkYaumiyahAccessInput): Promise<{
    count: number;
    entities: YaumiyahAccessRequestEntity[];
  }> {
    if (input.granterRole !== "teacher" && input.granterRole !== "koordinator_ttq") {
      throw new Error("Hanya guru atau koordinator yang berwenang memberikan akses langsung");
    }

    if (!input.studentIds || input.studentIds.length === 0) {
      throw new Error("Pilih minimal satu santri");
    }

    const uniqueStudentIds = Array.from(new Set(input.studentIds));
    if (uniqueStudentIds.length > 500) {
      throw new Error("Maksimal 500 santri dalam satu kali pembukaan akses");
    }

    assertYaumiyahGrantDatePolicy(input.granterRole, input.startDate, input.endDate, input.todayDate);

    // Jika guru, pastikan seluruh santri yang dipilih berada di kelas binaan guru tersebut
    if (input.granterRole === "teacher" && this.repo.filterStudentsAssignedToTeacher) {
      const allowedStudentIds = await this.repo.filterStudentsAssignedToTeacher(
        uniqueStudentIds,
        input.granterId,
        input.schoolId
      );
      if (allowedStudentIds.length !== uniqueStudentIds.length) {
        throw new Error("Terdapat santri yang bukan merupakan kelas binaan guru");
      }
    }

    const now = new Date();
    const durationHours = input.durationHours ?? 24;
    const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
    const reasonText = input.reason?.trim() || "Akses dibuka langsung secara massal oleh Guru/Koordinator";

    const entities: YaumiyahAccessRequestEntity[] = uniqueStudentIds.map((studentId) => ({
      id: crypto.randomUUID(),
      schoolId: input.schoolId,
      studentId,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: reasonText,
      status: "approved",
      reviewedBy: input.granterId,
      reviewedAt: now,
      expiresAt,
      isDirectGrant: true,
      createdAt: now,
      updatedAt: now,
    }));

    let savedEntities: YaumiyahAccessRequestEntity[] = [];
    if (this.repo.createBulk) {
      savedEntities = await this.repo.createBulk(entities);
    } else {
      savedEntities = await Promise.all(entities.map((e) => this.repo.create(e)));
    }

    // Kirim notifikasi in-app & push secara non-blocking ke semua santri
    const dateRange =
      input.startDate === input.endDate
        ? input.startDate
        : `${input.startDate} s.d ${input.endDate}`;
    const title = "Akses Izin Susulan Yaumiyah Dibuka";
    const message = `Akses susulan yaumiyah tanggal ${dateRange} telah dibuka selama ${durationHours} jam. Segera isi ibadahmu!`;

    void Promise.allSettled(
      uniqueStudentIds.map(async (studentId) => {
        if (this.notificationRepo) {
          try {
            await this.notificationRepo.createNotification({
              schoolId: input.schoolId,
              userId: studentId,
              title,
              message,
              type: "yaumiyah",
              isRead: false,
            });
          } catch {
            // best-effort
          }
        }
        if (this.pushToUser) {
          try {
            await this.pushToUser.execute({
              userId: studentId,
              schoolId: input.schoolId,
              payload: {
                title,
                body: message,
                url: "#/yaumiyah",
              },
            });
          } catch {
            // best-effort
          }
        }
      })
    );

    return {
      count: savedEntities.length,
      entities: savedEntities,
    };
  }
}
