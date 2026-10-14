import type { IHafalanTargetRepository } from "../../domain/repositories/IHafalanTargetRepository";

export class GetStudentPositionUseCase {
  constructor(private readonly repo: IHafalanTargetRepository) {}

  async execute(params: { studentId: string; schoolId: string }) {
    if (!params.studentId) {
      throw new Error("Student ID wajib diisi");
    }
    return this.repo.findStudentLastZiyadahPosition(
      params.studentId,
      params.schoolId
    );
  }
}
