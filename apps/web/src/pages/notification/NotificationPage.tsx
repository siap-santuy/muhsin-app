import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CheckCheck,
  HeartHandshake,
  Info,
} from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { KoorShell } from "@/components/layout/KoorShell";
import { useAuthStore } from "@/store/authStore";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "yaumiyah" | "setoran" | "system" | "raport";
}

export function NotificationPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "student";

  const initialItems: NotificationItem[] = [
    {
      id: "1",
      title: "Pengingat Ibadah Yaumiyah",
      message: "Jangan lupa untuk mengisi jurnal ibadah harian hari ini sebelum pukul 21.00 WIB.",
      time: "Hari ini",
      read: false,
      type: "yaumiyah",
    },
    {
      id: "2",
      title: "Sistem Terhubung ke Database PostgreSQL",
      message: "Seluruh pencatatan setoran & ibadah yaumiyah kini tersimpan secara real-time dan aman.",
      time: "1 jam lalu",
      read: false,
      type: "system",
    },
    {
      id: "3",
      title: "Periode Akademik Aktif",
      message: "Tahun ajaran 2026/2027 semester ganjil aktif.",
      time: "1 hari lalu",
      read: true,
      type: "raport",
    },
  ];

  const [notifications, setNotifications] = useState<NotificationItem[]>(initialItems);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const content = (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-brand-text-muted">
          {unreadCount > 0
            ? `${unreadCount} notifikasi belum dibaca`
            : "Semua notifikasi sudah dibaca"}
        </p>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs font-bold text-brand-cyan hover:underline"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {notifications.map((item) => {
          const Icon =
            item.type === "yaumiyah"
              ? HeartHandshake
              : item.type === "setoran"
              ? BookOpen
              : item.type === "raport"
              ? Bell
              : Info;

          const iconColor =
            item.type === "yaumiyah"
              ? "bg-purple-50 text-purple-600"
              : item.type === "setoran"
              ? "bg-cyan-50 text-brand-cyan"
              : item.type === "raport"
              ? "bg-amber-50 text-amber-600"
              : "bg-gray-100 text-gray-600";

          return (
            <div
              key={item.id}
              onClick={() => markAsRead(item.id)}
              className={`flex items-start gap-3 rounded-2xl border p-4 shadow-sm transition-all cursor-pointer ${
                item.read
                  ? "border-brand-line bg-white"
                  : "border-brand-cyan/40 bg-cyan-50/20"
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconColor}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-brand-navy">{item.title}</h3>
                  <span className="text-[10px] text-brand-text-muted">{item.time}</span>
                </div>
                <p className="mt-1 text-xs text-brand-navy/80 leading-relaxed">{item.message}</p>
              </div>
              {!item.read && (
                <span className="h-2 w-2 rounded-full bg-brand-cyan shrink-0 mt-1" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (role === "koordinator_ttq") {
    return (
      <KoorShell
        activePath="notifications"
        title="Pusat Notifikasi"
        subtitle="Notifikasi & Informasi Sistem"
      >
        {content}
      </KoorShell>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      {/* Mobile / Student / Teacher / Parent Top Header */}
      <div className="shrink-0 flex items-center justify-between bg-brand-page px-4 py-3">
        <button
          type="button"
          onClick={() => (window.location.hash = "#/dashboard")}
          aria-label="Kembali"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-cyan/10"
        >
          <ArrowLeft className="h-4 w-4 text-brand-cyan" />
        </button>
        <h1 className="text-xl font-bold text-brand-cyan">Notifikasi</h1>
        <div className="h-10 w-10" />
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-1">
        {content}
      </main>

      <BottomNav activeIndex={0} />
    </div>
  );
}
