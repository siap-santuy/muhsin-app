import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, SCHOOL_ID } from "@/lib/api";
import type { LoginInput, AuthUser } from "@muhsin/shared";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  login: (identifier: string, password: string, schoolId?: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      login: async (identifier, password, schoolId = SCHOOL_ID) => {
        const input: LoginInput = { identifier: identifier.trim(), password, schoolId };
        const result = await api.login(input);
        localStorage.setItem("access_token", result.accessToken);
        set({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        });
      },
      logout: () => {
        localStorage.removeItem("access_token");
        set({ accessToken: null, refreshToken: null, user: null });
      },
    }),
    { name: "muhsin-auth" }
  )
);
