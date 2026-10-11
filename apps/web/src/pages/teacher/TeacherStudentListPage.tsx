import { useState, useEffect, useMemo } from "react";
import {
  ArrowUpDown,
  Award,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, TEACHER_NAV_ITEMS } from "@/components/layout/BottomNav";
import { DayStripPicker, type DayItem } from "@/components/student/DayStripPicker";
import { MonthCalendar } from "@/components/student/MonthCalendar";
import { api } from "@/lib/api";

type TTQCategory = "ziyadah" | "murojaah" | "sabiq" | "talaqi";
type StatusFilter = "all" | "unrated" | "rated";

interface StudentItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  className: string | null;
  classId: string | null;
  level: number;
  totalExp: number;
  currentStreak: number;
  hasSetoranOnDate?: boolean;
  categorySetoranStatus?: {
    ziyadah: boolean;
    murojaah: boolean;
    sabiq: boolean;
    talaqi: boolean;
  };
  categoryLastActivity?: {
    ziyadah?: {
      label: string;
      date: string;
      grade: string;
      subcategoryCode?: string;
      setoranId?: string;
      attendanceStatus?: string;
    } | null;
    murojaah?: {
      label: string;
      date: string;
      grade: string;
      subcategoryCode?: string;
      setoranId?: string;
      attendanceStatus?: string;
    } | null;
    sabiq?: {
      label: string;
      date: string;
      grade: string;
      subcategoryCode?: string;
      setoranId?: string;
      attendanceStatus?: string;
    } | null;
    talaqi?: {
      label: string;
      date: string;
      grade: string;
      subcategoryCode?: string;
      setoranId?: string;
      attendanceStatus?: string;
    } | null;
  };
  lastActivity?: {
    label: string;
    date: string;
    grade: string;
    subcategoryCode?: string;
    setoranId?: string;
    attendanceStatus?: string;
  } | null;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatMonthYearHeader(dateStr: string): string {
  if (!dateStr || !dateStr.includes("-")) return "";
  const [y, m] = dateStr.split("-").map(Number);
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return `${monthNames[m - 1]} ${y}`;
}

function getCenteredDays(centerDateStr: string): DayItem[] {
  const target = parseLocalDate(centerDateStr);
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const days: DayItem[] = [];

  for (let offset = -2; offset <= 2; offset++) {
    const d = new Date(target);
    d.setDate(d.getDate() + offset);
    days.push({
      dayName: dayNames[d.getDay()],
      dayNum: d.getDate(),
      fullDate: formatLocalDate(d),
      status: offset === 0 ? "submitted" : "empty",
    });
  }
  return days;
}

const CATEGORY_TABS: Array<{ id: TTQCategory; label: string }> = [
  { id: "ziyadah", label: "Ziyadah" },
  { id: "murojaah", label: "Muroja'ah" },
  { id: "sabiq", label: "Sabiq" },
  { id: "talaqi", label: "Talaqi" },
];

const PAGE_SIZE = 5;
const TTQ_FILTER_STORAGE_KEY = "teacher_ttq_filter_state";

function getGradeColorClass(grade?: string): string {
  switch (grade?.toUpperCase()) {
    case "A":
      return "text-blue-600";
    case "B":
      return "text-emerald-600";
    case "C":
      return "text-amber-500";
    case "D":
      return "text-rose-600";
    default:
      return "text-gray-400";
  }
}

interface TTQFilterPersistedState {
  selectedDate?: string;
  activeCategory?: TTQCategory;
  statusFilter?: StatusFilter;
  selectedClass?: string;
  search?: string;
}

function loadPersistedTTQFilter(): TTQFilterPersistedState {
  try {
    const raw = sessionStorage.getItem(TTQ_FILTER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function TeacherStudentListPage() {
  const persisted = useMemo(() => loadPersistedTTQFilter(), []);

  const [selectedDate, setSelectedDate] = useState<string>(
    () => persisted.selectedDate || formatLocalDate(new Date())
  );
  const [days, setDays] = useState<DayItem[]>(() => getCenteredDays(selectedDate));
  const [activeCategory, setActiveCategory] = useState<TTQCategory>(
    () => persisted.activeCategory || "ziyadah"
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    () => persisted.statusFilter || "unrated"
  );
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => persisted.search || "");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>(
    () => persisted.selectedClass || "all"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Simpan filter ke sessionStorage saat ada perubahan
  useEffect(() => {
    const filterState: TTQFilterPersistedState = {
      selectedDate,
      activeCategory,
      statusFilter,
      selectedClass,
      search,
    };
    sessionStorage.setItem(TTQ_FILTER_STORAGE_KEY, JSON.stringify(filterState));
  }, [selectedDate, activeCategory, statusFilter, selectedClass, search]);

  // Re-center days strip on selectedDate change
  useEffect(() => {
    setDays(getCenteredDays(selectedDate));
  }, [selectedDate]);

  // Load students for the selected date
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getStudents({ date: selectedDate })
      .then((data) => {
        if (isMounted) {
          setStudents(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Gagal memuat daftar siswa");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Extract distinct classes
  const classesList = useMemo(() => {
    return Array.from(
      new Set(students.map((s) => s.className).filter(Boolean) as string[])
    );
  }, [students]);

  // Helper check if student has rating for activeCategory
  function isStudentRatedForCategory(s: StudentItem, cat: TTQCategory): boolean {
    if (s.categorySetoranStatus) {
      return !!s.categorySetoranStatus[cat];
    }
    return !!s.hasSetoranOnDate;
  }

  // Filter & sort
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const result = students.filter((s) => {
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q);
      const matchClass = selectedClass === "all" || s.className === selectedClass;

      const isRated = isStudentRatedForCategory(s, activeCategory);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "rated" && isRated) ||
        (statusFilter === "unrated" && !isRated);

      return matchSearch && matchClass && matchStatus;
    });

    result.sort((a, b) => {
      if (sortOrder === "asc") {
        return a.name.localeCompare(b.name, "id");
      }
      return b.name.localeCompare(a.name, "id");
    });

    return result;
  }, [students, search, selectedClass, sortOrder, activeCategory, statusFilter]);

  // Calculate counts for quick status filter pills
  const counts = useMemo(() => {
    const inClass = students.filter(
      (s) => selectedClass === "all" || s.className === selectedClass
    );
    const ratedCount = inClass.filter((s) => isStudentRatedForCategory(s, activeCategory)).length;
    const unratedCount = inClass.length - ratedCount;
    return { all: inClass.length, rated: ratedCount, unrated: unratedCount };
  }, [students, selectedClass, activeCategory]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedClass, sortOrder, selectedDate, activeCategory, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedStudents = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function handleSelectDay(index: number) {
    const targetDay = days[index];
    if (targetDay) {
      setSelectedDate(targetDay.fullDate);
    }
  }

  function handlePrevDay() {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatLocalDate(d));
  }

  function handleNextDay() {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatLocalDate(d));
  }

  function handleAction(studentId: string, isRated: boolean) {
    sessionStorage.setItem("selectedStudentId", studentId);
    if (isRated) {
      window.location.hash = `#/${activeCategory}-view?studentId=${studentId}&date=${selectedDate}`;
    } else {
      window.location.hash = `#/${activeCategory}-input?studentId=${studentId}&date=${selectedDate}`;
    }
  }

  const categoryLabel =
    activeCategory === "ziyadah"
      ? "Ziyadah"
      : activeCategory === "murojaah"
      ? "Muroja'ah"
      : activeCategory === "sabiq"
      ? "Sabiq"
      : "Talaqi";

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      <AppHeader />

      <main className="flex-1 overflow-y-auto px-4 pt-1 pb-24">
        <div className="flex flex-col gap-4">
          {/* 1. Date Strip Navigation & Calendar Quick Jump */}
          <section className="mt-1 rounded-2xl bg-white p-3 shadow-xs border border-brand-line">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-brand-line/50 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-brand-navy">
                  {formatMonthYearHeader(selectedDate)}
                </span>
                {selectedDate !== formatLocalDate(new Date()) && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(formatLocalDate(new Date()))}
                    className="rounded-lg bg-brand-cyan/10 px-2 py-0.5 text-[10px] font-bold text-brand-cyan hover:bg-brand-cyan/20 transition-colors"
                  >
                    Hari Ini
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-brand-line bg-gray-50/80 px-2.5 py-1 text-xs font-semibold text-brand-navy hover:bg-brand-cyan/10 hover:border-brand-cyan/40 hover:text-brand-cyan transition-all"
                title="Pilih tanggal via kalender"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Pilih Tanggal</span>
              </button>
            </div>

            <DayStripPicker
              days={days}
              selectedIndex={2}
              onSelectDay={handleSelectDay}
              onPrev={handlePrevDay}
              onNext={handleNextDay}
            />
          </section>

          {/* Modal Dialog Kalender Cepat */}
          {isCalendarOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in"
              onClick={() => setIsCalendarOpen(false)}
            >
              <div
                className="w-full max-w-sm rounded-3xl bg-white p-4 shadow-xl border border-brand-line/80 animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-brand-line">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-brand-cyan" />
                    <h3 className="text-sm font-bold text-brand-navy">Pilih Tanggal Setoran</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(false)}
                    aria-label="Tutup kalender"
                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-navy transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="pt-2">
                  <MonthCalendar
                    initialDate={parseLocalDate(selectedDate)}
                    selectedDate={parseLocalDate(selectedDate)}
                    showLegend={false}
                    onSelectDate={(date) => {
                      setSelectedDate(formatLocalDate(date));
                      setIsCalendarOpen(false);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Filter Dropdown Kelas */}
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-brand-line bg-white py-3 pl-4 pr-10 text-xs font-semibold text-brand-navy outline-none shadow-xs transition-colors focus:border-brand-cyan"
            >
              <option value="all">Semua Kelas</option>
              {classesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* 3. Category Tabs (Ziyadah / Muroja'ah / Sabiq / Talaqi) */}
          <div className="flex rounded-2xl border border-brand-line bg-white p-1.5 shadow-xs">
            {CATEGORY_TABS.map((t) => {
              const isActive = activeCategory === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveCategory(t.id)}
                  className={`flex-1 rounded-xl py-2.5 text-center text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[#22bad0] text-white shadow-xs scale-102"
                      : "text-brand-navy hover:text-brand-cyan"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* 4. Quick Status Sub-Filters (Semua / Belum Dinilai / Sudah Dinilai) */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`flex-1 rounded-xl py-2 text-center text-xs font-bold border transition-all ${
                statusFilter === "all"
                  ? "bg-[#0b1c30] text-white border-[#0b1c30] shadow-xs"
                  : "bg-white text-brand-navy border-brand-line hover:bg-gray-50"
              }`}
            >
              Semua ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("unrated")}
              className={`flex-1 rounded-xl py-2 text-center text-xs font-bold border transition-all ${
                statusFilter === "unrated"
                  ? "bg-[#f5a623] text-white border-[#f5a623] shadow-xs"
                  : "bg-white text-brand-navy border-brand-line hover:bg-gray-50"
              }`}
            >
              Belum ({counts.unrated})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("rated")}
              className={`flex-1 rounded-xl py-2 text-center text-xs font-bold border transition-all ${
                statusFilter === "rated"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-white text-brand-navy border-brand-line hover:bg-gray-50"
              }`}
            >
              Sudah ({counts.rated})
            </button>
          </div>

          {/* 5. Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama siswa..."
              className="w-full rounded-2xl border border-brand-line bg-white py-3 pl-11 pr-4 text-xs font-semibold text-brand-navy outline-none shadow-xs placeholder:text-gray-400 focus:border-brand-cyan transition-colors"
            />
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* 6. Section Title & Sort */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-baseline gap-1.5">
              <h1 className="text-base font-extrabold text-brand-navy">
                Daftar Siswa
              </h1>
              <span className="text-xs font-semibold text-brand-text-muted">
                ({filtered.length} Siswa)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              className="flex items-center gap-1.5 rounded-xl border border-brand-line bg-white px-3 py-1.5 text-xs font-bold text-brand-navy shadow-xs hover:bg-gray-50 active:scale-95 transition-all"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-gray-500" />
              <span>Nama</span>
            </button>
          </div>

          {/* Loading indicator */}
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
            </div>
          ) : null}

          {/* Error display */}
          {error ? (
            <div className="rounded-2xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200">
              {error}
            </div>
          ) : null}

          {/* Empty state */}
          {!loading && filtered.length === 0 ? (
            <div className="rounded-2xl border border-brand-line bg-white p-8 text-center text-xs text-brand-text-muted shadow-xs">
              {search
                ? `Tidak ada siswa yang cocok dengan pencarian "${search}".`
                : `Belum ada siswa pada kategori ${categoryLabel}.`}
            </div>
          ) : null}

          {/* 7. Student List Cards */}
          {!loading && paginatedStudents.length > 0 ? (
            <div className="space-y-3.5">
              {paginatedStudents.map((s) => {
                const isRated = isStudentRatedForCategory(s, activeCategory);
                const categoryActivity =
                  s.categoryLastActivity?.[activeCategory] ||
                  (isRated ? s.lastActivity : null);
                const attendanceStatus = categoryActivity?.attendanceStatus || (isRated ? "Hadir" : null);

                return (
                  <div
                    key={s.id}
                    className="flex flex-col gap-3 rounded-2xl border border-brand-line bg-white p-4 shadow-xs transition-all"
                  >
                    {/* Top Row: Avatar, Name, Class, Status Pill */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-line bg-gray-50 overflow-hidden">
                          <img
                            src="/brand/moon_star_icon.svg"
                            alt="Avatar"
                            className="h-6 w-6 object-contain"
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-brand-navy leading-tight">
                            {s.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-brand-text-muted">
                            {s.className ?? "Kelas TTQ"}
                          </p>
                        </div>
                      </div>

                      {/* Status Attendance Badge */}
                      {!isRated ? (
                        <span className="shrink-0 rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-[10px] font-bold text-gray-400">
                          Belum {categoryLabel}
                        </span>
                      ) : attendanceStatus === "Izin" ? (
                        <span className="shrink-0 rounded-full border border-amber-400 bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-600">
                          Izin
                        </span>
                      ) : attendanceStatus === "Sakit" ? (
                        <span className="shrink-0 rounded-full border border-sky-400 bg-sky-50 px-3 py-1 text-[10px] font-bold text-sky-600">
                          Sakit
                        </span>
                      ) : attendanceStatus === "Alpa" ? (
                        <span className="shrink-0 rounded-full border border-rose-400 bg-rose-50 px-3 py-1 text-[10px] font-bold text-rose-600">
                          Alpa
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full border border-emerald-400 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600">
                          Sudah {categoryLabel}
                        </span>
                      )}
                    </div>

                    {/* Inner Box: Aktifitas Terakhir & Grade (Hanya tampil jika hadir / belum dinilai) */}
                    {attendanceStatus && attendanceStatus !== "Hadir" ? (
                      <div className="flex items-center justify-between rounded-xl border border-dashed border-brand-line bg-[#f8fafc] px-3.5 py-2.5">
                        <p className="text-xs font-semibold text-brand-text-muted">
                          Siswa berstatus{" "}
                          <span className="font-bold text-brand-navy">
                            {attendanceStatus}
                          </span>{" "}
                          (Tidak ada setoran nilai)
                        </p>
                        <span className="text-xs font-bold text-gray-400">-</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl border border-brand-line/80 bg-[#fbfdfd] p-3">
                        <div>
                          <p className="text-xs font-bold text-brand-navy">
                            Aktifitas Terakhir ({categoryLabel}):
                          </p>
                          <p className="mt-1 text-xs font-semibold text-[#0b1c30]">
                            {isRated && categoryActivity
                              ? categoryActivity.label
                              : "Belum ada penilaian di tanggal ini"}
                          </p>
                          <p className="mt-0.5 text-[10px] text-brand-text-muted">
                            {isRated && categoryActivity
                              ? categoryActivity.date
                              : selectedDate}
                          </p>
                        </div>

                        <span
                          className={`text-2xl font-extrabold ${getGradeColorClass(
                            isRated && categoryActivity?.grade
                              ? categoryActivity.grade
                              : undefined
                          )}`}
                        >
                          {isRated && categoryActivity?.grade
                            ? categoryActivity.grade
                            : "-"}
                        </span>
                      </div>
                    )}

                    {/* 1-Click Action Buttons */}
                    <div className="flex gap-2">
                      {isRated ? (
                        <button
                          type="button"
                          onClick={() => handleAction(s.id, true)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#22bad0] hover:bg-[#1bb0c5] active:scale-[0.99] py-3 text-xs font-extrabold tracking-wider text-white shadow-xs transition-all"
                        >
                          <Eye className="h-4 w-4" />
                          <span>LIHAT {categoryLabel.toUpperCase()}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAction(s.id, false)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f5a623] hover:bg-[#e09612] active:scale-[0.99] py-3 text-xs font-extrabold tracking-wider text-white shadow-xs transition-all"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>INPUT {categoryLabel.toUpperCase()}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => (window.location.hash = `#/munaqosah?studentId=${s.id}`)}
                        title="Ajukan Munaqosah"
                        className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-purple-300 bg-purple-50 px-3 py-3 text-[11px] font-extrabold text-purple-700 shadow-xs transition-all hover:bg-purple-100 active:scale-[0.99]"
                      >
                        <Award className="h-4 w-4" />
                        <span>MUNAQOSAH</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* 8. Pagination Bar */}
          {!loading && totalPages > 1 ? (
            <div className="mt-2 flex items-center justify-center gap-1.5 pb-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-line bg-white text-brand-navy shadow-xs disabled:opacity-30 disabled:pointer-events-none hover:bg-gray-50 transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#0b1c30] text-white shadow-xs scale-105"
                        : "border border-brand-line bg-white text-brand-navy shadow-xs hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-line bg-white text-brand-navy shadow-xs disabled:opacity-30 disabled:pointer-events-none hover:bg-gray-50 transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </main>

      {/* 9. Bottom Navigation */}
      <BottomNav items={TEACHER_NAV_ITEMS} activeIndex={1} />
    </div>
  );
}
