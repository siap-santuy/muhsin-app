import { create } from "zustand";
import { persist } from "zustand/middleware";
import { post, SCHOOL_ID } from "@/lib/api";
import type { LoginInput, LoginOutput, AuthUser } from "@muhsin/shared";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      login: async (email, password) => {
        const cleanEmail = email.trim().toLowerCase();

        // Demo Mock Fallbacks (bypasses backend API)
        if (cleanEmail === "student@demo.com" || cleanEmail === "fulan@student.com") {
          set({
            accessToken: "mock-student-access-token",
            refreshToken: "mock-student-refresh-token",
            user: {
              id: "mock-student-id",
              name: "Fulan bin Fulan",
              email: "student@demo.com",
              role: "student",
              schoolId: SCHOOL_ID,
            },
          });
          return;
        }

        if (cleanEmail === "parent@demo.com") {
          set({
            accessToken: "mock-parent-access-token",
            refreshToken: "mock-parent-refresh-token",
            user: {
              id: "mock-parent-id",
              name: "Ummu Fulan",
              email: "parent@demo.com",
              role: "parent",
              schoolId: SCHOOL_ID,
            },
          });
          return;
        }

        if (
          cleanEmail === "teacher@demo.com" ||
          cleanEmail === "ustadz@demo.com" ||
          cleanEmail === "guru@demo.com"
        ) {
          set({
            accessToken: "mock-teacher-access-token",
            refreshToken: "mock-teacher-refresh-token",
            user: {
              id: "mock-teacher-id",
              name: "Ust. Arai Kurnia Ramadhan",
              email: "teacher@demo.com",
              role: "teacher",
              schoolId: SCHOOL_ID,
            },
          });
          return;
        }

        if (
          cleanEmail === "koordinator@demo.com" ||
          cleanEmail === "koordinator@alfitrah.demo" ||
          cleanEmail === "admin@demo.com"
        ) {
          set({
            accessToken: "mock-koordinator-access-token",
            refreshToken: "mock-koordinator-refresh-token",
            user: {
              id: "mock-koordinator-id",
              name: "Ust. Abdullah S.Pd.I",
              email: "koordinator@demo.com",
              role: "koordinator_ttq",
              schoolId: SCHOOL_ID,
            },
          });
          return;
        }

        const input: LoginInput = { email, password, schoolId: SCHOOL_ID };
        const result = await post<LoginOutput>("/auth/login", input);
        set({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        });
      },
      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: "muhsin-auth" }
  )
);