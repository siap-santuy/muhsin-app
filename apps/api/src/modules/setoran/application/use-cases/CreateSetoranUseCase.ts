import type { ISetoranRepository } from "../../domain/repositories/ISetoranRepository";
import type { SetoranEntryEntity } from "../../domain/entities/SetoranEntry";
import type { AddExpUseCase } from "../../../gamification/application/use-cases/AddExpUseCase";

export interface CreateSetoranInput {
  schoolId: string;
  subcategoryId: string;
  studentId: string;
  teacherId: string;
  substitutedForTeacherId?: string | null;
  date: string; // YYYY-MM-DD
  referenceStart?: Record<string, any> | null;
  referenceEnd?: Record<string, any> | null;
  scores: Record<string, number>;
  keterangan?: string | null;
  scoreFieldKeys: string[]; // Allowed keys to validate dynamically
}

function isHadirStatus(keterangan?: string | null): boolean {
  if (!keterangan) return true;
  const match = keterangan.match(/^\[(.*?)\]/);
  if (!match) return true;
  return match[1].toLowerCase() === "hadir";
}

export class CreateSetoranUseCase {
  constructor(
    private readonly repo: ISetoranRepository,
    private readonly addExpUseCase: AddExpUseCase
  ) {}

  async execute(input: CreateSetoranInput): Promise<SetoranEntryEntity> {
    // 1. Validasi dynamic score keys
    for (const key of Object.keys(input.scores)) {
      if (!input.scoreFieldKeys.includes(key)) {
        throw new Error(`Field nilai '${key}' tidak valid untuk sub-kategori ini`);
      }
      const val = input.scores[key];
      if (typeof val !== "number" || val < 0 || val > 100) {
        throw new Error(`Nilai untuk '${key}' harus berupa angka antara 0 dan 100`);
      }
    }

    const now = new Date();
    const entity: SetoranEntryEntity = {
      id: crypto.randomUUID(),
      schoolId: input.schoolId,
      subcategoryId: input.subcategoryId,
      studentId: input.studentId,
      teacherId: input.teacherId,
      substitutedForTeacherId: input.substitutedForTeacherId ?? null,
      date: input.date,
      referenceStart: input.referenceStart ?? null,
      referenceEnd: input.referenceEnd ?? null,
      scores: input.scores,
      keterangan: input.keterangan ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.repo.create(entity);

    // 2. Beri EXP setoran jika ada nilai valid dan status Hadir (+20 EXP)
    const hasValidScores = Object.values(input.scores).some((v) => v > 0);
    const isHadir = isHadirStatus(input.keterangan);
    if (hasValidScores && isHadir) {
      await this.addExpUseCase.execute({
        schoolId: input.schoolId,
        studentId: input.studentId,
        sourceType: "setoran",
        sourceId: saved.id,
        expAmount: 20,
        description: `Setoran hafalan/bacaan tanggal ${input.date}`,
      });
    }

    return saved;
  }
}
