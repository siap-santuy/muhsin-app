import { useState, useEffect } from "react";
import { Award, BookOpenCheck, Flame, PenLine, Star, Trophy, X, Zap } from "lucide-react";
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

interface LevelThresholdInfo {
  level: number;
  baseExp: number;
  nextThreshold: number;
  expInLevel: number;
  expNeededInLevel: number;
  expPercent: number;
}

function calculateProgressiveLevel(totalExp: number): LevelThresholdInfo {
  let lvl = 1;
  let threshold = 0;
  while (threshold + 100 * lvl <= totalExp) {
    threshold += 100 * lvl;
    lvl += 1;
  }
  const baseExp = threshold;
  const expNeededInLevel = 100 * lvl;
  const nextThreshold = baseExp + expNeededInLevel;
  const expInLevel = Math.max(0, totalExp - baseExp);
  // Opsi A: Progress bar akumulatif total terhadap target level berikutnya (misal 180 / 300 EXP = 60%)
  const expPercent = Math.min(100, Math.round((totalExp / Math.max(1, nextThreshold)) * 100));

  return {
    level: lvl,
    baseExp,
    nextThreshold,
    expInLevel,
    expNeededInLevel,
    expPercent,
  };
}

export function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name ? user.name.split(" ")[0] : "Siswa";
  const [dialog, setDialog] = useState<DialogType>(null);
  const [summary, setSummary] = useState<any>(null);
  const [munaqosahList, setMunaqosahList] = useState<any[]>([]);
  const todayStr = formatLocalDate(new Date());
  const [todayIbadahStatus, setTodayIbadahStatus] = useState<"submitted" | "draft" | "empty">("empty");

  useEffect(() => {
    api.getDashboardSummary()
      .then(setSummary)
      .catch(() => {});

    api.getDailyIbadah(todayStr)
      .then((data) => {
        if (data?.status === "submitted") setTodayIbadahStatus("submitted");
        else if (data?.status === "draft") setTodayIbadahStatus("draft");
        else setTodayIbadahStatus("empty");
      })
      .catch(() => setTodayIbadahStatus("empty"));

    api.getStudentMunaqosahSchedule()
      .then((data) => setMunaqosahList(Array.isArray(data) ? data : []))
      .catch(() => setMunaqosahList([]));
  }, [todayStr]);

  const currentExp = summary?.totalExp ?? 0;
  const levelInfo = calculateProgressiveLevel(currentExp);
  const level = summary?.level ?? levelInfo.level;
  const expPercent = levelInfo.expPercent;
  const currentStreak = summary?.currentStreak ?? 0;
  const longestStreak = summary?.longestStreak ?? 0;
  const target = summary?.targetHafalan ?? null;

  const progres = summary?.progresBulanIni ?? {};

  const ziyadahItem = progres.ziyadah ?? {
    percentage: Math.min(100, Math.round(((progres.ziyadahCount ?? 0) / 2) * 100)),
    caption: "Target 2 halaman",
  };
  const yaumiyahItem = progres.yaumiyah ?? {
    percentage: Math.min(100, Math.round(((progres.yaumiyahDays ?? 0) / 30) * 100)),
    caption: `${progres.yaumiyahDays ?? 0} dari 30 hari`,
  };

  const progressItems: ProgressItem[] = [
    {
      label: "Ziyadah",
      value: `${ziyadahItem.percentage}%`,
      caption: ziyadahItem.caption,
      percent: ziyadahItem.percentage,
      barClass: "bg-brand-cyan",
      trackClass: "bg-brand-cyan/15",
      onClick: () => (window.location.hash = "#/tahfidz-summary?tab=ziyadah"),
    },
    {
      label: "Yaumiyah",
      value: `${yaumiyahItem.percentage}%`,
      caption: yaumiyahItem.caption,
      percent: yaumiyahItem.percentage,
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
          {/* Menu Pencapaian & Badge Hafalan */}
          <div
            onClick={() => (window.location.hash = "#/achievements")}
            className="flex items-center justify-between rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/40 p-3.5 shadow-sm cursor-pointer hover:border-amber-300 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white shadow-sm shadow-amber-400/20">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-brand-navy">Pencapaian & Badge Hafalan</h3>
                <p className="text-[11px] font-medium text-amber-800/80">Koleksi surah, juz & sabiq yang telah tuntas</p>
              </div>
            </div>
            <span className="flex items-center text-xs font-bold text-amber-700">
              Lihat →
            </span>
          </div>

          {/* Kartu Status / Jadwal Ujian Munaqosah */}
          {(() => {
            const activeMunaqosah =
              munaqosahList.find(
                (m) => m.status === "dijadwalkan" || m.status === "disetujui" || m.status === "diajukan"
              ) || munaqosahList[0];

            if (!activeMunaqosah) return null;

            const juzText =
              activeMunaqosah.juzList && activeMunaqosah.juzList.length > 0
                ? activeMunaqosah.juzList.join(", ")
                : activeMunaqosah.juzKe;

            if (activeMunaqosah.status === "dijadwalkan") {
              return (
                <div className="rounded-2xl border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50/50 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
                        <Award className="h-5 w-5" />
                      </span>
                      <div>
                        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-700">
                          JADWAL MUNAQOSAH
                        </span>
                        <h3 className="text-sm font-bold text-brand-navy mt-0.5">
                          Ujian Kenaikan Juz {juzText}
                        </h3>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl bg-white/90 p-3 text-xs text-brand-navy space-y-1 border border-purple-100">
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500">📅 Tanggal:</span>
                      <strong>{activeMunaqosah.examDate ?? "Menunggu Penjadwalan"}</strong>
                      {activeMunaqosah.examTime && <span>({activeMunaqosah.examTime})</span>}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500">👤 Penguji:</span>
                      <strong>{activeMunaqosah.assignedExaminerName ?? "Ustadz Penguji"}</strong>
                    </p>
                  </div>
                </div>
              );
            }

            if (activeMunaqosah.isResultPublished && activeMunaqosah.scores) {
              const isLulus = activeMunaqosah.hasil === "lulus";
              const scoreVal = activeMunaqosah.nilaiAkhir ?? activeMunaqosah.scores?.nilaiAkhir;
              const gradeVal = activeMunaqosah.grade ?? activeMunaqosah.scores?.grade;
              return (
                <div
                  className={`rounded-2xl border p-4 shadow-sm ${
                    isLulus ? "border-emerald-300 bg-emerald-50/60" : "border-red-300 bg-red-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-xs ${
                          isLulus ? "bg-emerald-600" : "bg-red-600"
                        }`}
                      >
                        <Award className="h-5 w-5" />
                      </span>
                      <div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                            isLulus ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          HASIL MUNAQOSAH: {isLulus ? "LULUS" : "BELUM LULUS"}
                        </span>
                        <h3 className="text-sm font-bold text-brand-navy mt-0.5">
                          Juz {juzText} • Nilai: <strong>{scoreVal ?? "-"}</strong> ({gradeVal ?? "-"})
                        </h3>
                      </div>
                    </div>
                  </div>
                  {activeMunaqosah.catatanPenguji && (
                    <p className="mt-2.5 text-xs italic text-gray-700 bg-white/80 p-2.5 rounded-xl border border-gray-100">
                      &ldquo;{activeMunaqosah.catatanPenguji}&rdquo;
                    </p>
                  )}
                </div>
              );
            }

            if (activeMunaqosah.status === "lulus" || activeMunaqosah.status === "tidak_lulus") {
              return (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 shadow-sm text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Award className="h-4 w-4 text-amber-600" />
                    <span>Ujian Munaqosah Telah Selesai</span>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-700">
                    Ujian Juz {juzText} telah dilaksanakan. Pengumuman nilai dan raport resmi akan dirilis oleh pihak sekolah.
                  </p>
                </div>
              );
            }

            return null;
          })()}
          {/* Target Ziyadah Bulan Ini */}
          <div className="flex items-center gap-3 rounded-2xl border border-brand-cyan/30 bg-brand-cyan/5 px-4 py-3">
            <BookOpenCheck className="h-6 w-6 shrink-0 text-brand-cyan" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-brand-navy">Target Ziyadah Bulan Ini</p>
              <p className="text-xs text-brand-text-muted truncate">
                {target
                  ? `${target.surahStart}:${target.ayatStart} — ${target.surahEnd}:${target.ayatEnd}`
                  : "Target Ritme: 2 Halaman / Bulan (10 Hal / Semester)"}
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-brand-cyan/15 px-2 py-1 text-[10px] font-bold text-brand-cyan-dark">
              {target ? target.progressAyat : "Aktif"}
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
                <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-brand-amber" /> Progres EXP</span>
                <span>{currentExp} / {levelInfo.nextThreshold}</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-brand-amber/15">
                <div
                  className="h-full rounded-full bg-brand-amber transition-all"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-brand-text-muted">
                <span>Level {level}</span>
                <span>{Math.max(0, levelInfo.nextThreshold - currentExp)} EXP lagi menuju Level {level + 1}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
