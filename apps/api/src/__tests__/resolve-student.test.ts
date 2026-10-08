import { describe, it, expect, vi } from "vitest";
import { resolveStudentIdForUser } from "../shared/domain/resolve-student";

describe("resolveStudentIdForUser", () => {
  it("harus mengembalikan userId sendiri jika role adalah student", async () => {
    const mockDb = {} as any;
    const res = await resolveStudentIdForUser(
      mockDb,
      { userId: "student-1", schoolId: "sch-1", role: "student" },
      "other-id"
    );
    expect(res).toBe("student-1");
  });

  it("harus me-resolve ID anak pertama jika role parent dan studentId tidak di-request", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ studentId: "child-1" }]),
        }),
      }),
    } as any;

    const res = await resolveStudentIdForUser(
      mockDb,
      { userId: "parent-1", schoolId: "sch-1", role: "parent" }
    );
    expect(res).toBe("child-1");
  });

  it("harus menggunakan requestedStudentId jika valid milik parent tersebut", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ studentId: "child-1" }, { studentId: "child-2" }]),
        }),
      }),
    } as any;

    const res = await resolveStudentIdForUser(
      mockDb,
      { userId: "parent-1", schoolId: "sch-1", role: "parent" },
      "child-2"
    );
    expect(res).toBe("child-2");
  });

  it("harus fallback ke anak pertama jika childIds ada tetapi requestedStudentId bukan milik parent tersebut", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ studentId: "child-1" }]),
        }),
      }),
    } as any;

    const res = await resolveStudentIdForUser(
      mockDb,
      { userId: "parent-1", schoolId: "sch-1", role: "parent" },
      "stranger-id"
    );
    expect(res).toBe("child-1");
  });

  it("harus fallback ke student pertama jika mapping parent kosong", async () => {
    let callCount = 0;
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) return Promise.resolve([]);
            return {
              limit: vi.fn().mockResolvedValue([{ id: "student-fallback" }]),
            };
          }),
        }),
      }),
    } as any;

    const res = await resolveStudentIdForUser(
      mockDb,
      { userId: "parent-1", schoolId: "sch-1", role: "parent" }
    );
    expect(res).toBe("student-fallback");
  });

  it("harus mengembalikan requestedStudentId jika role adalah teacher / koordinator", async () => {
    const mockDb = {} as any;
    const res = await resolveStudentIdForUser(
      mockDb,
      { userId: "teacher-1", schoolId: "sch-1", role: "teacher" },
      "student-target"
    );
    expect(res).toBe("student-target");
  });
});
