import { describe, it, expect, beforeEach } from "bun:test";

// Mock localStorage in bun test environment
const storage: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, val: string) => {
    storage[key] = String(val);
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    for (const k in storage) delete storage[k];
  },
  length: 0,
  key: () => null,
} as any;

import { api } from "./api";
import { getOfflineQueue, clearOfflineQueue } from "./offlineQueue";

describe("ApiClient Offline Cache & Queue Mechanism", () => {
  beforeEach(() => {
    localStorage.clear();
    clearOfflineQueue();
  });

  it("should return cached data when network fails on GET request", async () => {
    const fakeData = { level: 3, totalExp: 250, currentStreak: 5 };
    const user = { id: "student-123", schoolId: "school-default-id" };
    localStorage.setItem("muhsin-auth", JSON.stringify({ state: { user } }));
    
    // Seed offline cache manually
    const cacheKey = "muhsin_offline_get_school-default-id_student-123_/dashboard/summary";
    localStorage.setItem(cacheKey, JSON.stringify({ data: fakeData, cachedAt: Date.now() }));

    const result = await api.getDashboardSummary();
    expect(result).toEqual(fakeData);
  });

  it("should enqueue mutation and update local cache when submitting daily ibadah offline", async () => {
    const user = { id: "student-123", schoolId: "school-default-id" };
    localStorage.setItem("muhsin-auth", JSON.stringify({ state: { user } }));

    const payload = {
      date: "2026-09-02",
      sholatFardhu: { subuh: "jamaah_masjid" } as any,
      sholatRawatib: ["qobliyah_subuh"],
      tahajud: true,
      dhuha: true,
      puasaSunnah: null,
      tilawah: null,
    };

    const res = await api.submitDailyIbadah(payload);
    expect(res.offlineQueued).toBe(true);

    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].endpoint).toBe("/daily-ibadah/submit");
    expect(queue[0].body).toEqual(payload);

    // Verify GET daily ibadah returns cached submitted data
    const cached = await api.getDailyIbadah("2026-09-02");
    expect(cached.status).toBe("submitted");
    expect(cached.tahajud).toBe(true);
  });
});
