import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  ActivityCard,
  type ActivityCardProps,
} from "@/components/student/ActivityCard";
import {
  MonthCalendar,
} from "@/components/student/MonthCalendar";
import { Pagination } from "@/components/ui/Pagination";
import { TabBar } from "@/components/ui/TabBar";
import { api } from "@/lib/api";

const TABS = [
  { id: "ziyadah", label: "Ziyadah" },
  { id: "murojaah", label: "Murojaah" },
  { id: "tahsin", label: "Tahsin" },
];

const RIWAYAT_TITLE: Record<string, string> = {
  ziyadah: "Riwayat Ziyadah",
  murojaah: "Riwayat Murojaah",
  tahsin: "Riwayat Tahsin",
};

const PER_PAGE = 4;

const LEGEND = [
  { label: "Setoran", color: "bg-emerald-500" },
  { label: "Sakit", color: "bg-amber-500" },
  { label: "Izin", color: "bg-amber-400" },
  { label: "Alpa", color: "bg-red-500" },
];

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

interface StudentMonthlySummaryPageProps {
  initialTab?: string;
}

export function StudentMonthlySummaryPage({ initialTab: propInitialTab }: StudentMonthlySummaryPageProps) {
  const [activeTab, setActiveTab] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.hash.split("?")[1] || "").get("tab");
    return propInitialTab || fromUrl || "ziyadah";
  });

  useEffect(() => {
    if (propInitialTab && propInitialTab !== activeTab) {
      setActiveTab(propInitialTab);
    }
  }, [propInitialTab]);

  const [page, setPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(() => formatLocalDate(new Date()).slice(0, 7));
  const [setoranList, setSetoranList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await api.getSetoranHistory({ month: selectedMonth });
        setSetoranList(data || []);
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
  }

  function handleTabChange(id: string) {
    setActiveTab(id);
    setPage(1);
  }

  // Filter activities by tab (category code match or subcategory match)
  const filteredSetoran = setoranList.filter((s) => {
    const code = (s.subcategoryCode || s.categoryCode || "").toLowerCase();
    const name = (s.subcategoryName || s.categoryName || "").toLowerCase();
    if (activeTab === "ziyadah") return code.includes("ziyadah") || name.includes("ziyadah");
    if (activeTab === "murojaah") return code.includes("murojaah") || name.includes("murojaah");
    if (activeTab === "tahsin") return code.includes("tahsin") || code.includes("talaqi") || code.includes("sabiq") || name.includes("tahsin");
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

  function getStatusForDate(date: Date) {
    const dateStr = formatLocalDate(date);
    const entry = setoranList.find((s) => s.date === dateStr);
    if (entry) {
      if (entry.status === "sakit") return "sakit";
      if (entry.status === "alpa") return "alpa";
      return "setoran";
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
        <h1 className="text-2xl font-bold text-brand-cyan">Progress TTQ</h1>
        <div className="h-10 w-10" />
      </div>

      {/* Body */}
      <main className="flex-1 overflow-y-auto pb-8">
        {/* Tab navigasi */}
        <div className="px-4">
          <TabBar
            tabs={TABS}
            activeId={activeTab}
            onChange={handleTabChange}
          />
        </div>

        {/* Calendar */}
        <div className="mt-3 px-4">
          <MonthCalendar
            getStatusForDate={getStatusForDate}
            onMonthChange={handleMonthChange}
          />
        </div>

        {/* Legend */}
        <div className="mt-2 flex items-center justify-center gap-4 px-4">
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${l.color}`} />
              <span className="text-[10px] text-brand-text-muted">
                {l.label}
              </span>
            </div>
          ))}
        </div>

        {/* Riwayat */}
        <div className="mt-4 flex items-end justify-between px-4">
          <h2 className="text-base font-bold text-brand-navy">
            {RIWAYAT_TITLE[activeTab]}
          </h2>
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
