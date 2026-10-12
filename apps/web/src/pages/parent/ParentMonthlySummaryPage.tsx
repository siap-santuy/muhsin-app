import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  ActivityCard,
  type ActivityCardProps,
} from "@/components/student/ActivityCard";
import { MonthCalendar } from "@/components/student/MonthCalendar";
import { Pagination } from "@/components/ui/Pagination";
import { TabBar } from "@/components/ui/TabBar";
import { api } from "@/lib/api";

const RIWAYAT_TITLE: Record<string, string> = {
  ziyadah: "Riwayat Ziyadah",
  murojaah: "Riwayat Murojaah",
  tahsin: "Riwayat Tahsin",
};

const PER_PAGE = 4;

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatIndonesianDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ];
  return `${dayNames[dateObj.getDay()]}, ${d} ${monthNames[m - 1]} ${y}`;
}

interface ParentMonthlySummaryPageProps {
  initialTab?: string;
}

export function ParentMonthlySummaryPage({ initialTab: propInitialTab }: ParentMonthlySummaryPageProps) {
  const [activeTab, setActiveTab] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.hash.split("?")[1] || "").get("tab");
    return propInitialTab || fromUrl || "ziyadah";
  });

  const queryDate = typeof window !== "undefined" ? new URLSearchParams(window.location.hash.split("?")[1] || "").get("date") : null;
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(queryDate);
  const [selectedMonth, setSelectedMonth] = useState(() => (queryDate ? queryDate.slice(0, 7) : formatLocalDate(new Date()).slice(0, 7)));

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.hash.split("?")[1] || "").get("tab");
    const targetTab = propInitialTab || fromUrl;
    if (targetTab && targetTab !== activeTab) {
      setActiveTab(targetTab);
    }
    const targetDate = new URLSearchParams(window.location.hash.split("?")[1] || "").get("date");
    if (targetDate) {
      setSelectedDateFilter(targetDate);
      setSelectedMonth(targetDate.slice(0, 7));
    }
  }, [propInitialTab]);

  const [page, setPage] = useState(1);
  const [setoranList, setSetoranList] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [targetHafalan, setTargetHafalan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const storedChildId = typeof window !== "undefined" ? localStorage.getItem("parent_active_child_id") || undefined : undefined;
        const [dashData, historyData, targetData] = await Promise.all([
          api.getDashboardSummary(),
          api.getSetoranHistory({ studentId: storedChildId, month: selectedMonth }),
          api.getCurrentHafalanTarget({ studentId: storedChildId, month: selectedMonth }).catch(() => null),
        ]);
        setSummary(dashData);
        setTargetHafalan(targetData);
        if (dashData?.childId && typeof window !== "undefined") {
          localStorage.setItem("parent_active_child_id", dashData.childId);
        }
        setSetoranList(historyData || []);
      } catch {
        setSetoranList([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedMonth]);

  function handleMonthChange(year: number, month: number) {
    const formatted = `${year}-${String(month + 1).padStart(2, "0")}`;
    setSelectedMonth(formatted);
    setSelectedDateFilter(null);
  }

  function handleTabChange(id: string) {
    setActiveTab(id);
    setSelectedDateFilter(null);
    setPage(1);
  }

  const childName = summary?.childName ?? "Ananda";

  const filteredSetoran = setoranList.filter((s) => {
    const code = (s.subcategoryCode || s.categoryCode || "").toLowerCase();
    const name = (s.subcategoryName || s.categoryName || "").toLowerCase();
    let matchesTab = true;
    if (activeTab === "ziyadah") matchesTab = code.includes("ziyadah") || name.includes("ziyadah");
    else if (activeTab === "murojaah") matchesTab = code.includes("murojaah") || name.includes("murojaah");
    else if (activeTab === "tahsin") matchesTab = code.includes("tahsin") || code.includes("talaqi") || code.includes("sabiq") || name.includes("tahsin");

    if (!matchesTab) return false;
    if (selectedDateFilter && s.date !== selectedDateFilter) return false;
    return true;
  });

  const activities: ActivityCardProps[] = filteredSetoran.map((s) => {
    const metrics: Array<{ label: string; value: number }> = [];
    if (s.scores && typeof s.scores === "object") {
      Object.entries(s.scores).forEach(([k, v]) => {
        metrics.push({
          label: k.charAt(0).toUpperCase() + k.slice(1),
          value: Number(v) || 0,
        });
      });
    }

    let title = s.subcategoryName || s.categoryName || "Setoran";
    if (s.referenceStart?.surah) {
      title = `${title} — ${s.referenceStart.surah}: ${s.referenceStart.ayat}-${s.referenceEnd?.ayat ?? s.referenceStart.ayat}`;
    } else if (s.referenceStart?.halaman) {
      title = `${title} — Halaman ${s.referenceStart.halaman}`;
    }

    return {
      date: formatIndonesianDate(s.date),
      statusLabel: s.status === "sakit" ? "Sakit" : s.status === "izin" ? "Izin" : s.status === "alpa" ? "Alpa" : "Setoran",
      statusType: (s.status === "sakit" || s.status === "izin" || s.status === "alpa") ? s.status : "setoran",
      title,
      metrics: metrics.length > 0 ? metrics : undefined,
    };
  });

  const totalPages = Math.max(1, Math.ceil(activities.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = activities.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE
  );

  const tabCounts = useMemo(() => {
    let ziyadah = 0;
    let murojaah = 0;
    let tahsin = 0;
    for (const s of setoranList) {
      const code = (s.subcategoryCode || s.categoryCode || "").toLowerCase();
      const name = (s.subcategoryName || s.categoryName || "").toLowerCase();
      if (code.includes("ziyadah") || name.includes("ziyadah")) ziyadah++;
      else if (code.includes("murojaah") || name.includes("murojaah")) murojaah++;
      else if (code.includes("tahsin") || code.includes("talaqi") || code.includes("sabiq") || name.includes("tahsin")) tahsin++;
    }
    return { ziyadah, murojaah, tahsin };
  }, [setoranList]);

  const tabsWithBadge = useMemo(() => [
    { id: "ziyadah", label: "Ziyadah", badge: tabCounts.ziyadah },
    { id: "murojaah", label: "Muroja'ah", badge: tabCounts.murojaah },
    { id: "tahsin", label: "Tahsin", badge: tabCounts.tahsin },
  ], [tabCounts]);

  function getStatusForDate(date: Date) {
    const dateStr = formatLocalDate(date);
    // Cari entri yang sesuai dengan kategori tab aktif
    const entry = setoranList.find((s) => {
      if (s.date !== dateStr) return false;
      const code = (s.subcategoryCode || s.categoryCode || "").toLowerCase();
      const name = (s.subcategoryName || s.categoryName || "").toLowerCase();
      if (activeTab === "ziyadah") return code.includes("ziyadah") || name.includes("ziyadah");
      if (activeTab === "murojaah") return code.includes("murojaah") || name.includes("murojaah");
      if (activeTab === "tahsin") return code.includes("tahsin") || code.includes("talaqi") || code.includes("sabiq") || name.includes("tahsin");
      return true;
    });

    if (entry) {
      if (entry.status === "sakit") return "sakit";
      if (entry.status === "izin") return "izin";
      if (entry.status === "alpa") return "alpa";
      return "setoran";
    }

    // Jika di tanggal tsb ada izin/sakit/alpa di entri manapun, tetap tampilkan sebagai penjelas
    const generalAbsence = setoranList.find(
      (s) => s.date === dateStr && (s.status === "sakit" || s.status === "izin" || s.status === "alpa")
    );
    if (generalAbsence) {
      return generalAbsence.status as any;
    }

    return undefined;
  }

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between bg-brand-page px-4 py-3">
        <button
          type="button"
          onClick={() => (window.location.hash = "#/dashboard")}
          aria-label="Kembali"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-cyan/10"
        >
          <ArrowLeft className="h-4 w-4 text-brand-cyan" />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold text-brand-cyan">Progress TTQ</h1>
          <p className="text-[11px] font-semibold text-brand-navy">Ananda: {childName}</p>
        </div>
        <div className="h-10 w-10" />
      </div>

      {/* Body */}
      <main className="flex-1 overflow-y-auto pb-8">
        {/* Tab navigasi */}
        <div className="px-4">
          <TabBar
            tabs={tabsWithBadge}
            activeId={activeTab}
            onChange={handleTabChange}
          />
        </div>

        {/* Banner Target Bulanan */}
        <div className="mt-3 px-4">
          <div className="rounded-2xl border border-brand-cyan/30 bg-linear-to-r from-brand-cyan/10 via-white to-brand-cyan/5 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-cyan-dark">
                Target {activeTab === "ziyadah" ? "Hafalan Baru" : activeTab === "murojaah" ? "Kelancaran Muroja'ah" : "Metode Tahsin"} Bulan Ini
              </span>
              <span className="rounded-full bg-brand-cyan/20 px-2 py-0.5 text-[10px] font-extrabold text-brand-navy">
                {selectedMonth}
              </span>
            </div>
            <p className="mt-1.5 text-xs font-bold text-brand-navy leading-snug">
              {activeTab === "ziyadah"
                ? targetHafalan?.targetSurahStart
                  ? `${targetHafalan.targetSurahStart} : ${targetHafalan.targetAyatStart ?? 1} s/d ${targetHafalan.targetSurahEnd} : ${targetHafalan.targetAyatEnd ?? 1}${targetHafalan.catatan ? ` (${targetHafalan.catatan})` : ""}`
                  : "Juz 30 (Surah An-Naba' s/d Al-Muthaffifin) — Minimal 20 Halaman"
                : activeTab === "murojaah"
                ? "Menjaga & Mengulang Hafalan Juz 30 Mutqin — Rutin Tiap Pekan"
                : "Metode Sabiq Jilid 4 & Talaqi Tartil — 20 Pertemuan Aktif"}
            </p>
          </div>
        </div>

        {/* Calendar */}
        <div className="mt-3 px-4">
          <MonthCalendar
            mode="setoran"
            initialDate={parseLocalDate(selectedMonth + "-01")}
            selectedDate={selectedDateFilter ? parseLocalDate(selectedDateFilter) : undefined}
            getStatusForDate={getStatusForDate}
            onMonthChange={handleMonthChange}
            onSelectDate={(date) => {
              const dateStr = formatLocalDate(date);
              setSelectedDateFilter((prev) => (prev === dateStr ? null : dateStr));
              setPage(1);
            }}
          />
        </div>

        {/* Riwayat */}
        <div className="mt-4 flex items-end justify-between px-4">
          <div>
            <h2 className="text-base font-bold text-brand-navy">
              {RIWAYAT_TITLE[activeTab]}
            </h2>
            {selectedDateFilter ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-brand-cyan-dark font-bold">
                  Filter: {formatIndonesianDate(selectedDateFilter)}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDateFilter(null)}
                  className="text-[10px] text-red-500 font-bold hover:underline"
                >
                  (Hapus Filter)
                </button>
              </div>
            ) : null}
          </div>
          <span className="text-xs font-semibold text-brand-text-muted">
            {activities.length} aktifitas
          </span>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
          </div>
        ) : activities.length === 0 ? (
          <div className="mx-4 mt-3 rounded-2xl border border-brand-line bg-white p-6 text-center text-xs text-brand-text-muted">
            Belum ada riwayat setoran {activeTab} untuk bulan ini.
          </div>
        ) : (
          <div className="mt-2 space-y-3 px-4">
            {paged.map((a, i) => (
              <ActivityCard key={`${activeTab}-${safePage}-${i}`} {...a} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 ? (
          <div className="mt-4">
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}
