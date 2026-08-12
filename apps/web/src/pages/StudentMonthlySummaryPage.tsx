import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  ActivityCard,
  type ActivityCardProps,
} from "@/components/student/ActivityCard";
import {
  MonthCalendar,
  type DayStatus,
} from "@/components/student/MonthCalendar";
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

const MONTH_DAYS = [
  { day: 1, status: "empty" },
  { day: 2, status: "empty" },
  { day: 3, status: "setoran" },
  { day: 4, status: "empty" },
  { day: 5, status: "setoran" },
  { day: 6, status: "sakit" },
  { day: 7, status: "empty" },
  { day: 8, status: "setoran" },
  { day: 9, status: "setoran" },
  { day: 10, status: "setoran" },
  { day: 11, status: "alpa" },
  { day: 12, status: "empty" },
  { day: 13, status: "setoran" },
  { day: 14, status: "empty" },
  { day: 15, status: "setoran" },
  { day: 16, status: "sakit" },
  { day: 17, status: "setoran" },
  { day: 18, status: "setoran" },
  { day: 19, status: "empty" },
  { day: 20, status: "setoran" },
  { day: 21, status: "empty" },
  { day: 22, status: "setoran" },
  { day: 23, status: "setoran" },
  { day: 24, status: "empty" },
  { day: 25, status: "setoran" },
  { day: 26, status: "alpa" },
  { day: 27, status: "setoran" },
  { day: 28, status: "setoran" },
  { day: 29, status: "setoran" },
  { day: 30, status: "setoran" },
].map((d) => ({ ...d, status: d.status as DayStatus["status"] }));

// --- Mock data per tab ---

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
  {
    date: "Sen, 16 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Ziyadah — Al-Baqarah: 11-16",
    metrics: [
      { label: "Tajwid", value: 88 },
      { label: "Kelancaran", value: 92 },
    ],
  },
  {
    date: "Sel, 17 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Ziyadah — Al-Baqarah: 17-20",
    metrics: [
      { label: "Tajwid", value: 91 },
      { label: "Kelancaran", value: 88 },
    ],
  },
  {
    date: "Kam, 20 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Ziyadah — Al-Baqarah: 21-25",
    metrics: [
      { label: "Tajwid", value: 93 },
      { label: "Kelancaran", value: 90 },
    ],
  },
  {
    date: "Sen, 22 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Ziyadah — Al-Baqarah: 26-30",
    metrics: [
      { label: "Tajwid", value: 87 },
      { label: "Kelancaran", value: 85 },
    ],
  },
  {
    date: "Kam, 25 Nov 2025",
    statusLabel: "Alpa",
    statusType: "alpa",
    title: "Ziyadah — Al-Baqarah: 31-35",
  },
  {
    date: "Jum, 27 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Ziyadah — Al-Baqarah: 31-35",
    metrics: [
      { label: "Tajwid", value: 89 },
      { label: "Kelancaran", value: 91 },
    ],
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
  {
    date: "Rab, 11 Nov 2025",
    statusLabel: "Sakit",
    statusType: "sakit",
    title: "Murojaah — Al-Falaq: 1-5",
  },
  {
    date: "Sen, 16 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Murojaah — Al-Ikhlas: 1-4",
    metrics: [
      { label: "Tajwid", value: 100 },
      { label: "Kelancaran", value: 100 },
    ],
  },
  {
    date: "Rab, 18 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Murojaah — Al-Lahab: 1-5",
    metrics: [
      { label: "Tajwid", value: 88 },
      { label: "Kelancaran", value: 90 },
    ],
  },
  {
    date: "Sen, 22 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Murojaah — An-Nashr: 1-3",
    metrics: [
      { label: "Tajwid", value: 94 },
      { label: "Kelancaran", value: 96 },
    ],
  },
  {
    date: "Kam, 25 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Murojaah — Al-Kafirun: 1-6",
    metrics: [
      { label: "Tajwid", value: 90 },
      { label: "Kelancaran", value: 93 },
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
  {
    date: "Kam, 5 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Sabiq — Review Halaman 1-5",
    metrics: [
      { label: "Makhroj", value: 92 },
      { label: "Tajwid", value: 95 },
      { label: "Kelancaran", value: 90 },
      { label: "Fashohah", value: 88 },
    ],
  },
  {
    date: "Rab, 11 Nov 2025",
    statusLabel: "Izin",
    statusType: "izin",
    title: "Talaqi — Halaman 11-15",
  },
  {
    date: "Sen, 16 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Talaqi — Halaman 11-15",
    metrics: [
      { label: "Makhroj", value: 88 },
      { label: "Tajwid", value: 92 },
      { label: "Kelancaran", value: 85 },
      { label: "Fashohah", value: 80 },
    ],
  },
  {
    date: "Rab, 18 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Sabiq — Review Halaman 6-10",
    metrics: [
      { label: "Makhroj", value: 90 },
      { label: "Tajwid", value: 93 },
      { label: "Kelancaran", value: 92 },
      { label: "Fashohah", value: 86 },
    ],
  },
  {
    date: "Sen, 22 Nov 2025",
    statusLabel: "Sakit",
    statusType: "sakit",
    title: "Talaqi — Halaman 16-20",
  },
  {
    date: "Kam, 25 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Talaqi — Halaman 16-20",
    metrics: [
      { label: "Makhroj", value: 87 },
      { label: "Tajwid", value: 91 },
      { label: "Kelancaran", value: 89 },
      { label: "Fashohah", value: 84 },
    ],
  },
  {
    date: "Jum, 27 Nov 2025",
    statusLabel: "Setoran",
    statusType: "setoran",
    title: "Sabiq — Review Halaman 11-15",
    metrics: [
      { label: "Makhroj", value: 93 },
      { label: "Tajwid", value: 96 },
      { label: "Kelancaran", value: 94 },
      { label: "Fashohah", value: 90 },
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

export function StudentMonthlySummaryPage() {
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

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between bg-brand-page px-4 py-3">
        <button
          type="button"
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
          <MonthCalendar monthYear="November 2025" days={MONTH_DAYS} />
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
