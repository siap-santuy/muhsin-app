import { useState, useEffect } from "react";
import {
  Award,
  BookOpen,
  BookOpenCheck,
  ChevronDown,
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
  const [munaqosahList, setMunaqosahList] = useState<any[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(() => {
    return typeof window !== "undefined" ? localStorage.getItem("parent_active_child_id") : null;
  });

  const loadSummary = (targetChildId?: string) => {
    api.getDashboardSummary(targetChildId)
      .then((data) => {
        setSummary(data);
        if (data?.childId) {
          setActiveChildId(data.childId);
          if (typeof window !== "undefined") {
            localStorage.setItem("parent_active_child_id", data.childId);
          }
        }
      })
      .catch(() => {});

    api.getStudentMunaqosahSchedule(targetChildId)
      .then((data) => setMunaqosahList(Array.isArray(data) ? data : []))
      .catch(() => setMunaqosahList([]));
  };

  useEffect(() => {
    loadSummary(activeChildId || undefined);
  }, []);

  const handleSwitchChild = (newChildId: string) => {
    if (!newChildId || newChildId === activeChildId) return;
    setActiveChildId(newChildId);
    if (typeof window !== "undefined") {
      localStorage.setItem("parent_active_child_id", newChildId);
    }
    loadSummary(newChildId);
  };

  const children: Array<{ id: string; name: string; className: string }> = summary?.children || [];

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
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold leading-snug text-brand-navy">
                Assalamu&apos;alaikum,
              </h1>
              <p className="text-lg font-semibold leading-snug text-brand-navy">
                {parentName}
              </p>
              
              {/* Dropdown Switcher Anak jika > 1, atau label statis jika 1 anak */}
              {children.length > 1 ? (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-brand-text-muted shrink-0">
                    Memantau:
                  </span>
                  <div className="relative inline-block max-w-[240px]">
                    <select
                      value={summary?.childId || ""}
                      onChange={(e) => handleSwitchChild(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-brand-cyan/40 bg-white py-1 pl-2.5 pr-7 text-xs font-extrabold text-brand-navy outline-none shadow-xs focus:border-brand-cyan"
                    >
                      {children.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.className})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-cyan" />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-brand-text-muted">
                  Wali dari {childName} &mdash; {childClass}
                </p>
              )}
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

          {/* Kartu Status / Jadwal Ujian Munaqosah Ananda */}
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
                          JADWAL MUNAQOSAH ANANDA
                        </span>
                        <h3 className="text-sm font-bold text-brand-navy mt-0.5">
                          Ujian Kenaikan Juz {juzText}
                        </h3>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl bg-white/90 p-3 text-xs text-brand-navy space-y-1 border border-purple-100">
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500">📅 Jadwal:</span>
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
                          HASIL MUNAQOSAH ANANDA: {isLulus ? "LULUS" : "BELUM LULUS"}
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
                    <span>Ujian Munaqosah Telah Terlaksana</span>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-700">
                    Ujian Juz {juzText} telah selesai. Hasil nilai raport resmi akan diumumkan oleh pihak sekolah.
                  </p>
                </div>
              );
            }

            return null;
          })()}

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
