import type { ITeacherRepository } from "../../domain/repositories/ITeacherRepository";

export class GetTeachersUseCase {
  constructor(private readonly teacherRepo: ITeacherRepository) {}

  async execute(schoolId: string) {
    return this.teacherRepo.findBySchool(schoolId);
  }
}
