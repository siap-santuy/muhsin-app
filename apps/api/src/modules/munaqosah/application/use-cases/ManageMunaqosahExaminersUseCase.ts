import type { IMunaqosahRepository } from "../../domain/repositories/IMunaqosahRepository";

export class ManageMunaqosahExaminersUseCase {
  constructor(private readonly repo: IMunaqosahRepository) {}

  async list(periodId: string, schoolId: string) {
    return this.repo.findExaminers(periodId, schoolId);
  }

  async add(params: {
    periodId: string;
    teacherId: string;
    kapasitasSiswa: number;
    assignedBy: string;
    schoolId: string;
  }) {
    if (params.kapasitasSiswa < 1) {
      throw new Error("Kapasitas minimal 1 siswa");
    }
    return this.repo.upsertExaminer(params);
  }

  async remove(periodId: string, teacherId: string, schoolId: string) {
    await this.repo.removeExaminer(periodId, teacherId, schoolId);
  }
}
