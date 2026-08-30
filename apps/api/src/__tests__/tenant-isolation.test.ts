import { describe, it, expect } from "vitest";
import { createApp } from "../bootstrap/container";
import { TokenService } from "../modules/auth/application/services/TokenService";

const tokenService = new TokenService(
  "access-secret-test-0123456789",
  "refresh-secret-test-0123456789",
  900,
  604800
);

const app = createApp({
  loginUseCase: {} as never,
  refreshTokenUseCase: {} as never,
  getProfileUseCase: {
    execute: async (userId: string, schoolId: string) => ({
      id: userId,
      schoolId,
      role: "teacher",
      name: "Test",
      email: "test@test.com",
      phone: null,
      createdAt: new Date().toISOString(),
    }),
  } as never,
  updateProfileUseCase: {} as never,
  changePasswordUseCase: {} as never,
  tokenService,
  dailyIbadahRepo: {} as never,
  submitDailyIbadahUseCase: {} as never,
  saveDraftDailyIbadahUseCase: {} as never,
  getGamificationSummaryUseCase: {} as never,
  createSetoranUseCase: {} as never,
  getStudentsUseCase: {} as never,
  getStudentByIdUseCase: {} as never,
  getTeachersUseCase: {} as never,
  getSetoranHistoryUseCase: {} as never,
  getSetoranByIdUseCase: {} as never,
  getAssessmentCategoriesUseCase: {} as never,
});

async function signToken(userId: string, schoolId: string, role: string) {
  return tokenService.signAccessToken({ id: userId, schoolId, role });
}

describe("tenant isolation", () => {
  it("rejects request without token (401)", async () => {
    const res = await app.request("/users/me", { method: "GET" });
    expect(res.status).toBe(401);
  });

  it("accepts request when school_id matches token (200)", async () => {
    const token = await signToken("user-1", "school-1", "teacher");
    const res = await app.request("/users/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { schoolId: string } };
    expect(body.data.schoolId).toBe("school-1");
  });

  it("rejects cross-tenant request via X-School-Id header (403)", async () => {
    const token = await signToken("user-1", "school-1", "teacher");
    const res = await app.request("/users/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-School-Id": "school-2",
      },
    });
    expect(res.status).toBe(403);
  });

  it("rejects cross-tenant request via schoolId query param (403)", async () => {
    const token = await signToken("user-1", "school-1", "teacher");
    const res = await app.request("/users/me?schoolId=school-2", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });
});
