import type { ISchoolAdminRepository, SchoolParentItem } from "../../domain/repositories/ISchoolAdminRepository";

export interface UpdateParentParams {
  name?: string;
  email?: string;
  phone?: string | null;
  studentIds?: string[];
}

export class ManageParentUseCase {
  constructor(private readonly repo: ISchoolAdminRepository) {}

  async list(schoolId: string): Promise<SchoolParentItem[]> {
    if (!schoolId) throw new Error("School ID wajib diisi");
    return this.repo.getParents(schoolId);
  }

  async update(parentId: string, schoolId: string, data: UpdateParentParams): Promise<void> {
    if (!parentId || !schoolId) throw new Error("Parent ID dan School ID wajib diisi");

    if (data.email) {
      const exists = await this.repo.emailExists(data.email, schoolId, parentId);
      if (exists) throw new Error(`Email ${data.email} sudah terdaftar.`);
    }

    if (data.name !== undefined || data.email !== undefined || data.phone !== undefined) {
      await this.repo.updateUser(parentId, schoolId, {
        name: data.name,
        email: data.email,
        phone: data.phone,
      });
    }

    if (Array.isArray(data.studentIds)) {
      await this.repo.updateParentMappings(parentId, schoolId, data.studentIds);
    }
  }
}
