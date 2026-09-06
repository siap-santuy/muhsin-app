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
      avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : user.avatarUrl,
      gender: input.gender !== undefined ? input.gender : user.gender,
      birthPlace: input.birthPlace !== undefined ? input.birthPlace : user.birthPlace,
      birthDate: input.birthDate !== undefined ? input.birthDate : user.birthDate,
    });

    return {
      id: updated.id,
      schoolId: updated.schoolId,
      role: updated.role,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      avatarUrl: updated.avatarUrl ?? null,
      gender: updated.gender ?? null,
      birthPlace: updated.birthPlace ?? null,
      birthDate: updated.birthDate ?? null,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
