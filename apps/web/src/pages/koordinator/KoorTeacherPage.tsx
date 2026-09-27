import { useState, useEffect } from "react";
import {
  BookOpen,
  CalendarClock,
  Edit2,
  GraduationCap,
  Loader2,
  Plus,
  Repeat,
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

interface TeacherActivityInfo {
  lastAssessmentAt: string | null;
  assessedToday: boolean;
  countToday: number;
}

function formatDateTime(iso: string | null) {
  if (!iso) return "Belum pernah";
  const d = new Date(iso);
  const date = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}

export function KoorTeacherPage() {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [activityMap, setActivityMap] = useState<Map<string, TeacherActivityInfo>>(new Map());
  const [classOptions, setClassOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [substitutions, setSubstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [subForm, setSubForm] = useState({
    absentTeacherId: "",
    substituteTeacherId: "",
    classId: "",
    dateStart: "",
    dateEnd: "",
    reason: "",
  });

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
      const [data, classes, subs] = await Promise.all([
        api.getTeachers(),
        api.getClasses().catch(() => []),
        api.getSubstitutions().catch(() => []),
      ]);
      setTeachers(data);
      setClassOptions(classes);
      setSubstitutions(subs);
      try {
        const activity = await api.getKoorTeacherActivity();
        setActivityMap(new Map(activity.map((a) => [a.teacherId, a])));
      } catch {
        setActivityMap(new Map());
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSubstitution(e: React.FormEvent) {
    e.preventDefault();
    if (!subForm.absentTeacherId || !subForm.substituteTeacherId || !subForm.classId || !subForm.dateStart || !subForm.dateEnd) {
      toast.warning("Lengkapi guru berhalangan, pengganti, kelas, dan rentang tanggal");
      return;
    }
    if (subForm.absentTeacherId === subForm.substituteTeacherId) {
      toast.warning("Guru pengganti harus berbeda dengan guru berhalangan");
      return;
    }
    setSubLoading(true);
    try {
      await api.createSubstitution(subForm);
      toast.success("Penugasan guru pengganti berhasil dibuat");
      setIsSubModalOpen(false);
      setSubForm({ absentTeacherId: "", substituteTeacherId: "", classId: "", dateStart: "", dateEnd: "", reason: "" });
      load();
    } catch (err: any) {
      toast.warning(err.message || "Gagal membuat penugasan pengganti");
    } finally {
      setSubLoading(false);
    }
  }

  async function handleDeleteSubstitution(id: string) {
    if (!window.confirm("Batalkan penugasan guru pengganti ini?")) return;
    try {
      await api.deleteSubstitution(id);
      toast.success("Penugasan pengganti dibatalkan");
      load();
    } catch (err: any) {
      toast.warning(err.message || "Gagal membatalkan penugasan");
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
          classId: formData.classId || null,
        });
        toast.success("Data guru berhasil diperbarui");
      } else {
        await api.createTeacher({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          classId: formData.classId || null,
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

  const totalAssignedStudents = teachers.reduce((sum, t) => sum + (t.studentCount || 0), 0);
  const avgStudents = teachers.length > 0 ? Math.round(totalAssignedStudents / teachers.length) : 0;

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
                  Total Siswa Binaan
                </p>
                <span className="text-2xl font-black text-emerald-600">{totalAssignedStudents} Siswa</span>
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
                <span className="text-2xl font-black text-brand-navy">{avgStudents} Siswa</span>
              </div>
            </div>
          </div>
        </div>

        {/* Substitute Assignment Section */}
        <div className="rounded-2xl border border-brand-line/60 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-brand-line/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Repeat className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-brand-navy">Guru Pengganti Sementara</h2>
                <p className="text-xs text-brand-text-muted">
                  {substitutions.length} penugasan aktif untuk guru berhalangan (izin/sakit)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSubModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition-colors"
            >
              <CalendarClock className="h-4 w-4" />
              <span>Tugaskan Pengganti</span>
            </button>
          </div>
          <div className="divide-y divide-brand-line/40">
            {substitutions.length === 0 ? (
              <p className="p-4 text-xs text-brand-text-muted">Belum ada penugasan pengganti.</p>
            ) : (
              substitutions.map((s) => {
                const absent = teachers.find((t) => t.id === s.absentTeacherId)?.name ?? "Guru berhalangan";
                const sub = teachers.find((t) => t.id === s.substituteTeacherId)?.name ?? "Guru pengganti";
                const cls = classOptions.find((c) => c.id === s.classId)?.name ?? "Kelas";
                return (
                  <div key={s.id} className="flex flex-col gap-2 p-4 text-xs sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-brand-navy">{sub} menggantikan {absent}</p>
                      <p className="text-brand-text-muted">{cls} • {String(s.dateStart).slice(0, 10)} s/d {String(s.dateEnd).slice(0, 10)}{s.reason ? ` • ${s.reason}` : ""}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubstitution(s.id)}
                      className="w-fit rounded-lg px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50"
                    >
                      Batalkan
                    </button>
                  </div>
                );
              })
            )}
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
                    <th className="px-4 py-3">Penilaian Terakhir</th>
                    <th className="px-4 py-3 text-center">Hari Ini</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line/40 font-medium">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-brand-text-muted">
                        Tidak ada guru ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t) => {
                      const act = activityMap.get(t.id);
                      return (
                      <tr key={t.id} className="hover:bg-brand-page/50">
                        <td className="px-4 py-3 font-bold text-brand-navy">{t.name}</td>
                        <td className="px-4 py-3 text-brand-text-muted">{t.email}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-xs font-bold text-brand-cyan-dark">
                            {t.classes.length > 0
                              ? t.classes.map((c) => c.name).join(", ")
                              : "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-brand-navy">
                          {t.studentCount} Siswa
                        </td>
                        <td className="px-4 py-3 font-semibold text-brand-navy">
                          {formatDateTime(act?.lastAssessmentAt ?? null)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${act?.assessedToday ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                            {act?.assessedToday ? `Sudah (${act.countToday})` : "Belum"}
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
                      );
                    })
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

                <div>
                  <label className="text-xs font-bold text-brand-navy">Kelas Bimbingan</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                  >
                    <option value="">Pilih Kelas...</option>
                    {classOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
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

        {isSubModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-brand-line pb-3">
                <h3 className="text-base font-bold text-brand-navy">Tugaskan Guru Pengganti</h3>
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-navy"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSubstitution} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-brand-navy">Guru Berhalangan</label>
                  <select
                    required
                    value={subForm.absentTeacherId}
                    onChange={(e) => setSubForm({ ...subForm, absentTeacherId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                  >
                    <option value="">Pilih Guru...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-brand-navy">Guru Pengganti</label>
                  <select
                    required
                    value={subForm.substituteTeacherId}
                    onChange={(e) => setSubForm({ ...subForm, substituteTeacherId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                  >
                    <option value="">Pilih Guru...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-brand-navy">Kelas yang Digantikan</label>
                  <select
                    required
                    value={subForm.classId}
                    onChange={(e) => setSubForm({ ...subForm, classId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                  >
                    <option value="">Pilih Kelas...</option>
                    {classOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-brand-navy">Tanggal Mulai</label>
                    <input
                      type="date"
                      required
                      value={subForm.dateStart}
                      onChange={(e) => setSubForm({ ...subForm, dateStart: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-brand-navy">Tanggal Selesai</label>
                    <input
                      type="date"
                      required
                      value={subForm.dateEnd}
                      onChange={(e) => setSubForm({ ...subForm, dateEnd: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-brand-line">
                  <button
                    type="button"
                    onClick={() => setIsSubModalOpen(false)}
                    className="rounded-xl border border-brand-line px-4 py-2 text-xs font-bold text-brand-navy hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <Button
                    type="submit"
                    disabled={subLoading}
                    className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white hover:bg-amber-600"
                  >
                    {subLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tugaskan"}
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
