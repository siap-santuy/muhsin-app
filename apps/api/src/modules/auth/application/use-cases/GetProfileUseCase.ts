import type { IUserRepository } from "../../domain/repositories/IUserRepository";
import { UserNotFoundError } from "../../domain/errors/AuthErrors";

export class GetProfileUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string, schoolId: string) {
    const user = await this.userRepo.findById(userId, schoolId);
    if (!user) throw new UserNotFoundError();

    return {
      id: user.id,
      schoolId: user.schoolId,
      role: user.role,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl ?? null,
      gender: user.gender ?? null,
      birthPlace: user.birthPlace ?? null,
      birthDate: user.birthDate ?? null,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
