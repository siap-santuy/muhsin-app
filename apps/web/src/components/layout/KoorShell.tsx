import { useState } from "react";
import {
  Award,
  Bell,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

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
    badge: "2",
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const userName = user?.name ?? "Ust. Abdullah S.Pd.I";

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
            {item.badge ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  isActive
                    ? "bg-brand-amber text-brand-navy"
                    : "bg-brand-amber/20 text-brand-navy"
                }`}
              >
                {item.badge}
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
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-brand-navy hover:bg-brand-navy/5 transition-all"
      >
        <Settings className="h-4 w-4 text-brand-navy/60" />
        <span>Pengaturan Akun</span>
      </a>
      <a
        href="#/notifications"
        onClick={() => setMobileOpen(false)}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-brand-navy hover:bg-brand-navy/5 transition-all"
      >
        <Bell className="h-4 w-4 text-brand-navy/60" />
        <span>Notifikasi Hub</span>
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
            {/* Notification Bell Button */}
            <button
              type="button"
              aria-label="Notifikasi"
              onClick={() => (window.location.hash = "#/notifications")}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-brand-line/60 bg-white text-brand-navy shadow-sm hover:border-brand-cyan"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-amber opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-amber" />
              </span>
            </button>

            {/* Profile pill */}
            <div
              onClick={() => (window.location.hash = "#/edit-profile")}
              className="hidden cursor-pointer items-center gap-2.5 rounded-full border border-brand-line/60 bg-white py-1 pl-1 pr-3 shadow-sm hover:border-brand-cyan sm:flex"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-navy text-[11px] font-bold text-white">
                {userName.charAt(0)}
              </div>
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
