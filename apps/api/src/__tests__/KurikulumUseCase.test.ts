import { describe, it, expect, vi } from "vitest";
import { GetKurikulumCategoriesUseCase } from "../modules/kurikulum/application/use-cases/GetKurikulumCategoriesUseCase";
import { CreateCategoryUseCase } from "../modules/kurikulum/application/use-cases/CreateCategoryUseCase";
import { CreateSubcategoryUseCase } from "../modules/kurikulum/application/use-cases/CreateSubcategoryUseCase";
import type { IKurikulumRepository } from "../modules/kurikulum/domain/repositories/IKurikulumRepository";

describe("Kurikulum Module UseCases", () => {
  it("GetKurikulumCategoriesUseCase returns categories", async () => {
    const mockRepo: IKurikulumRepository = {
      getCategoriesWithSubcategories: vi.fn().mockResolvedValue([
        {
          id: "cat-1",
          code: "TAHFIDZ",
          name: "Tahfidz",
          subcategories: [],
        },
      ]),
      createCategory: vi.fn(),
      createSubcategory: vi.fn(),
      getGradingScale: vi.fn(),
    };

    const useCase = new GetKurikulumCategoriesUseCase(mockRepo);
    const result = await useCase.execute("school-1");

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Tahfidz");
  });

  it("CreateCategoryUseCase calls repo create", async () => {
    const mockRepo: IKurikulumRepository = {
      getCategoriesWithSubcategories: vi.fn(),
      createCategory: vi.fn().mockResolvedValue("cat-new"),
      createSubcategory: vi.fn(),
      getGradingScale: vi.fn(),
    };

    const useCase = new CreateCategoryUseCase(mockRepo);
    const id = await useCase.execute({
      schoolId: "school-1",
      academicPeriodId: "period-1",
      code: "HADIST",
      name: "Hadist Arbain",
    });

    expect(id).toBe("cat-new");
    expect(mockRepo.createCategory).toHaveBeenCalledWith({
      schoolId: "school-1",
      academicPeriodId: "period-1",
      code: "HADIST",
      name: "Hadist Arbain",
    });
  });

  it("CreateSubcategoryUseCase calls repo create", async () => {
    const mockRepo: IKurikulumRepository = {
      getCategoriesWithSubcategories: vi.fn(),
      createCategory: vi.fn(),
      createSubcategory: vi.fn().mockResolvedValue("sub-new"),
      getGradingScale: vi.fn(),
    };

    const useCase = new CreateSubcategoryUseCase(mockRepo);
    const id = await useCase.execute({
      schoolId: "school-1",
      categoryId: "cat-1",
      code: "HAFALAN_HADIST",
      name: "Hafalan Hadist",
      scoreFields: [{ key: "kelancaran", label: "Kelancaran", min: 0, max: 100 }],
      includeInRanking: false,
    });

    expect(id).toBe("sub-new");
    expect(mockRepo.createSubcategory).toHaveBeenCalledWith({
      schoolId: "school-1",
      categoryId: "cat-1",
      code: "HAFALAN_HADIST",
      name: "Hafalan Hadist",
      scoreFields: [{ key: "kelancaran", label: "Kelancaran", min: 0, max: 100 }],
      includeInRanking: false,
    });
  });
});
