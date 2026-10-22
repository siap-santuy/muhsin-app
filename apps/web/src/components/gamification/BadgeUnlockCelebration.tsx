import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  Crown,
  Layers,
  Sparkles,
  ChevronRight,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import type { StudentBadge } from "@muhsin/shared";

export function BadgeUnlockCelebration() {
  const user = useAuthStore((s) => s.user);
  const [newBadges, setNewBadges] = useState<StudentBadge[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!user || user.role !== "student") return;

    const checkBadges = async () => {
      try {
        const summary = await api.getStudentAchievements();
        if (!summary?.badges) return;

        const unlockedBadges = summary.badges.filter((b) => b.status === "unlocked");
        const currentUnlockedIds = unlockedBadges.map((b) => b.id);

        const storageKey = `muhsin_seen_badges_${user.id}`;
        const rawSeen = localStorage.getItem(storageKey);

        if (rawSeen !== null && rawSeen !== undefined) {
          try {
            const seenIds: string[] = JSON.parse(rawSeen);
            const seenSet = new Set(seenIds);
            const freshBadges = unlockedBadges.filter((b) => !seenSet.has(b.id));

            if (freshBadges.length > 0) {
              setNewBadges(freshBadges);
              setCurrentIndex(0);
            }
          } catch {
            // parsing error fallback
          }
        }

        // Simpan daftar badge yang telah terbuka
        localStorage.setItem(storageKey, JSON.stringify(currentUnlockedIds));
      } catch {
        // silent
      }
    };

    // 1. Periksa saat komponen dimuat
    void checkBadges();

    // 2. Periksa saat layar aktif / tab difokuskan kembali
    const handleFocus = () => void checkBadges();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    // 3. Polling ringan setiap 60 detik saat santri sedang aktif di aplikasi
    const interval = setInterval(checkBadges, 60000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      clearInterval(interval);
    };
  }, [user]);

  if (newBadges.length === 0) return null;

  const currentBadge = newBadges[currentIndex];
  if (!currentBadge) return null;

  const total = newBadges.length;
  const isLast = currentIndex >= total - 1;

  const handleNext = () => {
    if (isLast) {
      setNewBadges([]);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleViewAll = () => {
    setNewBadges([]);
    window.location.hash = "#/achievements";
  };

  const getTheme = () => {
    if (currentBadge.category === "juz") {
      return {
        icon: <Crown className="h-10 w-10 text-white" />,
        bgGlow: "bg-amber-400 text-white shadow-xl shadow-amber-400/40",
        pill: "bg-amber-100 text-amber-800 border-amber-200",
        label: "Hafizh Juz",
      };
    }
    if (currentBadge.category === "sabiq") {
      return {
        icon: <Layers className="h-10 w-10 text-white" />,
        bgGlow: "bg-sky-500 text-white shadow-xl shadow-sky-500/40",
        pill: "bg-sky-100 text-sky-800 border-sky-200",
        label: "Sabiq Tahsin",
      };
    }
    return {
      icon: <BookOpen className="h-10 w-10 text-white" />,
      bgGlow: "bg-emerald-500 text-white shadow-xl shadow-emerald-500/40",
      pill: "bg-emerald-100 text-emerald-800 border-emerald-200",
      label: "Hafalan Surah",
    };
  };

  const theme = getTheme();

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setNewBadges([])}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl border border-brand-line animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={() => setNewBadges([])}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Counter jika > 1 */}
        {total > 1 && (
          <div className="mb-2">
            <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-brand-muted">
              Badge {currentIndex + 1} dari {total}
            </span>
          </div>
        )}

        {/* Ikon Badge Animasi */}
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-2xl ${theme.bgGlow} animate-bounce`}
        >
          {theme.icon}
        </div>

        {/* Badge Category Tag */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${theme.pill}`}
          >
            <Sparkles className="h-3 w-3" />
            {theme.label}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="mt-2 text-xl font-black text-brand-navy">
          🎉 {currentBadge.title}
        </h3>
        <p className="mt-1 text-xs font-semibold text-brand-muted">
          {currentBadge.subtitle}
        </p>

        <p className="mt-3 text-xs leading-relaxed text-brand-text-muted">
          Alhamdulillah! Kamu berhasil menuntaskan capaian ini. Terus istiqomah menambah dan menjaga hafalanmu!
        </p>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={handleNext}
            className="w-full rounded-xl bg-brand-cyan py-3 text-xs font-extrabold text-white shadow-sm hover:bg-brand-cyan-dark active:scale-[0.98] transition-all"
          >
            {isLast ? "Alhamdulillah, Lanjutkan!" : "Badge Berikutnya →"}
          </button>
          <button
            type="button"
            onClick={handleViewAll}
            className="flex w-full items-center justify-center gap-1 py-2 text-xs font-bold text-brand-navy hover:text-brand-cyan transition-colors"
          >
            <Award className="h-4 w-4 text-amber-500" />
            <span>Lihat Semua Koleksi Badge</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
