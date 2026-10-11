import { useState, useEffect } from "react";
import {
  BookOpen,
  CalendarDays,
  Loader2,
  Moon,
  Sun,
  Utensils,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { MonthCalendar } from "@/components/student/MonthCalendar";
import { YaumiyahLogCard } from "@/components/student/YaumiyahLogCard";
import {
  YaumiyahStatCard,
  type YaumiyahStatProps,
} from "@/components/student/YaumiyahStatCard";
import { api } from "@/lib/api";

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function ParentYaumiyahPage() {
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const todayStr = formatLocalDate(new Date());
  const [selectedMonth, setSelectedMonth] = useState(() => todayStr.slice(0, 7));

  useEffect(() => {
    async function load() {
      try {
        const storedChildId = typeof window !== "undefined" ? localStorage.getItem("parent_active_child_id") || undefined : undefined;
        const [dashData, statsData, histData] = await Promise.all([
          api.getDashboardSummary(),
          api.getDailyIbadahStats({ studentId: storedChildId, month: selectedMonth }),
          api.getDailyIbadahHistory({ studentId: storedChildId, month: selectedMonth }),
        ]);
        setSummary(dashData);
        if (dashData?.childId && typeof window !== "undefined") {
          localStorage.setItem("parent_active_child_id", dashData.childId);
        }
        setStats(statsData);
        setHistory(histData);
      } catch {
        // Fallback
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

  function getStatusForDate(date: Date) {
    const dateStr = formatLocalDate(date);
    const entry = history.find((h) => h.date === dateStr);
    if (entry) {
      return entry.status === "submitted" ? "submitted" : "draft";
    }
    return undefined;
  }

  function handleGoToView(date?: string) {
    if (date) {
      window.location.hash = `#/yaumiyah-view?date=${date}`;
    } else {
      window.location.hash = "#/yaumiyah-view";
    }
  }

  const childName = summary?.childName ?? "Ananda";

  const statItems: YaumiyahStatProps[] = [
    {
      label: "Tilawah",
      countText: `${stats?.tilawahDaysCount ?? 0}/30 hari`,
      icon: BookOpen,
      iconClass: "text-brand-cyan",
    },
    {
      label: "Sholat Fardhu",
      countText: `${stats?.fardhuOnTimeCount ?? 0}/150 waktu`,
      icon: CalendarDays,
      iconClass: "text-emerald-500",
    },
    {
      label: "Sunnah Rawatib",
      countText: `${stats?.rawatibTotalCount ?? 0} rakaat/slot`,
      icon: Sun,
      iconClass: "text-purple-500",
    },
    {
      label: "Tahajud",
      countText: `${stats?.tahajudDaysCount ?? 0}/30 hari`,
      icon: Moon,
      iconClass: "text-brand-navy",
    },
    {
      label: "Dhuha",
      countText: `${stats?.dhuhaDaysCount ?? 0}/30 hari`,
      icon: Sun,
      iconClass: "text-amber-500",
    },
    {
      label: "Puasa",
      countText: `${stats?.puasaDaysCount ?? 0}/8 hari`,
      icon: Utensils,
      iconClass: "text-orange-500",
    },
  ];

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      <AppHeader />
      <main className="flex-1 overflow-y-auto px-4 pt-1 pb-4">
        <div className="flex flex-col gap-4">
          {/* Header context ananda */}
          <div className="rounded-xl border border-brand-cyan/30 bg-brand-cyan/5 px-3 py-2 text-center">
            <p className="text-xs font-bold text-brand-navy">
              Memantau Ibadah: <span className="text-brand-cyan-dark">{childName}</span>
            </p>
          </div>

          <MonthCalendar
            mode="yaumiyah"
            getStatusForDate={getStatusForDate}
            onMonthChange={handleMonthChange}
            onSelectDate={(date) => {
              const dateStr = formatLocalDate(date);
              handleGoToView(dateStr);
            }}
          />

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
            </div>
          ) : (
            <>
              <section>
                <h2 className="text-base font-bold text-brand-navy">
                  Progres Yaumiyah Bulan Ini
                </h2>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {statItems.map((stat) => (
                    <YaumiyahStatCard key={stat.label} {...stat} />
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-base font-bold text-brand-navy">Aktivitas</h2>
                <div className="mt-3 space-y-2">
                  {history.length === 0 ? (
                    <div className="rounded-2xl border border-brand-line bg-white p-6 text-center text-xs text-brand-text-muted">
                      Belum ada catatan ibadah bulan ini.
                    </div>
                  ) : (
                    history.slice(0, 5).map((log, i) => (
                      <YaumiyahLogCard
                        key={`${log.date}-${i}`}
                        date={log.date}
                        message={
                          log.status === "submitted"
                            ? `${childName} telah menyelesaikan ibadah yaumiyah`
                            : `Draft ibadah tersimpan (belum terkirim)`
                        }
                        onView={() => handleGoToView(log.date)}
                      />
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      <BottomNav activeIndex={1} />
    </div>
  );
}
