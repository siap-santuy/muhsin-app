import type { IUserRepository } from "../../domain/repositories/IUserRepository";
import type { PasswordHasher } from "../services/PasswordHasher";
import type { ChangePasswordInput } from "@muhsin/shared";
import {
  UserNotFoundError,
  WrongPasswordError,
} from "../../domain/errors/AuthErrors";

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(userId: string, schoolId: string, input: ChangePasswordInput) {
    const user = await this.userRepo.findById(userId, schoolId);
    if (!user) throw new UserNotFoundError();

    const valid = await this.passwordHasher.verifyPassword(
      input.currentPassword,
      user.passwordHash
    );
    if (!valid) throw new WrongPasswordError();

    const newHash = await this.passwordHasher.hashPassword(input.newPassword);
    await this.userRepo.updatePasswordHash(userId, schoolId, newHash);
  }
}
