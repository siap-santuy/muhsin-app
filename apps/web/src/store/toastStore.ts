import { create } from "zustand";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const toast = {
  success: (message: string, duration = 3000) =>
    useToastStore.getState().addToast({ message, variant: "success", duration }),
  error: (message: string, duration = 4000) =>
    useToastStore.getState().addToast({ message, variant: "error", duration }),
  warning: (message: string, duration = 3500) =>
    useToastStore.getState().addToast({ message, variant: "warning", duration }),
  info: (message: string, duration = 3000) =>
    useToastStore.getState().addToast({ message, variant: "info", duration }),
};
