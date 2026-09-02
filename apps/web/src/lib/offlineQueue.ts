export interface OfflineQueueItem {
  id: string;
  endpoint: string;
  method: "POST" | "PATCH" | "PUT" | "DELETE";
  body: any;
  createdAt: number;
  schoolId: string;
  userId: string;
}

const OFFLINE_QUEUE_KEY = "muhsin_offline_sync_queue";

export function getOfflineQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
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

export function clearOfflineQueue(): void {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}
