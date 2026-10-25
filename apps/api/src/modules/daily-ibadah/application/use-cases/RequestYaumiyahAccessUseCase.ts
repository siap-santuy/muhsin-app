import type { IYaumiyahAccessRequestRepository } from "../../domain/repositories/IYaumiyahAccessRequestRepository";
import type { YaumiyahAccessRequestEntity } from "../../domain/entities/YaumiyahAccessRequest";
import { getDaysDiffFromToday } from "../../domain/services/YaumiyahWindowService";

export interface RequestYaumiyahAccessInput {
  schoolId: string;
  studentId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
  todayStr?: string;
}

export class RequestYaumiyahAccessUseCase {
  constructor(private readonly repo: IYaumiyahAccessRequestRepository) {}

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

    return this.repo.create(entity);
  }
}
