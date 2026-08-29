import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Search,
  UserCheck,
} from "lucide-react";
import { BottomNav, TEACHER_NAV_ITEMS } from "@/components/layout/BottomNav";

interface StudentItem {
  id: string;
  nis: string;
  name: string;
  lastZiyadah: string;
  lastMurojaah: string;
  status: "setor" | "belum" | "izin";
}

const STUDENTS_MOCK: StudentItem[] = [
  {
    id: "1",
    nis: "9991239201",
    name: "Fulan bin Fulan",
    lastZiyadah: "Al-Baqarah: 1-5 (90)",
    lastMurojaah: "Al-Fatihah: 1-7 (98)",
    status: "setor",
  },
  {
    id: "2",
    nis: "9991239202",
    name: "Ahmad Abdullah",
    lastZiyadah: "Al-Baqarah: 6-10 (88)",
    lastMurojaah: "An-Nas: 1-6 (95)",
    status: "setor",
  },
  {
    id: "3",
    nis: "9991239203",
    name: "Muhammad Ali",
    lastZiyadah: "Al-Baqarah: 11-15 (92)",
    lastMurojaah: "Al-Falaq: 1-5 (90)",
    status: "belum",
  },
  {
    id: "4",
    nis: "9991239204",
    name: "Umar Al-Faruq",
    lastZiyadah: "Al-Baqarah: 16-20 (85)",
    lastMurojaah: "Al-Ikhlas: 1-4 (92)",
    status: "izin",
  },
  {
    id: "5",
    nis: "9991239205",
    name: "Usman bin Affan",
    lastZiyadah: "Al-Baqarah: 21-25 (94)",
    lastMurojaah: "Al-Lahab: 1-5 (89)",
    status: "setor",
  },
];

export function TeacherStudentListPage() {
  const [search, setSearch] = useState("");

  const filtered = STUDENTS_MOCK.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.includes(search)
  );

  return (
    <div className="flex h-screen flex-col bg-brand-page pt-3">
      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-1">
        <div className="flex flex-col gap-4">
          {/* Top Bar Header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => (window.location.hash = "#/dashboard")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-cyan/10"
            >
              <ArrowLeft className="h-4 w-4 text-brand-cyan" />
            </button>
            <div className="text-center">
              <h1 className="text-lg font-bold text-brand-navy">
                Daftar Siswa Halaqah
              </h1>
              <p className="text-xs text-brand-text-muted">
                Kelas VII Abu Bakar (15 Siswa)
              </p>
            </div>
            <div className="h-9 w-9" />
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau NIS..."
              className="w-full rounded-2xl border border-brand-line bg-white py-3 pl-11 pr-4 text-xs font-semibold text-brand-navy outline-none shadow-sm placeholder:text-gray-400 focus:border-brand-cyan"
            />
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Student Cards List */}
          <div className="space-y-3">
            {filtered.map((student) => (
              <div
                key={student.id}
                onClick={() => (window.location.hash = "#/ziyadah-input")}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-brand-line bg-white p-4 shadow-sm transition-all hover:border-brand-cyan/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-brand-navy">
                        {student.name}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          student.status === "setor"
                            ? "bg-emerald-50 text-emerald-600"
                            : student.status === "belum"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {student.status === "setor"
                          ? "Sudah Setor"
                          : student.status === "belum"
                          ? "Belum Setor"
                          : "Izin"}
                      </span>
                    </div>
                    <p className="text-[10px] text-brand-text-muted">
                      NIS: {student.nis}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-brand-navy">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-brand-cyan" />
                        {student.lastZiyadah}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav items={TEACHER_NAV_ITEMS} activeIndex={1} />
    </div>
  );
}
