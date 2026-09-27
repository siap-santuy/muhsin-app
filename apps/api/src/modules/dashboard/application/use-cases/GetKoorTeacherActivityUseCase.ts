import type { IActivityRepository } from "../../domain/repositories/IActivityRepository";
import type { TeacherActivityRow } from "../../domain/entities/Activity";

export class GetKoorTeacherActivityUseCase {
  constructor(private readonly repo: IActivityRepository) {}

  async execute(params: { schoolId: string; date: string }): Promise<TeacherActivityRow[]> {
    return this.repo.getTeacherActivity(params.schoolId, params.date);
  }
}
