import { describe, it, expect, vi } from "vitest";
import { createPublicDailyIbadahRoutes } from "../modules/daily-ibadah/presentation/public-routes";

describe("Public Daily Ibadah Routes", () => {
  const schoolId = "11111111-1111-1111-1111-111111111111";
  const studentId = "22222222-2222-2222-2222-222222222222";
  const classId = "33333333-3333-3333-3333-333333333333";

  it("lists classes for a school", async () => {
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockResolvedValue([{ id: schoolId, slug: "smp-alfitrah", name: "SMP IT Al Fitrah" }]),
            orderBy: vi.fn().mockResolvedValue([
              { id: classId, name: "Kelas 7A" },
              { id: "44444444-4444-4444-4444-444444444444", name: "Kelas 7B" },
            ]),
          })),
        })),
      })),
    } as any;

    const app = createPublicDailyIbadahRoutes({
      db: mockDb,
      submitUseCase: {} as any,
      repo: {} as any,
    });

    const res = await app.request("/smp-alfitrah/classes");
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data).toHaveLength(2);
    expect(json.data[0].name).toBe("Kelas 7A");
  });

  it("submits yaumiyah successfully for student of the school", async () => {
    let call = 0;
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              call++;
              if (call === 1) {
                return Promise.resolve([{ id: schoolId, slug: "smp-alfitrah", name: "SMP IT Al Fitrah" }]);
              }
              return Promise.resolve([{ id: studentId, role: "student" }]);
            }),
          })),
        })),
      })),
    } as any;

    const mockSubmitUseCase = {
      execute: vi.fn().mockResolvedValue({
        entity: { id: "ibadah-1", date: "2026-09-30", status: "submitted" },
        expEarned: 25,
        currentStreak: 3,
      }),
    } as any;

    const app = createPublicDailyIbadahRoutes({
      db: mockDb,
      submitUseCase: mockSubmitUseCase,
      repo: {} as any,
    });

    const payload = {
      studentId,
      date: "2026-09-30",
      sholatFardhu: {
        subuh: "BA",
        dzuhur: "BA",
        ashar: "BA",
        maghrib: "BA",
        isya: "BA",
      },
    };

    const res = await app.request("/smp-alfitrah/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.expEarned).toBe(25);
    expect(mockSubmitUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        schoolId,
        studentId,
        date: "2026-09-30",
      })
    );
  });

  it("blocks submission if student does not belong to school (tenant isolation)", async () => {
    let callCount = 0;
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                // School resolve
                return Promise.resolve([{ id: schoolId, slug: "smp-alfitrah", name: "SMP IT Al Fitrah" }]);
              }
              // Student query returns empty (student does not belong to this school)
              return Promise.resolve([]);
            }),
          })),
        })),
      })),
    } as any;

    const mockSubmitUseCase = {
      execute: vi.fn(),
    } as any;

    const app = createPublicDailyIbadahRoutes({
      db: mockDb,
      submitUseCase: mockSubmitUseCase,
      repo: {} as any,
    });

    const payload = {
      studentId: "99999999-9999-9999-9999-999999999999",
      date: "2026-09-30",
    };

    const res = await app.request("/smp-alfitrah/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(403);
    const json = (await res.json()) as any;
    expect(json.error.code).toBe("FORBIDDEN");
    expect(mockSubmitUseCase.execute).not.toHaveBeenCalled();
  });
});
