import type {
  IHafalanTargetRepository,
  SetHafalanTargetInput,
} from "../../domain/repositories/IHafalanTargetRepository";
import { findSurah, validateSurahAyatRange } from "@muhsin/shared";

export class SetHafalanTargetUseCase {
  constructor(private readonly repo: IHafalanTargetRepository) {}

  async execute(input: SetHafalanTargetInput) {
    if (!input.studentIds || input.studentIds.length === 0) {
      throw new Error("Daftar santri wajib dipilih");
    }
    if (!input.bulan || !/^\d{4}-\d{2}$/.test(input.bulan)) {
      throw new Error("Format bulan wajib YYYY-MM");
    }
    if (!input.targetSurahStart || !input.targetSurahEnd) {
      throw new Error("Target surah awal dan akhir wajib diisi");
    }

    const sStart = findSurah(input.targetSurahStart);
    if (!sStart) {
      throw new Error(`Target surah awal (${input.targetSurahStart}) tidak valid`);
    }

    const sEnd = findSurah(input.targetSurahEnd);
    if (!sEnd) {
      throw new Error(`Target surah akhir (${input.targetSurahEnd}) tidak valid`);
    }

    const aStart = parseInt(input.targetAyatStart || "1", 10) || 1;
    const aEnd = parseInt(input.targetAyatEnd || "1", 10) || 1;

    const validation = validateSurahAyatRange(sStart.no, aStart, sEnd.no, aEnd);
    if (!validation.valid) {
      throw new Error(validation.error || "Rentang target hafalan tidak valid");
    }

    return this.repo.setTargets(input);
  }
}
