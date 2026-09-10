import type { ISchoolAdminRepository } from "../../domain/repositories/ISchoolAdminRepository";
import type { PasswordHasher } from "../../../auth/application/services/PasswordHasher";

export interface ManageStudentInput {
  schoolId: string;
  name: string;
  email: string;
  phone?: string | null;
  gender?: "ikhwan" | "akhwat" | null;
  nisn?: string | null;
  classId?: string | null;
}

export interface UpdateManagedUserInput {
  name?: string;
  email?: string;
  phone?: string | null;
  classId?: string | null;
}

export class ManageStudentUseCase {
  constructor(
    private readonly repo: ISchoolAdminRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async create(input: ManageStudentInput): Promise<{ id: string }> {
    if (!input.name?.trim() || !input.email?.trim()) {
      throw new Error("Nama dan email wajib diisi");
    }
    const email = input.email.trim().toLowerCase();
    const exists = await this.repo.emailExists(email, input.schoolId);
    if (exists) {
      throw new Error("Email sudah terdaftar di sekolah ini");
    }

    const period = await this.repo.getActivePeriod(input.schoolId);
    if (!period) {
      throw new Error("Periode akademik aktif belum dikonfigurasi");
    }

    const passwordHash = await this.passwordHasher.hashPassword("muhsin123");
    const baseUsername = email.split("@")[0].replace(/[^a-z0-9]/g, "").slice(0, 30) || `siswa${Date.now()}`;

    const { id } = await this.repo.createUser({
      schoolId: input.schoolId,
      role: "student",
      name: input.name.trim(),
      email,
      passwordHash,
      phone: input.phone ?? null,
      username: input.nisn?.trim() || baseUsername,
      gender: input.gender ?? null,
    });

    if (input.classId) {
      await this.repo.enrollStudent(id, input.classId, input.schoolId, period.id);
    }

    return { id };
  }

  async update(id: string, schoolId: string, input: UpdateManagedUserInput): Promise<void> {
    if (input.email) {
      const exists = await this.repo.emailExists(input.email, schoolId, id);
      if (exists) {
        throw new Error("Email sudah dipakai user lain di sekolah ini");
      }
    }
    await this.repo.updateUser(id, schoolId, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
    });

    if (input.classId) {
      const period = await this.repo.getActivePeriod(schoolId);
      if (period) {
        await this.repo.enrollStudent(id, input.classId, schoolId, period.id);
      }
    }
  }

  async delete(id: string, schoolId: string): Promise<void> {
    await this.repo.deleteUser(id, schoolId);
  }
}

export interface ManageTeacherInput {
  schoolId: string;
  name: string;
  email: string;
  phone?: string | null;
  classId?: string | null;
}

export class ManageTeacherUseCase {
  constructor(
    private readonly repo: ISchoolAdminRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async create(input: ManageTeacherInput): Promise<{ id: string }> {
    if (!input.name?.trim() || !input.email?.trim()) {
      throw new Error("Nama dan email wajib diisi");
    }
    const email = input.email.trim().toLowerCase();
    const exists = await this.repo.emailExists(email, input.schoolId);
    if (exists) {
      throw new Error("Email sudah terdaftar di sekolah ini");
    }

    const passwordHash = await this.passwordHasher.hashPassword("muhsin123");
    const baseUsername = email.split("@")[0].replace(/[^a-z0-9]/g, "").slice(0, 30) || `guru${Date.now()}`;

    const { id } = await this.repo.createUser({
      schoolId: input.schoolId,
      role: "teacher",
      name: input.name.trim(),
      email,
      passwordHash,
      phone: input.phone ?? null,
      username: baseUsername,
    });

    if (input.classId) {
      await this.repo.assignTeacherClass(id, input.classId, input.schoolId);
    }

    return { id };
  }

  async update(id: string, schoolId: string, input: UpdateManagedUserInput): Promise<void> {
    if (input.email) {
      const exists = await this.repo.emailExists(input.email, schoolId, id);
      if (exists) {
        throw new Error("Email sudah dipakai user lain di sekolah ini");
      }
    }
    await this.repo.updateUser(id, schoolId, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
    });

    if (input.classId) {
      await this.repo.assignTeacherClass(id, input.classId, schoolId);
    }
  }

  async delete(id: string, schoolId: string): Promise<void> {
    await this.repo.deleteUser(id, schoolId);
  }
}
