import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Search,
  UserCheck,
} from "lucide-react";
import { BottomNav, TEACHER_NAV_ITEMS } from "@/components/layout/BottomNav";
import { api } from "@/lib/api";

interface StudentItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  className: string | null;
  level: number;
  totalExp: number;
  currentStreak: number;
}

export function TeacherStudentListPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStudents() {
      try {
        const data = await api.getStudents();
        setStudents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat daftar siswa");
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, []);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
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
                {students.length} Siswa Terdaftar
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
              placeholder="Cari nama atau email siswa..."
              className="w-full rounded-2xl border border-brand-line bg-white py-3 pl-11 pr-4 text-xs font-semibold text-brand-navy outline-none shadow-sm placeholder:text-gray-400 focus:border-brand-cyan"
            />
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Error display */}
          {error ? (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
              {error}
            </div>
          ) : null}

          {/* Loading indicator */}
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
            </div>
          ) : null}

          {/* Empty state */}
          {!loading && filtered.length === 0 ? (
            <div className="rounded-2xl border border-brand-line bg-white p-8 text-center text-xs text-brand-text-muted">
              Belum ada siswa yang terhubung dengan halaqah Anda.
            </div>
          ) : null}

          {/* Student Cards List */}
          <div className="space-y-3">
            {filtered.map((student) => (
              <div
                key={student.id}
                onClick={() => {
                  sessionStorage.setItem("selectedStudentId", student.id);
                  sessionStorage.setItem("selectedStudentName", student.name);
                  window.location.hash = "#/ziyadah-input";
                }}
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
                      <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[9px] font-bold text-brand-cyan">
                        Lv. {student.level}
                      </span>
                    </div>
                    <p className="text-[10px] text-brand-text-muted">
                      {student.className ? `Kelas: ${student.className}` : student.email}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-brand-navy">
                      <span className="flex items-center gap-1 font-semibold text-brand-amber">
                        🔥 {student.currentStreak} Hari Streak
                      </span>
                      <span className="text-brand-text-muted">
                        • {student.totalExp} EXP
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
