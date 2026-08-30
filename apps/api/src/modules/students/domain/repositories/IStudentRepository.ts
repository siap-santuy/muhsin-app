import type { StudentListItem } from "../entities/Student";

export interface IStudentRepository {
  findBySchool(schoolId: string): Promise<StudentListItem[]>;
  findByTeacher(teacherId: string, schoolId: string): Promise<StudentListItem[]>;
  findById(id: string, schoolId: string): Promise<StudentListItem | null>;
}
