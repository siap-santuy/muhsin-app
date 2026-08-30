import { useState, useEffect } from "react";
import {
  BookOpen,
  CalendarDays,
  Loader2,
  Moon,
  PenLine,
  Sun,
  Utensils,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { MonthCalendar } from "@/components/student/MonthCalendar";
import { YaumiyahLogCard } from "@/components/student/YaumiyahLogCard";
import { YaumiyahStatCard } from "@/components/student/YaumiyahStatCard";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function StudentYaumiyahPage() {
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, historyData] = await Promise.all([
          api.getDailyIbadahStats({ month: currentMonth }),
          api.getDailyIbadahHistory({ month: currentMonth }),
        ]);
        setStats(statsData);
        setHistory(historyData);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentMonth]);

  function handleGoToInput() {
    window.location.hash = "#/yaumiyah-input";
  }

  function handleGoToView(date?: string) {
    if (date) sessionStorage.setItem("viewIbadahDate", date);
    window.location.hash = "#/yaumiyah-view";
  }

  const statItems = [
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
          <MonthCalendar />

          <Button
            type="button"
            onClick={handleGoToInput}
            className="h-11 w-full rounded-xl bg-brand-cyan font-bold uppercase tracking-wider text-white shadow-[0_2px_4px_rgba(34,186,208,0.3)] hover:bg-brand-cyan-dark"
          >
            <PenLine className="h-5 w-5 mr-2" /> ISI IBADAH HARI INI
          </Button>

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
                <h2 className="text-base font-bold text-brand-navy">Aktivitas Terakhir</h2>
                <div className="mt-3 space-y-2">
                  {history.length === 0 ? (
                    <div className="rounded-2xl border border-brand-line bg-white p-6 text-center text-xs text-brand-text-muted">
                      Belum ada catatan ibadah bulan ini. Klik tombol di atas untuk mengisi.
                    </div>
                  ) : (
                    history.slice(0, 5).map((log, i) => (
                      <YaumiyahLogCard
                        key={`${log.date}-${i}`}
                        date={log.date}
                        message={
                          log.status === "submitted"
                            ? "Ibadah yaumiyah berhasil terkirim"
                            : "Draft tersimpan (belum terkirim)"
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
