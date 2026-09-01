import { useState, useEffect } from "react";
import {
  BookOpen,
  ChevronDown,
  Loader2,
  Mic,
  Plus,
  Repeat,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
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
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<StudentItem | null>(null);

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

  const classesList = Array.from(
    new Set(students.map((s) => s.className).filter(Boolean) as string[])
  );

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchClass = selectedClass === "all" || s.className === selectedClass;
    return matchSearch && matchClass;
  });

  function handleAction(type: "ziyadah" | "murojaah" | "sabiq" | "talaqi", studentId: string) {
    sessionStorage.setItem("selectedStudentId", studentId);
    setSelectedStudentForAction(null);
    window.location.hash = `#/${type}-input`;
  }

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      <AppHeader />

      <main className="flex-1 overflow-y-auto px-4 pt-1 pb-20">
        <div className="flex flex-col gap-4">
          {/* Header Title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-brand-navy">
                Daftar Siswa Bimbingan
              </h1>
              <p className="text-xs text-brand-text-muted">
                {students.length} Siswa Terdaftar
              </p>
            </div>
            {classesList.length > 0 && (
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="appearance-none rounded-xl border border-brand-line bg-white py-1.5 pl-3 pr-8 text-xs font-bold text-brand-navy outline-none shadow-xs"
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
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama santri..."
              className="w-full rounded-2xl border border-brand-line bg-white py-3 pl-11 pr-4 text-xs font-semibold text-brand-navy outline-none shadow-sm placeholder:text-gray-400 focus:border-brand-cyan"
            />
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Loading indicator */}
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
            </div>
          ) : null}

          {/* Error display */}
          {error ? (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
              {error}
            </div>
          ) : null}

          {/* Empty state */}
          {!loading && filtered.length === 0 ? (
            <div className="rounded-2xl border border-brand-line bg-white p-8 text-center text-xs text-brand-text-muted">
              {search
                ? `Tidak ada siswa yang cocok dengan pencarian "${search}".`
                : "Belum ada data siswa bimbingan."}
            </div>
          ) : null}

          {/* Student List */}
          {!loading && filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((s) => {
                const initials = s.name
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase();

                return (
                  <div
                    key={s.id}
                    className="flex flex-col gap-2.5 rounded-2xl border border-brand-line bg-white p-4 shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-cyan/10 text-sm font-extrabold text-brand-cyan-dark">
                          {initials}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-brand-navy">
                            {s.name}
                          </h3>
                          <p className="text-[11px] text-brand-text-muted">
                            {s.className ?? "Kelas TTQ"} &bull; Level {s.level}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 border border-emerald-200">
                        {s.currentStreak > 0 ? `${s.currentStreak}d Streak` : "Aktif"}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1 border-t border-brand-line/40">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForAction(s)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-brand-cyan/10 py-2 text-xs font-bold text-brand-cyan-dark hover:bg-brand-cyan/20 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" /> Input Nilai
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sessionStorage.setItem("selectedStudentId", s.id);
                          window.location.hash = "#/ziyadah-view";
                        }}
                        className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-brand-line py-2 text-xs font-bold text-brand-navy hover:bg-gray-50 transition-colors"
                      >
                        Riwayat
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </main>

      {/* Input Action Sheet Modal */}
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
                  Santri: {selectedStudentForAction.name}
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
                className="flex flex-col items-center justify-center rounded-2xl border border-brand-line bg-brand-cyan/5 p-3.5 text-center hover:border-brand-cyan"
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
                className="flex flex-col items-center justify-center rounded-2xl border border-brand-line bg-purple-50/50 p-3.5 text-center hover:border-purple-300"
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
                className="flex flex-col items-center justify-center rounded-2xl border border-brand-line bg-amber-50/50 p-3.5 text-center hover:border-amber-300"
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
                className="flex flex-col items-center justify-center rounded-2xl border border-brand-line bg-emerald-50/50 p-3.5 text-center hover:border-emerald-300"
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

      <BottomNav items={TEACHER_NAV_ITEMS} activeIndex={1} />
    </div>
  );
}
