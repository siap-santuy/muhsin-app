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

const QUOTE = {
  text: '"Sesungguhnya Allah mencintai orang-orang yang berbuat ihsan."',
  source: "(QS. Al-Baqarah: 195)",
};

type DialogType = "streak" | "level" | null;

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name ? user.name.split(" ")[0] : "Santri";
  const [dialog, setDialog] = useState<DialogType>(null);
  const [summary, setSummary] = useState<any>(null);
  const todayStr = formatLocalDate(new Date());
  const [todayIbadahStatus, setTodayIbadahStatus] = useState<"submitted" | "draft" | "empty">("empty");

  useEffect(() => {
    api.getDashboardSummary()
      .then(setSummary)
      .catch(() => {
        // Fallback
      });

    api.getDailyIbadah(todayStr)
      .then((data) => {
        if (data?.status === "submitted") setTodayIbadahStatus("submitted");
        else if (data?.status === "draft") setTodayIbadahStatus("draft");
        else setTodayIbadahStatus("empty");
      })
      .catch(() => setTodayIbadahStatus("empty"));
  }, [todayStr]);

  const level = summary?.level ?? 1;
  const currentExp = summary?.totalExp ?? 0;
  const nextLevelExp = level * 100;
  const expPercent = Math.min(100, Math.round((currentExp / Math.max(1, nextLevelExp)) * 100));
  const currentStreak = summary?.currentStreak ?? 0;
  const longestStreak = summary?.longestStreak ?? 0;
  const target = summary?.targetHafalan ?? {
    surahStart: "Al-Baqarah",
    ayatStart: 1,
    surahEnd: "Al-Baqarah",
    ayatEnd: 75,
    progressAyat: "Target Aktif",
  };

  const ziyadahCount = summary?.progresBulanIni?.ziyadahCount ?? 0;
  const ziyadahPct = Math.min(100, Math.round((ziyadahCount / 20) * 100));

  const tahsinCount = summary?.progresBulanIni?.tahsinCount ?? 0;
  const tahsinPct = Math.min(100, Math.round((tahsinCount / 20) * 100));

  const murojaahCount = summary?.progresBulanIni?.murojaahCount ?? 0;
  const murojaahPct = Math.min(100, Math.round((murojaahCount / 20) * 100));

  const yaumiyahDays = summary?.progresBulanIni?.yaumiyahDays ?? 0;
  const yaumiyahPct = Math.min(100, Math.round((yaumiyahDays / 30) * 100));

  const progressItems: ProgressItem[] = [
    {
      label: "Ziyadah",
      value: `${ziyadahPct}%`,
      caption: "Target 20 halaman",
      percent: ziyadahPct,
      barClass: "bg-brand-cyan",
      trackClass: "bg-brand-cyan/15",
      onClick: () => (window.location.hash = "#/tahfidz-summary?tab=ziyadah"),
    },
    {
      label: "Tahsin",
      value: `${tahsinPct}%`,
      caption: "Target 20 pertemuan",
      percent: tahsinPct,
      barClass: "bg-brand-navy",
      trackClass: "bg-brand-navy/15",
      onClick: () => (window.location.hash = "#/tahfidz-summary?tab=tahsin"),
    },
    {
      label: "Murojaah",
      value: `${murojaahPct}%`,
      caption: "Target terjaga",
      percent: murojaahPct,
      barClass: "bg-[#7aa7f0]",
      trackClass: "bg-[#d3e4fe]",
      onClick: () => (window.location.hash = "#/tahfidz-summary?tab=murojaah"),
    },
    {
      label: "Yaumiyah",
      value: `${yaumiyahPct}%`,
      caption: `${yaumiyahDays} dari 30 hari`,
      percent: yaumiyahPct,
      barClass: "bg-[#8b5cf6]",
      trackClass: "bg-[#8b5cf6]/15",
      onClick: () => (window.location.hash = "#/yaumiyah"),
    },
  ];

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
          {/* Target Ziyadah Bulan Ini */}
          <div className="flex items-center gap-3 rounded-2xl border border-brand-cyan/30 bg-brand-cyan/5 px-4 py-3">
            <BookOpenCheck className="h-6 w-6 shrink-0 text-brand-cyan" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-brand-navy">Target Ziyadah Bulan Ini</p>
              <p className="text-xs text-brand-text-muted truncate">
                {target.surahStart}:{target.ayatStart} — {target.surahEnd}:{target.ayatEnd}
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-brand-cyan/15 px-2 py-1 text-[10px] font-bold text-brand-cyan-dark">
              {target.progressAyat}
            </span>
          </div>
          <ProgressGrid title="Progres Bulan Ini" items={progressItems} />
          {todayIbadahStatus === "empty" && (
            <Button
              type="button"
              onClick={() => (window.location.hash = `#/yaumiyah-input?date=${todayStr}`)}
              className="h-11 w-full rounded-xl bg-brand-cyan font-bold text-white shadow-sm hover:bg-brand-cyan-dark"
            >
              <PenLine className="mr-2 h-4 w-4" /> ISI IBADAH HARI INI
            </Button>
          )}

          {todayIbadahStatus === "draft" && (
            <Button
              type="button"
              onClick={() => (window.location.hash = `#/yaumiyah-view?date=${todayStr}`)}
              className="h-11 w-full rounded-xl bg-brand-cyan font-bold text-white shadow-sm hover:bg-brand-cyan-dark"
            >
              <PenLine className="mr-2 h-4 w-4" /> KIRIM IBADAH HARI INI
            </Button>
          )}
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
