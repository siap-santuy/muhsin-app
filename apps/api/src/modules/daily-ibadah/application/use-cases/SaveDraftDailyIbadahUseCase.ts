import type { IDailyIbadahRepository } from "../../domain/repositories/IDailyIbadahRepository";
import type { DailyIbadahEntity, SholatFardhuStatus, TilawahRef } from "../../domain/entities/DailyIbadah";

export interface SaveDraftDailyIbadahInput {
  schoolId: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  tilawah?: TilawahRef | null;
  sholatFardhu?: SholatFardhuStatus | null;
  sholatRawatib?: string[] | null;
  tahajud?: boolean;
  dhuha?: boolean;
  puasaSunnah?: string | null;
}

export class SaveDraftDailyIbadahUseCase {
  constructor(private readonly repo: IDailyIbadahRepository) {}

  async execute(input: SaveDraftDailyIbadahInput): Promise<DailyIbadahEntity> {
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
