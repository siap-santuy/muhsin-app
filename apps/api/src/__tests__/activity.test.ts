import { describe, it, expect, vi } from "vitest";
import { RecordParentViewUseCase } from "../modules/dashboard/application/use-cases/RecordParentViewUseCase";
import { GetKoorStudentActivityUseCase } from "../modules/dashboard/application/use-cases/GetKoorStudentActivityUseCase";
import { GetKoorTeacherActivityUseCase } from "../modules/dashboard/application/use-cases/GetKoorTeacherActivityUseCase";
import { RemindParentUseCase } from "../modules/dashboard/application/use-cases/RemindParentUseCase";
import { RemindStudentUseCase } from "../modules/dashboard/application/use-cases/RemindStudentUseCase";
import { PurgeOldParentViewsUseCase } from "../modules/dashboard/application/use-cases/PurgeOldParentViewsUseCase";
import type { IActivityRepository } from "../modules/dashboard/domain/repositories/IActivityRepository";

function mockActivityRepo(overrides: Partial<IActivityRepository> = {}): IActivityRepository {
  return {
    getStudentActivity: vi.fn().mockResolvedValue([]),
    getTeacherActivity: vi.fn().mockResolvedValue([]),
    recordParentView: vi.fn().mockResolvedValue(undefined),
    findChildIdsByParent: vi.fn().mockResolvedValue(["student-1"]),
    findParentIdsByStudent: vi.fn().mockResolvedValue(["parent-1"]),
    findRecentReminder: vi.fn().mockResolvedValue(false),
    purgeOldParentViews: vi.fn().mockResolvedValue(5),
    ...overrides,
  };
}

describe("Activity & Remind UseCases", () => {
  it("record view hanya untuk anak sendiri, lintas mapping silent", async () => {
    const repo = mockActivityRepo({ findChildIdsByParent: vi.fn().mockResolvedValue(["student-1"]) });
    const uc = new RecordParentViewUseCase(repo);
    await uc.execute({ schoolId: "s1", parentId: "p1", studentId: "student-1", source: "dashboard" });
    expect(repo.recordParentView).toHaveBeenCalledTimes(1);
    await uc.execute({ schoolId: "s1", parentId: "p1", studentId: "other", source: "raport" });
    expect(repo.recordParentView).toHaveBeenCalledTimes(1);
  });

  it("student activity passthrough repo", async () => {
    const rows = [{ studentId: "a", studentName: "A", className: "VII", yaumiyahStatus: "submitted", parentLastViewAt: new Date(), parentLastSource: "raport", parentName: "P" }] as any;
    const repo = mockActivityRepo({ getStudentActivity: vi.fn().mockResolvedValue(rows) });
    const uc = new GetKoorStudentActivityUseCase(repo);
    expect(await uc.execute({ schoolId: "s1", date: "2026-09-27" })).toEqual(rows);
  });

  it("teacher activity: guru tanpa setoran lastAssessmentAt null", async () => {
    const rows = [{ teacherId: "t1", teacherName: "U", classes: [], lastAssessmentAt: null, assessedToday: false, countToday: 0 }];
    const repo = mockActivityRepo({ getTeacherActivity: vi.fn().mockResolvedValue(rows as any) });
    const uc = new GetKoorTeacherActivityUseCase(repo);
    const res = await uc.execute({ schoolId: "s1", date: "2026-09-27" });
    expect(res[0].lastAssessmentAt).toBeNull();
    expect(res[0].assessedToday).toBe(false);
  });

  it("remind parent: happy path + 429 saat sudah ingatkan hari ini", async () => {
    const notif = { createNotification: vi.fn().mockResolvedValue({}) } as any;
    const ok = new RemindParentUseCase(mockActivityRepo(), notif);
    expect(await ok.execute({ schoolId: "s1", studentId: "student-1" })).toEqual({ reminded: 1 });
    const limited = new RemindParentUseCase(mockActivityRepo({ findRecentReminder: vi.fn().mockResolvedValue(true) }), notif);
    await expect(limited.execute({ schoolId: "s1", studentId: "student-1" })).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("remind student: tolak saat yaumiyah submitted + tolak lintas tenant mapping", async () => {
    const notif = { createNotification: vi.fn().mockResolvedValue({}) } as any;
    const daily = { findByStudentAndDate: vi.fn().mockResolvedValue({ status: "submitted" }) } as any;
    const uc = new RemindStudentUseCase(mockActivityRepo(), notif, daily);
    await expect(uc.execute({ schoolId: "s1", parentId: "p1" })).rejects.toMatchObject({ code: "ALREADY_FILLED" });
    const cross = new RemindStudentUseCase(mockActivityRepo(), notif, { findByStudentAndDate: vi.fn().mockResolvedValue(null) } as any);
    await expect(cross.execute({ schoolId: "s1", parentId: "p1", studentId: "other" })).rejects.toThrow("bukan anak Anda");
  });

  it("purge hapus data >30 hari", async () => {
    const repo = mockActivityRepo();
    const uc = new PurgeOldParentViewsUseCase(repo);
    expect(await uc.execute({})).toEqual({ deleted: 5 });
    expect(repo.purgeOldParentViews).toHaveBeenCalled();
  });
});
