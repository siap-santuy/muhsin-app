import { useState, useEffect } from "react";
import {
  Award,
  BookOpen,
  Download,
  Edit2,
  Filter,
  KeyRound,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { KoorShell } from "@/components/layout/KoorShell";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toastStore";
import { api } from "@/lib/api";
import { exportStudentListPdf } from "@/lib/exportStudentListPdf";

interface ParentRecord {
  id: string;
  name: string;
  username: string | null;
  email: string;
  phone: string | null;
  children: Array<{
    id: string;
    name: string;
    username: string | null;
    className: string | null;
  }>;
}

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

interface ActivityRow {
  studentId: string;
  studentName: string;
  className: string | null;
  yaumiyahStatus: "missing" | "draft" | "submitted";
  parentLastViewAt: string | null;
  parentLastSource: "dashboard" | "raport" | null;
  parentName: string | null;
}

function yaumiyahBadge(status: ActivityRow["yaumiyahStatus"]) {
  if (status === "submitted") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "draft") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-600 border-red-200";
}

function yaumiyahLabel(status: ActivityRow["yaumiyahStatus"]) {
  if (status === "submitted") return "Sudah Isi";
  if (status === "draft") return "Draft";
  return "Belum Isi";
}

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  const date = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}

export function KoorStudentPage() {
  const [activeTab, setActiveTab] = useState<"students" | "parents">("students");
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [parents, setParents] = useState<ParentRecord[]>([]);
  const [parentsLoading, setParentsLoading] = useState(false);
  const [activityMap, setActivityMap] = useState<Map<string, ActivityRow>>(new Map());
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [classOptions, setClassOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Modal State Santri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    classId: "",
    gender: "ikhwan" as "ikhwan" | "akhwat",
    nisn: "",
  });

  // Modal State Edit Orang Tua & Relasi Santri
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<ParentRecord | null>(null);
  const [parentModalLoading, setParentModalLoading] = useState(false);
  const [parentFormData, setParentFormData] = useState({
    name: "",
    email: "",
    phone: "",
    selectedStudentIds: [] as string[],
  });

  async function load() {
    setLoading(true);
    try {
      const params = classFilter !== "all" ? { classId: classFilter } : undefined;
      const [data, classes] = await Promise.all([
        api.getStudents(params),
        api.getClasses().catch(() => []),
      ]);
      setStudents(data);
      setClassOptions(classes);
      try {
        const activity = await api.getKoorStudentActivity({
          date: activityDate,
          ...(classFilter !== "all" ? { classId: classFilter } : {}),
        });
        setActivityMap(new Map(activity.map((a) => [a.studentId, a])));
      } catch {
        setActivityMap(new Map());
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  async function loadParents() {
    setParentsLoading(true);
    try {
      const data = await api.getSchoolParents();
      setParents(data);
    } catch {
      // Fallback
    } finally {
      setParentsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [classFilter, activityDate]);

  useEffect(() => {
    if (activeTab === "parents") {
      loadParents();
    }
  }, [activeTab]);

  async function handleResetParentDirect(parentId: string, parentName: string) {
    if (
      !window.confirm(
        `Reset password akun wali "${parentName}" ke default awal?`
      )
    ) {
      return;
    }
    try {
      const res = await api.resetSchoolParentPassword(parentId);
      toast.success(
        `Password wali berhasil di-reset ke: ${res.defaultPassword}`
      );
    } catch (err: any) {
      toast.warning(err.message || "Gagal mereset password wali");
    }
  }

  async function handleSaveParent(e: React.FormEvent) {
    e.preventDefault();
    if (!editingParent) return;
    setParentModalLoading(true);
    try {
      await api.updateSchoolParent(editingParent.id, {
        name: parentFormData.name,
        email: parentFormData.email,
        phone: parentFormData.phone || null,
        studentIds: parentFormData.selectedStudentIds,
      });
      toast.success("Data wali & relasi santri berhasil diperbarui");
      setIsParentModalOpen(false);
      loadParents();
    } catch (err: any) {
      toast.warning(err.message || "Gagal memperbarui data wali");
    } finally {
      setParentModalLoading(false);
    }
  }

  async function handleRemindParent(studentId: string, studentName: string) {
    try {
      await api.remindParent(studentId);
      toast.success(`Pengingat terkirim ke ortu ${studentName}`);
    } catch (err: any) {
      toast.warning(err.message || "Gagal mengirim pengingat");
    }
  }

  async function handleResetPassword(studentId: string, studentName: string) {
    if (
      !window.confirm(
        `Reset password santri ${studentName} & akun orang tua ke default tanggal lahir santri (format DDMMYYYY)?`
      )
    ) {
      return;
    }
    try {
      const res = await api.resetStudentPassword(studentId);
      toast.success(
        `Password ${studentName} & ortu berhasil di-reset ke: ${res.defaultPassword}`
      );
    } catch (err: any) {
      toast.warning(err.message || "Gagal mereset password");
    }
  }

  async function handleSaveStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.warning("Nama dan email wajib diisi");
      return;
    }

    setModalLoading(true);
    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          gender: formData.gender,
          nisn: formData.nisn || null,
          classId: formData.classId || null,
        });
        toast.success("Data siswa berhasil diperbarui");
      } else {
        await api.createStudent({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          gender: formData.gender,
          nisn: formData.nisn || null,
          classId: formData.classId || null,
        });
        toast.success("Siswa baru berhasil ditambahkan");
      }
      setIsModalOpen(false);
      load();
    } catch (err: any) {
      toast.warning(err.message || "Gagal menyimpan data siswa");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleDeleteStudent(id: string, name: string) {
    if (!window.confirm(`Yakin ingin menghapus siswa "${name}"?`)) return;
    try {
      await api.deleteStudent(id);
      toast.success("Siswa berhasil dihapus");
      load();
    } catch (err: any) {
      toast.warning(err.message || "Gagal menghapus siswa");
    }
  }

  const PAGE_SIZE = 5;

  const avgExp = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + (s.totalExp || 0), 0) / students.length)
    : 0;
  const activeStreakCount = students.filter((s) => (s.currentStreak || 0) > 0).length;
  const streakRate = students.length > 0 ? Math.round((activeStreakCount / students.length) * 100) : 0;

  const filtered = students.filter((st) => {
    const matchSearch =
      st.name.toLowerCase().includes(search.toLowerCase()) ||
      st.email.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(currentPage * PAGE_SIZE, filtered.length);
  const paginatedStudents = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const filteredParents = parents.filter((p) => {
    const q = search.toLowerCase();
    const matchParent =
      p.name.toLowerCase().includes(q) ||
      (p.username && p.username.toLowerCase().includes(q)) ||
      p.email.toLowerCase().includes(q);
    const matchChild = p.children.some(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.username && c.username.toLowerCase().includes(q))
    );
    return matchParent || matchChild;
  });

  return (
    <KoorShell
      activePath="students"
      title="Data Siswa & Wali Murid"
      subtitle="Monitoring Seluruh Siswa, Kelayakan Munaqosah & Akun Wali"
    >
      <div className="space-y-6">
        {/* Navigation Tabs: Data Siswa vs Data Wali Murid */}
        <div className="flex border-b border-brand-line/60 bg-white px-5 pt-3 rounded-2xl shadow-xs gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab("students");
              setPage(1);
            }}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-bold transition-all ${
              activeTab === "students"
                ? "border-brand-cyan text-brand-navy"
                : "border-transparent text-brand-muted hover:text-brand-navy"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Data Siswa ({students.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("parents");
              setPage(1);
            }}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-bold transition-all ${
              activeTab === "parents"
                ? "border-brand-cyan text-brand-navy"
                : "border-transparent text-brand-muted hover:text-brand-navy"
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Data Wali Murid ({parents.length})</span>
          </button>
        </div>
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
                {classOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="date"
              value={activityDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => {
                if (e.target.value) setActivityDate(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-brand-line/60 bg-brand-page px-3 py-2 text-xs font-semibold text-brand-navy outline-none"
            />

            <button
              type="button"
              onClick={() => {
                setEditingStudent(null);
                setFormData({ name: "", email: "", phone: "", classId: classOptions[0]?.id || "", gender: "ikhwan", nisn: "" });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-brand-cyan px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-cyan-dark transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Siswa</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                try {
                  await exportStudentListPdf(filtered, "SMP ISLAM TERPADU AL FITRAH");
                } catch (e: any) {
                  toast.warning(e.message || "Gagal mengunduh data Excel");
                }
              }}
              className="flex items-center gap-1.5 rounded-xl border border-brand-line bg-white px-4 py-2 text-xs font-bold text-brand-navy shadow-sm hover:border-brand-cyan"
            >
              <Download className="h-4 w-4 text-brand-navy/60" />
              <span>Ekspor PDF</span>
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
                Rata-rata EXP Siswa
              </p>
              <span className="text-2xl font-black text-brand-navy">{avgExp} EXP</span>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-line/60 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                <UserCheck className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                Live
              </span>
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                Siswa Aktif Streak ({activeStreakCount})
              </p>
              <span className="text-2xl font-black text-brand-navy">{streakRate}%</span>
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
        {activeTab === "students" && (
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
                    <th className="px-4 py-3">Yaumiyah</th>
                    <th className="px-4 py-3">Ortu Terakhir Lihat</th>
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
                    paginatedStudents.map((st) => {
                      const act = activityMap.get(st.id);
                      const yaumiyah = act?.yaumiyahStatus ?? "missing";
                      return (
                      <tr key={st.id} className="hover:bg-brand-page/50">
                        <td className="px-4 py-3">
                          <p className="font-bold text-brand-navy">{st.name}</p>
                          <p className="text-[10px] text-brand-text-muted">
                            {st.email}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-semibold">{st.className ?? "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${yaumiyahBadge(yaumiyah)}`}>
                            {yaumiyahLabel(yaumiyah)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-brand-navy">{formatDateTime(act?.parentLastViewAt ?? null)}</p>
                          <p className="text-[10px] text-brand-text-muted">
                            {act?.parentLastSource ? `via ${act.parentLastSource}` : "belum terpantau"}
                            {act?.parentName ? ` • ${act.parentName}` : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRemindParent(st.id, st.name)}
                              className="rounded-lg bg-brand-amber/15 px-2.5 py-1 text-[11px] font-bold text-brand-amber hover:bg-brand-amber hover:text-white transition-all"
                              title="Ingatkan orang tua"
                            >
                              Ingatkan
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStudent(st);
                                const matchedClass = classOptions.find((c) => c.name === st.className);
                                setFormData({
                                  name: st.name,
                                  email: st.email,
                                  phone: st.phone || "",
                                  classId: (st as any).classId || matchedClass?.id || "",
                                  gender: "ikhwan",
                                  nisn: "",
                                });
                                setIsModalOpen(true);
                              }}
                              className="rounded-lg p-1.5 text-brand-navy hover:bg-brand-page hover:text-brand-cyan transition-colors"
                              title="Edit Siswa"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetPassword(st.id, st.name)}
                              className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Reset Password Siswa & Ortu (Kembali ke Tanggal Lahir DDMMYYYY)"
                            >
                              <KeyRound className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStudent(st.id, st.name)}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                              title="Hapus Siswa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => (window.location.hash = `#/achievements?studentId=${st.id}`)}
                              className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-500 hover:text-white transition-all ml-1 flex items-center gap-1"
                              title="Lihat Peta Hafalan & Koleksi Badge Siswa"
                            >
                              <Award className="h-3.5 w-3.5" />
                              <span>Badge</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => (window.location.hash = "#/munaqosah")}
                              className="rounded-lg bg-brand-navy/10 px-2.5 py-1 text-[11px] font-bold text-brand-navy hover:bg-brand-navy hover:text-white transition-all ml-1"
                            >
                              Munaqosah
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

          {/* Pagination Footer */}
          <div className="flex flex-col gap-3 border-t border-brand-line/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between text-xs text-brand-text-muted">
            <span>
              Menampilkan <span className="font-bold text-brand-navy">{startIdx}–{endIdx}</span> dari{" "}
              <span className="font-bold text-brand-navy">{filtered.length}</span> murid
            </span>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
        )}

        {/* View Tab 2: Parents Management Table Section */}
        {activeTab === "parents" && (
          <div className="rounded-2xl border border-brand-line/60 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-brand-line/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama wali atau nama anak..."
                  className="h-10 w-full rounded-xl border border-brand-line/60 bg-brand-page pl-9 pr-3 text-xs font-medium text-brand-navy outline-none placeholder:text-gray-400 focus:border-brand-cyan"
                />
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="text-xs font-semibold text-brand-text-muted">
                Total <span className="font-bold text-brand-navy">{filteredParents.length}</span> akun wali murid
              </div>
            </div>

            {parentsLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-brand-navy">
                  <thead className="bg-brand-page text-[11px] font-bold uppercase tracking-wider text-brand-text-muted">
                    <tr>
                      <th className="px-4 py-3">Akun Wali Murid</th>
                      <th className="px-4 py-3">Username Login</th>
                      <th className="px-4 py-3">Santri yang Dipantau</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-line/40 font-medium">
                    {filteredParents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-xs text-brand-text-muted">
                          Tidak ada data wali murid ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredParents.map((p) => (
                        <tr key={p.id} className="hover:bg-brand-page/50">
                          <td className="px-4 py-3">
                            <p className="font-bold text-brand-navy">{p.name}</p>
                            <p className="text-[10px] text-brand-text-muted">{p.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-lg bg-gray-100 px-2 py-0.5 font-mono text-xs font-bold text-brand-navy">
                              {p.username || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {p.children.length === 0 ? (
                              <span className="text-amber-600 font-semibold text-[11px]">Belum terhubung ke santri</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {p.children.map((c) => (
                                  <span
                                    key={c.id}
                                    className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200"
                                  >
                                    {c.name} {c.className ? `(${c.className})` : ""}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingParent(p);
                                  setParentFormData({
                                    name: p.name,
                                    email: p.email,
                                    phone: p.phone || "",
                                    selectedStudentIds: p.children.map((c) => c.id),
                                  });
                                  setIsParentModalOpen(true);
                                }}
                                className="flex items-center gap-1 rounded-lg border border-brand-line bg-white px-2.5 py-1 text-[11px] font-bold text-brand-navy shadow-xs hover:border-brand-cyan hover:text-brand-cyan"
                                title="Edit Relasi Santri"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                <span>Kelola Relasi</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResetParentDirect(p.id, p.name)}
                                className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 transition-colors"
                                title="Reset Password Akun Wali"
                              >
                                <KeyRound className="h-4 w-4" />
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
        )}

        {/* Modal Add / Edit Siswa */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-brand-line pb-3">
                <h3 className="text-base font-bold text-brand-navy">
                  {editingStudent ? "Edit Data Siswa" : "Tambah Siswa Baru"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-navy"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStudent} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-brand-navy">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Muhammad Abdullah"
                    className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-brand-navy">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Contoh: abdullah@muhsin.sch.id"
                    className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                    <label className="text-xs font-bold text-brand-navy">Jenis Kelamin</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                    >
                      <option value="ikhwan">Ikhwan (Laki-laki)</option>
                      <option value="akhwat">Akhwat (Perempuan)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-brand-navy">Kelas</label>
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
                    {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : editingStudent ? "Simpan Perubahan" : "Tambah Siswa"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Modal Kelola Relasi & Akun Wali Murid */}
        {isParentModalOpen && editingParent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-brand-line pb-3">
                <div>
                  <h3 className="text-base font-bold text-brand-navy">Kelola Relasi & Akun Wali</h3>
                  <p className="text-[11px] text-brand-text-muted">
                    Username: <span className="font-mono font-bold text-brand-navy">{editingParent.username || "-"}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsParentModalOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-navy"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveParent} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-brand-navy">Nama Akun Wali</label>
                  <input
                    type="text"
                    required
                    value={parentFormData.name}
                    onChange={(e) => setParentFormData({ ...parentFormData, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-brand-navy">Email</label>
                    <input
                      type="email"
                      required
                      value={parentFormData.email}
                      onChange={(e) => setParentFormData({ ...parentFormData, email: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-brand-navy">No. HP / WA</label>
                    <input
                      type="tel"
                      value={parentFormData.phone}
                      onChange={(e) => setParentFormData({ ...parentFormData, phone: e.target.value })}
                      placeholder="08123456789"
                      className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                    />
                  </div>
                </div>

                {/* Pilih Santri Terhubung (Multi-Anak) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-brand-navy">Santri yang Terhubung (Anak Kandung)</label>
                    <span className="text-[10px] font-bold text-brand-cyan">
                      {parentFormData.selectedStudentIds.length} anak terpilih
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-text-muted mb-2">
                    Centang santri yang merupakan anak dari akun orang tua ini agar dapat dipantau sekaligus via switcher anak.
                  </p>

                  <div className="max-h-48 overflow-y-auto rounded-xl border border-brand-line/70 bg-brand-page/50 p-2 space-y-1 divide-y divide-brand-line/40">
                    {students.map((st) => {
                      const isChecked = parentFormData.selectedStudentIds.includes(st.id);
                      return (
                        <label
                          key={st.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-white cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setParentFormData({
                                    ...parentFormData,
                                    selectedStudentIds: [...parentFormData.selectedStudentIds, st.id],
                                  });
                                } else {
                                  setParentFormData({
                                    ...parentFormData,
                                    selectedStudentIds: parentFormData.selectedStudentIds.filter((id) => id !== st.id),
                                  });
                                }
                              }}
                              className="h-4 w-4 rounded border-brand-line text-brand-cyan focus:ring-brand-cyan"
                            />
                            <div>
                              <p className="text-xs font-bold text-brand-navy">{st.name}</p>
                              <p className="text-[10px] text-brand-text-muted">{st.className ?? "Tanpa Kelas"}</p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-brand-line">
                  <button
                    type="button"
                    onClick={() => setIsParentModalOpen(false)}
                    className="rounded-xl border border-brand-line px-4 py-2 text-xs font-bold text-brand-navy hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <Button
                    type="submit"
                    disabled={parentModalLoading}
                    className="rounded-xl bg-brand-cyan px-5 py-2 text-xs font-bold text-white hover:bg-brand-cyan-dark"
                  >
                    {parentModalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Relasi"}
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

export default function KoorStudentPageWrapper() {
  return <KoorStudentPage />;
}
