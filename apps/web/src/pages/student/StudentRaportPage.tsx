import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";

interface MonthItem {
  name: string;
  status: "completed" | "in_progress" | "upcoming";
}

const SEMESTER_1_MONTHS: MonthItem[] = [
  { name: "Juli", status: "completed" },
  { name: "Agustus", status: "in_progress" },
  { name: "September", status: "upcoming" },
  { name: "Oktober", status: "upcoming" },
  { name: "November", status: "upcoming" },
  { name: "Desember", status: "upcoming" },
];

const SEMESTER_2_MONTHS: MonthItem[] = [
  { name: "Januari", status: "upcoming" },
  { name: "Februari", status: "upcoming" },
  { name: "Maret", status: "upcoming" },
  { name: "April", status: "upcoming" },
  { name: "Mei", status: "upcoming" },
  { name: "Juni", status: "upcoming" },
];

const STATUS_DOT: Record<MonthItem["status"], string> = {
  completed: "bg-brand-cyan",
  in_progress: "bg-amber-500",
  upcoming: "bg-gray-300",
};

const STATUS_BORDER: Record<MonthItem["status"], string> = {
  completed: "border-gray-200 text-brand-navy",
  in_progress: "border-gray-200 text-brand-navy",
  upcoming: "border-gray-200 text-brand-navy",
};

interface StudentRaportPageProps {
  onNavigateToMonthly?: () => void;
  onNavigateToSemester?: () => void;
}

export function StudentRaportPage({
  onNavigateToMonthly,
  onNavigateToSemester,
}: StudentRaportPageProps) {
  const [selectedYear, setSelectedYear] = useState("2026/2027");
  const [selectedMonth, setSelectedMonth] = useState<string>("Agustus");

  function handleMonthlyClick() {
    if (onNavigateToMonthly) {
      onNavigateToMonthly();
    } else {
      window.location.hash = "#/monthly-raport";
    }
  }

  function handleSemesterClick() {
    if (onNavigateToSemester) {
      onNavigateToSemester();
    } else {
      window.location.hash = "#/semester-raport";
    }
  }

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      <AppHeader />

      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-1">
        <div className="flex flex-col gap-4">
          {/* Academic Year Dropdown */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-brand-navy/30 bg-white px-4 py-3 text-sm font-bold text-brand-navy outline-none shadow-sm"
            >
              <option value="2026/2027">Tahun Ajaran 2026/2027</option>
              <option value="2025/2026">Tahun Ajaran 2025/2026</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-navy" />
          </div>

          {/* Academic Period Selector Card */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            {/* Semester 1 Grid */}
            <div className="grid grid-cols-3 gap-2">
              {SEMESTER_1_MONTHS.map((m) => {
                const isSelected = selectedMonth === m.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setSelectedMonth(m.name)}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 py-2 transition-all ${
                      isSelected
                        ? "border-brand-cyan bg-brand-cyan/5 shadow-sm"
                        : STATUS_BORDER[m.status]
                    }`}
                  >
                    <span className="text-xs font-bold">{m.name}</span>
                    <span
                      className={`mt-1 h-2 w-2 rounded-full ${STATUS_DOT[m.status]}`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Semester 1 Divider/Bar */}
            <div className="my-3 flex items-center justify-center gap-1.5 border-t border-b border-amber-400 py-1.5">
              <span className="text-xs font-bold text-brand-navy">
                Semester 1
              </span>
              <span className="h-2 w-2 rounded-full bg-amber-500" />
            </div>

            {/* Semester 2 Grid */}
            <div className="grid grid-cols-3 gap-2">
              {SEMESTER_2_MONTHS.map((m) => {
                const isSelected = selectedMonth === m.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setSelectedMonth(m.name)}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 py-2 transition-all ${
                      isSelected
                        ? "border-brand-cyan bg-brand-cyan/5 shadow-sm"
                        : STATUS_BORDER[m.status]
                    }`}
                  >
                    <span className="text-xs font-bold">{m.name}</span>
                    <span
                      className={`mt-1 h-2 w-2 rounded-full ${STATUS_DOT[m.status]}`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Semester 2 Divider/Bar */}
            <div className="mt-3 flex items-center justify-center gap-1.5 border-t border-gray-200 pt-2">
              <span className="text-xs font-semibold text-brand-text-muted">
                Semester 2
              </span>
              <span className="h-2 w-2 rounded-full bg-gray-300" />
            </div>
          </section>

          {/* Action Card: Raport Bulanan */}
          <button
            type="button"
            onClick={handleMonthlyClick}
            className="flex w-full items-center justify-between rounded-2xl border-2 border-brand-cyan bg-white p-4 shadow-sm transition-all hover:bg-brand-cyan/5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="h-6 w-6" />
              </span>
              <div className="text-left">
                <h2 className="text-base font-bold text-brand-navy">
                  Lihat Raport Bulanan
                </h2>
                <p className="text-xs font-medium text-brand-text-muted">
                  Rekapitulasi pencapaian bulanan
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-brand-navy" />
          </button>

          {/* Action Card: Raport Semester */}
          <button
            type="button"
            onClick={handleSemesterClick}
            className="flex w-full items-center justify-between rounded-2xl border-2 border-brand-cyan/40 bg-white p-4 shadow-sm transition-all hover:bg-brand-cyan/5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan">
                <GraduationCap className="h-6 w-6" />
              </span>
              <div className="text-left">
                <h2 className="text-base font-bold text-brand-navy">
                  Lihat Raport Semester
                </h2>
                <p className="text-xs font-medium text-brand-text-muted">
                  Dokumen hasil akhir semester
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-brand-navy" />
          </button>
        </div>
      </main>

      <BottomNav activeIndex={2} />
    </div>
  );
}
