import { useState, useEffect } from "react";
import {
  BookOpen,
  Edit2,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { KoorShell } from "@/components/layout/KoorShell";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toastStore";
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRecord | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    classId: "",
  });

  async function load() {
    setLoading(true);
    try {
      const data = await api.getTeachers();
      setTeachers(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSaveTeacher(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.warning("Nama dan email wajib diisi");
      return;
    }

    setModalLoading(true);
    try {
      if (editingTeacher) {
        await api.updateTeacher(editingTeacher.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
        });
        toast.success("Data guru berhasil diperbarui");
      } else {
        await api.createTeacher({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
        });
        toast.success("Guru baru berhasil ditambahkan");
      }
      setIsModalOpen(false);
      load();
    } catch (err: any) {
      toast.warning(err.message || "Gagal menyimpan data guru");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleDeleteTeacher(id: string, name: string) {
    if (!window.confirm(`Yakin ingin menghapus guru "${name}"?`)) return;
    try {
      await api.deleteTeacher(id);
      toast.success("Guru berhasil dihapus");
      load();
    } catch (err: any) {
      toast.warning(err.message || "Gagal menghapus guru");
    }
  }

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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingTeacher(null);
                setFormData({ name: "", email: "", phone: "", classId: "" });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-brand-cyan px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-cyan-dark transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Guru</span>
            </button>
            <div className="relative w-full md:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama guru..."
                className="h-10 w-full rounded-xl border border-brand-line/60 bg-brand-page pl-9 pr-3 text-xs font-medium text-brand-navy outline-none placeholder:text-gray-400 focus:border-brand-cyan"
              />
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
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
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line/40 font-medium">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-brand-text-muted">
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
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            Aktif
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTeacher(t);
                                setFormData({
                                  name: t.name,
                                  email: t.email,
                                  phone: t.phone || "",
                                  classId: t.classes[0]?.id || "",
                                });
                                setIsModalOpen(true);
                              }}
                              className="rounded-lg p-1.5 text-brand-navy hover:bg-brand-page hover:text-brand-cyan transition-colors"
                              title="Edit Guru"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTeacher(t.id, t.name)}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                              title="Hapus Guru"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Add / Edit Guru */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-brand-line pb-3">
                <h3 className="text-base font-bold text-brand-navy">
                  {editingTeacher ? "Edit Data Guru" : "Tambah Guru Pembimbing Baru"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-navy"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTeacher} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-brand-navy">Nama Lengkap Guru</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Ustadz Ahmad Fauzi, Lc."
                    className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-brand-navy">Email Login</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Contoh: ustadz.ahmad@muhsin.sch.id"
                    className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-brand-navy">No. WhatsApp / HP</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08123456789"
                    className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-brand-line">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-brand-line px-4 py-2 text-xs font-bold text-brand-navy hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <Button
                    type="submit"
                    disabled={modalLoading}
                    className="rounded-xl bg-brand-cyan px-5 py-2 text-xs font-bold text-white hover:bg-brand-cyan-dark"
                  >
                    {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : editingTeacher ? "Simpan Perubahan" : "Tambah Guru"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </KoorShell>
  );
}
