import type { IYaumiyahAccessRequestRepository } from "../../domain/repositories/IYaumiyahAccessRequestRepository";
import type { YaumiyahAccessRequestEntity } from "../../domain/entities/YaumiyahAccessRequest";
import { getDaysDiffFromToday } from "../../domain/services/YaumiyahWindowService";
import type { INotificationRepository } from "../../../notifications/domain/repositories/INotificationRepository";
import type { Db } from "../../../../db/client";
import { studentTeacherMapping, users } from "../../../../db/schema";
import { eq, and } from "drizzle-orm";

export interface RequestYaumiyahAccessInput {
  schoolId: string;
  studentId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
  todayStr?: string;
}

export class RequestYaumiyahAccessUseCase {
  constructor(
    private readonly repo: IYaumiyahAccessRequestRepository,
    private readonly notificationRepo?: INotificationRepository,
    private readonly db?: Db
  ) {}

  async execute(input: RequestYaumiyahAccessInput): Promise<YaumiyahAccessRequestEntity> {
    if (input.startDate > input.endDate) {
      throw new Error("Tanggal awal tidak boleh lebih besar dari tanggal akhir");
    }

    const diffStart = getDaysDiffFromToday(input.startDate, input.todayStr);
    const diffEnd = getDaysDiffFromToday(input.endDate, input.todayStr);

    if (diffEnd < 0) {
      throw new Error("Tidak dapat meminta akses untuk tanggal masa depan");
    }

    // Jika seluruh rentang masih dalam window H / H-1
    if (diffStart <= 1 && diffEnd >= 0) {
      throw new Error("Tanggal hari ini dan kemarin dapat langsung diisi tanpa pengajuan akses");
    }

    if (!input.reason || input.reason.trim().length < 5) {
      throw new Error("Alasan permohonan akses minimal 5 karakter");
    }

    // Cek pending overlap
    const pending = await this.repo.findPendingOverlap(
      input.studentId,
      input.startDate,
      input.endDate,
      input.schoolId
    );

    if (pending) {
      throw new Error(
        `Masih ada permohonan akses yang menunggu persetujuan untuk rentang tanggal tersebut (${pending.startDate} s.d ${pending.endDate})`
      );
    }

    const now = new Date();
    const entity: YaumiyahAccessRequestEntity = {
      id: crypto.randomUUID(),
      schoolId: input.schoolId,
      studentId: input.studentId,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason.trim(),
      status: "pending",
      isDirectGrant: false,
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.repo.create(entity);

    // Kirim notifikasi best-effort ke guru pembina dan koordinator sekolah
    if (this.notificationRepo && this.db) {
      try {
        const student = await this.db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, input.studentId))
          .limit(1);
        const studentName = student[0]?.name || "Siswa";

        const teacherRows = await this.db
          .select({ teacherId: studentTeacherMapping.teacherId })
          .from(studentTeacherMapping)
          .where(
            and(
              eq(studentTeacherMapping.studentId, input.studentId),
              eq(studentTeacherMapping.schoolId, input.schoolId)
            )
          );

        const koorRows = await this.db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.schoolId, input.schoolId), eq(users.role, "koordinator_ttq")));

        const recipientIds = new Set<string>();
        teacherRows.forEach((t) => recipientIds.add(t.teacherId));
        koorRows.forEach((k) => recipientIds.add(k.id));

        const rentangStr =
          input.startDate === input.endDate
            ? input.startDate
            : `${input.startDate} s.d ${input.endDate}`;

        await Promise.all(
          Array.from(recipientIds).map((userId) =>
            this.notificationRepo!.createNotification({
              schoolId: input.schoolId,
              userId,
              title: "Permohonan Izin Susulan Yaumiyah",
              message: `${studentName} mengajukan izin susulan yaumiyah tanggal ${rentangStr}: "${input.reason.trim()}"`,
              type: "yaumiyah",
              isRead: false,
            })
          )
        );
      } catch {
        // Notif best-effort
      }
    }

    return created;
  }
}
