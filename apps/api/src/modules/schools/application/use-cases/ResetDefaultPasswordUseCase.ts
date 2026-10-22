import type { ISchoolAdminRepository } from "../../domain/repositories/ISchoolAdminRepository";
import type { PasswordHasher } from "../../../auth/application/services/PasswordHasher";
import { formatBirthDateToDefaultPassword } from "@muhsin/shared";

export class ResetDefaultPasswordUseCase {
  constructor(
    private readonly repo: ISchoolAdminRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async resetStudentAndParent(studentId: string, schoolId: string): Promise<{
    defaultPassword: string;
    studentName: string;
    parentsResetCount: number;
  }> {
    if (!studentId || !schoolId) {
      throw new Error("Student ID dan School ID wajib diisi");
    }

    const data = await this.repo.findStudentWithParents(studentId, schoolId);
    if (!data) {
      throw new Error("Santri tidak ditemukan di sekolah ini");
    }

    const defaultPassword = formatBirthDateToDefaultPassword(data.student.birthDate);
    const hash = await this.passwordHasher.hashPassword(defaultPassword);

    // Update password santri
    await this.repo.updateUserPassword(studentId, schoolId, hash);

    // Update password orang tua santri
    if (data.parentIds.length > 0) {
      await this.repo.updateUsersPassword(data.parentIds, schoolId, hash);
    }

    return {
      defaultPassword,
      studentName: data.student.name,
      parentsResetCount: data.parentIds.length,
    };
  }

  async resetTeacher(teacherId: string, schoolId: string): Promise<{
    defaultPassword: string;
    teacherName: string;
  }> {
    if (!teacherId || !schoolId) {
      throw new Error("Teacher ID dan School ID wajib diisi");
    }

    const teacher = await this.repo.findTeacher(teacherId, schoolId);
    if (!teacher) {
      throw new Error("Guru tidak ditemukan di sekolah ini");
    }

    const defaultPassword = "muhsin123";
    const hash = await this.passwordHasher.hashPassword(defaultPassword);

    await this.repo.updateUserPassword(teacherId, schoolId, hash);

    return {
      defaultPassword,
      teacherName: teacher.name,
    };
  }
}
