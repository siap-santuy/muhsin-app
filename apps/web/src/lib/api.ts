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
import {
  addToOfflineQueue,
  getOfflineQueue,
  removeFromOfflineQueue,
} from "./offlineQueue";

export const API_BASE = import.meta.env.VITE_API_URL || "/api";
export const SCHOOL_ID = import.meta.env.VITE_SCHOOL_ID || "school-default-id";

const GENERIC_ERROR = "Terjadi kesalahan server";
const OFFLINE_CACHE_PREFIX = "muhsin_offline_get_";

function getOfflineCacheKey(endpoint: string): string {
  try {
    const raw = localStorage.getItem("muhsin-auth");
    const user = raw ? JSON.parse(raw)?.state?.user : null;
    const userId = user?.id || "guest";
    const schoolId = user?.schoolId || SCHOOL_ID;
    return `${OFFLINE_CACHE_PREFIX}${schoolId}_${userId}_${endpoint}`;
  } catch {
    return `${OFFLINE_CACHE_PREFIX}${SCHOOL_ID}_guest_${endpoint}`;
  }
}

function saveToOfflineCache(endpoint: string, data: any): void {
  try {
    const key = getOfflineCacheKey(endpoint);
    localStorage.setItem(key, JSON.stringify({ data, cachedAt: Date.now() }));
  } catch {
    // Ignore storage quota errors
  }
}

function getFromOfflineCache<T>(endpoint: string): T | null {
  try {
    const key = getOfflineCacheKey(endpoint);
    const item = localStorage.getItem(key);
    if (!item) return null;
    const parsed = JSON.parse(item);
    return (parsed?.data as T) ?? null;
  } catch {
    return null;
  }
}

function getStoredRefreshToken(): string | null {
  try {
    const raw = localStorage.getItem("muhsin-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.refreshToken || null;
  } catch {
    return null;
  }
}

function handleAuthExpired() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("muhsin-auth");
  if (window.location.hash !== "#/" && window.location.hash !== "") {
    window.location.hash = "#/";
    window.location.reload();
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const rToken = getStoredRefreshToken();
  if (!rToken) {
    handleAuthExpired();
    return null;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rToken }),
      });
      if (!res.ok) {
        handleAuthExpired();
        return null;
      }
      const json = await res.json();
      const newAccessToken = json.data?.accessToken;
      if (newAccessToken) {
        localStorage.setItem("access_token", newAccessToken);
        try {
          const raw = localStorage.getItem("muhsin-auth");
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.state.accessToken = newAccessToken;
            if (json.data?.refreshToken) {
              parsed.state.refreshToken = json.data.refreshToken;
            }
            localStorage.setItem("muhsin-auth", JSON.stringify(parsed));
          }
        } catch {}
        return newAccessToken;
      }
      handleAuthExpired();
      return null;
    } catch {
      handleAuthExpired();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function handleResponse<T = any>(res: Response, retryFn?: (newToken: string) => Promise<Response>): Promise<T> {
  if (res.status === 401) {
    if (retryFn) {
      const newToken = await tryRefreshToken();
      if (newToken) {
        const retryRes = await retryFn(newToken);
        return handleResponse<T>(retryRes);
      }
    } else {
      handleAuthExpired();
    }
  }

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

class ApiClient {
  private async request<T = any>(
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
    endpoint: string,
    body?: any
  ): Promise<T> {
    const isGet = method === "GET";
    const token = localStorage.getItem("access_token");
    const doFetch = (authToken: string | null) =>
      fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

    try {
      const res = await doFetch(token);
      const data = await handleResponse<T>(res, (newToken) => doFetch(newToken));
      if (isGet && data !== undefined) {
        saveToOfflineCache(endpoint, data);
      }
      return data;
    } catch (err) {
      if (isGet) {
        const cached = getFromOfflineCache<T>(endpoint);
        if (cached !== null) {
          return cached;
        }
      }
      throw err;
    }
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
      ? `/gamification/summary?studentId=${studentId}`
      : `/gamification/summary`;
    return this.request<GamificationSummary>("GET", url);
  }

  async getDailyIbadah(date: string, studentId?: string) {
    const url = studentId
      ? `/daily-ibadah?date=${date}&studentId=${studentId}`
      : `/daily-ibadah?date=${date}`;
    return this.request("GET", url);
  }

  async getDailyIbadahHistory(params: { studentId?: string; month?: string } = {}) {
    const query = new URLSearchParams();
    if (params.studentId) query.set("studentId", params.studentId);
    if (params.month) query.set("month", params.month);
    return this.request("GET", `/daily-ibadah/history?${query.toString()}`);
  }

  async getDailyIbadahStats(params: { studentId?: string; month?: string } = {}) {
    const query = new URLSearchParams();
    if (params.studentId) query.set("studentId", params.studentId);
    if (params.month) query.set("month", params.month);
    return this.request("GET", `/daily-ibadah/stats?${query.toString()}`);
  }

  async saveDailyIbadahDraft(input: DailyIbadahInput) {
    try {
      const res = await this.request("POST", `/daily-ibadah/draft`, input);
      // Update local GET cache for this date immediately
      saveToOfflineCache(`/daily-ibadah?date=${input.date}`, {
        status: "draft",
        ...input,
      });
      return res;
    } catch (err) {
      // Offline fallback: queue draft mutation and update local date cache
      const raw = localStorage.getItem("muhsin-auth");
      const user = raw ? JSON.parse(raw)?.state?.user : null;
      addToOfflineQueue({
        endpoint: "/daily-ibadah/draft",
        method: "POST",
        body: input,
        schoolId: user?.schoolId || SCHOOL_ID,
        userId: user?.id || "guest",
      });
      saveToOfflineCache(`/daily-ibadah?date=${input.date}`, {
        status: "draft",
        ...input,
      });
      return { success: true, offlineQueued: true };
    }
  }

  async submitDailyIbadah(input: DailyIbadahInput) {
    try {
      const res = await this.request("POST", `/daily-ibadah/submit`, input);
      saveToOfflineCache(`/daily-ibadah?date=${input.date}`, {
        status: "submitted",
        ...input,
      });
      return res;
    } catch (err) {
      // Offline fallback: queue submission mutation and update local date cache
      const raw = localStorage.getItem("muhsin-auth");
      const user = raw ? JSON.parse(raw)?.state?.user : null;
      addToOfflineQueue({
        endpoint: "/daily-ibadah/submit",
        method: "POST",
        body: input,
        schoolId: user?.schoolId || SCHOOL_ID,
        userId: user?.id || "guest",
      });
      saveToOfflineCache(`/daily-ibadah?date=${input.date}`, {
        status: "submitted",
        ...input,
      });
      return { success: true, offlineQueued: true };
    }
  }

  async createSetoran(input: CreateSetoranInput) {
    try {
      return await this.request("POST", `/setoran`, input);
    } catch (err) {
      const raw = localStorage.getItem("muhsin-auth");
      const user = raw ? JSON.parse(raw)?.state?.user : null;
      addToOfflineQueue({
        endpoint: "/setoran",
        method: "POST",
        body: input,
        schoolId: user?.schoolId || SCHOOL_ID,
        userId: user?.id || "guest",
      });
      return { success: true, offlineQueued: true, id: `offline_${Date.now()}` };
    }
  }

  async processOfflineQueue(): Promise<number> {
    const queue = getOfflineQueue();
    if (queue.length === 0) return 0;
    let processed = 0;
    for (const item of queue) {
      try {
        await this.request(item.method, item.endpoint, item.body);
        removeFromOfflineQueue(item.id);
        processed++;
      } catch {
        // Stop on first failure if offline
        break;
      }
    }
    return processed;
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
    return this.request("GET", `/setoran/categories`);
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
    return this.request("GET", `/setoran/history?${query.toString()}`);
  }

  async getSetoranById(id: string) {
    return this.request("GET", `/setoran/${id}`);
  }

  async getMonthlyRaport(params: { studentId?: string; month?: string } = {}) {
    const query = new URLSearchParams();
    if (params.studentId) query.set("studentId", params.studentId);
    if (params.month) query.set("month", params.month);
    return this.request("GET", `/raport/monthly?${query.toString()}`);
  }

  async getSemesterRaport(params: { studentId?: string; semester?: string; tahunAjaran?: string } = {}) {
    const query = new URLSearchParams();
    if (params.studentId) query.set("studentId", params.studentId);
    if (params.semester) query.set("semester", params.semester);
    if (params.tahunAjaran) query.set("tahunAjaran", params.tahunAjaran);
    return this.request("GET", `/raport/semester?${query.toString()}`);
  }

  async getDashboardSummary<T = any>(): Promise<T> {
    return this.request<T>("GET", `/dashboard/summary`);
  }

  async getMunaqosahRequests(status?: string) {
    const url = status
      ? `/munaqosah/requests?status=${status}`
      : `/munaqosah/requests`;
    return this.request("GET", url);
  }

  async createMunaqosahRequest(input: { studentId: string; juzKe: number }) {
    return this.request("POST", `/munaqosah/requests`, input);
  }

  async approveMunaqosah(id: string) {
    return this.request("PATCH", `/munaqosah/requests/${id}/approve`);
  }

  async rejectMunaqosah(id: string) {
    return this.request("PATCH", `/munaqosah/requests/${id}/reject`);
  }

  async scheduleMunaqosah(id: string, input: {
    periodId: string;
    examinerTeacherId: string;
    jadwalTanggal: string;
    jadwalWaktu?: string;
  }) {
    return this.request("POST", `/munaqosah/requests/${id}/schedule`, input);
  }

  async submitMunaqosahResult(assignmentId: string, input: {
    scores: Record<string, number>;
    hasil: "lulus" | "tidak_lulus";
    catatanPenguji?: string;
  }) {
    return this.request("POST", `/munaqosah/assignments/${assignmentId}/result`, input);
  }

  async getKurikulumCategories() {
    return this.request("GET", `/kurikulum/categories`);
  }

  async getGradingScale() {
    return this.request("GET", `/kurikulum/grading-scale`);
  }

  async createKurikulumCategory(input: { code: string; name: string }) {
    return this.request("POST", `/kurikulum/categories`, input);
  }

  async createKurikulumSubcategory(input: {
    categoryId: string;
    code: string;
    name: string;
    scoreFields: Array<{ key: string; label: string; min: number; max: number }>;
    includeInRanking?: boolean;
  }) {
    return this.request("POST", `/kurikulum/subcategories`, input);
  }

  async getMyProfile(): Promise<UserProfile> {
    return this.request<UserProfile>("GET", `/users/me`);
  }

  async updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
    return this.request<UserProfile>("PATCH", `/users/profile`, input);
  }

  async changePassword(input: ChangePasswordInput): Promise<{ message: string }> {
    return this.request<{ message: string }>("PATCH", `/users/change-password`, input);
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
      ? `/students?teacherId=${teacherId}`
      : `/students`;
    return this.request("GET", url);
  }

  async getStudentById(id: string) {
    return this.request("GET", `/students/${id}`);
  }

  async createStudent(input: {
    name: string;
    email: string;
    phone?: string | null;
    classId?: string | null;
    gender?: "ikhwan" | "akhwat";
    nisn?: string | null;
  }) {
    return this.request("POST", `/students`, input);
  }

  async updateStudent(
    id: string,
    input: {
      name?: string;
      email?: string;
      phone?: string | null;
      classId?: string | null;
      gender?: "ikhwan" | "akhwat";
      nisn?: string | null;
    }
  ) {
    return this.request("PUT", `/students/${id}`, input);
  }

  async deleteStudent(id: string) {
    return this.request("DELETE", `/students/${id}`);
  }

  async getTeachers(): Promise<Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    classes: Array<{ id: string; name: string }>;
    studentCount: number;
  }>> {
    return this.request("GET", `/teachers`);
  }

  async createTeacher(input: {
    name: string;
    email: string;
    phone?: string | null;
    classId?: string | null;
  }) {
    return this.request("POST", `/teachers`, input);
  }

  async updateTeacher(
    id: string,
    input: {
      name?: string;
      email?: string;
      phone?: string | null;
      classId?: string | null;
    }
  ) {
    return this.request("PUT", `/teachers/${id}`, input);
  }

  async deleteTeacher(id: string) {
    return this.request("DELETE", `/teachers/${id}`);
  }

  async createCategory(input: { code: string; name: string; academicPeriodId?: string }) {
    return this.request("POST", `/kurikulum/categories`, input);
  }

  async updateCategory(id: string, input: { code?: string; name?: string }) {
    return this.request("PUT", `/kurikulum/categories/${id}`, input);
  }

  async deleteCategory(id: string) {
    return this.request("DELETE", `/kurikulum/categories/${id}`);
  }

  async createSubcategory(input: {
    categoryId: string;
    code: string;
    name: string;
    scoreFields: Array<{ key: string; label: string; min: number; max: number }>;
    includeInRanking?: boolean;
  }) {
    return this.request("POST", `/kurikulum/subcategories`, input);
  }

  async updateSubcategory(
    id: string,
    input: {
      code?: string;
      name?: string;
      scoreFields?: Array<{ key: string; label: string; min: number; max: number }>;
      includeInRanking?: boolean;
    }
  ) {
    return this.request("PUT", `/kurikulum/subcategories/${id}`, input);
  }

  async deleteSubcategory(id: string) {
    return this.request("DELETE", `/kurikulum/subcategories/${id}`);
  }

  async getNotifications() {
    return this.request("GET", `/notifications`);
  }

  async markNotificationRead(id: string) {
    return this.request("PATCH", `/notifications/${id}/read`);
  }

  async markAllNotificationsRead() {
    return this.request("PATCH", `/notifications/read-all`);
  }
}

export const api = new ApiClient();
