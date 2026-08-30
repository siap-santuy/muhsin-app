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

  async getDailyIbadah(date: string, studentId?: string) {
    const url = studentId
      ? `${API_BASE}/daily-ibadah?date=${date}&studentId=${studentId}`
      : `${API_BASE}/daily-ibadah?date=${date}`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mengambil data ibadah");
    return json.data;
  }

  async getDailyIbadahHistory(params: { studentId?: string; month?: string } = {}) {
    const query = new URLSearchParams();
    if (params.studentId) query.set("studentId", params.studentId);
    if (params.month) query.set("month", params.month);

    const res = await fetch(`${API_BASE}/daily-ibadah/history?${query.toString()}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mengambil riwayat ibadah");
    return json.data;
  }

  async getDailyIbadahStats(params: { studentId?: string; month?: string } = {}) {
    const query = new URLSearchParams();
    if (params.studentId) query.set("studentId", params.studentId);
    if (params.month) query.set("month", params.month);

    const res = await fetch(`${API_BASE}/daily-ibadah/stats?${query.toString()}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mengambil statistik ibadah");
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

  async getAssessmentCategories(): Promise<Array<{
    id: string;
    categoryId: string;
    categoryCode: string;
    categoryName: string;
    code: string;
    name: string;
    scoreFields: Array<{ key: string; label: string; min: number; max: number }>;
    referenceShape: Record<string, any> | null;
  }>> {
    const res = await fetch(`${API_BASE}/setoran/categories`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mengambil kategori penilaian");
    return json.data;
  }

  async getSetoranHistory(params: {
    studentId?: string;
    subcategoryId?: string;
    month?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.studentId) query.set("studentId", params.studentId);
    if (params.subcategoryId) query.set("subcategoryId", params.subcategoryId);
    if (params.month) query.set("month", params.month);

    const res = await fetch(`${API_BASE}/setoran/history?${query.toString()}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mengambil riwayat setoran");
    return json.data;
  }

  async getSetoranById(id: string) {
    const res = await fetch(`${API_BASE}/setoran/${id}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mengambil detail setoran");
    return json.data;
  }

  async getMonthlyRaport(params: { studentId?: string; month?: string } = {}) {
    const query = new URLSearchParams();
    if (params.studentId) query.set("studentId", params.studentId);
    if (params.month) query.set("month", params.month);

    const res = await fetch(`${API_BASE}/raport/monthly?${query.toString()}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mengambil raport bulanan");
    return json.data;
  }

  async getSemesterRaport(params: { studentId?: string; semester?: string; tahunAjaran?: string } = {}) {
    const query = new URLSearchParams();
    if (params.studentId) query.set("studentId", params.studentId);
    if (params.semester) query.set("semester", params.semester);
    if (params.tahunAjaran) query.set("tahunAjaran", params.tahunAjaran);

    const res = await fetch(`${API_BASE}/raport/semester?${query.toString()}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mengambil raport semester");
    return json.data;
  }

  async getDashboardSummary<T = any>(): Promise<T> {
    const res = await fetch(`${API_BASE}/dashboard/summary`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mengambil data dashboard");
    return json.data;
  }

  async getMunaqosahRequests(status?: string) {
    const url = status
      ? `${API_BASE}/munaqosah/requests?status=${status}`
      : `${API_BASE}/munaqosah/requests`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mengambil pengajuan munaqosah");
    return json.data;
  }

  async createMunaqosahRequest(input: { studentId: string; juzKe: number }) {
    const res = await fetch(`${API_BASE}/munaqosah/requests`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal membuat pengajuan munaqosah");
    return json.data;
  }

  async approveMunaqosah(id: string) {
    const res = await fetch(`${API_BASE}/munaqosah/requests/${id}/approve`, {
      method: "PATCH",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal menyetujui munaqosah");
    return json.data;
  }

  async rejectMunaqosah(id: string) {
    const res = await fetch(`${API_BASE}/munaqosah/requests/${id}/reject`, {
      method: "PATCH",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal menolak munaqosah");
    return json.data;
  }

  async scheduleMunaqosah(id: string, input: {
    periodId: string;
    examinerTeacherId: string;
    jadwalTanggal: string;
    jadwalWaktu?: string;
  }) {
    const res = await fetch(`${API_BASE}/munaqosah/requests/${id}/schedule`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal menjadwalkan munaqosah");
    return json.data;
  }

  async submitMunaqosahResult(assignmentId: string, input: {
    scores: Record<string, number>;
    hasil: "lulus" | "tidak_lulus";
    catatanPenguji?: string;
  }) {
    const res = await fetch(`${API_BASE}/munaqosah/assignments/${assignmentId}/result`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal menyimpan hasil munaqosah");
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

  async getStudents(teacherId?: string): Promise<Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    className: string | null;
    classId: string | null;
    level: number;
    totalExp: number;
    currentStreak: number;
  }>> {
    const url = teacherId
      ? `${API_BASE}/students?teacherId=${teacherId}`
      : `${API_BASE}/students`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mengambil daftar siswa");
    return json.data;
  }

  async getStudentById(id: string) {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mengambil data siswa");
    return json.data;
  }

  async getTeachers(): Promise<Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    classes: Array<{ id: string; name: string }>;
    studentCount: number;
  }>> {
    const res = await fetch(`${API_BASE}/teachers`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gagal mengambil daftar guru");
    return json.data;
  }
}

export const api = new ApiClient();
