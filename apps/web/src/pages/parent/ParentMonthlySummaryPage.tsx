import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  ActivityCard,
  type ActivityCardProps,
} from "@/components/student/ActivityCard";
import { MonthCalendar } from "@/components/student/MonthCalendar";
import { Pagination } from "@/components/ui/Pagination";
import { TabBar } from "@/components/ui/TabBar";

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

const ZIYADAH_ACTIVITIES: ActivityCardProps[] = [
  {
    date: "Sen, 2 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Ziyadah — Al-Baqarah: 1-5",
    metrics: [
      { label: "Tajwid", value: 90 },
      { label: "Kelancaran", value: 85 },
    ],
  },
  {
    date: "Sen, 9 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Ziyadah — Al-Baqarah: 6-10",
    metrics: [
      { label: "Tajwid", value: 95 },
      { label: "Kelancaran", value: 90 },
    ],
  },
  {
    date: "Rab, 11 Nov 2025",
    statusLabel: "Izin",
    statusType: "izin",
    title: "Ziyadah — Al-Baqarah: 11-15",
  },
];

const MUROJAAH_ACTIVITIES: ActivityCardProps[] = [
  {
    date: "Sel, 3 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Murojaah — Al-Fatihah: 1-7",
    metrics: [
      { label: "Tajwid", value: 95 },
      { label: "Kelancaran", value: 98 },
    ],
  },
  {
    date: "Kam, 5 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Murojaah — An-Nas: 1-6",
    metrics: [
      { label: "Tajwid", value: 92 },
      { label: "Kelancaran", value: 95 },
    ],
  },
];

const TAHSIN_ACTIVITIES: ActivityCardProps[] = [
  {
    date: "Sel, 3 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Talaqi — Halaman 5-10",
    metrics: [
      { label: "Makhroj", value: 85 },
      { label: "Tajwid", value: 90 },
      { label: "Kelancaran", value: 88 },
      { label: "Fashohah", value: 82 },
    ],
  },
];

const ACTIVITIES_MAP: Record<string, ActivityCardProps[]> = {
  ziyadah: ZIYADAH_ACTIVITIES,
  murojaah: MUROJAAH_ACTIVITIES,
  tahsin: TAHSIN_ACTIVITIES,
};

const PER_PAGE = 4;

const LEGEND = [
  { label: "Setoran", color: "bg-emerald-500" },
  { label: "Sakit", color: "bg-amber-500" },
  { label: "Izin", color: "bg-amber-400" },
  { label: "Alpa", color: "bg-red-500" },
];

export function ParentMonthlySummaryPage() {
  const [activeTab, setActiveTab] = useState("ziyadah");
  const [page, setPage] = useState(1);

  const activities = ACTIVITIES_MAP[activeTab] ?? [];
  const totalPages = Math.max(1, Math.ceil(activities.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = activities.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE
  );

  function handleTabChange(id: string) {
    setActiveTab(id);
    setPage(1);
  }

  function handleBack() {
    window.location.hash = "#/dashboard";
  }

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between bg-brand-page px-4 py-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Kembali"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-cyan/10"
        >
          <ArrowLeft className="h-4 w-4 text-brand-cyan" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-brand-cyan">Progress TTQ</h1>
          <p className="text-[11px] font-semibold text-brand-navy">Ananda: Fulan bin Fulan</p>
        </div>
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
          <MonthCalendar />
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
        <div className="mt-2 space-y-3 px-4">
          {paged.map((a, i) => (
            <ActivityCard key={`${activeTab}-${safePage}-${i}`} {...a} />
          ))}
        </div>

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
