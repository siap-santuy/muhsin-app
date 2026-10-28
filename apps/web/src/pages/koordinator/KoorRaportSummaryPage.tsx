import { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Search,
  Trophy,
  Users,
} from "lucide-react";
import { KoorShell } from "@/components/layout/KoorShell";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const MONTHS_SEMESTER_1 = [
  { name: "Juli", monthNum: "07" },
  { name: "Agustus", monthNum: "08" },
  { name: "September", monthNum: "09" },
  { name: "Oktober", monthNum: "10" },
  { name: "November", monthNum: "11" },
  { name: "Desember", monthNum: "12" },
];

const MONTHS_SEMESTER_2 = [
  { name: "Januari", monthNum: "01" },
  { name: "Februari", monthNum: "02" },
  { name: "Maret", monthNum: "03" },
  { name: "April", monthNum: "04" },
  { name: "Mei", monthNum: "05" },
  { name: "Juni", monthNum: "06" },
];

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

export function KoorRaportSummaryPage() {
  const [mode, setMode] = useState<"monthly" | "semester">("monthly");
  const [selectedYear, setSelectedYear] = useState("2026/2027");
  const [selectedSemester, setSelectedSemester] = useState<"Ganjil" | "Genap">("Ganjil");
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(3); // Default Oktober
  const [selectedClass, setSelectedClass] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyUnderTarget, setOnlyUnderTarget] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<"rank" | "name">("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  // Data states
  const [items, setItems] = useState<RaportSummaryItem[]>([]);
  const [classesList, setClassesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Derive start and end year numbers
  const [startYearStr, endYearStr] = selectedYear.split("/").map((s) => s.trim());
  const startYr = Number(startYearStr) || 2026;
  const endYr = Number(endYearStr) || startYr + 1;

  const currentMonthList = selectedSemester === "Ganjil" ? MONTHS_SEMESTER_1 : MONTHS_SEMESTER_2;
  const activeMonthDef = currentMonthList[selectedMonthIndex] || currentMonthList[0];
  const targetYear = selectedSemester === "Ganjil" ? startYr : endYr;
  const formattedMonthStr = `${targetYear}-${activeMonthDef.monthNum}`;

  // Load classes list
  useEffect(() => {
    api.getClasses()
      .then((cls) => {
        if (Array.isArray(cls)) {
          setClassesList(cls.map((c: any) => c.name));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch summary data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const params: any = {
      mode,
      className: selectedClass !== "all" ? selectedClass : undefined,
    };

    if (mode === "monthly") {
      params.month = formattedMonthStr;
    } else {
      params.semester = selectedSemester;
      params.tahunAjaran = selectedYear;
    }

    api.getRaportSummary(params)
      .then((data) => {
        if (isMounted) {
          setItems(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (isMounted) setItems([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mode, formattedMonthStr, selectedSemester, selectedYear, selectedClass]);

  // Client-side filtering & sorting
  const processedItems = useMemo(() => {
    let result = [...items];

    // Search by student name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.studentName.toLowerCase().includes(q) ||
          item.className.toLowerCase().includes(q)
      );
    }

    // Filter only under target (< 75)
    if (onlyUnderTarget) {
      result = result.filter((item) => item.isUnderTarget);
    }

    // Sort
    result.sort((a, b) => {
      if (sortField === "rank") {
        return sortDirection === "asc" ? a.rank - b.rank : b.rank - a.rank;
      } else {
        const cmp = a.studentName.localeCompare(b.studentName);
        return sortDirection === "asc" ? cmp : -cmp;
      }
    });

    return result;
  }, [items, searchQuery, onlyUnderTarget, sortField, sortDirection]);

  // Overall Statistics
  const stats = useMemo(() => {
    if (items.length === 0) {
      return { total: 0, avgScore: 0, passed: 0, underTarget: 0 };
    }
    const total = items.length;
    const scores = items.map((i) => i.nilaiAkhir).filter((s) => s > 0);
    const avgScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;
    const underTarget = items.filter((i) => i.isUnderTarget).length;
    const passed = total - underTarget;

    return { total, avgScore, passed, underTarget };
  }, [items]);

  // Reset page when search, filter, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, onlyUnderTarget, sortField, sortDirection, selectedClass, mode, formattedMonthStr, selectedSemester, selectedYear]);

  // Paginated items
  const totalPages = Math.max(1, Math.ceil(processedItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return processedItems.slice(start, start + PAGE_SIZE);
  }, [processedItems, currentPage, PAGE_SIZE]);

  function toggleSort(field: "rank" | "name") {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  function handleOpenDetail(studentId: string) {
    if (mode === "monthly") {
      window.location.hash = `#/monthly-raport?studentId=${studentId}&month=${formattedMonthStr}`;
    } else {
      window.location.hash = `#/semester-raport?studentId=${studentId}&semester=${selectedSemester}&tahunAjaran=${selectedYear}`;
    }
  }

  return (
    <KoorShell
      activePath="raport-summary"
      title="Rekap Nilai Raport Santri"
      subtitle="Leger nilai & pemetaan ranking prestasi per bulan & semester"
    >
      <div className="space-y-6">
        {/* Top Header Card & Mode Switcher */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-brand-line/60 bg-white p-5 shadow-sm md:flex-row md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-100 px-3 py-0.5 text-xs font-bold text-brand-cyan-dark">
                Leger Akademik TTQ
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-brand-navy">
                TA {selectedYear} • Semester {selectedSemester}
              </span>
            </div>
            <h1 className="mt-1.5 text-lg font-black text-brand-navy">
              {mode === "monthly"
                ? `Rekapitulasi Nilai Bulan ${activeMonthDef.name} ${targetYear}`
                : `Rekapitulasi Nilai Semester ${selectedSemester} (${selectedYear})`}
            </h1>
            <p className="text-xs text-brand-text-muted">
              {selectedClass === "all" ? "Semua Kelas Binaan" : `Kelas ${selectedClass}`} • Total {stats.total} Santri
            </p>
          </div>

          {/* Toggle Mode: Bulanan vs Semesteran */}
          <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold text-brand-navy shrink-0">
            <button
              type="button"
              onClick={() => setMode("monthly")}
              className={`rounded-lg px-4 py-2 transition-all ${
                mode === "monthly"
                  ? "bg-white text-brand-cyan shadow-xs"
                  : "text-brand-text-muted hover:text-brand-navy"
              }`}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setMode("semester")}
              className={`rounded-lg px-4 py-2 transition-all ${
                mode === "semester"
                  ? "bg-white text-brand-cyan shadow-xs"
                  : "text-brand-text-muted hover:text-brand-navy"
              }`}
            >
              Semesteran
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-brand-cyan-dark">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-brand-navy/60 uppercase">Total Santri</p>
                <p className="text-xl font-extrabold text-brand-navy">{stats.total}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-brand-text-muted">Terdaftar di periode ini</p>
          </div>

          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-brand-navy/60 uppercase">Rata-rata Nilai</p>
                <p className="text-xl font-extrabold text-brand-navy">{stats.avgScore}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-emerald-600 font-bold">Rata-rata kumulatif</p>
          </div>

          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-brand-navy/60 uppercase">Tuntas (&ge; 75)</p>
                <p className="text-xl font-extrabold text-emerald-700">{stats.passed}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-brand-text-muted">Memenuhi standar KKM</p>
          </div>

          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-brand-navy/60 uppercase">Perlu Bimbingan</p>
                <p className="text-xl font-extrabold text-red-600">{stats.underTarget}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-red-600 font-bold">Nilai &lt; 75 / Grade C &amp; D</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="rounded-2xl border border-brand-line/60 bg-white p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-line/50 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Kelas */}
              <div>
                <label className="text-[10px] font-bold uppercase text-brand-navy/60 block mb-1">Kelas</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="rounded-xl border border-brand-line bg-gray-50/50 py-1.5 px-3 text-xs font-bold text-brand-navy outline-none focus:border-brand-cyan"
                >
                  <option value="all">Semua Kelas</option>
                  {classesList.map((c) => (
                    <option key={c} value={c}>
                      Kelas {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Tahun Ajaran */}
              <div>
                <label className="text-[10px] font-bold uppercase text-brand-navy/60 block mb-1">Tahun Ajaran</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="rounded-xl border border-brand-line bg-gray-50/50 py-1.5 px-3 text-xs font-bold text-brand-navy outline-none focus:border-brand-cyan"
                >
                  <option value="2026/2027">2026/2027</option>
                  <option value="2025/2026">2025/2026</option>
                </select>
              </div>

              {/* Filter Semester */}
              <div>
                <label className="text-[10px] font-bold uppercase text-brand-navy/60 block mb-1">Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => {
                    setSelectedSemester(e.target.value as any);
                    setSelectedMonthIndex(0);
                  }}
                  className="rounded-xl border border-brand-line bg-gray-50/50 py-1.5 px-3 text-xs font-bold text-brand-navy outline-none focus:border-brand-cyan"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>

              {/* Filter Bulan (Hanya jika mode bulanan) */}
              {mode === "monthly" && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-brand-navy/60 block mb-1">Bulan</label>
                  <select
                    value={selectedMonthIndex}
                    onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                    className="rounded-xl border border-brand-line bg-gray-50/50 py-1.5 px-3 text-xs font-bold text-brand-navy outline-none focus:border-brand-cyan"
                  >
                    {currentMonthList.map((m, idx) => (
                      <option key={m.name} value={idx}>
                        {m.name} ({selectedSemester === "Ganjil" ? startYr : endYr})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Filter: Hanya Nilai Kurang */}
            <div className="flex items-center pt-3 sm:pt-0">
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border ${
                  onlyUnderTarget
                    ? "bg-red-50 text-red-700 border-red-300 shadow-2xs"
                    : "bg-gray-50 text-gray-600 border-brand-line hover:bg-gray-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={onlyUnderTarget}
                  onChange={(e) => setOnlyUnderTarget(e.target.checked)}
                  className="rounded text-red-600 focus:ring-0"
                />
                <span>⚠️ Tampilkan Hanya Nilai Kurang (&lt; 75)</span>
              </label>
            </div>
          </div>

          {/* Search bar & active count */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama santri..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-brand-line py-1.5 pl-8 pr-3 text-xs font-medium text-brand-navy outline-none focus:border-brand-cyan"
              >
              </input>
            </div>

            <div className="text-xs text-brand-text-muted">
              Menampilkan <strong>{processedItems.length}</strong> dari {items.length} santri
            </div>
          </div>
        </div>

        {/* Tabel Rekapitulasi Nilai */}
        {loading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-brand-line bg-white shadow-sm">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
              <p className="text-xs font-semibold text-brand-text-muted">Mengalkulasi rekapitulasi nilai santri...</p>
            </div>
          </div>
        ) : processedItems.length === 0 ? (
          <div className="rounded-2xl border border-brand-line bg-white p-12 text-center text-xs text-brand-text-muted shadow-sm">
            {onlyUnderTarget
              ? "Alhamdulillah, tidak ada santri yang memiliki nilai kurang (< 75) pada kriteria filter ini."
              : "Belum ada data setoran atau raport santri untuk periode yang dipilih."}
          </div>
        ) : (
          <div className="rounded-2xl border border-brand-line bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-brand-navy">
                <thead>
                  <tr className="border-b border-brand-line bg-gray-50/70 text-[11px] font-bold text-brand-text-muted uppercase">
                    <th
                      onClick={() => toggleSort("rank")}
                      className="py-3 px-4 cursor-pointer hover:bg-gray-100/80 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Peringkat</span>
                        {sortField === "rank" ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5 text-brand-cyan" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-brand-cyan" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort("name")}
                      className="py-3 px-4 cursor-pointer hover:bg-gray-100/80 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Santri</span>
                        {sortField === "name" ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5 text-brand-cyan" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-brand-cyan" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-3">Kelas</th>
                    <th className="py-3 px-3 text-center">Tahfidz</th>
                    <th className="py-3 px-3 text-center">Tahsin</th>
                    <th className="py-3 px-3 text-center">Yaumiyah</th>
                    <th className="py-3 px-3 text-center">Kehadiran</th>
                    <th className="py-3 px-4 text-center">Nilai Akhir</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Rapor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line/60">
                  {paginatedItems.map((item) => {
                    const rankBadgeClass =
                      item.rank === 1
                        ? "bg-amber-400 text-white shadow-xs"
                        : item.rank === 2
                        ? "bg-slate-300 text-slate-800"
                        : item.rank === 3
                        ? "bg-amber-700/60 text-white"
                        : "bg-gray-100 text-brand-navy";

                    return (
                      <tr
                        key={item.studentId}
                        className={`transition-colors ${
                          item.isUnderTarget
                            ? "bg-red-50/20 hover:bg-red-50/40"
                            : "hover:bg-gray-50/80"
                        }`}
                      >
                        {/* Peringkat */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex h-6 min-w-6 items-center justify-center rounded-lg px-1.5 text-[11px] font-extrabold ${rankBadgeClass}`}
                          >
                            #{item.rank}
                          </span>
                        </td>

                        {/* Nama Santri */}
                        <td className="py-3 px-4">
                          <p className="font-bold text-brand-navy">{item.studentName}</p>
                          {item.isUnderTarget && (
                            <span className="text-[10px] font-semibold text-red-600 flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="h-3 w-3" /> Perlu bimbingan intensif
                            </span>
                          )}
                        </td>

                        {/* Kelas */}
                        <td className="py-3 px-3 font-semibold text-brand-text-muted">
                          {item.className}
                        </td>

                        {/* Nilai Tahfidz */}
                        <td className="py-3 px-3 text-center">
                          {item.tahfidzScore > 0 ? (
                            <span className="font-bold text-brand-navy">
                              {item.tahfidzScore}{" "}
                              <span className="text-[10px] font-extrabold text-brand-cyan-dark">
                                ({item.tahfidzGrade})
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        {/* Nilai Tahsin */}
                        <td className="py-3 px-3 text-center">
                          {item.tahsinScore > 0 ? (
                            <span className="font-bold text-brand-navy">
                              {item.tahsinScore}{" "}
                              <span className="text-[10px] font-extrabold text-emerald-700">
                                ({item.tahsinGrade})
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        {/* Nilai Yaumiyah */}
                        <td className="py-3 px-3 text-center font-bold">
                          {item.yaumiyahGrade !== "-" ? (
                            <span
                              className={`rounded-md px-2 py-0.5 text-[11px] ${
                                item.yaumiyahGrade === "A"
                                  ? "bg-emerald-100 text-emerald-700 font-extrabold"
                                  : item.yaumiyahGrade === "B"
                                  ? "bg-cyan-100 text-brand-cyan-dark font-extrabold"
                                  : "bg-amber-100 text-amber-700 font-bold"
                              }`}
                            >
                              {item.yaumiyahGrade}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        {/* Kehadiran Setoran */}
                        <td className="py-3 px-3 text-center">
                          <span className="font-bold text-brand-navy">
                            {item.kehadiranRatio ?? `${item.kehadiranCount ?? 0} hari`}
                          </span>
                        </td>

                        {/* Nilai Akhir */}
                        <td className="py-3 px-4 text-center">
                          {item.nilaiAkhir > 0 ? (
                            <div>
                              <span
                                className={`text-sm font-extrabold ${
                                  item.isUnderTarget ? "text-red-600" : "text-brand-navy"
                                }`}
                              >
                                {item.nilaiAkhir}
                              </span>
                              <span className="ml-1 text-[11px] font-bold text-brand-text-muted">
                                ({item.gradeAkhir})
                              </span>
                              <p className="text-[9.5px] text-gray-400">{item.arabicPredicate}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              !item.isUnderTarget
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : "bg-red-100 text-red-700 border border-red-200"
                            }`}
                          >
                            {!item.isUnderTarget ? "Tuntas" : "Kurang"}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-4 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetail(item.studentId)}
                            className="h-7 px-2.5 text-[11px] font-bold border-brand-cyan text-brand-cyan hover:bg-brand-cyan/10 rounded-lg"
                          >
                            <ExternalLink className="mr-1 h-3 w-3" /> Detail
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-brand-line/60 bg-gray-50/50 px-4 py-3 text-xs text-brand-text-muted">
                <span>
                  Menampilkan <strong>{(currentPage - 1) * PAGE_SIZE + 1}</strong> -{" "}
                  <strong>{Math.min(currentPage * PAGE_SIZE, processedItems.length)}</strong> dari{" "}
                  <strong>{processedItems.length}</strong> santri
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
    </KoorShell>
  );
}
