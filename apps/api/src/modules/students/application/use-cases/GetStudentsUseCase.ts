import type { IStudentRepository } from "../../domain/repositories/IStudentRepository";

export class GetStudentsUseCase {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(params: {
    schoolId: string;
    teacherId?: string;
    role: string;
    userId: string;
    date?: string;
    classId?: string;
  }) {
    const options = { date: params.date, classId: params.classId };

    // If teacher, only return students mapped to this teacher
    if (params.role === "teacher") {
      return this.studentRepo.findByTeacher(params.userId, params.schoolId, options);
    }

    // If koordinator/super_admin or requested specific teacher
    if (params.teacherId) {
      return this.studentRepo.findByTeacher(params.teacherId, params.schoolId, options);
    }

    return this.studentRepo.findBySchool(params.schoolId, options);
  }
}
