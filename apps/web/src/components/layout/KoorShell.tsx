import { useState } from "react";
import {
  Award,
  Bell,
  BookOpen,
  CheckCheck,
  GraduationCap,
  HeartHandshake,
  Info,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { getDisplayName } from "@/lib/utils";
import { formatNotificationTime } from "@/utils/date";

interface KoorShellProps {
  children: React.ReactNode;
  activePath: string; // e.g. "dashboard", "students", "teachers", "kurikulum", "munaqosah"
  title?: string;
  subtitle?: string;
}

const NAV_ITEMS = [
  {
    path: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "#/dashboard",
  },
  {
    path: "students",
    label: "Data Siswa",
    icon: Users,
    href: "#/students",
  },
  {
    path: "teachers",
    label: "Data Guru & Bimbingan",
    icon: GraduationCap,
    href: "#/teachers",
  },
  {
    path: "kurikulum",
    label: "Kurikulum & Penilaian",
    icon: BookOpen,
    href: "#/kurikulum",
  },
  {
    path: "munaqosah",
    label: "Approval Munaqosah",
    icon: Award,
    href: "#/munaqosah",
    badgeKey: "munaqosahPending",
  },
  {
    path: "yaumiyah-approval",
    label: "Riwayat Susulan Yaumiyah",
    icon: BookOpen,
    href: "#/yaumiyah-approval",
    badgeKey: "yaumiyahPending",
  },
];

export function KoorShell({
  children,
  activePath,
  title = "Koordinator TTQ",
  subtitle = "SMP Islam Terpadu AL FITRAH",
}: KoorShellProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const notifications = useNotificationStore((s) => s.notifications);
  const loading = useNotificationStore((s) => s.loading);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useState(() => {
    fetchNotifications();
  });

  const userName = getDisplayName(
    user?.name ?? "Ust. Abdullah S.Pd.I",
    user?.gender ?? "",
    "koordinator"
  );
  const [munaqosahPending, setMunaqosahPending] = useState<number | null>(null);
  const [yaumiyahPending, setYaumiyahPending] = useState<number | null>(null);

  useState(() => {
    (async () => {
      try {
        const { api } = await import("@/lib/api");
        const reqs = await api.getMunaqosahRequests("diajukan").catch(() => api.getMunaqosahRequests());
        const pending = Array.isArray(reqs) ? reqs.filter((r: any) => r.status === "diajukan").length : 0;
        setMunaqosahPending(pending);

        const yRes = await api.getYaumiyahAccessRequests({ status: "pending", limit: 1 }).catch(() => null);
        setYaumiyahPending(yRes?.meta?.total ?? null);
      } catch {
        setMunaqosahPending(null);
        setYaumiyahPending(null);
      }
    })();
  });

  function resolveBadge(item: any): string | null {
    if (item.badge) return item.badge;
    if (item.badgeKey === "munaqosahPending") {
      if (munaqosahPending === null || munaqosahPending === 0) return null;
      return String(munaqosahPending);
    }
    if (item.badgeKey === "yaumiyahPending") {
      if (yaumiyahPending === null || yaumiyahPending === 0) return null;
      return String(yaumiyahPending);
    }
    return null;
  }

  const renderNavList = () => (
    <nav className="flex-1 space-y-1 px-3 py-4">
      <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted/60">
        Menu Utama
      </div>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activePath === item.path;
        return (
          <a
            key={item.path}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
              isActive
                ? "bg-brand-navy text-white shadow-sm"
                : "text-brand-navy hover:bg-brand-navy/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={`h-4 w-4 ${
                  isActive ? "text-brand-cyan" : "text-brand-navy/60 group-hover:text-brand-navy"
                }`}
              />
              <span>{item.label}</span>
            </div>
            {resolveBadge(item) ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  isActive
                    ? "bg-brand-amber text-brand-navy"
                    : "bg-brand-amber/20 text-brand-navy"
                }`}
              >
                {resolveBadge(item)}
              </span>
            ) : null}
          </a>
        );
      })}

      <div className="pt-4 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted/60">
        Sistem & Akun
      </div>
      <a
        href="#/edit-profile"
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
          activePath === "settings"
            ? "bg-brand-navy text-white shadow-sm"
            : "text-brand-navy hover:bg-brand-navy/5"
        }`}
      >
        <Settings
          className={`h-4 w-4 ${
            activePath === "settings" ? "text-brand-cyan" : "text-brand-navy/60"
          }`}
        />
        <span>Pengaturan Akun</span>
      </a>
    </nav>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-brand-page">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 flex-col border-r border-brand-line/60 bg-white md:flex">
        {/* Sidebar Header */}
        <div className="flex items-center gap-3 border-b border-brand-line/40 px-5 py-4">
          <img
            src="/brand/TTQ_Logo.png"
            alt="Logo TTQ"
            className="h-10 w-10 object-contain"
          />
          <div>
            <h2 className="text-xs font-extrabold text-brand-navy leading-tight">
              SMP ISLAM TERPADU
            </h2>
            <p className="text-sm font-black text-brand-cyan-dark leading-none">
              AL FITRAH
            </p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-brand-navy/5 px-1.5 py-0.5 text-[9px] font-bold text-brand-navy">
              <ShieldCheck className="h-3 w-3 text-brand-cyan-dark" /> Koordinator TTQ
            </span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        {renderNavList()}

        {/* Sidebar Footer User Info */}
        <div className="border-t border-brand-line/40 p-3">
          <div className="flex items-center justify-between rounded-xl bg-brand-page p-2.5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white text-xs font-extrabold">
                {userName.charAt(0)}
              </div>
              <div className="truncate">
                <p className="truncate text-xs font-bold text-brand-navy">
                  {userName}
                </p>
                <p className="text-[10px] text-brand-text-muted">
                  Koordinator TTQ
                </p>
              </div>
            </div>
            <button
              type="button"
              title="Keluar"
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop & Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-brand-line/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <img
                  src="/brand/TTQ_Logo.png"
                  alt="Logo"
                  className="h-8 w-8 object-contain"
                />
                <span className="text-xs font-black text-brand-navy">
                  AL FITRAH — Koordinator
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1 text-brand-navy hover:bg-brand-navy/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNavList()}
            <div className="border-t border-brand-line/40 p-3">
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-brand-line/60 bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-navy md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-brand-navy leading-tight md:text-lg">
                {title}
              </h1>
              <p className="text-xs text-brand-text-muted">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell Button & Chat-Style Popover Modal */}
            <div className="relative">
              <button
                type="button"
                aria-label="Notifikasi"
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  fetchNotifications();
                }}
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                  notifOpen
                    ? "border-brand-cyan bg-brand-cyan/10 text-brand-cyan"
                    : "border-brand-line/60 bg-white text-brand-navy shadow-sm hover:border-brand-cyan"
                }`}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white shadow-xs">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Chat-Style Notification Modal / Popover */}
              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-2xs"
                    onClick={() => setNotifOpen(false)}
                  />

                  <div className="absolute right-0 top-12 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-3xl border border-brand-line/80 bg-white shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
                    {/* Header Modal */}
                    <div className="flex items-center justify-between border-b border-brand-line/60 bg-gradient-to-r from-brand-navy to-brand-navy/95 px-4 py-3.5 text-white">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-cyan/20 text-brand-cyan">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold leading-tight">Pemberitahuan &amp; Pesan</h3>
                          <p className="text-[10px] text-gray-300">
                            {unreadCount > 0 ? `${unreadCount} pesan belum dibaca` : "Semua pesan telah dibaca"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => markAllRead()}
                            title="Tandai semua dibaca"
                            className="rounded-lg p-1.5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                          >
                            <CheckCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setNotifOpen(false)}
                          className="rounded-lg p-1.5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Body: Chat Bubbles List */}
                    <div className="max-h-[420px] overflow-y-auto p-3 space-y-2.5 bg-gray-50/50">
                      {loading && notifications.length === 0 ? (
                        <div className="flex h-36 items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-brand-cyan" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 mb-2">
                            <Bell className="h-6 w-6" />
                          </div>
                          <p className="text-xs font-bold text-brand-navy">Belum ada notifikasi</p>
                          <p className="text-[11px] text-brand-text-muted mt-0.5">
                            Pemberitahuan munaqosah, yaumiyah, dan sistem akan muncul di sini.
                          </p>
                        </div>
                      ) : (
                        notifications.map((item) => {
                          const isUnread = !item.read;
                          const Icon =
                            item.type === "yaumiyah"
                              ? HeartHandshake
                              : item.type === "munaqosah"
                              ? Award
                              : item.type === "setoran"
                              ? BookOpen
                              : item.title.toLowerCase().includes("password")
                              ? ShieldAlert
                              : Info;

                          const iconBg =
                            item.type === "yaumiyah"
                              ? "bg-amber-100 text-amber-700"
                              : item.type === "munaqosah"
                              ? "bg-purple-100 text-purple-700"
                              : item.type === "setoran"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700";

                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (isUnread) markAsRead(item.id);
                                if (item.type === "yaumiyah" || item.title.toLowerCase().includes("yaumiyah")) {
                                  window.location.hash = "#/yaumiyah-approval";
                                  setNotifOpen(false);
                                } else if (item.type === "munaqosah" || item.title.toLowerCase().includes("munaqosah")) {
                                  window.location.hash = "#/munaqosah";
                                  setNotifOpen(false);
                                } else if (item.title.toLowerCase().includes("password")) {
                                  window.location.hash = "#/dashboard";
                                  setNotifOpen(false);
                                }
                              }}
                              className={`group relative flex items-start gap-2.5 rounded-2xl border p-3 transition-all cursor-pointer ${
                                isUnread
                                  ? "border-brand-cyan/40 bg-cyan-50/50 hover:bg-cyan-50/80 shadow-2xs"
                                  : "border-brand-line/60 bg-white hover:bg-gray-50/80 shadow-2xs"
                              }`}
                            >
                              {/* Chat Avatar / Icon */}
                              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                                <Icon className="h-4 w-4" />
                              </div>

                              {/* Message Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className="text-xs font-bold text-brand-navy truncate">
                                    {item.title}
                                  </h4>
                                  <span className="text-[10px] text-brand-text-muted shrink-0">
                                    {formatNotificationTime(item.time)}
                                  </span>
                                </div>
                                <p className="mt-1 text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                                  {item.message}
                                </p>
                              </div>

                              {/* Unread indicator dot */}
                              {isUnread && (
                                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-cyan ring-2 ring-white" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer Info */}
                    <div className="border-t border-brand-line/50 bg-white px-4 py-2 text-center text-[10px] font-semibold text-brand-text-muted">
                      Klik notifikasi untuk membuka halaman terkait
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile pill */}
            <div
              onClick={() => (window.location.hash = "#/edit-profile")}
              className="hidden cursor-pointer items-center gap-2.5 rounded-full border border-brand-line/60 bg-white py-1 pl-1 pr-3 shadow-sm hover:border-brand-cyan sm:flex"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={userName}
                  className="h-7 w-7 rounded-full object-cover border border-brand-cyan"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-navy text-[11px] font-bold text-white">
                  {userName.charAt(0)}
                </div>
              )}
              <span className="text-xs font-semibold text-brand-navy">
                {userName}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
