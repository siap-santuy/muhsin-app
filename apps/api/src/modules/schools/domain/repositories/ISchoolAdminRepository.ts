export interface SchoolClassItem {
  id: string;
  name: string;
  jenjangLevel: string | null;
}

export interface AcademicPeriodItem {
  id: string;
  tahunAjaran: string;
  semester: string;
  isLocked: boolean;
}

export interface MunaqosahPeriodItem {
  id: string;
  nama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: string;
}

export interface CreateSchoolUserParams {
  schoolId: string;
  role: "student" | "teacher";
  name: string;
  email: string;
  passwordHash: string;
  phone?: string | null;
  username?: string | null;
  gender?: string | null;
  nisn?: string | null;
  classId?: string | null;
}

export interface ISchoolAdminRepository {
  createUser(data: CreateSchoolUserParams): Promise<{ id: string }>;
  updateUser(id: string, schoolId: string, data: { name?: string; email?: string; phone?: string | null }): Promise<void>;
  deleteUser(id: string, schoolId: string): Promise<void>;
  emailExists(email: string, schoolId: string, excludeUserId?: string): Promise<boolean>;
  getClasses(schoolId: string): Promise<SchoolClassItem[]>;
  getActivePeriod(schoolId: string): Promise<AcademicPeriodItem | null>;
  getMunaqosahPeriods(schoolId: string): Promise<MunaqosahPeriodItem[]>;
  enrollStudent(studentId: string, classId: string, schoolId: string, academicPeriodId: string): Promise<void>;
  assignTeacherClass(teacherId: string, classId: string, schoolId: string): Promise<void>;
}
