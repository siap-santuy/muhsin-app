import type {
  IHafalanTargetRepository,
  SetHafalanTargetInput,
} from "../../domain/repositories/IHafalanTargetRepository";

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

    return this.repo.setTargets(input);
  }
}
