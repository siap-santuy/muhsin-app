import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { api } from "@/lib/api";

interface MonthDef {
  name: string;
  semester: 1 | 2;
  offset: number;
}

const ACADEMIC_MONTHS: MonthDef[] = [
  { name: "Juli", semester: 1, offset: 0 },
  { name: "Agustus", semester: 1, offset: 1 },
  { name: "September", semester: 1, offset: 2 },
  { name: "Oktober", semester: 1, offset: 3 },
  { name: "November", semester: 1, offset: 4 },
  { name: "Desember", semester: 1, offset: 5 },
  { name: "Januari", semester: 2, offset: 6 },
  { name: "Februari", semester: 2, offset: 7 },
  { name: "Maret", semester: 2, offset: 8 },
  { name: "April", semester: 2, offset: 9 },
  { name: "Mei", semester: 2, offset: 10 },
  { name: "Juni", semester: 2, offset: 11 },
];

const SEMESTER_1_MONTHS = ACADEMIC_MONTHS.filter((m) => m.semester === 1);
const SEMESTER_2_MONTHS = ACADEMIC_MONTHS.filter((m) => m.semester === 2);

function getCurrentAcademicOffset(): number {
  const now = new Date();
  const month = now.getMonth();
  return month >= 6 ? month - 6 : month + 6;
}

interface ParentRaportPageProps {
  onNavigateToMonthly?: (month?: string, year?: string) => void;
  onNavigateToSemester?: (semester?: number, year?: string) => void;
}

export function ParentRaportPage({
  onNavigateToMonthly,
  onNavigateToSemester,
}: ParentRaportPageProps) {
  const currentOffset = getCurrentAcademicOffset();
  const defaultMonthOffset = Math.max(0, currentOffset - 1);
  const defaultMonth = ACADEMIC_MONTHS[defaultMonthOffset];

  const [selectedYear, setSelectedYear] = useState("2026/2027");
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth.name);
  const [selectedSemester, setSelectedSemester] = useState<number>(
    defaultMonth.semester
  );
  const [childName, setChildName] = useState<string>("Ananda");
  const [childClass, setChildClass] = useState<string>("");

  useEffect(() => {
    api.getDashboardSummary()
      .then((summary) => {
        if (summary?.childName) setChildName(summary.childName);
        if (summary?.childClassName) setChildClass(summary.childClassName);
      })
      .catch(() => {});
  }, []);

  const isPastYear = selectedYear !== "2026/2027";

  function getMonthStatus(offset: number) {
    if (isPastYear) return { isAvailable: true, status: "done" };
    if (offset < currentOffset) return { isAvailable: true, status: "done" };
    if (offset === currentOffset) return { isAvailable: false, status: "ongoing" };
    return { isAvailable: false, status: "none" };
  }

  function getSemesterStatus(sem: 1 | 2) {
    if (isPastYear) return { isAvailable: true, status: "done" };
    const targetEndOffset = sem === 1 ? 5 : 11;
    if (currentOffset > targetEndOffset) return { isAvailable: true, status: "done" };
    if (currentOffset >= (sem === 1 ? 0 : 6) && currentOffset <= targetEndOffset) {
      return { isAvailable: false, status: "ongoing" };
    }
    return { isAvailable: false, status: "none" };
  }

  const sem1 = getSemesterStatus(1);
  const sem2 = getSemesterStatus(2);

  const activeMonthDef = ACADEMIC_MONTHS.find((m) => m.name === selectedMonth) ?? defaultMonth;
  const activeMonthStatus = getMonthStatus(activeMonthDef.offset);
  const activeSemesterStatus = getSemesterStatus(selectedSemester as 1 | 2);

  function handleSelectMonth(m: MonthDef) {
    const { isAvailable } = getMonthStatus(m.offset);
    if (!isAvailable) return;
    setSelectedMonth(m.name);
    setSelectedSemester(m.semester);
  }

  function handleSelectSemester(sem: 1 | 2) {
    const { isAvailable } = getSemesterStatus(sem);
    if (!isAvailable) return;
    setSelectedSemester(sem);
  }

  function handleMonthlyClick() {
    if (!activeMonthStatus.isAvailable) return;
    if (onNavigateToMonthly) {
      onNavigateToMonthly(selectedMonth, selectedYear);
    } else {
      const params = new URLSearchParams({ month: selectedMonth, year: selectedYear });
      window.location.hash = `#/monthly-raport?${params.toString()}`;
    }
  }

  function handleSemesterClick() {
    if (!activeSemesterStatus.isAvailable) return;
    const semName = selectedSemester === 1 ? "Ganjil" : "Genap";
    if (onNavigateToSemester) {
      onNavigateToSemester(selectedSemester, selectedYear);
    } else {
      const params = new URLSearchParams({
        semester: semName,
        year: selectedYear,
      });
      window.location.hash = `#/semester-raport?${params.toString()}`;
    }
  }

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      <AppHeader />

      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-1">
        <div className="flex flex-col gap-4">
          {/* Header context ananda */}
          <div className="rounded-xl border border-brand-cyan/30 bg-brand-cyan/5 px-3 py-2 text-center">
            <p className="text-xs font-bold text-brand-navy">
              Raport TTQ Ananda: <span className="text-brand-cyan-dark">{childName}</span>
              {childClass ? <span className="text-brand-text-muted font-normal"> ({childClass})</span> : null}
            </p>
          </div>

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
                const { isAvailable, status } = getMonthStatus(m.offset);

                return (
                  <button
                    key={m.name}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => handleSelectMonth(m)}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 py-2 transition-all ${
                      !isAvailable
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                        : isSelected
                        ? "border-brand-cyan bg-brand-cyan/5 text-brand-navy shadow-sm"
                        : "border-gray-200 text-brand-navy hover:border-brand-cyan/40"
                    }`}
                  >
                    <span className="text-xs font-bold">{m.name}</span>
                    <span
                      className={`mt-1 h-2 w-2 rounded-full ${
                        status === "done"
                          ? "bg-emerald-500"
                          : status === "ongoing"
                          ? "bg-amber-500"
                          : "bg-gray-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Semester 1 Button / Divider */}
            <button
              type="button"
              disabled={!sem1.isAvailable}
              onClick={() => handleSelectSemester(1)}
              className={`my-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 py-1.5 transition-all ${
                !sem1.isAvailable
                  ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                  : selectedSemester === 1
                  ? sem1.status === "ongoing"
                    ? "border-amber-500 bg-amber-50 text-brand-navy shadow-sm"
                    : "border-brand-cyan bg-brand-cyan/10 text-brand-navy shadow-sm"
                  : sem1.status === "ongoing"
                  ? "border-amber-300 text-brand-navy hover:border-amber-400"
                  : "border-gray-200 text-brand-navy hover:border-brand-cyan/40"
              }`}
            >
              <span className="text-xs font-bold">Semester 1</span>
              <span
                className={`h-2 w-2 rounded-full ${
                  sem1.status === "done"
                    ? "bg-emerald-500"
                    : sem1.status === "ongoing"
                    ? "bg-amber-500"
                    : "bg-gray-300"
                }`}
              />
            </button>

            {/* Semester 2 Grid */}
            <div className="grid grid-cols-3 gap-2">
              {SEMESTER_2_MONTHS.map((m) => {
                const isSelected = selectedMonth === m.name;
                const { isAvailable, status } = getMonthStatus(m.offset);

                return (
                  <button
                    key={m.name}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => handleSelectMonth(m)}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 py-2 transition-all ${
                      !isAvailable
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                        : isSelected
                        ? "border-brand-cyan bg-brand-cyan/5 text-brand-navy shadow-sm"
                        : "border-gray-200 text-brand-navy hover:border-brand-cyan/40"
                    }`}
                  >
                    <span className="text-xs font-bold">{m.name}</span>
                    <span
                      className={`mt-1 h-2 w-2 rounded-full ${
                        status === "done"
                          ? "bg-emerald-500"
                          : status === "ongoing"
                          ? "bg-amber-500"
                          : "bg-gray-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Semester 2 Button / Divider */}
            <button
              type="button"
              disabled={!sem2.isAvailable}
              onClick={() => handleSelectSemester(2)}
              className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 py-1.5 transition-all ${
                !sem2.isAvailable
                  ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                  : selectedSemester === 2
                  ? sem2.status === "ongoing"
                    ? "border-amber-500 bg-amber-50 text-brand-navy shadow-sm"
                    : "border-brand-cyan bg-brand-cyan/10 text-brand-navy shadow-sm"
                  : sem2.status === "ongoing"
                  ? "border-amber-300 text-brand-navy hover:border-amber-400"
                  : "border-gray-200 text-brand-navy hover:border-brand-cyan/40"
              }`}
            >
              <span className="text-xs font-bold">Semester 2</span>
              <span
                className={`h-2 w-2 rounded-full ${
                  sem2.status === "done"
                    ? "bg-emerald-500"
                    : sem2.status === "ongoing"
                    ? "bg-amber-500"
                    : "bg-gray-300"
                }`}
              />
            </button>

            {/* Status Legend Notes */}
            <div className="mt-4 flex items-center justify-center gap-4 border-t border-brand-line/50 pt-3 text-[11px] font-medium text-brand-text-muted">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>On going</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Done</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gray-300" />
                <span>None</span>
              </div>
            </div>
          </section>

          {/* Action Card: Raport Bulanan */}
          <button
            type="button"
            disabled={!activeMonthStatus.isAvailable}
            onClick={handleMonthlyClick}
            className={`flex w-full items-center justify-between rounded-2xl border-2 p-4 shadow-sm transition-all ${
              !activeMonthStatus.isAvailable
                ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                : "border-brand-cyan bg-white hover:bg-brand-cyan/5"
            }`}
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
                  {!activeMonthStatus.isAvailable
                    ? `Bulan ${selectedMonth} sedang berjalan / terkunci`
                    : `Rekapitulasi pencapaian bulanan (${selectedMonth})`}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-brand-navy" />
          </button>

          {/* Action Card: Raport Semester */}
          <button
            type="button"
            disabled={!activeSemesterStatus.isAvailable}
            onClick={handleSemesterClick}
            className={`flex w-full items-center justify-between rounded-2xl border-2 p-4 shadow-sm transition-all ${
              !activeSemesterStatus.isAvailable
                ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                : "border-brand-cyan/40 bg-white hover:bg-brand-cyan/5"
            }`}
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
                  {!activeSemesterStatus.isAvailable
                    ? `Semester ${selectedSemester} sedang berjalan / terkunci`
                    : `Dokumen hasil akhir (Semester ${selectedSemester})`}
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
