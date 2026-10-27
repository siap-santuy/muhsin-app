import { describe, it, expect, vi } from "vitest";
import { assertYaumiyahGrantDatePolicy } from "../modules/daily-ibadah/domain/services/YaumiyahAccessPolicy";
import { GrantYaumiyahAccessUseCase } from "../modules/daily-ibadah/application/use-cases/GrantYaumiyahAccessUseCase";
import { GrantBulkYaumiyahAccessUseCase } from "../modules/daily-ibadah/application/use-cases/GrantBulkYaumiyahAccessUseCase";
import { ApproveYaumiyahAccessUseCase } from "../modules/daily-ibadah/application/use-cases/ApproveYaumiyahAccessUseCase";
import { RejectYaumiyahAccessUseCase } from "../modules/daily-ibadah/application/use-cases/RejectYaumiyahAccessUseCase";
import type { IYaumiyahAccessRequestRepository } from "../modules/daily-ibadah/domain/repositories/IYaumiyahAccessRequestRepository";
import type { INotificationRepository } from "../modules/notifications/domain/repositories/INotificationRepository";
import type { SendPushToUserUseCase } from "../modules/notifications/application/use-cases/SendPushToUserUseCase";

describe("Yaumiyah Access Date Policy & Role Permissions", () => {
  const refDate = new Date("2026-10-27T10:00:00Z");

  it("assertYaumiyahGrantDatePolicy: tolak jika startDate > endDate", () => {
    expect(() =>
      assertYaumiyahGrantDatePolicy("teacher", "2026-10-25", "2026-10-20", refDate)
    ).toThrow("Tanggal awal tidak boleh lebih besar dari tanggal akhir");
  });

  it("assertYaumiyahGrantDatePolicy: guru boleh membuka tanggal di bulan berjalan (2026-10)", () => {
    expect(() =>
      assertYaumiyahGrantDatePolicy("teacher", "2026-10-05", "2026-10-10", refDate)
    ).not.toThrow();
  });

  it("assertYaumiyahGrantDatePolicy: guru DITOLAK membuka tanggal di bulan lalu (2026-09)", () => {
    expect(() =>
      assertYaumiyahGrantDatePolicy("teacher", "2026-09-20", "2026-09-25", refDate)
    ).toThrow("Guru hanya dapat membuka akses yaumiyah untuk tanggal di bulan berjalan");
  });

  it("assertYaumiyahGrantDatePolicy: koordinator TTQ BEBAS membuka tanggal kapan pun di masa lampau", () => {
    expect(() =>
      assertYaumiyahGrantDatePolicy("koordinator_ttq", "2026-08-01", "2026-08-10", refDate)
    ).not.toThrow();
  });

  it("assertYaumiyahGrantDatePolicy: tolak tanggal masa depan (> hari ini) baik untuk guru maupun koor", () => {
    expect(() =>
      assertYaumiyahGrantDatePolicy("teacher", "2026-10-27", "2026-10-28", refDate)
    ).toThrow("Tidak dapat membuka akses susulan untuk tanggal masa depan");

    expect(() =>
      assertYaumiyahGrantDatePolicy("koordinator_ttq", "2026-10-27", "2026-10-29", refDate)
    ).toThrow("Tidak dapat membuka akses susulan untuk tanggal masa depan");
  });
});

describe("GrantYaumiyahAccessUseCase & GrantBulkYaumiyahAccessUseCase", () => {
  const refDate = new Date("2026-10-27T10:00:00Z");

  const createMockRepo = (assignedStudentIds = ["stu-1", "stu-2"]): IYaumiyahAccessRequestRepository => ({
    create: vi.fn().mockImplementation(async (e) => e),
    createBulk: vi.fn().mockImplementation(async (entities) => entities),
    findById: vi.fn(),
    findActiveApproved: vi.fn(),
    findPendingOverlap: vi.fn(),
    listByStudent: vi.fn().mockResolvedValue([]),
    listPendingBySchool: vi.fn().mockResolvedValue([]),
    listPaginated: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 }),
    update: vi.fn().mockImplementation(async (e) => e),
    isStudentAssignedToTeacher: vi.fn(async (stuId: string) => assignedStudentIds.includes(stuId)),
    filterStudentsAssignedToTeacher: vi.fn(async (ids: string[]) => ids.filter((id) => assignedStudentIds.includes(id))),
  });

  const mockNotifRepo: INotificationRepository = {
    createNotification: vi.fn().mockResolvedValue({} as any),
    getUserNotifications: vi.fn().mockResolvedValue([]),
    markAsRead: vi.fn().mockResolvedValue(undefined),
    markAllAsRead: vi.fn().mockResolvedValue(undefined),
    seedInitialNotifications: vi.fn().mockResolvedValue([]),
  };

  const mockPushUseCase = {
    execute: vi.fn().mockResolvedValue({ sent: 1, removed: 0 }),
  } as unknown as SendPushToUserUseCase;

  it("GrantYaumiyahAccessUseCase: guru ditolak jika membuka untuk santri di luar kelas binaan", async () => {
    const repo = createMockRepo(["stu-1"]);
    const uc = new GrantYaumiyahAccessUseCase(repo, mockNotifRepo, mockPushUseCase);

    await expect(
      uc.execute({
        schoolId: "sch-1",
        studentId: "stu-other",
        startDate: "2026-10-10",
        endDate: "2026-10-12",
        granterId: "tch-1",
        granterRole: "teacher",
        todayDate: refDate,
      })
    ).rejects.toThrow("Guru hanya dapat membuka akses untuk santri di kelas binaan");
  });

  it("GrantYaumiyahAccessUseCase: guru ditolak jika tanggal di bulan lalu", async () => {
    const repo = createMockRepo(["stu-1"]);
    const uc = new GrantYaumiyahAccessUseCase(repo, mockNotifRepo, mockPushUseCase);

    await expect(
      uc.execute({
        schoolId: "sch-1",
        studentId: "stu-1",
        startDate: "2026-09-10",
        endDate: "2026-09-12",
        granterId: "tch-1",
        granterRole: "teacher",
        todayDate: refDate,
      })
    ).rejects.toThrow("Guru hanya dapat membuka akses yaumiyah untuk tanggal di bulan berjalan");
  });

  it("GrantYaumiyahAccessUseCase: sukses membuka akses & mengirim notif serta push ke santri", async () => {
    const repo = createMockRepo(["stu-1"]);
    const uc = new GrantYaumiyahAccessUseCase(repo, mockNotifRepo, mockPushUseCase);

    const result = await uc.execute({
      schoolId: "sch-1",
      studentId: "stu-1",
      startDate: "2026-10-10",
      endDate: "2026-10-12",
      granterId: "tch-1",
      granterRole: "teacher",
      todayDate: refDate,
    });

    expect(result.status).toBe("approved");
    expect(result.isDirectGrant).toBe(true);
    expect(mockNotifRepo.createNotification).toHaveBeenCalled();
    expect(mockPushUseCase.execute).toHaveBeenCalled();
  });

  it("GrantBulkYaumiyahAccessUseCase: membuka akses banyak santri sekaligus", async () => {
    const repo = createMockRepo(["stu-1", "stu-2", "stu-3"]);
    const uc = new GrantBulkYaumiyahAccessUseCase(repo, mockNotifRepo, mockPushUseCase);

    const res = await uc.execute({
      schoolId: "sch-1",
      studentIds: ["stu-1", "stu-2"],
      startDate: "2026-10-15",
      endDate: "2026-10-17",
      reason: "Dispensasi Mukhoyam",
      granterId: "tch-1",
      granterRole: "teacher",
      todayDate: refDate,
    });

    expect(res.count).toBe(2);
    expect(repo.createBulk).toHaveBeenCalled();
  });

  it("GrantBulkYaumiyahAccessUseCase: koordinator bisa membuka akses santri mana pun di bulan lalu", async () => {
    const repo = createMockRepo([]); // Koor tidak dibatasi kelas
    const uc = new GrantBulkYaumiyahAccessUseCase(repo, mockNotifRepo, mockPushUseCase);

    const res = await uc.execute({
      schoolId: "sch-1",
      studentIds: ["stu-x", "stu-y"],
      startDate: "2026-08-01",
      endDate: "2026-08-05",
      reason: "Dispensasi khusus Koordinator",
      granterId: "koor-1",
      granterRole: "koordinator_ttq",
      todayDate: refDate,
    });

    expect(res.count).toBe(2);
  });

  it("GrantBulkYaumiyahAccessUseCase: menolak jika lebih dari 500 santri", async () => {
    const repo = createMockRepo([]);
    const uc = new GrantBulkYaumiyahAccessUseCase(repo, mockNotifRepo, mockPushUseCase);
    const manyIds = Array.from({ length: 501 }, (_, i) => `stu-${i}`);

    await expect(
      uc.execute({
        schoolId: "sch-1",
        studentIds: manyIds,
        startDate: "2026-10-01",
        endDate: "2026-10-05",
        granterId: "koor-1",
        granterRole: "koordinator_ttq",
        todayDate: refDate,
      })
    ).rejects.toThrow("Maksimal 500 santri dalam satu kali pembukaan akses");
  });
});

describe("ApproveYaumiyahAccessUseCase & RejectYaumiyahAccessUseCase", () => {
  const refDate = new Date("2026-10-27T10:00:00Z");

  const pendingRequest = {
    id: "req-1",
    schoolId: "sch-1",
    studentId: "stu-1",
    startDate: "2026-10-10",
    endDate: "2026-10-12",
    reason: "Sakit",
    status: "pending" as const,
    reviewedBy: null,
    reviewedAt: null,
    rejectionNote: null,
    expiresAt: null,
    isDirectGrant: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createMockRepo = (req = pendingRequest, isAssigned = true): IYaumiyahAccessRequestRepository => ({
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(req),
    findActiveApproved: vi.fn(),
    findPendingOverlap: vi.fn(),
    listByStudent: vi.fn().mockResolvedValue([]),
    listPendingBySchool: vi.fn().mockResolvedValue([]),
    listPaginated: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 }),
    update: vi.fn().mockImplementation(async (e) => e),
    isStudentAssignedToTeacher: vi.fn().mockResolvedValue(isAssigned),
  });

  const mockNotifRepo: INotificationRepository = {
    createNotification: vi.fn().mockResolvedValue({} as any),
    getUserNotifications: vi.fn().mockResolvedValue([]),
    markAsRead: vi.fn().mockResolvedValue(undefined),
    markAllAsRead: vi.fn().mockResolvedValue(undefined),
    seedInitialNotifications: vi.fn().mockResolvedValue([]),
  };

  const mockPushUseCase = {
    execute: vi.fn().mockResolvedValue({ sent: 1, removed: 0 }),
  } as unknown as SendPushToUserUseCase;

  it("Approve: guru ditolak jika menyetujui permohonan tanggal bulan lalu", async () => {
    const pastReq = { ...pendingRequest, startDate: "2026-09-10", endDate: "2026-09-12" };
    const repo = createMockRepo(pastReq, true);
    const uc = new ApproveYaumiyahAccessUseCase(repo, mockNotifRepo, mockPushUseCase);

    await expect(
      uc.execute({
        requestId: "req-1",
        schoolId: "sch-1",
        reviewerId: "tch-1",
        reviewerRole: "teacher",
        todayDate: refDate,
      })
    ).rejects.toThrow("Guru hanya dapat membuka akses yaumiyah untuk tanggal di bulan berjalan");
  });

  it("Approve: guru ditolak jika santri bukan kelas binaannya", async () => {
    const repo = createMockRepo(pendingRequest, false);
    const uc = new ApproveYaumiyahAccessUseCase(repo, mockNotifRepo, mockPushUseCase);

    await expect(
      uc.execute({
        requestId: "req-1",
        schoolId: "sch-1",
        reviewerId: "tch-1",
        reviewerRole: "teacher",
        todayDate: refDate,
      })
    ).rejects.toThrow("Guru hanya dapat mengelola permohonan santri di kelas binaan");
  });

  it("Approve: koordinator dapat menyetujui permohonan bulan lalu & kirim notif + push", async () => {
    const pastReq = { ...pendingRequest, startDate: "2026-09-10", endDate: "2026-09-12" };
    const repo = createMockRepo(pastReq, false);
    const uc = new ApproveYaumiyahAccessUseCase(repo, mockNotifRepo, mockPushUseCase);

    const result = await uc.execute({
      requestId: "req-1",
      schoolId: "sch-1",
      reviewerId: "koor-1",
      reviewerRole: "koordinator_ttq",
      todayDate: refDate,
    });

    expect(result.status).toBe("approved");
    expect(mockNotifRepo.createNotification).toHaveBeenCalled();
    expect(mockPushUseCase.execute).toHaveBeenCalled();
  });

  it("Reject: menolak permohonan dengan alasan & kirim notif + push", async () => {
    const repo = createMockRepo(pendingRequest, true);
    const uc = new RejectYaumiyahAccessUseCase(repo, mockNotifRepo, mockPushUseCase);

    const result = await uc.execute({
      requestId: "req-1",
      schoolId: "sch-1",
      reviewerId: "tch-1",
      reviewerRole: "teacher",
      rejectionNote: "Tidak menyertakan surat dokter",
    });

    expect(result.status).toBe("rejected");
    expect(result.rejectionNote).toBe("Tidak menyertakan surat dokter");
    expect(mockNotifRepo.createNotification).toHaveBeenCalled();
    expect(mockPushUseCase.execute).toHaveBeenCalled();
  });
});
