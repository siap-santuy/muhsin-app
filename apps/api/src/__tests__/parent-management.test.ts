import { describe, expect, it, vi } from "vitest";
import { ManageParentUseCase } from "../modules/schools/application/use-cases/ManageParentUseCase";
import { GetDashboardSummaryUseCase } from "../modules/dashboard/application/use-cases/GetDashboardSummaryUseCase";
import type { ISchoolAdminRepository } from "../modules/schools/domain/repositories/ISchoolAdminRepository";
import type { IDashboardRepository } from "../modules/dashboard/domain/repositories/IDashboardRepository";

describe("ManageParentUseCase", () => {
  it("mengembalikan daftar orang tua di sekolah", async () => {
    const mockRepo: ISchoolAdminRepository = {
      getParents: vi.fn(async (schoolId: string) => {
        expect(schoolId).toBe("sch-1");
        return [
          {
            id: "p-1",
            name: "Ortu Muhammad Ar Rayyan Sopamena",
            username: "ortu_muhammadsopamena",
            email: "fitriasopamena@gmail.com",
            phone: null,
            children: [
              { id: "std-1", name: "Muhammad Ar Rayyan Sopamena", username: "muhammadsopamena", className: "7A" },
              { id: "std-2", name: "Moira Rainia Sopamena", username: "moirasopamena", className: "9B" },
            ],
          },
        ];
      }),
    } as any;

    const uc = new ManageParentUseCase(mockRepo);
    const result = await uc.list("sch-1");

    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(2);
    expect(result[0].children[0].name).toBe("Muhammad Ar Rayyan Sopamena");
    expect(result[0].children[1].name).toBe("Moira Rainia Sopamena");
  });

  it("memperbarui data akun orang tua dan relasi santri terhubung", async () => {
    let updatedParentData: any = null;
    let updatedMappings: string[] = [];

    const mockRepo: ISchoolAdminRepository = {
      emailExists: vi.fn(async () => false),
      updateUser: vi.fn(async (_id, _schoolId, data) => {
        updatedParentData = data;
      }),
      updateParentMappings: vi.fn(async (_pId, _schoolId, studentIds) => {
        updatedMappings = studentIds;
      }),
    } as any;

    const uc = new ManageParentUseCase(mockRepo);
    await uc.update("p-1", "sch-1", {
      name: "Ibu Fitria Sopamena",
      email: "fitria.new@gmail.com",
      phone: "081234567890",
      studentIds: ["std-1", "std-2"],
    });

    expect(updatedParentData.name).toBe("Ibu Fitria Sopamena");
    expect(updatedParentData.email).toBe("fitria.new@gmail.com");
    expect(updatedMappings).toEqual(["std-1", "std-2"]);
  });
});

describe("GetDashboardSummaryUseCase (Multi-Child Support)", () => {
  it("meneruskan requested studentId ke repository dashboard orang tua", async () => {
    const mockRepo: IDashboardRepository = {
      getStudentDashboard: vi.fn(),
      getTeacherDashboard: vi.fn(),
      getKoordinatorDashboard: vi.fn(),
      getParentDashboard: vi.fn(async (parentId, schoolId, reqStudentId) => {
        expect(parentId).toBe("p-1");
        expect(schoolId).toBe("sch-1");
        expect(reqStudentId).toBe("std-moira");
        return {
          parentName: "Ortu Muhammad Ar Rayyan Sopamena",
          children: [
            { id: "std-rayyan", name: "Muhammad Ar Rayyan Sopamena", className: "7A" },
            { id: "std-moira", name: "Moira Rainia Sopamena", className: "9B" },
          ],
          childId: "std-moira",
          childName: "Moira Rainia Sopamena",
          childClassName: "9B",
          childLevel: 3,
          childStreak: 12,
          lastSetoran: null,
          progres: {
            ziyadahCount: 1.5,
            murojaahCount: 10,
            tahsinCount: 8,
            yaumiyahDays: 14,
          },
          isYaumiyahTodayFilled: true,
        };
      }),
    };

    const uc = new GetDashboardSummaryUseCase(mockRepo);
    const result = (await uc.execute({
      userId: "p-1",
      role: "parent",
      schoolId: "sch-1",
      studentId: "std-moira",
    })) as any;

    expect(result.childName).toBe("Moira Rainia Sopamena");
    expect(result.children).toHaveLength(2);
  });
});
