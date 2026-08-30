import type { IStudentRepository } from "../../domain/repositories/IStudentRepository";

export class GetStudentByIdUseCase {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(id: string, schoolId: string) {
    const student = await this.studentRepo.findById(id, schoolId);
    if (!student) throw new Error("Student not found");
    return student;
  }
}
