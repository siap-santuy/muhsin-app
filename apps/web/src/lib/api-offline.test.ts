import { describe, it, expect, beforeEach, afterAll, mock } from "bun:test";

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

import { api, ApiHttpError } from "./api";
import {
  getOfflineQueue,
  clearOfflineQueue,
  addToOfflineQueue,
  incrementRetryCount,
  MAX_QUEUE_AGE_MS,
  MAX_RETRIES,
} from "./offlineQueue";

describe("ApiClient Offline Cache & Queue Mechanism", () => {
  const origFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    clearOfflineQueue();
    globalThis.fetch = mock(() => Promise.reject(new TypeError("Failed to fetch")));
  });

  afterAll(() => {
    globalThis.fetch = origFetch;
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

  it("should auto-purge queue items older than 48 hours (TTL)", () => {
    const oldTimestamp = Date.now() - (MAX_QUEUE_AGE_MS + 1000);
    const staleItem = {
      id: "stale-1",
      endpoint: "/setoran",
      method: "POST" as const,
      body: { test: 1 },
      createdAt: oldTimestamp,
      schoolId: "s-1",
      userId: "u-1",
      retryCount: 0,
    };
    const freshItem = {
      id: "fresh-1",
      endpoint: "/setoran",
      method: "POST" as const,
      body: { test: 2 },
      createdAt: Date.now(),
      schoolId: "s-1",
      userId: "u-1",
      retryCount: 0,
    };

    localStorage.setItem("muhsin_offline_sync_queue", JSON.stringify([staleItem, freshItem]));

    const activeQueue = getOfflineQueue();
    expect(activeQueue.length).toBe(1);
    expect(activeQueue[0].id).toBe("fresh-1");
  });

  it("should increment retry count and purge items exceeding MAX_RETRIES (3)", () => {
    addToOfflineQueue({
      endpoint: "/setoran",
      method: "POST",
      body: { data: "test" },
      schoolId: "s-1",
      userId: "u-1",
    });

    let queue = getOfflineQueue();
    const itemId = queue[0].id;

    // Retry 1
    incrementRetryCount(itemId);
    queue = getOfflineQueue();
    expect(queue[0].retryCount).toBe(1);

    // Retry 2
    incrementRetryCount(itemId);
    queue = getOfflineQueue();
    expect(queue[0].retryCount).toBe(2);

    // Retry 3 (exceeds MAX_RETRIES = 3, auto-purged)
    incrementRetryCount(itemId);
    queue = getOfflineQueue();
    expect(queue.length).toBe(0);
  });
});
