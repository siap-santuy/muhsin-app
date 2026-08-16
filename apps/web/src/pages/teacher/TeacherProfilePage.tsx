import {
  BookOpen,
  ChevronRight,
  HelpCircle,
  Info,
  Lock,
  LogOut,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuthStore } from "@/store/authStore";

interface TeacherProfilePageProps {
  onLogout?: () => void;
}

export function TeacherProfilePage({ onLogout }: TeacherProfilePageProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      window.location.hash = "";
    }
  }

  const name = user?.name ?? "Ustadz Arai Kurnia";

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      <AppHeader />

      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-2">
        <div className="flex flex-col gap-5">
          {/* Profile Header Card */}
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80"
                alt={name}
                className="h-24 w-24 rounded-full border-4 border-brand-cyan object-cover shadow-sm"
              />
            </div>

            <h2 className="mt-4 text-xl font-extrabold text-brand-navy">
              {name}
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-brand-navy">
              NIP: 199208152020121001
            </p>
            <p className="text-xs text-brand-text-muted">Guru Pembimbing TTQ &amp; Yaumiyah</p>

            <span className="mt-2.5 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-0.5 text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
              GURU PEMBIMBING
            </span>
          </div>

          {/* Info Halaqah Section */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-navy">
              INFORMASI HALAQAH
            </h3>
            <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-brand-line/40 pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-brand-cyan" />
                  <span className="text-xs font-bold text-brand-navy">Halaqah Kelas</span>
                </div>
                <span className="text-xs font-bold text-brand-cyan">VII Abu Bakar</span>
              </div>

              <div className="flex items-center justify-between border-b border-brand-line/40 pb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-navy" />
                  <span className="text-xs font-bold text-brand-navy">Jumlah Siswa</span>
                </div>
                <span className="text-xs font-bold text-brand-navy">15 Siswa</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-navy">Tahun Ajaran</span>
                <span className="text-xs font-semibold text-brand-text-muted">2026/2027</span>
              </div>
            </div>
          </section>

          {/* Pengaturan Akun */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-navy">
              PENGATURAN AKUN
            </h3>
            <div className="rounded-2xl border border-brand-line bg-white px-4 py-1 shadow-sm divide-y divide-brand-line/40">
              {[
                { icon: UserCog, label: "Ubah Profile", route: "#/edit-profile" },
                { icon: Lock, label: "Ubah Password", route: "#/change-password" },
                { icon: ShieldCheck, label: "Kebijakan Privasi", route: "#/privacy" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => (window.location.hash = item.route)}
                    className="flex w-full items-center justify-between py-3 text-left transition-opacity hover:opacity-75"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-brand-navy" />
                      <span className="text-xs font-bold text-brand-navy">
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                );
              })}
            </div>
          </section>

          {/* Bantuan & Informasi */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-navy">
              BANTUAN &amp; INFORMASI
            </h3>
            <div className="rounded-2xl border border-brand-line bg-white px-4 py-1 shadow-sm divide-y divide-brand-line/40">
              {[
                { icon: HelpCircle, label: "Bantuan & Panduan Guru", route: "#/help" },
                { icon: Info, label: "Tentang Muhsin", route: "#/about" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => (window.location.hash = item.route)}
                    className="flex w-full items-center justify-between py-3 text-left transition-opacity hover:opacity-75"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-brand-navy" />
                      <span className="text-xs font-bold text-brand-navy">
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                );
              })}
            </div>
          </section>

          {/* Keluar Button Card */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl border border-brand-line bg-white p-4 shadow-sm transition-opacity hover:opacity-80"
          >
            <LogOut className="h-5 w-5 text-red-500" />
            <span className="text-sm font-bold text-red-500">Keluar</span>
          </button>

          {/* App Version Footer */}
          <div className="text-center py-2">
            <p className="text-[11px] font-medium text-brand-text-muted">
              Powered by <span className="font-semibold text-brand-navy">MuhsinApp</span>
            </p>
            <p className="text-[10px] text-brand-text-muted">v1.0.0 (Guru Edition)</p>
          </div>
        </div>
      </main>

      <BottomNav activeIndex={3} />
    </div>
  );
}
