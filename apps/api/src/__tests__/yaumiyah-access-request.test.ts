import { describe, it, expect, vi } from "vitest";
import { RequestYaumiyahAccessUseCase } from "../modules/daily-ibadah/application/use-cases/RequestYaumiyahAccessUseCase";
import { ApproveYaumiyahAccessUseCase } from "../modules/daily-ibadah/application/use-cases/ApproveYaumiyahAccessUseCase";
import { RejectYaumiyahAccessUseCase } from "../modules/daily-ibadah/application/use-cases/RejectYaumiyahAccessUseCase";
import { GrantYaumiyahAccessUseCase } from "../modules/daily-ibadah/application/use-cases/GrantYaumiyahAccessUseCase";
import { SubmitDailyIbadahUseCase } from "../modules/daily-ibadah/application/use-cases/SubmitDailyIbadahUseCase";
import { SaveDraftDailyIbadahUseCase } from "../modules/daily-ibadah/application/use-cases/SaveDraftDailyIbadahUseCase";
import type { IYaumiyahAccessRequestRepository } from "../modules/daily-ibadah/domain/repositories/IYaumiyahAccessRequestRepository";
import type { IDailyIbadahRepository } from "../modules/daily-ibadah/domain/repositories/IDailyIbadahRepository";
import type { YaumiyahAccessRequestEntity } from "../modules/daily-ibadah/domain/entities/YaumiyahAccessRequest";

describe("Yaumiyah Access Request Flow & Rules", () => {
  const mockAccessRepo: IYaumiyahAccessRequestRepository = {
    create: vi.fn().mockImplementation(async (e) => e),
    findById: vi.fn(),
    findActiveApproved: vi.fn(),
    findPendingOverlap: vi.fn().mockResolvedValue(null),
    listByStudent: vi.fn().mockResolvedValue([]),
    listPendingBySchool: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockImplementation(async (e) => e),
  };

  it("RequestYaumiyahAccessUseCase: tolak jika tanggal masa depan", async () => {
    const uc = new RequestYaumiyahAccessUseCase(mockAccessRepo);
    await expect(
      uc.execute({
        schoolId: "sch-1",
        studentId: "stu-1",
        startDate: "2026-10-26",
        endDate: "2026-10-26",
        reason: "Sakit demam",
        todayStr: "2026-10-25",
      })
    ).rejects.toThrow("Tidak dapat meminta akses untuk tanggal masa depan");
  });

  it("RequestYaumiyahAccessUseCase: tolak jika masih dalam window H / H-1", async () => {
    const uc = new RequestYaumiyahAccessUseCase(mockAccessRepo);
    await expect(
      uc.execute({
        schoolId: "sch-1",
        studentId: "stu-1",
        startDate: "2026-10-24",
        endDate: "2026-10-25",
        reason: "Lupa kemarin",
        todayStr: "2026-10-25",
      })
    ).rejects.toThrow("Tanggal hari ini dan kemarin dapat langsung diisi tanpa pengajuan akses");
  });

  it("RequestYaumiyahAccessUseCase: tolak jika overlap dengan pending request lain", async () => {
    const repoWithPending: IYaumiyahAccessRequestRepository = {
      ...mockAccessRepo,
      findPendingOverlap: vi.fn().mockResolvedValue({
        id: "req-old",
        startDate: "2026-10-20",
        endDate: "2026-10-22",
      } as any),
    };
    const uc = new RequestYaumiyahAccessUseCase(repoWithPending);
    await expect(
      uc.execute({
        schoolId: "sch-1",
        studentId: "stu-1",
        startDate: "2026-10-21",
        endDate: "2026-10-21",
        reason: "Izin pulang kampung",
        todayStr: "2026-10-25",
      })
    ).rejects.toThrow("Masih ada permohonan akses yang menunggu persetujuan");
  });

  it("RequestYaumiyahAccessUseCase: sukses buat permohonan untuk H-3 (rentang tanggal)", async () => {
    const uc = new RequestYaumiyahAccessUseCase(mockAccessRepo);
    const res = await uc.execute({
      schoolId: "sch-1",
      studentId: "stu-1",
      startDate: "2026-10-20",
      endDate: "2026-10-22",
      reason: "Opname di rumah sakit",
      todayStr: "2026-10-25",
    });

    expect(res.status).toBe("pending");
    expect(res.startDate).toBe("2026-10-20");
    expect(res.endDate).toBe("2026-10-22");
    expect(mockAccessRepo.create).toHaveBeenCalled();
  });

  it("ApproveYaumiyahAccessUseCase: guru/koor berhasil approve dengan expired 24 jam", async () => {
    const pendingReq: YaumiyahAccessRequestEntity = {
      id: "req-1",
      schoolId: "sch-1",
      studentId: "stu-1",
      startDate: "2026-10-20",
      endDate: "2026-10-22",
      reason: "Opname",
      status: "pending",
      isDirectGrant: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const repo: IYaumiyahAccessRequestRepository = {
      ...mockAccessRepo,
      findById: vi.fn().mockResolvedValue(pendingReq),
      update: vi.fn().mockImplementation(async (e) => e),
    };

    const uc = new ApproveYaumiyahAccessUseCase(repo);
    const res = await uc.execute({
      requestId: "req-1",
      schoolId: "sch-1",
      reviewerId: "teacher-1",
      reviewerRole: "teacher",
    });

    expect(res.status).toBe("approved");
    expect(res.reviewedBy).toBe("teacher-1");
    expect(res.expiresAt).toBeDefined();
  });

  it("RejectYaumiyahAccessUseCase: menolak permohonan dengan catatan", async () => {
    const pendingReq: YaumiyahAccessRequestEntity = {
      id: "req-1",
      schoolId: "sch-1",
      studentId: "stu-1",
      startDate: "2026-10-20",
      endDate: "2026-10-22",
      reason: "Males isi",
      status: "pending",
      isDirectGrant: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const repo: IYaumiyahAccessRequestRepository = {
      ...mockAccessRepo,
      findById: vi.fn().mockResolvedValue(pendingReq),
      update: vi.fn().mockImplementation(async (e) => e),
    };

    const uc = new RejectYaumiyahAccessUseCase(repo);
    const res = await uc.execute({
      requestId: "req-1",
      schoolId: "sch-1",
      reviewerId: "koor-1",
      reviewerRole: "koordinator_ttq",
      rejectionNote: "Alasan tidak valid",
    });

    expect(res.status).toBe("rejected");
    expect(res.rejectionNote).toBe("Alasan tidak valid");
  });

  it("GrantYaumiyahAccessUseCase: inisiatif guru/koor buka akses langsung tanpa request siswa", async () => {
    const uc = new GrantYaumiyahAccessUseCase(mockAccessRepo);
    const res = await uc.execute({
      schoolId: "sch-1",
      studentId: "stu-1",
      startDate: "2026-10-18",
      endDate: "2026-10-20",
      reason: "Dispensasi karantina",
      granterId: "teacher-1",
      granterRole: "teacher",
    });

    expect(res.status).toBe("approved");
    expect(res.isDirectGrant).toBe(true);
    expect(res.expiresAt).toBeDefined();
  });

  describe("Submit & SaveDraft with Window & Access Check", () => {
    const mockDailyRepo: IDailyIbadahRepository = {
      findByStudentAndDate: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockImplementation(async (e) => e),
      findByMonth: vi.fn().mockResolvedValue([]),
    };

    const mockAddExp = { execute: vi.fn().mockResolvedValue({}) } as any;
    const mockUpdateStreak = { execute: vi.fn().mockResolvedValue({ currentStreak: 5 }) } as any;

    it("SaveDraft: tolak H-2 jika belum ada approval aktif", async () => {
      const accessRepoNoGrant: IYaumiyahAccessRequestRepository = {
        ...mockAccessRepo,
        findActiveApproved: vi.fn().mockResolvedValue(null),
      };

      const uc = new SaveDraftDailyIbadahUseCase(mockDailyRepo, accessRepoNoGrant);
      await expect(
        uc.execute({
          schoolId: "sch-1",
          studentId: "stu-1",
          date: "2026-10-20", // H-5
          todayStr: "2026-10-25",
        })
      ).rejects.toThrow("Tanggal ini telah terkunci untuk pengisian");
    });

    it("Submit: tolak H-2 jika tidak ada approval", async () => {
      const accessRepoNoGrant: IYaumiyahAccessRequestRepository = {
        ...mockAccessRepo,
        findActiveApproved: vi.fn().mockResolvedValue(null),
      };

      const uc = new SubmitDailyIbadahUseCase(
        mockDailyRepo,
        mockAddExp,
        mockUpdateStreak,
        accessRepoNoGrant
      );

      await expect(
        uc.execute({
          schoolId: "sch-1",
          studentId: "stu-1",
          date: "2026-10-20",
          todayStr: "2026-10-25",
        })
      ).rejects.toThrow("Tanggal ini telah terkunci untuk pengisian");
    });

    it("Submit: izinkan susulan jika ada approval aktif -> EXP bertambah, STREAK dilewati", async () => {
      const accessRepoWithGrant: IYaumiyahAccessRequestRepository = {
        ...mockAccessRepo,
        findActiveApproved: vi.fn().mockResolvedValue({
          id: "grant-1",
          status: "approved",
          expiresAt: new Date(Date.now() + 3600000),
        } as any),
      };

      const uc = new SubmitDailyIbadahUseCase(
        mockDailyRepo,
        mockAddExp,
        mockUpdateStreak,
        accessRepoWithGrant
      );

      const res = await uc.execute({
        schoolId: "sch-1",
        studentId: "stu-1",
        date: "2026-10-20", // Susulan H-5
        todayStr: "2026-10-25",
        sholatFardhu: {
          subuh: "BA",
          dzuhur: "BA",
          ashar: "BA",
          maghrib: "BA",
          isya: "BA",
        },
      });

      expect(res.entity.status).toBe("submitted");
      expect(res.expEarned).toBe(25);
      expect(mockAddExp.execute).toHaveBeenCalled();
      // STREAK TIDAK DIPANGGIL untuk susulan:
      expect(mockUpdateStreak.execute).not.toHaveBeenCalled();
      expect(res.currentStreak).toBe(0);
    });

    it("Submit: pengisian H dan H-1 normal -> EXP bertambah dan STREAK bertambah", async () => {
      mockUpdateStreak.execute.mockClear();
      mockAddExp.execute.mockClear();

      const uc = new SubmitDailyIbadahUseCase(
        mockDailyRepo,
        mockAddExp,
        mockUpdateStreak,
        mockAccessRepo
      );

      const res = await uc.execute({
        schoolId: "sch-1",
        studentId: "stu-1",
        date: "2026-10-24", // H-1 (kemarin)
        todayStr: "2026-10-25",
        sholatFardhu: {
          subuh: "BA",
          dzuhur: "BA",
          ashar: "BA",
          maghrib: "BA",
          isya: "BA",
        },
      });

      expect(res.entity.status).toBe("submitted");
      expect(res.expEarned).toBe(25);
      expect(mockAddExp.execute).toHaveBeenCalled();
      // STREAK DIPANGGIL untuk H & H-1:
      expect(mockUpdateStreak.execute).toHaveBeenCalledTimes(1);
      expect(res.currentStreak).toBe(5);
    });
  });
});
