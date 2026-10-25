import { describe, expect, it, vi } from "vitest";
import { ResetDefaultPasswordUseCase } from "../modules/schools/application/use-cases/ResetDefaultPasswordUseCase";
import { RequestPasswordResetUseCase } from "../modules/auth/application/use-cases/RequestPasswordResetUseCase";
import type { ISchoolAdminRepository } from "../modules/schools/domain/repositories/ISchoolAdminRepository";
import type { IUserRepository } from "../modules/auth/domain/repositories/IUserRepository";
import type { INotificationRepository } from "../modules/notifications/domain/repositories/INotificationRepository";
import type { SendPushToUserUseCase } from "../modules/notifications/application/use-cases/SendPushToUserUseCase";

describe("ResetDefaultPasswordUseCase", () => {
  const mockHasher = {
    hashPassword: vi.fn(async (p: string) => `hashed_${p}`),
    verifyPassword: vi.fn(),
  } as any;

  it("mereset password santri dan orang tua ke tanggal lahir santri (DDMMYYYY)", async () => {
    const updatedUsers: Record<string, string> = {};
    const mockRepo: ISchoolAdminRepository = {
      findStudentWithParents: vi.fn(async (studentId, schoolId) => {
        expect(studentId).toBe("std-1");
        expect(schoolId).toBe("sch-1");
        return {
          student: { id: "std-1", name: "Ahmad", birthDate: "2014-05-21" },
          parentIds: ["parent-1", "parent-2"],
        };
      }),
      updateUserPassword: vi.fn(async (userId, _schoolId, passwordHash) => {
        updatedUsers[userId] = passwordHash;
      }),
      updateUsersPassword: vi.fn(async (userIds, _schoolId, passwordHash) => {
        userIds.forEach((id: string) => {
          updatedUsers[id] = passwordHash;
        });
      }),
    } as any;

    const uc = new ResetDefaultPasswordUseCase(mockRepo, mockHasher);
    const result = await uc.resetStudentAndParent("std-1", "sch-1");

    expect(result.defaultPassword).toBe("21052014");
    expect(result.studentName).toBe("Ahmad");
    expect(result.parentsResetCount).toBe(2);

    expect(updatedUsers["std-1"]).toBe("hashed_21052014");
    expect(updatedUsers["parent-1"]).toBe("hashed_21052014");
    expect(updatedUsers["parent-2"]).toBe("hashed_21052014");
  });

  it("fallback ke 'muhsin123' jika tanggal lahir santri kosong", async () => {
    const updatedUsers: Record<string, string> = {};
    const mockRepo: ISchoolAdminRepository = {
      findStudentWithParents: vi.fn(async () => ({
        student: { id: "std-2", name: "Budi", birthDate: null },
        parentIds: [],
      })),
      updateUserPassword: vi.fn(async (userId, _schoolId, passwordHash) => {
        updatedUsers[userId] = passwordHash;
      }),
      updateUsersPassword: vi.fn(),
    } as any;

    const uc = new ResetDefaultPasswordUseCase(mockRepo, mockHasher);
    const result = await uc.resetStudentAndParent("std-2", "sch-1");

    expect(result.defaultPassword).toBe("muhsin123");
    expect(updatedUsers["std-2"]).toBe("hashed_muhsin123");
  });

  it("mereset password guru kembali ke default 'muhsin123'", async () => {
    let updatedHash = "";
    const mockRepo: ISchoolAdminRepository = {
      findTeacher: vi.fn(async (teacherId, schoolId) => {
        expect(teacherId).toBe("tch-1");
        expect(schoolId).toBe("sch-1");
        return { id: "tch-1", name: "Ustadz Faisal" };
      }),
      updateUserPassword: vi.fn(async (_userId, _schoolId, passwordHash) => {
        updatedHash = passwordHash;
      }),
    } as any;

    const uc = new ResetDefaultPasswordUseCase(mockRepo, mockHasher);
    const result = await uc.resetTeacher("tch-1", "sch-1");

    expect(result.defaultPassword).toBe("muhsin123");
    expect(result.teacherName).toBe("Ustadz Faisal");
    expect(updatedHash).toBe("hashed_muhsin123");
  });

  it("melempar error jika santri atau guru tidak ditemukan di sekolah tersebut (tenant check)", async () => {
    const mockRepo: ISchoolAdminRepository = {
      findStudentWithParents: vi.fn(async () => null),
      findTeacher: vi.fn(async () => null),
    } as any;

    const uc = new ResetDefaultPasswordUseCase(mockRepo, mockHasher);
    await expect(uc.resetStudentAndParent("std-x", "sch-1")).rejects.toThrow("Santri tidak ditemukan");
    await expect(uc.resetTeacher("tch-x", "sch-1")).rejects.toThrow("Guru tidak ditemukan");
  });
});

describe("RequestPasswordResetUseCase", () => {
  it("mengirim notifikasi & push ke koordinator saat user meminta reset", async () => {
    const createdNotifs: any[] = [];
    const pushedUsers: any[] = [];

    const mockUserRepo: IUserRepository = {
      findByIdentifierAnySchool: vi.fn(async (_id: string) => ({
        id: "usr-1",
        schoolId: "sch-1",
        role: "student",
        name: "Fathir",
        email: "fathir@test.sch.id",
        passwordHash: "hash",
        createdAt: new Date(),
      })),
      findKoordinatorBySchool: vi.fn(async (schId: string) => [
        {
          id: "koor-1",
          schoolId: schId,
          role: "koordinator_ttq",
          name: "Ustadz Koor",
          email: "koor@test.sch.id",
          passwordHash: "hash",
          createdAt: new Date(),
        },
      ]),
    } as any;

    const mockNotifRepo: INotificationRepository = {
      createNotification: vi.fn(async (data) => {
        createdNotifs.push(data);
      }),
    } as any;

    const mockPushUseCase = {
      execute: vi.fn(async (params) => {
        pushedUsers.push(params);
        return { sent: 1, removed: 0 };
      }),
    } as unknown as SendPushToUserUseCase;

    const uc = new RequestPasswordResetUseCase(mockUserRepo, mockNotifRepo, mockPushUseCase);
    const res = await uc.execute({ identifier: "fathir@test.sch.id" });

    expect(res.success).toBe(true);
    expect(createdNotifs).toHaveLength(1);
    expect(createdNotifs[0].userId).toBe("koor-1");
    expect(createdNotifs[0].message).toContain("Fathir (Santri)");

    expect(pushedUsers).toHaveLength(1);
    expect(pushedUsers[0].userId).toBe("koor-1");
  });

  it("menolak permohonan dengan pesan error jika username atau email tidak ditemukan", async () => {
    const mockUserRepo: IUserRepository = {
      findByIdentifierAnySchool: vi.fn(async () => null),
    } as any;

    const uc = new RequestPasswordResetUseCase(mockUserRepo, {} as any);
    await expect(uc.execute({ identifier: "nonexistent@test.com" })).rejects.toThrow(
      "Username atau email tidak valid atau tidak ditemukan. Silakan hubungi admin sekolah."
    );
  });
});
