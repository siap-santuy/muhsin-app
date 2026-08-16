import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Check,
  CheckCheck,
  HeartHandshake,
  Info,
} from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuthStore } from "@/store/authStore";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "yaumiyah" | "setoran" | "system" | "raport";
  targetRole?: ("student" | "parent" | "teacher")[];
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "Pengingat Ibadah Yaumiyah",
    message: "Jangan lupa untuk mengisi jurnal ibadah harian hari ini sebelum pukul 21.00 WIB.",
    time: "10 menit yang lalu",
    read: false,
    type: "yaumiyah",
    targetRole: ["student", "parent"],
  },
  {
    id: "2",
    title: "Setoran Ziyadah Terverifikasi",
    message: "Ust. Arai Kurnia telah memverifikasi setoran Al-Baqarah: 1-5 dengan nilai Tajwid 90.",
    time: "2 jam yang lalu",
    read: false,
    type: "setoran",
    targetRole: ["student", "parent"],
  },
  {
    id: "3",
    title: "Catatan Evaluasi Guru Baru",
    message: "Pembimbing menambahkan catatan evaluasi baru pada laporan bulanan Juli 2026.",
    time: "1 hari yang lalu",
    read: true,
    type: "raport",
    targetRole: ["student", "parent"],
  },
  {
    id: "4",
    title: "Belum Mengisi Ibadah Yaumiyah",
    message: "Ananda Fulan belum mengisi catatan ibadah hari ini. Harap ingatkan Ananda.",
    time: "3 jam yang lalu",
    read: false,
    type: "yaumiyah",
    targetRole: ["parent"],
  },
  {
    id: "5",
    title: "Setoran Siswa Belum Diperiksa",
    message: "Ada 3 siswa Halaqah VII Abu Bakar yang belum melakukan setoran hari ini.",
    time: "1 jam yang lalu",
    read: false,
    type: "setoran",
    targetRole: ["teacher"],
  },
  {
    id: "6",
    title: "Pengumuman Jadwal Munaqosah",
    message: "Pendaftaran Munaqosah Gelombang I Semester Ganjil 2026/2027 telah dibuka.",
    time: "2 hari yang lalu",
    read: true,
    type: "system",
    targetRole: ["student", "parent", "teacher"],
  },
];

export function NotificationPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "student";

  const roleFiltered = MOCK_NOTIFICATIONS.filter((n) =>
    !n.targetRole || n.targetRole.includes(role as "student" | "parent" | "teacher")
  );

  const [notifications, setNotifications] = useState<NotificationItem[]>(roleFiltered);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const displayed = notifications.filter((n) => (filter === "unread" ? !n.read : true));
  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleMarkAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function handleToggleRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  }

  function getIcon(type: NotificationItem["type"]) {
    switch (type) {
      case "yaumiyah":
        return <HeartHandshake className="h-4 w-4 text-purple-600" />;
      case "setoran":
        return <BookOpen className="h-4 w-4 text-brand-cyan" />;
      case "raport":
        return <Info className="h-4 w-4 text-emerald-600" />;
      case "system":
      default:
        return <Bell className="h-4 w-4 text-amber-500" />;
    }
  }

  function getIconBg(type: NotificationItem["type"]) {
    switch (type) {
      case "yaumiyah":
        return "bg-purple-50";
      case "setoran":
        return "bg-brand-cyan/10";
      case "raport":
        return "bg-emerald-50";
      case "system":
      default:
        return "bg-amber-50";
    }
  }

  function handleBack() {
    window.location.hash = "#/dashboard";
  }

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      {/* Page Title Bar */}
      <div className="shrink-0 flex items-center justify-between border-b border-brand-line/60 bg-white px-4 py-3 shadow-xs">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Kembali"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-cyan/10"
        >
          <ArrowLeft className="h-4 w-4 text-brand-cyan" />
        </button>
        <div className="text-center">
          <h1 className="text-base font-bold text-brand-navy">Pusat Notifikasi</h1>
          <p className="text-[10px] text-brand-text-muted">
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
          </p>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            title="Tandai semua dibaca"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-brand-navy hover:bg-brand-cyan/10 hover:text-brand-cyan"
          >
            <CheckCheck className="h-4 w-4" />
          </button>
        ) : (
          <div className="h-9 w-9" />
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-3">
        <div className="flex flex-col gap-3">
          {/* Tab Filter */}
          <div className="flex items-center gap-2 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                filter === "all"
                  ? "bg-white text-brand-navy shadow-xs"
                  : "text-brand-text-muted hover:text-brand-navy"
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                filter === "unread"
                  ? "bg-white text-brand-navy shadow-xs"
                  : "text-brand-text-muted hover:text-brand-navy"
              }`}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          {displayed.length === 0 ? (
            <div className="mt-12 flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-cyan/10 text-brand-cyan">
                <Bell className="h-8 w-8" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-brand-navy">Tidak ada notifikasi</h3>
              <p className="mt-1 text-xs text-brand-text-muted">
                {filter === "unread"
                  ? "Semua notifikasi sudah dibaca."
                  : "Belum ada notifikasi baru untuk Anda saat ini."}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayed.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleRead(item.id)}
                  className={`flex cursor-pointer gap-3 rounded-2xl border p-3.5 shadow-xs transition-all ${
                    !item.read
                      ? "border-brand-cyan/40 bg-brand-cyan/5"
                      : "border-brand-line bg-white opacity-80"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${getIconBg(
                      item.type
                    )}`}
                  >
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`text-xs font-bold ${
                          !item.read ? "text-brand-navy" : "text-gray-600"
                        }`}
                      >
                        {item.title}
                      </h4>
                      {!item.read ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-brand-cyan" />
                      ) : (
                        <Check className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-brand-navy/90 leading-snug">
                      {item.message}
                    </p>
                    <span className="mt-1.5 block text-[10px] text-brand-text-muted">
                      {item.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav activeIndex={0} />
    </div>
  );
}
