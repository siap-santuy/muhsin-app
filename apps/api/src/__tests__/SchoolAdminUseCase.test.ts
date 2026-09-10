import { describe, it, expect, vi } from "vitest";
import { ManageStudentUseCase, ManageTeacherUseCase } from "../modules/schools/application/use-cases/ManageSchoolUserUseCase";
import type { ISchoolAdminRepository } from "../modules/schools/domain/repositories/ISchoolAdminRepository";

function makeRepo(overrides: Partial<ISchoolAdminRepository> = {}): ISchoolAdminRepository {
  return {
    createUser: vi.fn().mockResolvedValue({ id: "user-new" }),
    updateUser: vi.fn().mockResolvedValue(undefined),
    deleteUser: vi.fn().mockResolvedValue(undefined),
    emailExists: vi.fn().mockResolvedValue(false),
    getClasses: vi.fn().mockResolvedValue([]),
    getActivePeriod: vi.fn().mockResolvedValue({ id: "period-1", tahunAjaran: "2026/2027", semester: "Ganjil", isLocked: false }),
    getMunaqosahPeriods: vi.fn().mockResolvedValue([]),
    enrollStudent: vi.fn().mockResolvedValue(undefined),
    assignTeacherClass: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const hasher = { hashPassword: vi.fn().mockResolvedValue("hashed-muhsin123") } as any;

describe("School Admin CRUD", () => {
  it("ManageStudentUseCase creates student and enrolls to class", async () => {
    const repo = makeRepo();
    const useCase = new ManageStudentUseCase(repo, hasher);
    const res = await useCase.create({
      schoolId: "school-1",
      name: "Siswa Baru",
      email: "siswa@sekolah.sch.id",
      classId: "class-1",
    });
    expect(res.id).toBe("user-new");
    expect(repo.createUser).toHaveBeenCalledWith(expect.objectContaining({ role: "student", schoolId: "school-1" }));
    expect(repo.enrollStudent).toHaveBeenCalledWith("user-new", "class-1", "school-1", "period-1");
  });

  it("ManageStudentUseCase rejects duplicate email in same school (tenant-scoped)", async () => {
    const repo = makeRepo({ emailExists: vi.fn().mockResolvedValue(true) });
    const useCase = new ManageStudentUseCase(repo, hasher);
    await expect(
      useCase.create({ schoolId: "school-1", name: "X", email: "dup@sekolah.sch.id" })
    ).rejects.toThrow(/sudah terdaftar/);
    expect(repo.createUser).not.toHaveBeenCalled();
  });

  it("ManageTeacherUseCase creates teacher and assigns class", async () => {
    const repo = makeRepo();
    const useCase = new ManageTeacherUseCase(repo, hasher);
    const res = await useCase.create({
      schoolId: "school-1",
      name: "Ustadz Baru",
      email: "ustadz@sekolah.sch.id",
      classId: "class-1",
    });
    expect(res.id).toBe("user-new");
    expect(repo.createUser).toHaveBeenCalledWith(expect.objectContaining({ role: "teacher" }));
    expect(repo.assignTeacherClass).toHaveBeenCalledWith("user-new", "class-1", "school-1");
  });

  it("ManageStudentUseCase update rejects email used by another user", async () => {
    const repo = makeRepo({ emailExists: vi.fn().mockResolvedValue(true) });
    const useCase = new ManageStudentUseCase(repo, hasher);
    await expect(
      useCase.update("user-1", "school-1", { email: "used@sekolah.sch.id" })
    ).rejects.toThrow(/sudah dipakai/);
  });
});
