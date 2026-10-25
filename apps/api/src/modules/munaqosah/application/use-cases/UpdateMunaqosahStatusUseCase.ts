import type { IMunaqosahRepository } from "../../domain/repositories/IMunaqosahRepository";
import type { INotificationRepository } from "../../../notifications/domain/repositories/INotificationRepository";

export class UpdateMunaqosahStatusUseCase {
  constructor(
    private readonly repo: IMunaqosahRepository,
    private readonly notificationRepo?: INotificationRepository
  ) {}

  async execute(params: {
    id: string;
    schoolId: string;
    status: "diajukan" | "disetujui" | "dijadwalkan" | "lulus" | "tidak_lulus" | "ditolak";
    rejectionNote?: string;
  }) {
    const res = await this.repo.updateRequestStatus(
      params.id,
      params.schoolId,
      params.status,
      params.rejectionNote
    );

    // Kirim notifikasi ke guru pengaju jika permohonan ditolak
    if (params.status === "ditolak" && this.notificationRepo && res?.teacherId) {
      try {
        const noteStr = params.rejectionNote ? `: "${params.rejectionNote}"` : ".";
        await this.notificationRepo.createNotification({
          schoolId: params.schoolId,
          userId: res.teacherId,
          title: "Pengajuan Munaqosah Ditolak",
          message: `Pengajuan munaqosah ${res.studentName} (Juz ${res.juzText}) ditolak oleh Koordinator${noteStr}`,
          type: "munaqosah",
          isRead: false,
        });
      } catch {
        // Notif best-effort
      }
    }
  }
}
