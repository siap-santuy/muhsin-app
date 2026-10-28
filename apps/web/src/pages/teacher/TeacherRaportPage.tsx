import { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  ChevronDown,
  Loader2,
  Search,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, TEACHER_NAV_ITEMS } from "@/components/layout/BottomNav";
import { Pagination } from "@/components/ui/Pagination";
import { api } from "@/lib/api";

interface MonthDef {
  name: string;
  monthNum: string;
  semester: 1 | 2;
  offset: number;
}

const ACADEMIC_MONTHS: MonthDef[] = [
  { name: "Juli", monthNum: "07", semester: 1, offset: 0 },
  { name: "Agustus", monthNum: "08", semester: 1, offset: 1 },
  { name: "September", monthNum: "09", semester: 1, offset: 2 },
  { name: "Oktober", monthNum: "10", semester: 1, offset: 3 },
  { name: "November", monthNum: "11", semester: 1, offset: 4 },
  { name: "Desember", monthNum: "12", semester: 1, offset: 5 },
  { name: "Januari", monthNum: "01", semester: 2, offset: 6 },
  { name: "Februari", monthNum: "02", semester: 2, offset: 7 },
  { name: "Maret", monthNum: "03", semester: 2, offset: 8 },
  { name: "April", monthNum: "04", semester: 2, offset: 9 },
  { name: "Mei", monthNum: "05", semester: 2, offset: 10 },
  { name: "Juni", monthNum: "06", semester: 2, offset: 11 },
];

const SEMESTER_1_MONTHS = ACADEMIC_MONTHS.filter((m) => m.semester === 1);
const SEMESTER_2_MONTHS = ACADEMIC_MONTHS.filter((m) => m.semester === 2);

function getCurrentAcademicOffset(): number {
  const now = new Date();
  const month = now.getMonth();
  return month >= 6 ? month - 6 : month + 6;
}

interface StudentOption {
  id: string;
  name: string;
  className: string | null;
}

interface RaportSummaryItem {
  rank: number;
  studentId: string;
  studentName: string;
  className: string;
  tahfidzScore: number;
  tahfidzGrade: string;
  tahsinScore: number;
  tahsinGrade: string;
  yaumiyahGrade: string;
  kehadiranCount: number;
  kehadiranRatio: string;
  nilaiAkhir: number;
  gradeAkhir: string;
  arabicPredicate: string;
  isUnderTarget: boolean;
}

export function TeacherRaportPage() {
  const currentOffset = getCurrentAcademicOffset();
  const defaultMonthOffset = Math.max(0, currentOffset - 1);
  const defaultMonth = ACADEMIC_MONTHS[defaultMonthOffset] || ACADEMIC_MONTHS[3];

  // View mode tab: "rekap" (Leaderboard) vs "per_anak"
  const [viewTab, setViewTab] = useState<"rekap" | "per_anak">("rekap");

  // Filter states
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("2026/2027");
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth.name);
  const [selectedSemester, setSelectedSemester] = useState<number>(defaultMonth.semester);

  // Rekap specific states
  const [summaryMode, setSummaryMode] = useState<"monthly" | "semester">("monthly");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyUnderTarget, setOnlyUnderTarget] = useState(false);
  const [sortField, setSortField] = useState<"rank" | "name">("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Summary data
  const [summaryItems, setSummaryItems] = useState<RaportSummaryItem[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Pagination for mobile leaderboard cards
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Derive years
  const [startYearStr, endYearStr] = selectedYear.split("/").map((s) => s.trim());
  const startYr = Number(startYearStr) || 2026;
  const endYr = Number(endYearStr) || startYr + 1;

  // Derive current month definition
  const currentMonthDef = ACADEMIC_MONTHS.find((m) => m.name === selectedMonth) || defaultMonth;
  const formattedMonthStr = `${currentMonthDef.semester === 1 ? startYr : endYr}-${currentMonthDef.monthNum}`;

  // Load students list
  useEffect(() => {
    async function load() {
      try {
        const studentList = await api.getStudents();
        setStudents(studentList);
      } catch {
        // Fallback
      }
    }
    load();
  }, []);

  // Classes list
  const classesList = useMemo(() => {
    return Array.from(
      new Set(students.map((s) => s.className).filter(Boolean) as string[])
    );
  }, [students]);

  // Filter students for per_anak
  const filteredStudents = useMemo(() => {
    if (selectedClass === "all") return students;
    return students.filter((s) => s.className === selectedClass);
  }, [students, selectedClass]);

  useEffect(() => {
    if (filteredStudents.length > 0 && !filteredStudents.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(filteredStudents[0].id);
    }
  }, [filteredStudents, selectedStudentId]);

  // Fetch summary when filters change
  useEffect(() => {
    if (viewTab !== "rekap") return;
    let isMounted = true;
    setLoadingSummary(true);

    const semName = selectedSemester === 1 ? "Ganjil" : "Genap";
    const params: any = {
      mode: summaryMode,
      className: selectedClass !== "all" ? selectedClass : undefined,
    };

    if (summaryMode === "monthly") {
      params.month = formattedMonthStr;
    } else {
      params.semester = semName;
      params.tahunAjaran = selectedYear;
    }

    api.getRaportSummary(params)
      .then((data) => {
        if (isMounted) {
          setSummaryItems(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (isMounted) setSummaryItems([]);
      })
      .finally(() => {
        if (isMounted) setLoadingSummary(false);
      });

    return () => {
      isMounted = false;
    };
  }, [viewTab, summaryMode, formattedMonthStr, selectedSemester, selectedYear, selectedClass]);

  // Client-side filtering & sorting for summary
  const processedSummary = useMemo(() => {
    let result = [...summaryItems];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.studentName.toLowerCase().includes(q) ||
          i.className.toLowerCase().includes(q)
      );
    }

    if (onlyUnderTarget) {
      result = result.filter((i) => i.isUnderTarget);
    }

    result.sort((a, b) => {
      if (sortField === "rank") {
        return sortDirection === "asc" ? a.rank - b.rank : b.rank - a.rank;
      } else {
        const cmp = a.studentName.localeCompare(b.studentName);
        return sortDirection === "asc" ? cmp : -cmp;
      }
    });

    return result;
  }, [summaryItems, searchQuery, onlyUnderTarget, sortField, sortDirection]);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, onlyUnderTarget, sortField, sortDirection, selectedClass, summaryMode, formattedMonthStr, selectedSemester, selectedYear]);

  // Paginated items for mobile leaderboard cards
  const totalPages = Math.max(1, Math.ceil(processedSummary.length / PAGE_SIZE));
  const paginatedSummary = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return processedSummary.slice(start, start + PAGE_SIZE);
  }, [processedSummary, currentPage, PAGE_SIZE]);

  // Quick stats
  const summaryStats = useMemo(() => {
    const total = summaryItems.length;
    const scores = summaryItems.map((i) => i.nilaiAkhir).filter((s) => s > 0);
    const avgScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;
    const underTarget = summaryItems.filter((i) => i.isUnderTarget).length;
    return { total, avgScore, underTarget };
  }, [summaryItems]);

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

  function handleSelectMonth(m: MonthDef) {
    const { isAvailable } = getMonthStatus(m.offset);
    if (!isAvailable) return;
    setSelectedMonth(m.name);
    setSelectedSemester(m.semester);
    const params = new URLSearchParams({
      month: m.name,
      year: selectedYear,
      studentId: selectedStudentId,
    });
    window.location.hash = `#/monthly-raport?${params.toString()}`;
  }

  function handleSelectSemester(sem: 1 | 2) {
    const { isAvailable } = getSemesterStatus(sem);
    if (!isAvailable) return;
    setSelectedSemester(sem);
    const semName = sem === 1 ? "Ganjil" : "Genap";
    const params = new URLSearchParams({
      semester: semName,
      year: selectedYear,
      studentId: selectedStudentId,
    });
    window.location.hash = `#/semester-raport?${params.toString()}`;
  }

  function handleOpenStudentReport(studentId: string) {
    const semName = selectedSemester === 1 ? "Ganjil" : "Genap";
    if (summaryMode === "monthly") {
      window.location.hash = `#/monthly-raport?studentId=${studentId}&month=${selectedMonth}&year=${selectedYear}`;
    } else {
      window.location.hash = `#/semester-raport?studentId=${studentId}&semester=${semName}&year=${selectedYear}`;
    }
  }

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      <AppHeader />

      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-1">
        <div className="flex flex-col gap-3.5">
          {/* Header Title & Tab Switcher */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-extrabold text-brand-navy">Raport &amp; Rekap Nilai</h1>
              <p className="text-[11px] text-brand-text-muted">
                {viewTab === "rekap" ? "Pemetaan nilai & ranking kolektif" : "Pilihan lembar rapor per santri"}
              </p>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex rounded-xl bg-gray-200/80 p-0.5 text-xs font-bold text-brand-navy shrink-0">
              <button
                type="button"
                onClick={() => setViewTab("rekap")}
                className={`rounded-lg px-2.5 py-1.5 transition-all text-[11px] ${
                  viewTab === "rekap"
                    ? "bg-white text-brand-cyan shadow-xs"
                    : "text-brand-text-muted hover:text-brand-navy"
                }`}
              >
                Rekap Kelas
              </button>
              <button
                type="button"
                onClick={() => setViewTab("per_anak")}
                className={`rounded-lg px-2.5 py-1.5 transition-all text-[11px] ${
                  viewTab === "per_anak"
                    ? "bg-white text-brand-cyan shadow-xs"
                    : "text-brand-text-muted hover:text-brand-navy"
                }`}
              >
                Per Anak
              </button>
            </div>
          </div>

          {/* VIEW TAB 1: REKAP KELAS (LEADERBOARD MOBILE) */}
          {viewTab === "rekap" && (
            <div className="space-y-3">
              {/* Filter Card */}
              <div className="rounded-2xl border border-brand-line bg-white p-3.5 shadow-sm space-y-3">
                {/* Mode Selector Pill & Class */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-brand-navy block mb-1">
                      Mode Rekap
                    </label>
                    <div className="flex rounded-xl bg-gray-100 p-0.5 text-xs font-bold text-brand-navy">
                      <button
                        type="button"
                        onClick={() => setSummaryMode("monthly")}
                        className={`flex-1 rounded-lg py-1.5 text-center text-[11px] transition-all ${
                          summaryMode === "monthly"
                            ? "bg-white text-brand-cyan shadow-xs"
                            : "text-brand-text-muted"
                        }`}
                      >
                        Bulanan
                      </button>
                      <button
                        type="button"
                        onClick={() => setSummaryMode("semester")}
                        className={`flex-1 rounded-lg py-1.5 text-center text-[11px] transition-all ${
                          summaryMode === "semester"
                            ? "bg-white text-brand-cyan shadow-xs"
                            : "text-brand-text-muted"
                        }`}
                      >
                        Semesteran
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-brand-navy block mb-1">
                      Pilih Kelas
                    </label>
                    <div className="relative">
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-brand-line bg-gray-50 py-1.5 pl-2.5 pr-7 text-xs font-bold text-brand-navy outline-none focus:border-brand-cyan"
                      >
                        <option value="all">Semua Kelas</option>
                        {classesList.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Periode selector */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-brand-line/50">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-brand-navy block mb-1">
                      Tahun Ajaran
                    </label>
                    <div className="relative">
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-brand-line bg-gray-50 py-1.5 pl-2.5 pr-7 text-xs font-bold text-brand-navy outline-none focus:border-brand-cyan"
                      >
                        <option value="2026/2027">2026/2027</option>
                        <option value="2025/2026">2025/2026</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-brand-navy block mb-1">
                      {summaryMode === "monthly" ? "Bulan" : "Semester"}
                    </label>
                    <div className="relative">
                      {summaryMode === "monthly" ? (
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-brand-line bg-gray-50 py-1.5 pl-2.5 pr-7 text-xs font-bold text-brand-navy outline-none focus:border-brand-cyan"
                        >
                          {ACADEMIC_MONTHS.map((m) => (
                            <option key={m.name} value={m.name}>
                              {m.name} ({m.semester === 1 ? "Ganjil" : "Genap"})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={selectedSemester}
                          onChange={(e) => setSelectedSemester(Number(e.target.value))}
                          className="w-full appearance-none rounded-xl border border-brand-line bg-gray-50 py-1.5 pl-2.5 pr-7 text-xs font-bold text-brand-navy outline-none focus:border-brand-cyan"
                        >
                          <option value={1}>Semester Ganjil</option>
                          <option value={2}>Semester Genap</option>
                        </select>
                      )}
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Quick Toggle Kurang & Sort Pill */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-brand-line/50 text-[11px]">
                  <label
                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition-all border ${
                      onlyUnderTarget
                        ? "bg-red-50 text-red-700 border-red-300"
                        : "bg-gray-50 text-gray-600 border-brand-line"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={onlyUnderTarget}
                      onChange={(e) => setOnlyUnderTarget(e.target.checked)}
                      className="rounded text-red-600 focus:ring-0"
                    />
                    <span>⚠️ Nilai Kurang Saja</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (sortField === "rank") {
                        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
                      } else {
                        setSortField("rank");
                        setSortDirection("asc");
                      }
                    }}
                    className="flex items-center gap-1 font-bold text-brand-navy bg-gray-100 rounded-lg px-2 py-1"
                  >
                    <span>Urut: {sortDirection === "asc" ? "Tertinggi" : "Terendah"}</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-500" />
                  </button>
                </div>

                {/* Search input */}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari santri..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-brand-line bg-gray-50/50 py-1.5 pl-8 pr-3 text-xs font-medium text-brand-navy outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              {/* Quick Summary Pill Bar */}
              <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-brand-line text-[11px] font-bold text-brand-navy shadow-2xs">
                <span>Total: {summaryStats.total} Santri</span>
                <span>Rerata: {summaryStats.avgScore}</span>
                {summaryStats.underTarget > 0 ? (
                  <span className="text-red-600 font-extrabold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {summaryStats.underTarget} Perlu Bimbingan
                  </span>
                ) : (
                  <span className="text-emerald-600 font-extrabold">Semua Tuntas</span>
                )}
              </div>

              {/* Student Cards List (Leaderboard Style) */}
              {loadingSummary ? (
                <div className="flex h-36 items-center justify-center rounded-2xl bg-white border border-brand-line">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
                </div>
              ) : processedSummary.length === 0 ? (
                <div className="rounded-2xl border border-brand-line bg-white p-8 text-center text-xs text-brand-text-muted">
                  {onlyUnderTarget
                    ? "Alhamdulillah, tidak ada santri yang memiliki nilai kurang."
                    : "Belum ada data nilai santri untuk filter ini."}
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedSummary.map((item) => {
                    const rankClass =
                      item.rank === 1
                        ? "bg-amber-400 text-white"
                        : item.rank === 2
                        ? "bg-slate-300 text-slate-800"
                        : item.rank === 3
                        ? "bg-amber-700/60 text-white"
                        : "bg-gray-100 text-brand-navy";

                    return (
                      <div
                        key={item.studentId}
                        onClick={() => handleOpenStudentReport(item.studentId)}
                        className={`cursor-pointer rounded-2xl border p-3 shadow-xs transition-all hover:border-brand-cyan ${
                          item.isUnderTarget
                            ? "border-red-200 bg-red-50/30"
                            : "border-brand-line bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black ${rankClass}`}
                            >
                              #{item.rank}
                            </span>
                            <div>
                              <h3 className="text-xs font-bold text-brand-navy line-clamp-1">
                                {item.studentName}
                              </h3>
                              <p className="text-[10px] text-brand-text-muted">
                                {item.className}
                              </p>
                            </div>
                          </div>

                          {/* Nilai Akhir Besar */}
                          <div className="text-right shrink-0">
                            <span
                              className={`text-sm font-black ${
                                item.isUnderTarget ? "text-red-600" : "text-brand-navy"
                              }`}
                            >
                              {item.nilaiAkhir > 0 ? item.nilaiAkhir : "-"}
                            </span>
                            <span className="ml-1 text-[11px] font-bold text-brand-text-muted">
                              ({item.gradeAkhir})
                            </span>
                          </div>
                        </div>

                        {/* Breakdown Nilai Tahfidz, Tahsin, Yaumiyah */}
                        <div className="mt-2.5 flex items-center justify-between border-t border-brand-line/50 pt-2 text-[10px]">
                          <div className="flex items-center gap-2 text-brand-navy font-semibold">
                            <span>
                              Tahfidz: <strong className="text-brand-cyan-dark">{item.tahfidzScore > 0 ? `${item.tahfidzScore} (${item.tahfidzGrade})` : "-"}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Tahsin: <strong className="text-emerald-700">{item.tahsinScore > 0 ? `${item.tahsinScore} (${item.tahsinGrade})` : "-"}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Ibadah: <strong>{item.yaumiyahGrade}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Hadir: <strong>{item.kehadiranRatio ?? `${item.kehadiranCount ?? 0} hr`}</strong>
                            </span>
                          </div>

                          <div className="flex items-center text-brand-cyan font-bold text-[10px]">
                            <span>Rapor →</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination Controls Mobile */}
                  {totalPages > 1 && (
                    <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl bg-white p-3 border border-brand-line text-xs text-brand-text-muted">
                      <span>
                        Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> ({processedSummary.length} santri)
                      </span>
                      <Pagination
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEW TAB 2: PER ANAK (CALENDAR GRID SELECTION) */}
          {viewTab === "per_anak" && (
            <div className="space-y-4">
              {/* Filter Kelas & Siswa Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-brand-navy">
                    PILIH KELAS
                  </label>
                  <div className="relative mt-1">
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-brand-line bg-gray-50 p-2.5 pr-8 text-xs font-bold text-brand-navy outline-none focus:border-brand-cyan transition-colors"
                    >
                      <option value="all">Semua Kelas</option>
                      {classesList.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-brand-navy">
                    PILIH SISWA HALAQAH
                  </label>
                  <div className="relative mt-1">
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      disabled={filteredStudents.length === 0}
                      className="w-full appearance-none rounded-xl border border-brand-line bg-gray-50 p-2.5 pr-8 text-xs font-bold text-brand-navy outline-none focus:border-brand-cyan transition-colors disabled:opacity-50"
                    >
                      {filteredStudents.length === 0 ? (
                        <option value="">Tidak ada siswa di kelas ini</option>
                      ) : (
                        filteredStudents.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
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
                <div className="grid grid-cols-3 gap-2">
                  {SEMESTER_1_MONTHS.map((m) => {
                    const isSelected = selectedMonth === m.name;
                    const { status } = getMonthStatus(m.offset);

                    return (
                      <button
                        key={m.name}
                        type="button"
                        onClick={() => handleSelectMonth(m)}
                        className={`flex flex-col items-center justify-center rounded-xl border-2 py-2 transition-all ${
                          isSelected
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

                <button
                  type="button"
                  onClick={() => handleSelectSemester(1)}
                  className={`my-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 py-1.5 transition-all ${
                    selectedSemester === 1
                      ? "border-brand-cyan bg-brand-cyan/10 text-brand-navy shadow-sm"
                      : "border-gray-200 text-brand-navy hover:border-brand-cyan/40"
                  }`}
                >
                  <span className="text-xs font-bold">Semester 1</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      sem1.status === "done" ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                </button>

                <div className="grid grid-cols-3 gap-2">
                  {SEMESTER_2_MONTHS.map((m) => {
                    const isSelected = selectedMonth === m.name;
                    const { status } = getMonthStatus(m.offset);

                    return (
                      <button
                        key={m.name}
                        type="button"
                        onClick={() => handleSelectMonth(m)}
                        className={`flex flex-col items-center justify-center rounded-xl border-2 py-2 transition-all ${
                          isSelected
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

                <button
                  type="button"
                  disabled={!sem2.isAvailable}
                  onClick={() => handleSelectSemester(2)}
                  className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 py-1.5 transition-all ${
                    selectedSemester === 2
                      ? "border-brand-cyan bg-brand-cyan/10 text-brand-navy shadow-sm"
                      : "border-gray-200 text-brand-navy hover:border-brand-cyan/40"
                  }`}
                >
                  <span className="text-xs font-bold">Semester 2</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      sem2.status === "done" ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                </button>
              </section>
            </div>
          )}
        </div>
      </main>

      <BottomNav items={TEACHER_NAV_ITEMS} activeIndex={2} />
    </div>
  );
}
