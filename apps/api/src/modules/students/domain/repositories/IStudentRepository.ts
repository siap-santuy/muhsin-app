import type { StudentListItem } from "../entities/Student";

export interface IStudentRepository {
  findBySchool(schoolId: string, options?: { date?: string; classId?: string }): Promise<StudentListItem[]>;
  findByTeacher(teacherId: string, schoolId: string, options?: { date?: string; classId?: string }): Promise<StudentListItem[]>;
  findById(id: string, schoolId: string): Promise<StudentListItem | null>;
}
