import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, TEACHER_NAV_ITEMS } from "@/components/layout/BottomNav";
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

interface StudentOption {
  id: string;
  name: string;
  className: string | null;
}

export function TeacherRaportPage() {
  const currentOffset = getCurrentAcademicOffset();
  const defaultMonthOffset = Math.max(0, currentOffset - 1);
  const defaultMonth = ACADEMIC_MONTHS[defaultMonthOffset];

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState("2026/2027");
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth.name);
  const [selectedSemester, setSelectedSemester] = useState<number>(
    defaultMonth.semester
  );

  useEffect(() => {
    async function load() {
      try {
        const studentList = await api.getStudents();
        setStudents(studentList);
        if (studentList.length > 0) {
          const preselected = sessionStorage.getItem("selectedStudentId");
          if (preselected && studentList.some((s) => s.id === preselected)) {
            setSelectedStudentId(preselected);
          } else {
            setSelectedStudentId(studentList[0].id);
          }
        }
      } catch {
        // Fallback
      }
    }
    load();
  }, []);

  const isPastYear = selectedYear !== "2026/2027";

  function getMonthStatus(offset: number) {
    if (isPastYear) return { isAvailable: true, status: "done" };
    if (offset < currentOffset) return { isAvailable: true, status: "done" };
    if (offset === currentOffset) return { isAvailable: true, status: "ongoing" };
    return { isAvailable: false, status: "none" };
  }

  function getSemesterStatus(sem: 1 | 2) {
    if (isPastYear) return { isAvailable: true, status: "done" };
    const targetEndOffset = sem === 1 ? 5 : 11;
    if (currentOffset > targetEndOffset) return { isAvailable: true, status: "done" };
    if (currentOffset === targetEndOffset) return { isAvailable: true, status: "ongoing" };
    return { isAvailable: false, status: "none" };
  }

  const sem1 = getSemesterStatus(1);
  const sem2 = getSemesterStatus(2);

  function handleSelectMonth(m: MonthDef) {
    setSelectedMonth(m.name);
    setSelectedSemester(m.semester);
  }

  function handleSelectSemester(sem: 1 | 2) {
    setSelectedSemester(sem);
  }

  const selectedStudentName = students.find((s) => s.id === selectedStudentId)?.name ?? "Siswa Halaqah";

  function handleMonthlyClick() {
    const params = new URLSearchParams({
      month: selectedMonth,
      year: selectedYear,
      studentId: selectedStudentId,
    });
    window.location.hash = `#/monthly-raport?${params.toString()}`;
  }

  function handleSemesterClick() {
    const semName = selectedSemester === 1 ? "Ganjil" : "Genap";
    const params = new URLSearchParams({
      semester: semName,
      year: selectedYear,
      studentId: selectedStudentId,
    });
    window.location.hash = `#/semester-raport?${params.toString()}`;
  }

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      <AppHeader />

      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-1">
        <div className="flex flex-col gap-4">
          {/* Siswa Selector */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              PILIH SISWA HALAQAH
            </label>
            <div className="relative mt-1">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-brand-line bg-gray-50 p-2.5 pr-8 text-xs font-bold text-brand-navy outline-none"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.className ?? "Kelas TTQ"})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
            {/* Semester 1 Grid */}
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

            {/* Semester 1 Divider Button */}
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

            {/* Semester 2 Grid */}
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

            {/* Semester 2 Divider Button */}
            <button
              type="button"
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

          {/* Action Cards */}
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
                  Input / Edit Raport Bulanan
                </h2>
                <p className="text-xs font-medium text-brand-text-muted">
                  Siswa: {selectedStudentName} ({selectedMonth})
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-brand-navy" />
          </button>

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
                  Input / Edit Raport Semester
                </h2>
                <p className="text-xs font-medium text-brand-text-muted">
                  Siswa: {selectedStudentName} (Semester {selectedSemester === 1 ? "Ganjil" : "Genap"})
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-brand-navy" />
          </button>
        </div>
      </main>

      <BottomNav items={TEACHER_NAV_ITEMS} activeIndex={2} />
    </div>
  );
}
