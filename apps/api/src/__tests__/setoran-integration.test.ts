import { describe, it, expect, vi } from "vitest";
import { createSetoranRoutes } from "../modules/setoran/presentation/routes";
import { CreateSetoranUseCase } from "../modules/setoran/application/use-cases/CreateSetoranUseCase";
import { Hono } from "hono";

describe("Setoran HTTP Integration & Input Verification", () => {
  const schoolId = "11111111-1111-1111-1111-111111111111";
  const teacherId = "22222222-2222-2222-2222-222222222222";
  const studentId = "33333333-3333-3333-3333-333333333333";
  const subcategoryId = "44444444-4444-4444-4444-444444444444";

  function createTestApp(userRole = "teacher") {
    const mockRepo = {
      create: vi.fn().mockImplementation(async (e) => e),
      update: vi.fn().mockImplementation(async (e) => e),
      findById: vi.fn().mockResolvedValue(null),
      findByStudent: vi.fn().mockResolvedValue([]),
      findByStudentAndMonth: vi.fn().mockResolvedValue([]),
      findByClassAndDate: vi.fn().mockResolvedValue([]),
      getActiveSubcategories: vi.fn().mockResolvedValue([
        {
          id: subcategoryId,
          categoryId: "cat-1",
          categoryCode: "TAHFIDZ",
          categoryName: "Tahfidz",
          code: "ZIYADAH",
          name: "Ziyadah",
          scoreFields: [
            { key: "tajwid", label: "Tajwid", min: 0, max: 100 },
            { key: "kelancaran", label: "Kelancaran", min: 0, max: 100 },
          ],
          referenceShape: { type: "surah_ayat" },
        },
      ]),
    };

    const mockAddExpUseCase = {
      execute: vi.fn().mockResolvedValue({ newTotalExp: 20, newLevel: 1 }),
    } as any;

    const createUseCase = new CreateSetoranUseCase(mockRepo as any, mockAddExpUseCase);

    const routes = createSetoranRoutes({
      createSetoranUseCase: createUseCase,
      correctSetoranUseCase: {} as any,
      getSetoranHistoryUseCase: {} as any,
      getSetoranByIdUseCase: {} as any,
      getAssessmentCategoriesUseCase: {
        execute: async () => mockRepo.getActiveSubcategories(),
      } as any,
    });

    const rootApp = new Hono<{
      Variables: {
        user: { userId: string; schoolId: string; role: string };
      };
    }>();

    rootApp.use("*", async (c, next) => {
      c.set("user", {
        userId: teacherId,
        schoolId,
        role: userRole,
      });
      await next();
    });

    rootApp.route("/setoran", routes);
    return { app: rootApp, mockRepo, mockAddExpUseCase };
  }

  it("successfully creates setoran when teacher inputs valid scores", async () => {
    const { app, mockRepo, mockAddExpUseCase } = createTestApp("teacher");

    const payload = {
      studentId,
      subcategoryId,
      date: "2026-09-30",
      scores: { tajwid: 85, kelancaran: 90 },
      scoreFieldKeys: ["tajwid", "kelancaran"],
      referenceStart: { surah: "An-Naba", surahNumber: 78, ayat: 1 },
      referenceEnd: { surah: "An-Naba", surahNumber: 78, ayat: 10 },
      keterangan: "[Hadir] Lancar dan tartil",
    };

    const res = await app.request("/setoran", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(201);
    const json = (await res.json()) as any;
    expect(json.data.scores.tajwid).toBe(85);
    expect(json.data.teacherId).toBe(teacherId);
    expect(mockRepo.create).toHaveBeenCalledTimes(1);
    expect(mockAddExpUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ expAmount: 20 })
    );
  });

  it("handles non-Hadir status (Sakit/Izin/Alpa) without errors or EXP", async () => {
    const { app, mockAddExpUseCase } = createTestApp("teacher");

    const payload = {
      studentId,
      subcategoryId,
      date: "2026-09-30",
      scores: {},
      scoreFieldKeys: [],
      referenceStart: null,
      referenceEnd: null,
      keterangan: "[Sakit] Demam",
    };

    const res = await app.request("/setoran", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(201);
    const json = (await res.json()) as any;
    expect(json.data.keterangan).toBe("[Sakit] Demam");
    expect(mockAddExpUseCase.execute).not.toHaveBeenCalled();
  });

  it("rejects non-teacher role with 403 Forbidden", async () => {
    const { app } = createTestApp("student");

    const payload = {
      studentId,
      subcategoryId,
      date: "2026-09-30",
      scores: { tajwid: 80 },
      scoreFieldKeys: ["tajwid"],
    };

    const res = await app.request("/setoran", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(403);
  });

  it("rejects invalid score range with 422", async () => {
    const { app } = createTestApp("teacher");

    const payload = {
      studentId,
      subcategoryId,
      date: "2026-09-30",
      scores: { tajwid: 150 }, // > 100 invalid!
      scoreFieldKeys: ["tajwid"],
    };

    const res = await app.request("/setoran", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Zod validator on body schema rejects scores > 100 with 400
    expect(res.status).toBe(400);
  });
});
