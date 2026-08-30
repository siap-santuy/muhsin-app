import { describe, it, expect, beforeEach } from "vitest";
import { LoginUseCase } from "../modules/auth/application/use-cases/LoginUseCase";
import { TokenService } from "../modules/auth/application/services/TokenService";
import { PasswordHasher } from "../modules/auth/application/services/PasswordHasher";
import { InvalidCredentialsError } from "../modules/auth/domain/errors/AuthErrors";
import type { IUserRepository } from "../modules/auth/domain/repositories/IUserRepository";
import type { ITokenRepository } from "../modules/auth/domain/repositories/ITokenRepository";
import type { User } from "../modules/auth/domain/entities/User";

const hasher = new PasswordHasher();

function makeTokenService() {
  return new TokenService("access-secret-test-0123456789", "refresh-secret-test-0123456789", 900, 604800);
}

function makeDeps(user: User | null) {
  const userRepository: IUserRepository = {
    findByEmail: async () => user,
    findById: async () => user,
    updateProfile: async () => user!,
    updatePasswordHash: async () => {},
  };

  const saved: Array<{ userId: string; hash: string; ttl: number }> = [];
  const tokenRepository: ITokenRepository = {
    saveRefreshToken: async (userId, tokenHash, ttlSeconds) => {
      saved.push({ userId, hash: tokenHash, ttl: ttlSeconds });
    },
    findRefreshToken: async () => null,
    deleteRefreshToken: async () => {},
  };

  const tokenService = makeTokenService();
  const useCase = new LoginUseCase(userRepository, tokenRepository, tokenService, hasher);

  return { useCase, tokenService, tokenRepository, saved };
}

const seededUser: User = {
  id: "user-1",
  schoolId: "school-1",
  role: "koordinator_ttq",
  name: "Koordinator Demo",
  email: "koordinator@demo.sch.id",
  passwordHash: "",
  phone: null,
  createdAt: new Date(),
};

beforeEach(async () => {
  seededUser.passwordHash = await hasher.hashPassword("muhsin123");
});

describe("LoginUseCase", () => {
  it("returns tokens and user on valid credentials", async () => {
    const { useCase, saved } = makeDeps(seededUser);

    const result = await useCase.execute({
      email: "koordinator@demo.sch.id",
      password: "muhsin123",
      schoolId: "school-1",
    });

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.expiresIn).toBe(900);
    expect(result.user).toEqual({
      id: "user-1",
      schoolId: "school-1",
      role: "koordinator_ttq",
      name: "Koordinator Demo",
      email: "koordinator@demo.sch.id",
    });
    expect(saved).toHaveLength(1);
    expect(saved[0].userId).toBe("user-1");
    expect(saved[0].hash).not.toBe(result.refreshToken);
  });

  it("throws InvalidCredentialsError when email not found", async () => {
    const { useCase } = makeDeps(null);

    await expect(
      useCase.execute({
        email: "nonexistent@demo.sch.id",
        password: "muhsin123",
        schoolId: "school-1",
      })
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("throws InvalidCredentialsError on wrong password", async () => {
    const { useCase } = makeDeps(seededUser);

    await expect(
      useCase.execute({
        email: "koordinator@demo.sch.id",
        password: "wrongpass123",
        schoolId: "school-1",
      })
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
