import { useState, useEffect } from "react";
import {
  Award,
  BookOpen,
  BookOpenCheck,
  ChevronRight,
  Flame,
  HeartHandshake,
  NotebookPen,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { DailyQuote } from "@/components/student/DailyQuote";
import { ProgressGrid, type ProgressItem } from "@/components/student/ProgressGrid";
import { MascotTip } from "@/components/ui/MascotTip";
import { MenuCard } from "@/components/ui/MenuCard";
import { ReminderBanner } from "@/components/ui/ReminderBanner";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { getDisplayName } from "@/lib/utils";
import { toast } from "@/store/toastStore";

const QUOTE = {
  text: '"Sesungguhnya Allah mencintai orang-orang yang berbuat ihsan."',
  source: "(QS. Al-Baqarah: 195)",
};

export function ParentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api.getDashboardSummary()
      .then((data) => {
        setSummary(data);
        if (data?.childId && typeof window !== "undefined") {
          localStorage.setItem("parent_active_child_id", data.childId);
        }
      })
      .catch(() => {
        // Fallback
      });
  }, []);

  const parentName = getDisplayName(
    user?.name ?? "Orang Tua",
    user?.gender ?? "",
    "parent"
  );
  const childName = summary?.childName ?? "Ananda";
  const childClass = summary?.childClassName ?? "Kelas VII";
  const isFilled = summary?.isYaumiyahTodayFilled ?? true;
  const progres = summary?.progres ?? {};

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
      icon: BookOpen,
      iconClass: "bg-brand-cyan/10 text-brand-cyan",
      barClass: "bg-brand-cyan",
      trackClass: "bg-brand-cyan/15",
      onClick: () => (window.location.hash = "#/tahfidz-summary?tab=ziyadah"),
    },
    {
      label: "Yaumiyah",
      value: `${yaumiyahItem.percentage}%`,
      caption: yaumiyahItem.caption,
      percent: yaumiyahItem.percentage,
      icon: HeartHandshake,
      iconClass: "bg-purple-500/10 text-purple-500",
      barClass: "bg-purple-500",
      trackClass: "bg-purple-500/15",
      onClick: () => (window.location.hash = "#/yaumiyah"),
    },
  ];

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      <AppHeader />
      <main className="flex-1 overflow-y-auto px-4 pt-1 pb-4">
        <div className="flex flex-col gap-4">
          <section className="flex items-end justify-between">
            <div>
              <h1 className="text-xl font-bold leading-snug text-brand-navy">
                Assalamu&apos;alaikum,
              </h1>
              <p className="text-lg font-semibold leading-snug text-brand-navy">
                {parentName}
              </p>
              <p className="text-xs text-brand-text-muted">
                Wali dari {childName} &mdash; {childClass}
              </p>
            </div>
          </section>

          {!isFilled ? (
            <ReminderBanner
              text={`${childName} belum mengisi ibadah yaumiyah hari ini.`}
              action="Ingatkan"
              onAction={async () => {
                try {
                  await api.remindStudent();
                  toast.success("Pengingat terkirim ke ananda");
                } catch (err: any) {
                  toast.warning(err.message || "Gagal mengirim pengingat");
                }
              }}
            />
          ) : null}

          {/* Banner Prestasi Streak Ananda */}
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-xs border border-brand-line">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
              <Flame className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline justify-between">
                <p className="text-base font-extrabold text-brand-navy leading-none">
                  {summary?.childStreak ?? 0} Hari
                </p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Konsisten
                </span>
              </div>
              <p className="text-[11px] font-semibold text-brand-text-muted mt-1">
                Rekor Istiqomah Ibadah &amp; Setoran Ananda
              </p>
            </div>
          </div>

          {/* Banner Capaian Badge & Hafalan Ananda */}
          <div
            onClick={() => (window.location.hash = "#/achievements")}
            className="flex items-center justify-between rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/40 p-3.5 shadow-xs cursor-pointer hover:border-amber-300 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white shadow-sm shadow-amber-400/20">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-brand-navy">Pencapaian &amp; Badge Hafalan</h3>
                <p className="text-[11px] font-medium text-amber-800/80">Pantau koleksi surah &amp; juz yang telah tuntas</p>
              </div>
            </div>
            <span className="flex items-center text-xs font-bold text-amber-700">
              Buka →
            </span>
          </div>

          {/* Widget Setoran Terakhir Ananda */}
          {summary?.lastSetoran ? (
            <div
              onClick={() => {
                const targetTab = summary.lastSetoran.tab || "ziyadah";
                const targetDate = summary.lastSetoran.date || "";
                window.location.hash = `#/tahfidz-summary?tab=${targetTab}${targetDate ? `&date=${targetDate}` : ""}`;
              }}
              className="cursor-pointer rounded-2xl border border-brand-cyan/30 bg-linear-to-r from-brand-cyan/5 via-white to-brand-cyan/10 p-3.5 shadow-xs transition-all hover:border-brand-cyan hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-cyan text-white text-[10px] font-bold">
                    ✓
                  </span>
                  <span className="text-xs font-bold text-brand-navy">
                    Setoran Terakhir Ananda
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-brand-cyan">
                  <span>Nilai: {summary.lastSetoran.scoreAvg}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline justify-between border-t border-brand-cyan/15 pt-2">
                <div>
                  <p className="text-xs font-extrabold text-brand-navy">
                    {summary.lastSetoran.categoryName} — {summary.lastSetoran.reference}
                  </p>
                  {summary.lastSetoran.keterangan ? (
                    <p className="text-[10px] text-brand-text-muted line-clamp-1 mt-0.5">
                      {summary.lastSetoran.keterangan}
                    </p>
                  ) : null}
                </div>
                <span className="text-[10px] font-semibold text-brand-text-muted whitespace-nowrap ml-2">
                  {summary.lastSetoran.date}
                </span>
              </div>
            </div>
          ) : null}

          <DailyQuote text={QUOTE.text} source={QUOTE.source} />

          <ProgressGrid title={`Progres ${childName} Bulan Ini`} items={progressItems} />

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-brand-navy">
              Menu Pantauan Orang Tua
            </h2>

            <MenuCard
              icon={BookOpenCheck}
              iconClass="bg-brand-cyan/15 text-brand-cyan-dark"
              title="Capaian &amp; Target Hafalan"
              description={`Lihat riwayat hafalan &amp; target ${childName}`}
              onPress={() => (window.location.hash = "#/tahfidz-summary")}
            />

            <MenuCard
              icon={HeartHandshake}
              iconClass="bg-emerald-500/15 text-emerald-600"
              title="Jurnal Ibadah Yaumiyah"
              description={`Pantau sholat 5 waktu &amp; tilawah harian`}
              onPress={() => (window.location.hash = "#/yaumiyah")}
            />

            <MenuCard
              icon={NotebookPen}
              iconClass="bg-purple-500/15 text-purple-600"
              title="Raport Bulanan &amp; Semester"
              description={`Evaluasi berkala &amp; catatan guru pembimbing`}
              onPress={() => (window.location.hash = "#/raport")}
            />
          </section>

          <MascotTip message="Dukungan dan apresiasi dari orang tua adalah kunci semangat ananda dalam menjaga hafalan Al-Qur'an." />
        </div>
      </main>
      <BottomNav activeIndex={0} />
    </div>
  );
}
