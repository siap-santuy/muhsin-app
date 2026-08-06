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