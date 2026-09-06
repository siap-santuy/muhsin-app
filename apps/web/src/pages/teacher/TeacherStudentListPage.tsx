import { useState, useEffect, useMemo } from "react";
import {
  ArrowUpDown,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mic,
  Repeat,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, TEACHER_NAV_ITEMS } from "@/components/layout/BottomNav";
import { DayStripPicker, type DayItem } from "@/components/student/DayStripPicker";
import { api } from "@/lib/api";

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
  lastActivity?: {
    label: string;
    date: string;
    grade: string;
    subcategoryCode?: string;
    setoranId?: string;
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

const PAGE_SIZE = 5;

export function TeacherStudentListPage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => formatLocalDate(new Date()));
  const [days, setDays] = useState<DayItem[]>(() => getCenteredDays(selectedDate));
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<StudentItem | null>(null);

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

  // Filter & sort
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const result = students.filter((s) => {
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q);
      const matchClass = selectedClass === "all" || s.className === selectedClass;
      return matchSearch && matchClass;
    });

    result.sort((a, b) => {
      if (sortOrder === "asc") {
        return a.name.localeCompare(b.name, "id");
      }
      return b.name.localeCompare(a.name, "id");
    });

    return result;
  }, [students, search, selectedClass, sortOrder]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedClass, sortOrder, selectedDate]);

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

  function handleAction(type: "ziyadah" | "murojaah" | "sabiq" | "talaqi", studentId: string) {
    sessionStorage.setItem("selectedStudentId", studentId);
    setSelectedStudentForAction(null);
    window.location.hash = `#/${type}-input?studentId=${studentId}&date=${selectedDate}`;
  }

  function handleViewPenilaian(student: StudentItem) {
    sessionStorage.setItem("selectedStudentId", student.id);
    const code = student.lastActivity?.subcategoryCode?.toLowerCase();
    if (code?.includes("muroja")) {
      window.location.hash = `#/murojaah-view?studentId=${student.id}&date=${selectedDate}`;
    } else if (code?.includes("sabiq")) {
      window.location.hash = `#/sabiq-view?studentId=${student.id}&date=${selectedDate}`;
    } else if (code?.includes("talaqi")) {
      window.location.hash = `#/talaqi-view?studentId=${student.id}&date=${selectedDate}`;
    } else {
      window.location.hash = `#/ziyadah-view?studentId=${student.id}&date=${selectedDate}`;
    }
  }

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      <AppHeader />

      <main className="flex-1 overflow-y-auto px-4 pt-1 pb-24">
        <div className="flex flex-col gap-4">
          {/* 1. Date Strip Navigation */}
          <section className="mt-1 rounded-2xl bg-white p-3 shadow-xs border border-brand-line">
            <DayStripPicker
              days={days}
              selectedIndex={2}
              onSelectDay={handleSelectDay}
              onPrev={handlePrevDay}
              onNext={handleNextDay}
            />
          </section>

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

          {/* 3. Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama santri..."
              className="w-full rounded-2xl border border-brand-line bg-white py-3 pl-11 pr-4 text-xs font-semibold text-brand-navy outline-none shadow-xs placeholder:text-gray-400 focus:border-brand-cyan transition-colors"
            />
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* 4. Section Title & Sort */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-baseline gap-1.5">
              <h1 className="text-base font-extrabold text-brand-navy">
                Daftar Siswa
              </h1>
              <span className="text-xs font-normal text-brand-text-muted">
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
                : "Belum ada data siswa bimbingan."}
            </div>
          ) : null}

          {/* 5. Student List Cards */}
          {!loading && paginatedStudents.length > 0 ? (
            <div className="space-y-3.5">
              {paginatedStudents.map((s) => {
                const isSudahSetor = !!s.hasSetoranOnDate;

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

                      {isSudahSetor ? (
                        <span className="shrink-0 rounded-full border border-emerald-400 bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-600">
                          Sudah Setor
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-[10px] font-semibold text-gray-400">
                          Belum Setor
                        </span>
                      )}
                    </div>

                    {/* Inner Box: Aktifitas Terakhir & Grade */}
                    <div className="flex items-center justify-between rounded-xl border border-brand-line/80 bg-[#fbfdfd] p-3">
                      <div>
                        <p className="text-xs font-bold text-brand-navy">
                          Aktifitas Terakhir:
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#0b1c30]">
                          {s.lastActivity?.label ?? "Belum ada riwayat setoran"}
                        </p>
                        <p className="mt-0.5 text-[10px] text-brand-text-muted">
                          {s.lastActivity?.date ?? "-"}
                        </p>
                      </div>

                      <span className="text-2xl font-extrabold text-emerald-600">
                        {s.lastActivity?.grade ?? "-"}
                      </span>
                    </div>

                    {/* Action Button */}
                    {isSudahSetor ? (
                      <button
                        type="button"
                        onClick={() => handleViewPenilaian(s)}
                        className="w-full rounded-xl bg-[#22bad0] hover:bg-[#1bb0c5] active:scale-[0.99] py-3 text-xs font-extrabold tracking-wider text-white shadow-xs transition-all"
                      >
                        LIHAT PENILAIAN
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForAction(s)}
                        className="w-full rounded-xl bg-[#f5a623] hover:bg-[#e09612] active:scale-[0.99] py-3 text-xs font-extrabold tracking-wider text-white shadow-xs transition-all"
                      >
                        INPUT NILAI
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* 6. Pagination Bar */}
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

      {/* 7. Input Action Sheet Modal */}
      {selectedStudentForAction && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-in fade-in duration-200"
          onClick={() => setSelectedStudentForAction(null)}
        >
          <div
            className="w-full max-w-md animate-in slide-in-from-bottom duration-300 rounded-t-3xl bg-white p-5 pb-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-brand-line/60 pb-3">
              <div>
                <h2 className="text-sm font-bold text-brand-navy">
                  Pilih Jenis Setoran
                </h2>
                <p className="text-xs text-brand-text-muted">
                  Santri: {selectedStudentForAction.name} ({selectedDate})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForAction(null)}
                className="rounded-full p-1.5 hover:bg-gray-100 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleAction("ziyadah", selectedStudentForAction.id)}
                className="flex flex-col items-center justify-center rounded-2xl border border-brand-line bg-brand-cyan/5 p-3.5 text-center hover:border-brand-cyan transition-colors"
              >
                <BookOpen className="h-6 w-6 text-brand-cyan" />
                <span className="mt-2 text-xs font-bold text-brand-navy">
                  Ziyadah (Tahfidz)
                </span>
                <span className="text-[10px] text-brand-text-muted">Hafalan Baru</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction("murojaah", selectedStudentForAction.id)}
                className="flex flex-col items-center justify-center rounded-2xl border border-brand-line bg-purple-50/50 p-3.5 text-center hover:border-purple-300 transition-colors"
              >
                <Repeat className="h-6 w-6 text-purple-600" />
                <span className="mt-2 text-xs font-bold text-brand-navy">
                  Muroja&apos;ah
                </span>
                <span className="text-[10px] text-brand-text-muted">Ulang Hafalan</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction("sabiq", selectedStudentForAction.id)}
                className="flex flex-col items-center justify-center rounded-2xl border border-brand-line bg-amber-50/50 p-3.5 text-center hover:border-amber-300 transition-colors"
              >
                <Sparkles className="h-6 w-6 text-amber-600" />
                <span className="mt-2 text-xs font-bold text-brand-navy">
                  Sabiq (Tahsin)
                </span>
                <span className="text-[10px] text-brand-text-muted">Bacaan Buku</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction("talaqi", selectedStudentForAction.id)}
                className="flex flex-col items-center justify-center rounded-2xl border border-brand-line bg-emerald-50/50 p-3.5 text-center hover:border-emerald-300 transition-colors"
              >
                <Mic className="h-6 w-6 text-emerald-600" />
                <span className="mt-2 text-xs font-bold text-brand-navy">
                  Talaqi (Tahsin)
                </span>
                <span className="text-[10px] text-brand-text-muted">Bimbingan Guru</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Bottom Navigation */}
      <BottomNav items={TEACHER_NAV_ITEMS} activeIndex={1} />
    </div>
  );
}
