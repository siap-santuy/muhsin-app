import { useState, useEffect } from "react";
import {
  BookOpen,
  GraduationCap,
  Loader2,
  Search,
  Users,
} from "lucide-react";
import { KoorShell } from "@/components/layout/KoorShell";
import { api } from "@/lib/api";

interface TeacherRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  classes: Array<{ id: string; name: string }>;
  studentCount: number;
}

export function KoorTeacherPage() {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getTeachers();
        setTeachers(data);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <KoorShell
      activePath="teachers"
      title="Data Guru Pembimbing TTQ"
      subtitle="Manajemen Penugasan Guru &amp; Kelas Halaqah"
    >
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-brand-line/60 bg-white p-5 shadow-sm md:flex-row md:items-center">
          <div>
            <h1 className="text-lg font-black text-brand-navy">
              Direktori Guru Pembimbing TTQ
            </h1>
            <p className="text-xs text-brand-text-muted">
              Total {teachers.length} guru aktif mengampu kelas bimbingan
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama guru atau email..."
              className="h-10 w-full rounded-xl border border-brand-line/60 bg-brand-page pl-9 pr-3 text-xs font-medium text-brand-navy outline-none placeholder:text-gray-400 focus:border-brand-cyan"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand-line/60 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-brand-cyan-dark">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                  Total Guru
                </p>
                <span className="text-2xl font-black text-brand-navy">{teachers.length} Guru</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-line/60 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                  Status Aktif
                </p>
                <span className="text-2xl font-black text-emerald-600">100% Aktif</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-line/60 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                  Rata-rata Siswa / Guru
                </p>
                <span className="text-2xl font-black text-brand-navy">15 Siswa</span>
              </div>
            </div>
          </div>
        </div>

        {/* Teachers Table */}
        <div className="rounded-2xl border border-brand-line/60 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-brand-navy">
                <thead className="bg-brand-page text-[11px] font-bold uppercase tracking-wider text-brand-text-muted">
                  <tr>
                    <th className="px-4 py-3">Nama Guru</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Kelas Bimbingan</th>
                    <th className="px-4 py-3">Total Siswa</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line/40 font-medium">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-brand-text-muted">
                        Tidak ada guru ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t) => (
                      <tr key={t.id} className="hover:bg-brand-page/50">
                        <td className="px-4 py-3 font-bold text-brand-navy">{t.name}</td>
                        <td className="px-4 py-3 text-brand-text-muted">{t.email}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-xs font-bold text-brand-cyan-dark">
                            {t.classes.length > 0
                              ? t.classes.map((c) => c.name).join(", ")
                              : "Halaqah VII Abu Bakar"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-brand-navy">
                          {t.studentCount || 15} Siswa
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            Aktif
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </KoorShell>
  );
}
