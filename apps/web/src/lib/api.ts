import type {
  LoginInput,
  LoginOutput,
  GamificationSummary,
  DailyIbadahInput,
  CreateSetoranInput,
  UpdateProfileInput,
  ChangePasswordInput,
  UserProfile,
} from "@muhsin/shared";

export const API_BASE = import.meta.env.VITE_API_URL || "/api";
export const SCHOOL_ID = import.meta.env.VITE_SCHOOL_ID || "school-default-id";

export async function post<T>(endpoint: string, body: any): Promise<T> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "Request failed");
  return json.data;
}

export async function get<T>(endpoint: string): Promise<T> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "Request failed");
  return json.data;
}

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem("access_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async login(input: LoginInput): Promise<LoginOutput> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Login gagal");
    return json.data;
  }

  async getGamificationSummary(studentId?: string): Promise<GamificationSummary> {
    const url = studentId
      ? `${API_BASE}/gamification/summary?studentId=${studentId}`
      : `${API_BASE}/gamification/summary`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mengambil data gamifikasi");
    return json.data;
  }

  async getDailyIbadah(date: string) {
    const res = await fetch(`${API_BASE}/daily-ibadah?date=${date}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mengambil data ibadah");
    return json.data;
  }

  async saveDailyIbadahDraft(input: DailyIbadahInput) {
    const res = await fetch(`${API_BASE}/daily-ibadah/draft`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal menyimpan draft");
    return json.data;
  }

  async submitDailyIbadah(input: DailyIbadahInput) {
    const res = await fetch(`${API_BASE}/daily-ibadah/submit`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mengirim ibadah");
    return json.data;
  }

  async createSetoran(input: CreateSetoranInput) {
    const res = await fetch(`${API_BASE}/setoran`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mencatat setoran");
    return json.data;
  }

  async getMyProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/users/me`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mengambil profil");
    return json.data;
  }

  async updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal memperbarui profil");
    return json.data;
  }

  async changePassword(input: ChangePasswordInput): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/users/change-password`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mengubah password");
    return json.data;
  }
}

export const api = new ApiClient();
