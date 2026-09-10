import type { ISetoranRepository } from "../../domain/repositories/ISetoranRepository";
import type { SetoranEntryEntity } from "../../domain/entities/SetoranEntry";
import type { AddExpUseCase } from "../../../gamification/application/use-cases/AddExpUseCase";

export interface CorrectSetoranInput {
  setoranId: string;
  schoolId: string;
  userId: string;
  userRole: string;
  targetSubcategoryId: string;
  scores: Record<string, number>;
  referenceStart?: Record<string, any> | null;
  referenceEnd?: Record<string, any> | null;
  keterangan?: string | null;
  scoreFieldKeys: string[]; // Allowed keys to validate dynamically
}

function isHadirStatus(keterangan?: string | null): boolean {
  if (!keterangan) return true;
  const match = keterangan.match(/^\[(.*?)\]/);
  if (!match) return true;
  return match[1].toLowerCase() === "hadir";
}

export class CorrectSetoranUseCase {
  constructor(
    private readonly repo: ISetoranRepository,
    private readonly addExpUseCase: AddExpUseCase
  ) {}

  async execute(input: CorrectSetoranInput): Promise<SetoranEntryEntity> {
    const existing = await this.repo.findById(input.setoranId, input.schoolId);
    if (!existing) {
      throw new Error("Data setoran tidak ditemukan");
    }

    // RBAC: Hanya pemilik (teacherId) atau koordinator_ttq yang boleh mengoreksi
    const isOwner = existing.teacherId === input.userId;
    const isKoor = input.userRole === "koordinator_ttq";
    if (!isOwner && !isKoor) {
      throw new Error("Akses ditolak: Anda bukan guru pemilik setoran ini");
    }

    // Validasi skor input terhadap field target
    for (const key of Object.keys(input.scores)) {
      if (!input.scoreFieldKeys.includes(key)) {
        throw new Error(`Field nilai '${key}' tidak valid untuk sub-kategori ini`);
      }
      const val = input.scores[key];
      if (typeof val !== "number" || val < 0 || val > 100) {
        throw new Error(`Nilai untuk '${key}' harus berupa angka antara 0 dan 100`);
      }
    }

    // Cek status eligibility EXP: Hadir & punya nilai > 0
    const wasHadir = isHadirStatus(existing.keterangan);
    const hadValidScores = Object.values(existing.scores || {}).some((v) => v > 0);
    const wasEligible = wasHadir && hadValidScores;

    const willBeHadir = isHadirStatus(input.keterangan);
    const willHaveValidScores = Object.values(input.scores).some((v) => v > 0);
    const willBeEligible = willBeHadir && willHaveValidScores;

    // Evaluasi EXP difference:
    // 1. Hadir -> Tidak Hadir/Non-eligible: Reverse EXP (-20)
    // 2. Tidak Hadir/Non-eligible -> Hadir & Eligible: Award EXP (+20)
    // 3. Hadir -> Hadir (ganti kategori saja): EXP tetap, TIDAK double (+0)
    let expDiff = 0;
    if (wasEligible && !willBeEligible) {
      expDiff = -20;
    } else if (!wasEligible && willBeEligible) {
      expDiff = 20;
    }

    const updatedEntity: SetoranEntryEntity = {
      ...existing,
      subcategoryId: input.targetSubcategoryId,
      scores: input.scores,
      referenceStart: input.referenceStart ?? null,
      referenceEnd: input.referenceEnd ?? null,
      keterangan: input.keterangan ?? null,
      updatedAt: new Date(),
    };

    const saved = await this.repo.update(updatedEntity);

    if (expDiff !== 0) {
      await this.addExpUseCase.execute({
        schoolId: input.schoolId,
        studentId: existing.studentId,
        sourceType: "setoran",
        sourceId: existing.id,
        expAmount: expDiff,
        description:
          expDiff < 0
            ? `Penyesuaian koreksi setoran tanggal ${existing.date} (status diubah)`
            : `Pemberian EXP koreksi setoran tanggal ${existing.date} (status menjadi Hadir)`,
      });
    }

    return saved;
  }
}
