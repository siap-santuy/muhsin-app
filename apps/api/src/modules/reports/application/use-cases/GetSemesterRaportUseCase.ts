import type { IRaportRepository } from "../../domain/repositories/IRaportRepository";

export class GetSemesterRaportUseCase {
  constructor(private readonly repo: IRaportRepository) {}

  async execute(
    studentId: string,
    semester: string,
    tahunAjaran: string,
    schoolId: string
  ) {
    return this.repo.getSemesterRaport(studentId, semester, tahunAjaran, schoolId);
  }
}
