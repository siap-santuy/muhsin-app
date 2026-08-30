import { useState, useEffect } from "react";
import { BookOpenCheck, Flame, PenLine, Star, Trophy, X, Zap } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { DailyQuote } from "@/components/student/DailyQuote";
import { ProgressGrid, type ProgressItem } from "@/components/student/ProgressGrid";
import { StreakLevelBanner } from "@/components/student/StreakLevelBanner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import type { GamificationSummary } from "@muhsin/shared";

const QUOTE = {
  text: '"Sesungguhnya Allah mencintai orang-orang yang berbuat ihsan."',
  source: "(QS. Al-Baqarah: 195)",
};

const PROGRESS: ProgressItem[] = [
  {
    label: "Ziyadah",
    value: "75%",
    caption: "12 dari 16 target",
    percent: 75,
    barClass: "bg-brand-cyan",
    trackClass: "bg-brand-cyan/15",
  },
  {
    label: "Tahsin",
    value: "60%",
    caption: "9 dari 15 target",
    percent: 60,
    barClass: "bg-brand-navy",
    trackClass: "bg-brand-navy/15",
  },
  {
    label: "Murojaah",
    value: "90%",
    caption: "18 dari 20 target",
    percent: 90,
    barClass: "bg-[#7aa7f0]",
    trackClass: "bg-[#d3e4fe]",
  },
  {
    label: "Yaumiyah",
    value: "5/7",
    caption: "5 dari 7 hari",
    percent: 71,
    barClass: "bg-[#8b5cf6]",
    trackClass: "bg-[#8b5cf6]/15",
  },
];

// ponytail: mock gamification data — replace with API response when backend ready
// ponytail: mock target ziyadah — replace with API (PRD 4.3b)
const MOCK_TARGET = { from: "Al-Baqarah: 1", to: "Al-Baqarah: 75", progress: "Ayat 48" };

type DialogType = "streak" | "level" | null;

export function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name.split(" ")[0] ?? "Santri";
  const [dialog, setDialog] = useState<DialogType>(null);
  const [gamification, setGamification] = useState<GamificationSummary | null>(null);

  useEffect(() => {
    if (user?.id) {
      api.getGamificationSummary(user.id)
        .then(setGamification)
        .catch(() => {
          // fallback if API is not yet seeded
          setGamification({
            studentId: user.id,
            schoolId: user.schoolId,
            level: 3,
            totalExp: 280,
            currentStreak: 5,
            longestStreak: 14,
            lastActivityDate: null,
          });
        });
    }
  }, [user]);

  const level = gamification?.level ?? 1;
  const currentExp = gamification?.totalExp ?? 0;
  const nextLevelExp = level * 100;
  const expPercent = Math.min(100, Math.round((currentExp / Math.max(1, nextLevelExp)) * 100));
  const currentStreak = gamification?.currentStreak ?? 0;
  const longestStreak = gamification?.longestStreak ?? 0;

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      <AppHeader />
      <main className="flex-1 overflow-y-auto px-4 pt-1 pb-4">
        <div className="flex flex-col gap-3">
          <section className="flex items-end justify-between">
            <div>
              <h1 className="text-xl font-bold text-brand-navy">
                Assalamu&apos;alaikum,
              </h1>
              <p className="text-lg font-semibold text-brand-navy">
                {firstName}!
              </p>
              <p className="mt-1 text-sm text-brand-text-muted">
                Siap melanjutkan petualangan ilmumu hari ini?
              </p>
            </div>
          </section>
          <DailyQuote text={QUOTE.text} source={QUOTE.source} />
          <StreakLevelBanner
            streak={currentStreak}
            level={level}
            onStreakPress={() => setDialog("streak")}
            onLevelPress={() => setDialog("level")}
          />
          {/* Target Ziyadah Bulan Ini (PRD 4.3b) */}
          <div className="flex items-center gap-3 rounded-2xl border border-brand-cyan/30 bg-brand-cyan/5 px-4 py-3">
            <BookOpenCheck className="h-6 w-6 shrink-0 text-brand-cyan" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-brand-navy">Target Ziyadah Bulan Ini</p>
              <p className="text-xs text-brand-text-muted truncate">
                {MOCK_TARGET.from} — {MOCK_TARGET.to}
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-brand-cyan/15 px-2 py-1 text-[10px] font-bold text-brand-cyan-dark">
              {MOCK_TARGET.progress}
            </span>
          </div>
          <div onClick={() => (window.location.hash = "#/tahfidz-summary")} className="cursor-pointer">
            <ProgressGrid title="Progres Bulan Ini" items={PROGRESS} />
          </div>
          <Button
            type="button"
            onClick={() => (window.location.hash = "#/yaumiyah-input")}
            className="h-[38px] w-full rounded-lg bg-brand-cyan text-white shadow-[0_1px_0_#159db5] hover:bg-brand-cyan-dark"
          >
            <PenLine /> Isi Ibadah Hari Ini
          </Button>
        </div>
      </main>
      <BottomNav activeIndex={0} />

      {/* Streak Detail Dialog */}
      {dialog === "streak" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setDialog(null)}>
          <div
            className="w-full max-w-md animate-in slide-in-from-bottom rounded-t-3xl bg-white px-5 pb-8 pt-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-brand-navy">Streak Ibadah</h2>
              <button type="button" onClick={() => setDialog(null)} className="rounded-full p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-orange-50 p-4">
                <Flame className="h-8 w-8 text-[#ff5722]" />
                <span className="text-2xl font-extrabold text-brand-navy">{currentStreak}</span>
                <span className="text-[11px] text-brand-text-muted">Hari Saat Ini</span>
              </div>
              <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-amber-50 p-4">
                <Trophy className="h-8 w-8 text-brand-amber" />
                <span className="text-2xl font-extrabold text-brand-navy">{longestStreak || currentStreak}</span>
                <span className="text-[11px] text-brand-text-muted">Rekor Terbaik</span>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-brand-text-muted">
              Isi ibadah yaumiyah setiap hari agar streak tidak terputus!
            </p>
          </div>
        </div>
      )}

      {/* Level & EXP Detail Dialog */}
      {dialog === "level" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setDialog(null)}>
          <div
            className="w-full max-w-md animate-in slide-in-from-bottom rounded-t-3xl bg-white px-5 pb-8 pt-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-brand-navy">Level & EXP</h2>
              <button type="button" onClick={() => setDialog(null)} className="rounded-full p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-amber/15">
                <Star className="h-9 w-9 text-brand-amber" />
              </div>
              <span className="text-2xl font-extrabold text-brand-navy">Level {level}</span>
            </div>
            <div className="mt-4 rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center justify-between text-xs font-bold text-brand-navy">
                <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-brand-amber" /> EXP</span>
                <span>{currentExp} / {nextLevelExp}</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-brand-amber/15">
                <div
                  className="h-full rounded-full bg-brand-amber transition-all"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
              <p className="mt-2 text-center text-[11px] text-brand-text-muted">
                {Math.max(0, nextLevelExp - currentExp)} EXP lagi menuju Level {level + 1}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
