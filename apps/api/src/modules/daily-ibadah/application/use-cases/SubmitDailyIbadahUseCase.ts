import type { IDailyIbadahRepository } from "../../domain/repositories/IDailyIbadahRepository";
import type { IYaumiyahAccessRequestRepository } from "../../domain/repositories/IYaumiyahAccessRequestRepository";
import type { DailyIbadahEntity, SholatFardhuStatus, TilawahRef } from "../../domain/entities/DailyIbadah";
import { IbadahValidator } from "../../domain/services/IbadahValidator";
import { isWithinDirectWindow, getDaysDiffFromToday } from "../../domain/services/YaumiyahWindowService";
import type { AddExpUseCase } from "../../../gamification/application/use-cases/AddExpUseCase";
import type { UpdateStreakUseCase } from "../../../gamification/application/use-cases/UpdateStreakUseCase";

export interface SubmitDailyIbadahInput {
  schoolId: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  tilawah?: TilawahRef | null;
  sholatFardhu?: SholatFardhuStatus | null;
  sholatRawatib?: string[] | null;
  tahajud?: boolean;
  dhuha?: boolean;
  puasaSunnah?: string | null;
  todayStr?: string;
}

export class SubmitDailyIbadahUseCase {
  constructor(
    private readonly repo: IDailyIbadahRepository,
    private readonly addExpUseCase: AddExpUseCase,
    private readonly updateStreakUseCase: UpdateStreakUseCase,
    private readonly accessRequestRepo?: IYaumiyahAccessRequestRepository
  ) {}

  async execute(input: SubmitDailyIbadahInput): Promise<{
    entity: DailyIbadahEntity;
    expEarned: number;
    currentStreak: number;
  }> {
    const diffDays = getDaysDiffFromToday(input.date, input.todayStr);
    if (diffDays < 0) {
      throw new Error("Tidak dapat mengirim data ibadah untuk tanggal masa depan");
    }

    const isDirect = isWithinDirectWindow(input.date, input.todayStr);
    if (!isDirect) {
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
      throw new Error("Data ibadah tanggal ini sudah terkirim dan terkunci");
    }

    const now = new Date();
    const entity: DailyIbadahEntity = {
      id: existing?.id ?? crypto.randomUUID(),
      schoolId: input.schoolId,
      studentId: input.studentId,
      date: input.date,
      status: "submitted",
      submittedAt: now,
      tilawah: input.tilawah ?? null,
      sholatFardhu: input.sholatFardhu ?? null,
      sholatRawatib: input.sholatRawatib ?? null,
      tahajud: input.tahajud ?? false,
      dhuha: input.dhuha ?? false,
      puasaSunnah: input.puasaSunnah ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    const saved = await this.repo.save(entity);

    // 1. Calculate & add EXP (selalu didapat baik direct maupun susulan)
    const expEarned = IbadahValidator.calculateDayExp({
      sholatFardhu: entity.sholatFardhu,
      sholatRawatib: entity.sholatRawatib,
      tahajud: entity.tahajud,
      dhuha: entity.dhuha,
      puasaSunnah: entity.puasaSunnah,
      tilawah: entity.tilawah,
    });

    if (expEarned > 0) {
      await this.addExpUseCase.execute({
        schoolId: input.schoolId,
        studentId: input.studentId,
        sourceType: "daily_ibadah",
        sourceId: saved.id,
        expAmount: expEarned,
        description: `Ibadah harian tanggal ${input.date}${!isDirect ? " (susulan)" : ""}`,
      });
    }

    // 2. Evaluate & update streak (HANYA untuk H & H-1; susulan H-2+ lewati streak)
    let currentStreak = 0;
    if (isDirect) {
      const isComplete = IbadahValidator.isCompleteForStreak(entity.sholatFardhu);
      const streakRes = await this.updateStreakUseCase.execute({
        schoolId: input.schoolId,
        studentId: input.studentId,
        today: input.date,
        isComplete,
      });
      currentStreak = streakRes.currentStreak;
    }

    return { entity: saved, expEarned, currentStreak };
  }
}
