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

const GENERIC_ERROR = "Terjadi kesalahan server";

async function handleResponse<T = any>(res: Response): Promise<T> {
  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new Error(GENERIC_ERROR);
  }
  if (res.ok) return json.data;
  // Expose backend error message for all 4xx client errors (400, 401, 403, 404, 422, etc.)
  if (res.status >= 400 && res.status < 500) {
    throw new Error(json.error?.message || json.message || "Permintaan tidak valid");
  }
  // 500+ server errors
  throw new Error(GENERIC_ERROR);
}

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
  return handleResponse<T>(res);
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
  return handleResponse<T>(res);
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
    return handleResponse<LoginOutput>(res);
  }

  async getGamificationSummary(studentId?: string): Promise<GamificationSummary> {
    const url = studentId
      ? `${API_BASE}/gamification/summary?studentId=${studentId}`
      : `${API_BASE}/gamification/summary`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return handleResponse<GamificationSummary>(res);
  }

  async getDailyIbadah(date: string, studentId?: string) {
    const url = studentId
      ? `${API_BASE}/daily-ibadah?date=${date}&studentId=${studentId}`
      : `${API_BASE}/daily-ibadah?date=${date}`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return handleResponse(res);
  }

  async getDailyIbadahHistory(params: { studentId?: string; month?: string } = {}) {
    const query = new URLSearchParams();
    if (params.studentId) query.set("studentId", params.studentId);
    if (params.month) query.set("month", params.month);

    const res = await fetch(`${API_BASE}/daily-ibadah/history?${query.toString()}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return handleResponse(res);
  }

  async getDailyIbadahStats(params: { studentId?: string; month?: string } = {}) {
    const query = new URLSearchParams();
    if (params.studentId) query.set("studentId", params.studentId);
    if (params.month) query.set("month", params.month);

    const res = await fetch(`${API_BASE}/daily-ibadah/stats?${query.toString()}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return handleResponse(res);
  }

  async saveDailyIbadahDraft(input: DailyIbadahInput) {
    const res = await fetch(`${API_BASE}/daily-ibadah/draft`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });
    return handleResponse(res);
  }

  async submitDailyIbadah(input: DailyIbadahInput) {
    const res = await fetch(`${API_BASE}/daily-ibadah/submit`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });
    return handleResponse(res);
  }

  async createSetoran(input: CreateSetoranInput) {
    const res = await fetch(`${API_BASE}/setoran`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });
    return handleResponse(res);
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
    return handleResponse(res);
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
    return handleResponse(res);
  }

  async getSetoranById(id: string) {
    const res = await fetch(`${API_BASE}/setoran/${id}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return handleResponse(res);
  }

  async getMonthlyRaport(params: { studentId?: string; month?: string } = {}) {
    const query = new URLSearchParams();
    if (params.studentId) query.set("studentId", params.studentId);
    if (params.month) query.set("month", params.month);

    const res = await fetch(`${API_BASE}/raport/monthly?${query.toString()}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return handleResponse(res);
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
    return handleResponse(res);
  }

  async getDashboardSummary<T = any>(): Promise<T> {
    const res = await fetch(`${API_BASE}/dashboard/summary`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return handleResponse<T>(res);
  }

  async getMunaqosahRequests(status?: string) {
    const url = status
      ? `${API_BASE}/munaqosah/requests?status=${status}`
      : `${API_BASE}/munaqosah/requests`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return handleResponse(res);
  }

  async createMunaqosahRequest(input: { studentId: string; juzKe: number }) {
    const res = await fetch(`${API_BASE}/munaqosah/requests`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });
    return handleResponse(res);
  }

  async approveMunaqosah(id: string) {
    const res = await fetch(`${API_BASE}/munaqosah/requests/${id}/approve`, {
      method: "PATCH",
      headers: this.getHeaders(),
    });
    return handleResponse(res);
  }

  async rejectMunaqosah(id: string) {
    const res = await fetch(`${API_BASE}/munaqosah/requests/${id}/reject`, {
      method: "PATCH",
      headers: this.getHeaders(),
    });
    return handleResponse(res);
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
    return handleResponse(res);
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
    return handleResponse(res);
  }

  async getKurikulumCategories() {
    const res = await fetch(`${API_BASE}/kurikulum/categories`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return handleResponse(res);
  }

  async getGradingScale() {
    const res = await fetch(`${API_BASE}/kurikulum/grading-scale`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return handleResponse(res);
  }

  async createKurikulumCategory(input: { code: string; name: string }) {
    const res = await fetch(`${API_BASE}/kurikulum/categories`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });
    return handleResponse(res);
  }

  async createKurikulumSubcategory(input: {
    categoryId: string;
    code: string;
    name: string;
    scoreFields: Array<{ key: string; label: string; min: number; max: number }>;
    includeInRanking?: boolean;
  }) {
    const res = await fetch(`${API_BASE}/kurikulum/subcategories`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });
    return handleResponse(res);
  }

  async getMyProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/users/me`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return handleResponse<UserProfile>(res);
  }

  async updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });
    return handleResponse<UserProfile>(res);
  }

  async changePassword(input: ChangePasswordInput): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/users/change-password`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });
    return handleResponse<{ message: string }>(res);
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
    return handleResponse(res);
  }

  async getStudentById(id: string) {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return handleResponse(res);
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
    return handleResponse(res);
  }

  async getNotifications() {
    const res = await fetch(`${API_BASE}/notifications`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return handleResponse(res);
  }

  async markNotificationRead(id: string) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: "PATCH",
      headers: this.getHeaders(),
    });
    return handleResponse(res);
  }

  async markAllNotificationsRead() {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: "PATCH",
      headers: this.getHeaders(),
    });
    return handleResponse(res);
  }
}

export const api = new ApiClient();
