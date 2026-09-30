export interface OfflineQueueItem {
  id: string;
  endpoint: string;
  method: "POST" | "PATCH" | "PUT" | "DELETE";
  body: any;
  createdAt: number;
  schoolId: string;
  userId: string;
  retryCount?: number;
}

const OFFLINE_QUEUE_KEY = "muhsin_offline_sync_queue";

// TTL maksimal 48 jam (sesuai window H & H-1 mutaba'ah)
export const MAX_QUEUE_AGE_MS = 48 * 60 * 60 * 1000;
export const MAX_RETRIES = 3;

export function getOfflineQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const list: OfflineQueueItem[] = JSON.parse(raw);
    const now = Date.now();

    // Auto-purge item kadaluwarsa (> 48 jam) atau melewati batas retry
    const valid = list.filter((item) => {
      const isExpired = now - item.createdAt > MAX_QUEUE_AGE_MS;
      const isExceeded = (item.retryCount ?? 0) >= MAX_RETRIES;
      return !isExpired && !isExceeded;
    });

    if (valid.length !== list.length) {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(valid));
    }
    return valid;
  } catch {
    return [];
  }
}

export function addToOfflineQueue(item: Omit<OfflineQueueItem, "id" | "createdAt">): OfflineQueueItem {
  const queue = getOfflineQueue();
  const newItem: OfflineQueueItem = {
    ...item,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    retryCount: 0,
  };
  queue.push(newItem);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  return newItem;
}

export function removeFromOfflineQueue(id: string): void {
  const queue = getOfflineQueue();
  const next = queue.filter((item) => item.id !== id);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(next));
}

export function incrementRetryCount(id: string): void {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return;
    const list: OfflineQueueItem[] = JSON.parse(raw);
    const next = list
      .map((item) => {
        if (item.id === id) {
          const retries = (item.retryCount ?? 0) + 1;
          return { ...item, retryCount: retries };
        }
        return item;
      })
      .filter((item) => (item.retryCount ?? 0) < MAX_RETRIES);

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors
  }
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}
