import { create } from "zustand";
import { api } from "@/lib/api";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "yaumiyah" | "setoran" | "system" | "raport" | "munaqosah";
}

interface NotificationState {
  notifications: NotificationItem[];
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const data = await api.getNotifications();
      if (Array.isArray(data)) {
        set({ notifications: data });
      }
    } catch {
      // Keep existing
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (id: string) => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
    try {
      await api.markNotificationRead(id);
    } catch {
      // Revert if needed
    }
  },

  markAllRead: async () => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
    try {
      await api.markAllNotificationsRead();
    } catch {
      // Revert if needed
    }
  },
}));
