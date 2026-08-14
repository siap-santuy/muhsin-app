import {
  BookOpen,
  CalendarDays,
  Moon,
  PenLine,
  Sun,
  Utensils,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import {
  MonthCalendar,
} from "@/components/student/MonthCalendar";
import {
  YaumiyahLogCard,
} from "@/components/student/YaumiyahLogCard";
import {
  YaumiyahStatCard,
  type YaumiyahStatProps,
} from "@/components/student/YaumiyahStatCard";
import { Button } from "@/components/ui/button";

const STATS: YaumiyahStatProps[] = [
  {
    label: "Tilawah",
    countText: "12/30 kali",
    icon: BookOpen,
    iconClass: "text-brand-cyan",
  },
  {
    label: "Sholat Fardhu",
    countText: "20/150 kali",
    icon: CalendarDays,
    iconClass: "text-emerald-500",
  },
  {
    label: "Sunnah Rawatib",
    countText: "15/240 kali",
    icon: Sun,
    iconClass: "text-purple-500",
  },
  {
    label: "Tahajud",
    countText: "8/30 kali",
    icon: Moon,
    iconClass: "text-brand-navy",
  },
  {
    label: "Dhuha",
    countText: "8/30 kali",
    icon: Sun,
    iconClass: "text-amber-500",
  },
  {
    label: "Puasa",
    countText: "2/8 kali",
    icon: Utensils,
    iconClass: "text-orange-500",
  },
];

const LOGS = [
  { date: "11/07/2026", message: "Berhasil menyelesaikan ibadah yaumiyah" },
  { date: "10/07/2026", message: "Berhasil menyelesaikan ibadah yaumiyah" },
  { date: "09/07/2026", message: "Berhasil menyelesaikan ibadah yaumiyah" },
];

export function StudentYaumiyahPage() {
  function handleGoToInput() {
    window.location.hash = "#/yaumiyah-input";
  }

  function handleGoToView() {
    window.location.hash = "#/yaumiyah-view";
  }

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
            <PenLine className="h-5 w-5" /> ISI IBADAH HARI INI
          </Button>

          <section>
            <h2 className="text-base font-bold text-brand-navy">
              Progres Yaumiyah Bulan Ini
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {STATS.map((stat) => (
                <YaumiyahStatCard key={stat.label} {...stat} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-brand-navy">Aktivitas</h2>
            <div className="mt-3 space-y-2">
              {LOGS.map((log, i) => (
                <YaumiyahLogCard
                  key={`${log.date}-${i}`}
                  {...log}
                  onView={handleGoToView}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
      <BottomNav activeIndex={1} />
    </div>
  );
}
