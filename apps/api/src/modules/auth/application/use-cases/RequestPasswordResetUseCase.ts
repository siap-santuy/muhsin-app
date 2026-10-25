import type { IUserRepository } from "../../domain/repositories/IUserRepository";
import type { IPasswordResetRequestRepository } from "../../domain/repositories/IPasswordResetRequestRepository";
import type { INotificationRepository } from "../../../notifications/domain/repositories/INotificationRepository";
import type { SendPushToUserUseCase } from "../../../notifications/application/use-cases/SendPushToUserUseCase";

export interface RequestPasswordResetParams {
  identifier: string;
  schoolId?: string | null;
}

export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly notificationRepo: INotificationRepository,
    private readonly pushToUser?: SendPushToUserUseCase,
    private readonly resetRequestRepo?: IPasswordResetRequestRepository
  ) {}

  async execute(params: RequestPasswordResetParams): Promise<{ success: boolean; message: string }> {
    if (!params.identifier?.trim()) {
      throw new Error("Username atau email wajib diisi");
    }

    const trimmed = params.identifier.trim();
    const user = params.schoolId
      ? await this.userRepo.findByIdentifier(trimmed, params.schoolId)
      : await this.userRepo.findByIdentifierAnySchool(trimmed);

    if (!user) {
      throw new Error("Username atau email tidak valid atau tidak ditemukan. Silakan hubungi admin sekolah.");
    }

    // Catat request ke database jika repository tersedia
    if (this.resetRequestRepo) {
      const existing = await this.resetRequestRepo.findPendingByUserId(user.id, user.schoolId);
      if (!existing) {
        const now = new Date();
        await this.resetRequestRepo.create({
          id: crypto.randomUUID(),
          schoolId: user.schoolId,
          userId: user.id,
          identifier: trimmed,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const koors = await this.userRepo.findKoordinatorBySchool(user.schoolId);
    if (koors.length === 0) {
      return {
        success: true,
        message: "Permintaan reset password tercatat. Silakan hubungi admin sekolah secara langsung.",
      };
    }

    const roleLabel =
      user.role === "teacher"
        ? "Guru"
        : user.role === "parent"
        ? "Orang Tua"
        : "Santri";

    const title = "Permintaan Reset Password";
    const message = `${user.name} (${roleLabel}) mengajukan permohonan reset password.`;

    await Promise.all(
      koors.map(async (koor) => {
        try {
          await this.notificationRepo.createNotification({
            schoolId: user.schoolId,
            userId: koor.id,
            title,
            message,
            type: "system",
            isRead: false,
          });

          if (this.pushToUser) {
            await this.pushToUser.execute({
              userId: koor.id,
              schoolId: user.schoolId,
              payload: {
                title,
                body: message,
                url: "#/dashboard",
              },
            }).catch(() => {});
          }
        } catch {
          // best-effort per koordinator
        }
      })
    );

    return {
      success: true,
      message: "Permintaan reset password berhasil dikirim ke koordinator sekolah.",
    };
  }
}
