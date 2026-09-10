export interface TeacherSubstitutionEntity {
  id: string;
  schoolId: string;
  absentTeacherId: string;
  substituteTeacherId: string;
  classId: string;
  dateStart: Date;
  dateEnd: Date;
  reason?: string | null;
  createdAt: Date;
}

export interface ITeacherSubstitutionRepository {
  create(entity: TeacherSubstitutionEntity): Promise<TeacherSubstitutionEntity>;
  findActiveSubstitutionsByTeacher(
    teacherId: string,
    schoolId: string,
    date?: Date
  ): Promise<TeacherSubstitutionEntity[]>;
  findBySchool(schoolId: string): Promise<TeacherSubstitutionEntity[]>;
  delete(id: string, schoolId: string): Promise<void>;
}
