import type { IDailyIbadahRepository } from "../../domain/repositories/IDailyIbadahRepository";
import type { IYaumiyahAccessRequestRepository } from "../../domain/repositories/IYaumiyahAccessRequestRepository";
import type { DailyIbadahEntity, SholatFardhuStatus, TilawahRef } from "../../domain/entities/DailyIbadah";
import { isWithinDirectWindow, getDaysDiffFromToday } from "../../domain/services/YaumiyahWindowService";

export interface SaveDraftDailyIbadahInput {
  schoolId: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  tilawah?: TilawahRef | null;
  sholatFardhu?: Partial<SholatFardhuStatus> | null;
  sholatRawatib?: string[] | null;
  tahajud?: boolean;
  dhuha?: boolean;
  puasaSunnah?: string | null;
  todayStr?: string;
}

export class SaveDraftDailyIbadahUseCase {
  constructor(
    private readonly repo: IDailyIbadahRepository,
    private readonly accessRequestRepo?: IYaumiyahAccessRequestRepository
  ) {}

  async execute(input: SaveDraftDailyIbadahInput): Promise<DailyIbadahEntity> {
    const diffDays = getDaysDiffFromToday(input.date, input.todayStr);
    if (diffDays < 0) {
      throw new Error("Tidak dapat menyimpan draft untuk tanggal masa depan");
    }

    // Jika bukan H atau H-1, harus punya approved access request aktif
    if (!isWithinDirectWindow(input.date, input.todayStr)) {
      if (!this.accessRequestRepo) {
        throw new Error("Tanggal ini telah terkunci. Silakan ajukan permohonan buka akses.");
      }
      const activeGrant = await this.accessRequestRepo.findActiveApproved(
        input.studentId,
        input.date,
        input.schoolId
      );
      if (!activeGrant) {
        throw new Error(
          "Tanggal ini telah terkunci untuk pengisian. Silakan ajukan permohonan buka akses kepada Guru atau Koordinator."
        );
      }
    }

    const existing = await this.repo.findByStudentAndDate(
      input.studentId,
      input.date,
      input.schoolId
    );

    if (existing && existing.status === "submitted") {
      throw new Error("Data ibadah tanggal ini sudah terkirim dan tidak dapat diedit");
    }

    const now = new Date();
    const entity: DailyIbadahEntity = {
      id: existing?.id ?? crypto.randomUUID(),
      schoolId: input.schoolId,
      studentId: input.studentId,
      date: input.date,
      status: "draft",
      submittedAt: null,
      tilawah: input.tilawah ?? existing?.tilawah ?? null,
      sholatFardhu: input.sholatFardhu ?? existing?.sholatFardhu ?? null,
      sholatRawatib: input.sholatRawatib ?? existing?.sholatRawatib ?? null,
      tahajud: input.tahajud ?? existing?.tahajud ?? false,
      dhuha: input.dhuha ?? existing?.dhuha ?? false,
      puasaSunnah: input.puasaSunnah ?? existing?.puasaSunnah ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    return await this.repo.save(entity);
  }
}
