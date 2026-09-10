import type {
  ITeacherSubstitutionRepository,
  TeacherSubstitutionEntity,
} from "../../domain/repositories/ITeacherSubstitutionRepository";

export class ManageSubstitutionUseCase {
  constructor(private readonly repo: ITeacherSubstitutionRepository) {}

  async create(params: {
    schoolId: string;
    absentTeacherId: string;
    substituteTeacherId: string;
    classId: string;
    dateStart: string; // ISO date string
    dateEnd: string;
    reason?: string | null;
  }): Promise<TeacherSubstitutionEntity> {
    const start = new Date(params.dateStart);
    const end = new Date(params.dateEnd);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Format tanggal substitusi tidak valid");
    }
    if (end < start) {
      throw new Error("Tanggal selesai tidak boleh lebih awal dari tanggal mulai");
    }

    const entity: TeacherSubstitutionEntity = {
      id: crypto.randomUUID(),
      schoolId: params.schoolId,
      absentTeacherId: params.absentTeacherId,
      substituteTeacherId: params.substituteTeacherId,
      classId: params.classId,
      dateStart: start,
      dateEnd: end,
      reason: params.reason ?? null,
      createdAt: new Date(),
    };

    return this.repo.create(entity);
  }

  async list(schoolId: string): Promise<TeacherSubstitutionEntity[]> {
    return this.repo.findBySchool(schoolId);
  }

  async delete(id: string, schoolId: string): Promise<void> {
    return this.repo.delete(id, schoolId);
  }
}
