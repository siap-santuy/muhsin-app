import type { IUserRepository } from "../../domain/repositories/IUserRepository";
import type { UpdateProfileInput } from "@muhsin/shared";
import {
  UserNotFoundError,
  EmailAlreadyUsedError,
} from "../../domain/errors/AuthErrors";

export class UpdateProfileUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string, schoolId: string, input: UpdateProfileInput) {
    const user = await this.userRepo.findById(userId, schoolId);
    if (!user) throw new UserNotFoundError();

    // Check email uniqueness if changed
    if (input.email !== user.email) {
      const existing = await this.userRepo.findByEmail(input.email, schoolId);
      if (existing && existing.id !== userId) throw new EmailAlreadyUsedError();
    }

    const updated = await this.userRepo.updateProfile(userId, schoolId, {
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
    });

    return {
      id: updated.id,
      schoolId: updated.schoolId,
      role: updated.role,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
