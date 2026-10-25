import { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { KoorShell } from "@/components/layout/KoorShell";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function KoorDashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [activePeriod, setActivePeriod] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Pending Yaumiyah Requests
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [reqPage, setReqPage] = useState(1);
  const [reqTotalPages, setReqTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Pending Password Reset Requests
  const [pendingResets, setPendingResets] = useState<any[]>([]);
  const [resetActionLoading, setResetActionLoading] = useState<string | null>(null);
  const [resetSuccessModal, setResetSuccessModal] = useState<{ defaultPassword: string; userName?: string } | null>(null);

  // Pending Munaqosah Requests
  const [pendingMunaqosahCount, setPendingMunaqosahCount] = useState<number>(0);

  async function loadPending(page = 1) {
    try {
      const res = await api.getYaumiyahAccessRequests({ status: "pending", page, limit: 5 });
      setPendingRequests(res.data || []);
      setPendingTotal(res.meta?.total || 0);
      setReqTotalPages(res.meta?.totalPages || 1);
      setReqPage(res.meta?.page || 1);
    } catch {
      setPendingRequests([]);
      setPendingTotal(0);
    }
  }

  async function loadPasswordResets() {
    try {
      const list = await api.getPasswordResetRequests();
      setPendingResets(list || []);
    } catch {
      setPendingResets([]);
    }
  }

  async function loadMunaqosahPending() {
    try {
      const list = await api.getMunaqosahRequests("diajukan");
      setPendingMunaqosahCount(Array.isArray(list) ? list.length : 0);
    } catch {
      setPendingMunaqosahCount(0);
    }
  }

  useEffect(() => {
    Promise.all([
      api.getDashboardSummary(),
      api.getActivePeriod().catch(() => null),
      loadPending(1),
      loadPasswordResets(),
      loadMunaqosahPending(),
    ])
      .then(([sum, period]) => {
        setSummary(sum);
        setActivePeriod(period);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      await api.approveYaumiyahAccess(id);
      await loadPending(reqPage);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id);
    try {
      await api.rejectYaumiyahAccess(id, "Ditolak dari Dashboard Koordinator");
      await loadPending(reqPage);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResolvePasswordReset(id: string) {
    setResetActionLoading(id);
    try {
      const res = await api.resolvePasswordResetRequest(id);
      setResetSuccessModal({
        defaultPassword: res.defaultPassword,
        userName: res.userName,
      });
      await loadPasswordResets();
    } finally {
      setResetActionLoading(null);
    }
  }

  async function handleRejectPasswordReset(id: string) {
    setResetActionLoading(id);
    try {
      await api.rejectPasswordResetRequest(id, "Ditolak oleh Koordinator");
      await loadPasswordResets();
    } finally {
      setResetActionLoading(null);
    }
  }

  const totalStudents = summary?.totalStudents ?? 0;
  const totalTeachers = summary?.totalTeachers ?? 0;
  const totalClasses = summary?.totalClasses ?? 0;
  const setoranMingguIni = summary?.setoranMingguIniCount ?? 0;
  const chartData: Array<{ day: string; Ziyadah: number; Murojaah: number; Tahsin: number }> =
    summary?.chartData ?? [];

  const stats = [
    {
      label: "TOTAL SISWA",
      value: String(totalStudents),
      subtext: "Terdaftar Aktif",
      subtextColor: "text-brand-cyan-dark font-bold",
      icon: GraduationCap,
      iconBg: "bg-cyan-100 text-brand-cyan-dark",
    },
    {
      label: "GURU PEMBIMBING",
      value: String(totalTeachers),
      subtext: `${totalClasses} Kelas Binaan`,
      subtextColor: "text-emerald-600 font-bold",
      icon: Users,
      iconBg: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "TOTAL KELAS",
      value: String(totalClasses),
      subtext: activePeriod ? `TA ${activePeriod.tahunAjaran} • ${activePeriod.semester}` : "Tahun Ajaran Aktif",
      subtextColor: "text-brand-text-muted",
      icon: BookOpen,
      iconBg: "bg-slate-100 text-brand-navy",
    },
    {
      label: "SETORAN PEKAN INI",
      value: String(setoranMingguIni),
      subtext: "Aktivitas Terverifikasi 7 Hari",
      subtextColor: "text-orange-600 font-bold",
      icon: Award,
      iconBg: "bg-orange-100 text-orange-600",
      badge: loading ? "Memuat..." : "Live",
    },
  ];

  return (
    <KoorShell
      title="Dashboard Koordinator TTQ"
      subtitle="Monitoring program TTQ &amp; Ibadah Siswa"
      activePath="dashboard"
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="relative rounded-2xl border border-brand-line bg-white p-4 shadow-sm"
              >
                {item.badge && (
                  <span className="absolute right-3 top-3 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                    {item.badge}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-brand-navy/60">
                      {item.label}
                    </p>
                    <p className="text-xl font-extrabold text-brand-navy">
                      {item.value}
                    </p>
                  </div>
                </div>
                <p className={`mt-2 text-xs ${item.subtextColor}`}>
                  {item.subtext}
                </p>
              </div>
            );
          })}
        </div>

        {/* Banner Antrean Pengajuan Munaqosah (Muncul jika ada pengajuan) */}
        {pendingMunaqosahCount > 0 && (
          <div className="flex items-center justify-between rounded-2xl border-2 border-purple-200 bg-purple-50/70 p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
                <Award className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-brand-navy">
                  {pendingMunaqosahCount} Pengajuan Munaqosah Menunggu Review
                </h3>
                <p className="text-xs text-brand-text-muted">
                  Guru pembimbing telah mengajukan santri siap ujian kenaikan juz
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => (window.location.hash = "#/munaqosah")}
              className="h-8 rounded-lg bg-purple-600 text-xs font-bold text-white shadow-xs hover:bg-purple-700"
            >
              Review &amp; Plot Jadwal →
            </Button>
          </div>
        )}

        {/* Tabel Request Susulan Yaumiyah Pending (Hanya muncul jika ada request) */}
        {pendingRequests.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-brand-navy">
                    Permohonan Izin Susulan Yaumiyah ({pendingTotal} Menunggu)
                  </h2>
                  <p className="text-xs text-brand-text-muted">
                    Santri meminta dispensasi pembukaan akses pengisian ibadah lampau
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => (window.location.hash = "#/yaumiyah-approval")}
                className="h-8 rounded-lg border-brand-cyan text-xs font-bold text-brand-cyan hover:bg-brand-cyan/10"
              >
                Lihat Semua <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs text-brand-navy">
                <thead>
                  <tr className="border-b border-amber-200/60 text-[11px] font-bold text-brand-text-muted">
                    <th className="py-2">SANTRI</th>
                    <th className="py-2">KELAS</th>
                    <th className="py-2">RENTANG TANGGAL</th>
                    <th className="py-2">ALASAN</th>
                    <th className="py-2 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {pendingRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-amber-100/30">
                      <td className="py-2.5 font-bold">{req.studentName}</td>
                      <td className="py-2.5 text-brand-text-muted">{req.className || "-"}</td>
                      <td className="py-2.5 font-semibold text-brand-cyan">
                        {req.startDate === req.endDate ? req.startDate : `${req.startDate} s.d ${req.endDate}`}
                      </td>
                      <td className="py-2.5 italic text-gray-600 max-w-xs truncate">
                        &ldquo;{req.reason}&rdquo;
                      </td>
                      <td className="py-2.5 text-right space-x-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoading === req.id}
                          className="h-7 px-2 border-red-300 text-[11px] font-bold text-red-600 hover:bg-red-50"
                        >
                          <X className="mr-1 h-3 w-3" /> Tolak
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleApprove(req.id)}
                          disabled={actionLoading === req.id}
                          className="h-7 px-2.5 bg-emerald-600 text-[11px] font-bold text-white hover:bg-emerald-700"
                        >
                          <Check className="mr-1 h-3 w-3" /> Setujui
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {reqTotalPages > 1 && (
              <div className="mt-3 flex items-center justify-between border-t border-amber-200/60 pt-2 text-xs text-brand-text-muted">
                <span>Halaman {reqPage} dari {reqTotalPages}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => loadPending(reqPage - 1)}
                    disabled={reqPage <= 1}
                    className="rounded p-1 text-brand-navy hover:bg-amber-100 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPending(reqPage + 1)}
                    disabled={reqPage >= reqTotalPages}
                    className="rounded p-1 text-brand-navy hover:bg-amber-100 disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabel Permohonan Reset Password Akun Pending (Hanya muncul jika ada request) */}
        {pendingResets.length > 0 && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-blue-200/60">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-brand-navy">
                    Permohonan Reset Password Akun ({pendingResets.length} Menunggu)
                  </h2>
                  <p className="text-xs text-brand-text-muted">
                    Pengguna (Santri, Orang Tua, atau Guru) lupa kata sandi dan meminta reset ke default
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs text-brand-navy">
                <thead>
                  <tr className="border-b border-blue-200/60 text-[11px] font-bold text-brand-text-muted">
                    <th className="py-2">NAMA PENGGUNA</th>
                    <th className="py-2">PERAN (ROLE)</th>
                    <th className="py-2">USERNAME / EMAIL</th>
                    <th className="py-2">WAKTU DIAJUKAN</th>
                    <th className="py-2 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {pendingResets.map((req) => {
                    const roleLabel =
                      req.userRole === "teacher"
                        ? "Guru"
                        : req.userRole === "parent"
                        ? "Orang Tua"
                        : "Santri";
                    const roleBadge =
                      req.userRole === "teacher"
                        ? "bg-purple-100 text-purple-700"
                        : req.userRole === "parent"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-cyan-100 text-cyan-800";
                    return (
                      <tr key={req.id} className="hover:bg-blue-100/30">
                        <td className="py-2.5 font-bold">{req.userName}</td>
                        <td className="py-2.5">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${roleBadge}`}>
                            {roleLabel}
                          </span>
                        </td>
                        <td className="py-2.5 font-semibold text-brand-navy">
                          {req.identifier}
                        </td>
                        <td className="py-2.5 text-brand-text-muted">
                          {new Date(req.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2.5 text-right space-x-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectPasswordReset(req.id)}
                            disabled={resetActionLoading === req.id}
                            className="h-7 px-2 border-red-300 text-[11px] font-bold text-red-600 hover:bg-red-50"
                          >
                            <X className="mr-1 h-3 w-3" /> Tolak
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleResolvePasswordReset(req.id)}
                            disabled={resetActionLoading === req.id}
                            className="h-7 px-2.5 bg-blue-600 text-[11px] font-bold text-white hover:bg-blue-700"
                          >
                            <Check className="mr-1 h-3 w-3" /> Reset Default
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Hasil Reset Password */}
        {resetSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl animate-in fade-in zoom-in-95">
              <h3 className="text-base font-bold text-brand-navy">Password Berhasil Direset</h3>
              <p className="mt-1 text-xs text-brand-text-muted">
                Kata sandi untuk {resetSuccessModal.userName ? <strong>{resetSuccessModal.userName}</strong> : "pengguna"} telah dikembalikan ke format default:
              </p>
              <div className="mt-3 rounded-xl bg-gray-100 p-3 text-center">
                <span className="font-mono text-lg font-bold tracking-wider text-brand-cyan-dark">
                  {resetSuccessModal.defaultPassword}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-brand-text-muted">
                Silakan sampaikan password default ini kepada yang bersangkutan.
              </p>
              <Button
                type="button"
                onClick={() => setResetSuccessModal(null)}
                className="mt-4 w-full rounded-xl bg-brand-cyan font-bold text-white hover:bg-brand-cyan-dark"
              >
                Tutup
              </Button>
            </div>
          </div>
        )}

        {/* Chart Setoran */}
        <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-brand-navy">
                Aktivitas Setoran Pekan Ini
              </h2>
              <p className="text-xs text-brand-text-muted">
                Jumlah setoran per kategori TTQ
              </p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-brand-cyan">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-cyan" />
                Ziyadah
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Muroja&apos;ah
              </span>
              <span className="flex items-center gap-1.5 text-purple-600">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                Tahsin
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Ziyadah" fill="#22bad0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Murojaah" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Tahsin" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </KoorShell>
  );
}
