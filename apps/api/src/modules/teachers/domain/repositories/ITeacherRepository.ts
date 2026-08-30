import type { TeacherListItem } from "../entities/Teacher";

export interface ITeacherRepository {
  findBySchool(schoolId: string): Promise<TeacherListItem[]>;
  findById(id: string, schoolId: string): Promise<TeacherListItem | null>;
}
