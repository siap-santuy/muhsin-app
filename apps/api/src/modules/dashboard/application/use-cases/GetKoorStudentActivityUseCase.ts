import type { IActivityRepository } from "../../domain/repositories/IActivityRepository";
import type { StudentActivityRow } from "../../domain/entities/Activity";

export class GetKoorStudentActivityUseCase {
  constructor(private readonly repo: IActivityRepository) {}

  async execute(params: { schoolId: string; date: string; classId?: string }): Promise<StudentActivityRow[]> {
    return this.repo.getStudentActivity(params.schoolId, params.date, params.classId);
  }
}
