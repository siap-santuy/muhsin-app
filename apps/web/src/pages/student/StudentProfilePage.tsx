import {
  ChevronRight,
  HelpCircle,
  Info,
  Lock,
  LogOut,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuthStore } from "@/store/authStore";

interface StudentProfilePageProps {
  onLogout?: () => void;
}

export function StudentProfilePage({ onLogout }: StudentProfilePageProps) {
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      window.location.hash = "";
    }
  }

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
                alt="Fulan bin Fulan"
                className="h-24 w-24 rounded-full border-4 border-brand-cyan object-cover shadow-sm"
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-brand-amber px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                Lv. 12
              </span>
            </div>

            <h2 className="mt-4 text-xl font-extrabold text-brand-navy">
              Fulan bin Fulan
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-brand-navy">
              VII Abu Bakar Ash-Shiddiq
            </p>
            <p className="text-xs text-brand-text-muted">Ikhwan</p>

            <span className="mt-2.5 rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-4 py-0.5 text-[10px] font-bold tracking-wider text-brand-cyan uppercase">
              STUDENT
            </span>
          </div>

          {/* Status Pelajar Section */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-navy">
              STATUS PELAJAR
            </h3>
            <div className="flex items-center gap-3 rounded-2xl border border-brand-line bg-white p-3.5 shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                alt="Ust. Arai Kurnia Ramadhan"
                className="h-12 w-12 rounded-xl object-cover"
              />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-navy">
                  GURU PEMBIMBING
                </p>
                <p className="text-sm font-bold text-brand-navy">
                  Ust. Arai Kurnia Ramadhan
                </p>
              </div>
            </div>
          </section>

          {/* Akun Section */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-navy">
              AKUN
            </h3>
            <div className="rounded-2xl border border-brand-line bg-white px-4 py-1 shadow-sm divide-y divide-brand-line/40">
              {[
                { icon: UserCog, label: "Ubah Profile" },
                { icon: Lock, label: "Ubah Password" },
                { icon: ShieldCheck, label: "Kebijakan Privasi" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
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

          {/* Tentang Section */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-navy">
              TENTANG
            </h3>
            <div className="rounded-2xl border border-brand-line bg-white px-4 py-1 shadow-sm divide-y divide-brand-line/40">
              {[
                { icon: HelpCircle, label: "Bantuan & Panduan" },
                { icon: Info, label: "Tentang Muhsin" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
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
            <p className="text-[10px] text-brand-text-muted">v1.0.0</p>
          </div>
        </div>
      </main>

      <BottomNav activeIndex={3} />
    </div>
  );
}
