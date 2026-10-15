import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";

export function LevelUpCelebration() {
  const user = useAuthStore((s) => s.user);
  const [levelUpData, setLevelUpData] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== "student") return;

    const checkLevel = async () => {
      try {
        const summary: any = await api.getDashboardSummary();
        const currentLevel = summary?.level;
        if (!currentLevel) return;

        const key = `muhsin_last_seen_level_${user.id}`;
        const lastSeen = localStorage.getItem(key);

        if (lastSeen !== null && lastSeen !== undefined) {
          const prev = Number(lastSeen);
          if (prev > 0 && currentLevel > prev) {
            setLevelUpData(currentLevel);
          }
        }
        localStorage.setItem(key, String(currentLevel));
      } catch {
        // silent
      }
    };

    // 1. Periksa saat komponen dimuat
    void checkLevel();

    // 2. Periksa saat layar HP dinyalakan kembali atau tab browser difokuskan kembali
    const handleFocus = () => void checkLevel();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    // 3. Polling ringan setiap 60 detik saat santri sedang aktif di aplikasi
    const interval = setInterval(checkLevel, 60000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      clearInterval(interval);
    };
  }, [user]);

  if (levelUpData === null) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setLevelUpData(null)}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl border border-brand-line animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-amber/20 text-brand-amber animate-bounce">
          <Star className="h-12 w-12 fill-brand-amber" />
        </div>
        <h3 className="mt-4 text-xl font-black text-brand-navy">
          🎉 Barakallahu Fiik!
        </h3>
        <p className="mt-1 text-sm font-extrabold text-brand-cyan-dark">
          Selamat, Kamu Naik ke Level {levelUpData}!
        </p>
        <p className="mt-2 text-xs text-brand-text-muted leading-relaxed">
          Terus istiqomah dalam mutaba&apos;ah ibadah dan setoran hafalan Al-Qur&apos;an untuk meraih level berikutnya!
        </p>
        <button
          type="button"
          onClick={() => setLevelUpData(null)}
          className="mt-5 w-full rounded-xl bg-brand-cyan py-3 text-xs font-bold text-white shadow-sm hover:bg-brand-cyan-dark active:scale-[0.98] transition-all"
        >
          Alhamdulillah, Lanjutkan!
        </button>
      </div>
    </div>
  );
}
