import { useState, useEffect } from "react";
import {
  Award,
  BookOpen,
  Download,
  Filter,
  Loader2,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { KoorShell } from "@/components/layout/KoorShell";
import { Pagination } from "@/components/ui/Pagination";
import { api } from "@/lib/api";

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  className: string | null;
  level: number;
  totalExp: number;
  currentStreak: number;
}

export function KoorStudentPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getStudents();
        setStudents(data);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const PAGE_SIZE = 5;

  const filtered = students.filter((st) => {
    const matchSearch =
      st.name.toLowerCase().includes(search.toLowerCase()) ||
      st.email.toLowerCase().includes(search.toLowerCase());
    const matchClass =
      classFilter === "all" ||
      (st.className && st.className.toLowerCase().includes(classFilter));
    return matchSearch && matchClass;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(currentPage * PAGE_SIZE, filtered.length);
  const paginatedStudents = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <KoorShell
      activePath="students"
      title="Data & Capaian Siswa"
      subtitle="Monitoring Seluruh Siswa & Kelayakan Munaqosah"
    >
      <div className="space-y-6">
        {/* Header & Filter Bar */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-brand-line/60 bg-white p-5 shadow-sm md:flex-row md:items-center">
          <div>
            <h1 className="text-lg font-black text-brand-navy">
              Direktori Capaian TTQ Siswa
            </h1>
            <p className="text-xs text-brand-text-muted">
              Total {students.length} siswa terdaftar di seluruh kelas binaan
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-brand-line/60 bg-brand-page px-3 py-2 text-xs">
              <Filter className="h-4 w-4 text-brand-navy/60" />
              <select
                value={classFilter}
                onChange={(e) => {
                  setClassFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent font-semibold text-brand-navy outline-none"
              >
                <option value="all">Semua Kelas</option>
                <option value="vii">Kelas VII</option>
                <option value="viii">Kelas VIII</option>
                <option value="ix">Kelas IX</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl border border-brand-line bg-white px-4 py-2 text-xs font-bold text-brand-navy shadow-sm hover:border-brand-cyan"
            >
              <Download className="h-4 w-4 text-brand-navy/60" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-brand-line/60 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-brand-cyan-dark">
                <Users className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600">
                Aktif
              </span>
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                Total Murid
              </p>
              <span className="text-2xl font-black text-brand-navy">{students.length}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-line/60 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-brand-cyan-dark">
                Weekly
              </span>
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                Progress TTQ Minggu Ini
              </p>
              <span className="text-2xl font-black text-brand-navy">92.5%</span>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-line/60 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                <UserCheck className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                Baik
              </span>
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                Rata-rata Kehadiran
              </p>
              <span className="text-2xl font-black text-brand-navy">96.8%</span>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-brand-cyan to-brand-cyan-dark p-4 text-white shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-white/80">
                Capaian Mendatang
              </p>
              <h3 className="text-base font-black leading-tight text-white mt-0.5">
                Ujian Akhir Munaqosah
              </h3>
            </div>
            <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-white/20 px-2.5 py-1 text-[10px] font-bold backdrop-blur-xs w-fit">
              <Award className="h-3.5 w-3.5" />
              <span>Periode Aktif</span>
            </div>
          </div>
        </div>

        {/* Student Table Section */}
        <div className="rounded-2xl border border-brand-line/60 bg-white shadow-sm">
          {/* Table Control Header */}
          <div className="flex flex-col gap-3 border-b border-brand-line/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama atau email..."
                className="h-10 w-full rounded-xl border border-brand-line/60 bg-brand-page pl-9 pr-3 text-xs font-medium text-brand-navy outline-none placeholder:text-gray-400 focus:border-brand-cyan"
              />
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="text-xs font-semibold text-brand-text-muted">
              Menampilkan <span className="font-bold text-brand-navy">{filtered.length}</span> siswa
            </div>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-brand-navy">
                <thead className="bg-brand-page text-[11px] font-bold uppercase tracking-wider text-brand-text-muted">
                  <tr>
                    <th className="px-4 py-3">Nama Siswa</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3">Level / EXP</th>
                    <th className="px-4 py-3">Streak Yaumiyah</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line/40 font-medium">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-brand-text-muted">
                        Tidak ada data siswa ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-brand-page/50">
                        <td className="px-4 py-3">
                          <p className="font-bold text-brand-navy">{st.name}</p>
                          <p className="text-[10px] text-brand-text-muted">
                            {st.email}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-semibold">{st.className ?? "VII Abu Bakar"}</td>
                        <td className="px-4 py-3 font-bold text-brand-cyan">
                          Lv. {st.level} ({st.totalExp} EXP)
                        </td>
                        <td className="px-4 py-3 font-semibold text-brand-amber">
                          🔥 {st.currentStreak} Hari
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => (window.location.hash = "#/munaqosah")}
                            className="rounded-lg bg-brand-navy/10 px-2.5 py-1 text-[11px] font-bold text-brand-navy hover:bg-brand-navy hover:text-white transition-all"
                          >
                            Detail Munaqosah
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="flex flex-col gap-3 border-t border-brand-line/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between text-xs text-brand-text-muted">
            <span>
              Menampilkan <span className="font-bold text-brand-navy">{startIdx}–{endIdx}</span> dari{" "}
              <span className="font-bold text-brand-navy">{filtered.length}</span> murid
            </span>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>
    </KoorShell>
  );
}

export default function KoorStudentPageWrapper() {
  return <KoorStudentPage />;
}
