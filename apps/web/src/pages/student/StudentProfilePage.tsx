import { useState, useEffect } from "react";
import {
  ChevronRight,
  HelpCircle,
  Info,
  Layers,
  Lock,
  LogOut,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { PWAInstallProfileItem } from "@/components/pwa/PWAInstallPrompt";
import { PushToggleProfileItem } from "@/components/pwa/PushToggleProfileItem";
import { APP_VERSION } from "@/lib/appVersion";
import type { UserProfile } from "@muhsin/shared";

interface StudentProfilePageProps {
  onLogout?: () => void;
}

export function StudentProfilePage({ onLogout }: StudentProfilePageProps) {
  const storeUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getMyProfile();
        setProfile(data);
      } catch {
        // Fallback to store
      }
    }
    load();
  }, []);

  function handleLogout() {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      window.location.hash = "";
    }
  }

  const name = profile?.name ?? storeUser?.name ?? "Siswa";
  const email = profile?.email ?? storeUser?.email ?? "";
  const avatarUrl =
    profile?.avatarUrl ||
    storeUser?.avatarUrl ||
    "https://i.pinimg.com/736x/0a/aa/f6/0aaaf68b00bf54b01ae506c8bbe03622.jpg";

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      <AppHeader />

      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-2">
        <div className="flex flex-col gap-5">
          {/* Profile Header Card */}
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <img
                src={avatarUrl}
                alt={name}
                className="h-24 w-24 rounded-full border-4 border-brand-cyan object-cover shadow-sm bg-gray-100"
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-brand-amber px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                Lv. 1
              </span>
            </div>

            <h2 className="mt-4 text-xl font-extrabold text-brand-navy">
              {name}
            </h2>
            {email ? (
              <p className="mt-0.5 text-xs text-brand-text-muted">{email}</p>
            ) : null}

            <span className="mt-2.5 rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-4 py-0.5 text-[10px] font-bold tracking-wider text-brand-cyan uppercase">
              STUDENT
            </span>
          </div>

          {/* Akun Section */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-navy">
              AKUN
            </h3>
            <div className="rounded-2xl border border-brand-line bg-white px-4 py-1 shadow-sm divide-y divide-brand-line/40">
              <PWAInstallProfileItem />
              <PushToggleProfileItem />
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

          {/* Tentang Section */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-navy">
              TENTANG
            </h3>
            <div className="rounded-2xl border border-brand-line bg-white px-4 py-1 shadow-sm divide-y divide-brand-line/40">
              {[
                { icon: HelpCircle, label: "Bantuan & Panduan", route: "#/help" },
                { icon: Info, label: "Tentang Muhsin", route: "#/about" },
                { icon: Layers, label: "Riwayat Versi", route: "#/versioning" },
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
            <p className="text-[10px] text-brand-text-muted">{APP_VERSION}</p>
          </div>
        </div>
      </main>

      <BottomNav activeIndex={3} />
    </div>
  );
}
