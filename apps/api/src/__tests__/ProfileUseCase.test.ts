import { describe, it, expect } from "vitest";
import { GetProfileUseCase } from "../modules/auth/application/use-cases/GetProfileUseCase";
import { UpdateProfileUseCase } from "../modules/auth/application/use-cases/UpdateProfileUseCase";
import { ChangePasswordUseCase } from "../modules/auth/application/use-cases/ChangePasswordUseCase";
import { PasswordHasher } from "../modules/auth/application/services/PasswordHasher";
import {
  UserNotFoundError,
  WrongPasswordError,
  EmailAlreadyUsedError,
} from "../modules/auth/domain/errors/AuthErrors";
import type { IUserRepository, UpdateUserData } from "../modules/auth/domain/repositories/IUserRepository";
import type { User } from "../modules/auth/domain/entities/User";

const hasher = new PasswordHasher();

function makeMockUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-123",
    schoolId: "school-1",
    role: "student",
    name: "Ahmad Siswa",
    username: "ahmadsiswa",
    email: "ahmad@sekolah.sch.id",
    passwordHash: "",
    phone: "08123456789",
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("Profile UseCases", () => {
  it("GetProfileUseCase returns sanitized profile", async () => {
    const user = makeMockUser();
    const userRepo: IUserRepository = {
      findByEmail: async () => null,
      findByIdentifier: async () => null,
      findById: async (id, schoolId) =>
        id === user.id && schoolId === user.schoolId ? user : null,
      updateProfile: async () => user,
      updatePasswordHash: async () => {},
    };

    const useCase = new GetProfileUseCase(userRepo);
    const result = await useCase.execute("user-123", "school-1");

    expect(result.id).toBe("user-123");
    expect(result.name).toBe("Ahmad Siswa");
    expect(result.email).toBe("ahmad@sekolah.sch.id");
    expect(result.username).toBe("ahmadsiswa");
    expect((result as any).passwordHash).toBeUndefined();
  });

  it("GetProfileUseCase throws UserNotFoundError when user not found", async () => {
    const userRepo: IUserRepository = {
      findByEmail: async () => null,
      findByIdentifier: async () => null,
      findById: async () => null,
      updateProfile: async () => makeMockUser(),
      updatePasswordHash: async () => {},
    };

    const useCase = new GetProfileUseCase(userRepo);
    await expect(useCase.execute("bad-id", "school-1")).rejects.toThrow(
      UserNotFoundError
    );
  });

  it("UpdateProfileUseCase updates name, email, phone", async () => {
    let current = makeMockUser();
    const userRepo: IUserRepository = {
      findByEmail: async (email) => (email === current.email ? current : null),
      findByIdentifier: async () => null,
      findById: async (id, schoolId) =>
        id === current.id && schoolId === current.schoolId ? current : null,
      updateProfile: async (_id, _schoolId, data: UpdateUserData) => {
        current = { ...current, ...data };
        return current;
      },
      updatePasswordHash: async () => {},
    };

    const useCase = new UpdateProfileUseCase(userRepo);
    const result = await useCase.execute("user-123", "school-1", {
      name: "Ahmad Baru",
      email: "ahmad.baru@sekolah.sch.id",
      phone: "08999999999",
    });

    expect(result.name).toBe("Ahmad Baru");
    expect(result.email).toBe("ahmad.baru@sekolah.sch.id");
    expect(result.phone).toBe("08999999999");
  });

  it("UpdateProfileUseCase throws EmailAlreadyUsedError if duplicate in same tenant", async () => {
    const existingOther = makeMockUser({
      id: "other-user",
      email: "duplicate@sekolah.sch.id",
    });
    const current = makeMockUser();

    const userRepo: IUserRepository = {
      findByEmail: async (email) =>
        email === existingOther.email ? existingOther : null,
      findByIdentifier: async () => null,
      findById: async () => current,
      updateProfile: async () => current,
      updatePasswordHash: async () => {},
    };

    const useCase = new UpdateProfileUseCase(userRepo);
    await expect(
      useCase.execute("user-123", "school-1", {
        name: "Test",
        email: "duplicate@sekolah.sch.id",
      })
    ).rejects.toThrow(EmailAlreadyUsedError);
  });

  it("ChangePasswordUseCase verifies old password and updates hash", async () => {
    const current = makeMockUser({
      passwordHash: await hasher.hashPassword("oldpassword123"),
    });
    let updatedHash = "";

    const userRepo: IUserRepository = {
      findByEmail: async () => null,
      findByIdentifier: async () => null,
      findById: async () => current,
      updateProfile: async () => current,
      updatePasswordHash: async (_id, _schoolId, hash) => {
        updatedHash = hash;
      },
    };

    const useCase = new ChangePasswordUseCase(userRepo, hasher);
    await useCase.execute("user-123", "school-1", {
      currentPassword: "oldpassword123",
      newPassword: "newpassword456",
    });

    expect(updatedHash).toBeTruthy();
    expect(await hasher.verifyPassword("newpassword456", updatedHash)).toBe(true);
  });

  it("ChangePasswordUseCase throws WrongPasswordError on incorrect current password", async () => {
    const current = makeMockUser({
      passwordHash: await hasher.hashPassword("correctpass123"),
    });

    const userRepo: IUserRepository = {
      findByEmail: async () => null,
      findByIdentifier: async () => null,
      findById: async () => current,
      updateProfile: async () => current,
      updatePasswordHash: async () => {},
    };

    const useCase = new ChangePasswordUseCase(userRepo, hasher);
    await expect(
      useCase.execute("user-123", "school-1", {
        currentPassword: "wrongpassword",
        newPassword: "newpassword456",
      })
    ).rejects.toThrow(WrongPasswordError);
  });
});
