import { useState, useEffect, useMemo } from "react";
import {
  Check,
  Loader2,
  X,
  Plus,
  Send,
  EyeOff,
  Clock,
  AlertTriangle,
  Printer,
  FileText,
} from "lucide-react";
import { KoorShell } from "@/components/layout/KoorShell";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  exportSuratPenjadwalanPdf,
  exportSuratHasilMunaqosahPdf,
} from "@/lib/exportMunaqosahPdf";

interface MunaqosahRequestItem {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  teacherId: string;
  teacherName: string;
  juzKe: number;
  juzList?: number[] | null;
  periodId?: string | null;
  periodName?: string | null;
  status: "diajukan" | "disetujui" | "dijadwalkan" | "lulus" | "tidak_lulus" | "ditolak";
  submissionDate: string;
  assignedExaminerName?: string | null;
  examinerTeacherId?: string | null;
  examDate?: string | null;
  examTime?: string | null;
  hasil?: string | null;
  scores?: any;
  nilaiAkhir?: number | null;
  grade?: string | null;
  catatanPenguji?: string | null;
  rejectionNote?: string | null;
  isResultPublished?: boolean;
}

interface PeriodItem {
  id: string;
  nama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: string;
  isResultPublished: boolean;
}

export function KoorMunaqosahPage() {
  const [requests, setRequests] = useState<MunaqosahRequestItem[]>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([]);
  const [periods, setPeriods] = useState<PeriodItem[]>([]);
  const [teacherLoads, setTeacherLoads] = useState<Record<string, number>>({});
  const [activeAcademicPeriod, setActiveAcademicPeriod] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [pendingPage, setPendingPage] = useState(1);
  const [scheduledPage, setScheduledPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  // Tab
  const [activeTab, setActiveTab] = useState<"pending" | "scheduled" | "history">("pending");

  // Selection states
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [selectedReq, setSelectedReq] = useState<MunaqosahRequestItem | null>(null);

  // Reject Modal State
  const [rejectTarget, setRejectTarget] = useState<MunaqosahRequestItem | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");

  // Plot Jadwal Modal State
  const [scheduleTarget, setScheduleTarget] = useState<MunaqosahRequestItem | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [jadwalTanggal, setJadwalTanggal] = useState("");
  const [jadwalWaktuMulai, setJadwalWaktuMulai] = useState("08:00");
  const [jadwalWaktuSelesai, setJadwalWaktuSelesai] = useState("09:00");

  const [actionLoading, setActionLoading] = useState(false);

  // Modal Tambah Periode State
  const [showCreatePeriodModal, setShowCreatePeriodModal] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState("");
  const [newPeriodStart, setNewPeriodStart] = useState("");
  const [newPeriodEnd, setNewPeriodEnd] = useState("");
  const [creatingPeriod, setCreatingPeriod] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [exportingSchedule, setExportingSchedule] = useState(false);
  const [exportingResultId, setExportingResultId] = useState<string | null>(null);

  async function loadData() {
    try {
      const [reqs, teacherList, periodList, currentAcademic] = await Promise.all([
        api.getMunaqosahRequests(),
        api.getTeachers(),
        api.getMunaqosahPeriods().catch(() => []),
        api.getActivePeriod().catch(() => null),
      ]);
      setRequests(reqs);
      setTeachers(teacherList);
      setPeriods(periodList);
      setActiveAcademicPeriod(currentAcademic);

      if (teacherList.length > 0 && !selectedTeacherId) {
        setSelectedTeacherId(teacherList[0].id);
      }
      const openPeriod = periodList.find((p) => p.status === "buka") || periodList[0];
      if (openPeriod && !selectedPeriodId) {
        setSelectedPeriodId(openPeriod.id);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Load teacher assignment counts when period changes
  useEffect(() => {
    if (!selectedPeriodId) return;
    api.getTeacherLoads(selectedPeriodId)
      .then((loads) => {
        const map: Record<string, number> = {};
        loads.forEach((l) => {
          map[l.teacherId] = l.assignedCount;
        });
        setTeacherLoads(map);
      })
      .catch(() => setTeacherLoads({}));
  }, [selectedPeriodId]);

  const currentPeriod = periods.find((p) => p.id === selectedPeriodId) || periods[0];

  const pendingList = requests.filter((r) => r.status === "diajukan");
  const scheduledList = requests.filter(
    (r) => r.status === "dijadwalkan" || r.status === "disetujui"
  );
  const historyList = requests.filter(
    (r) => r.status === "lulus" || r.status === "tidak_lulus" || r.status === "ditolak"
  );

  const PAGE_SIZE = 8;
  const pendingTotalPages = Math.max(1, Math.ceil(pendingList.length / PAGE_SIZE));
  const pendingPaginated = pendingList.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE);

  const scheduledTotalPages = Math.max(1, Math.ceil(scheduledList.length / PAGE_SIZE));
  const scheduledPaginated = scheduledList.slice((scheduledPage - 1) * PAGE_SIZE, scheduledPage * PAGE_SIZE);

  const historyTotalPages = Math.max(1, Math.ceil(historyList.length / PAGE_SIZE));
  const historyPaginated = historyList.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

  // Hitung rentang waktu akumulatif per hari pada ujian yang telah dijadwalkan
  const dailyTimeRanges = useMemo(() => {
    const map: Record<string, { minTime: string; maxTime: string; count: number }> = {};
    scheduledList.forEach((r) => {
      if (!r.examDate || !r.examTime) return;
      const [start, end] = r.examTime.split(" - ");
      const cur = map[r.examDate];
      if (!cur) {
        map[r.examDate] = { minTime: start || r.examTime, maxTime: end || start || r.examTime, count: 1 };
      } else {
        cur.count += 1;
        if (start && start < cur.minTime) cur.minTime = start;
        if (end && end > cur.maxTime) cur.maxTime = end;
      }
    });
    return map;
  }, [scheduledList]);

  async function handleApproveSubmit() {
    if (!selectedReq) return;
    setActionLoading(true);
    try {
      await api.approveMunaqosah(selectedReq.id);
      await loadData();
      setSelectedReq(null);
    } catch (err: any) {
      alert(err.message || "Gagal menyetujui pengajuan");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmReject() {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await api.rejectMunaqosah(rejectTarget.id, rejectionNote.trim() || undefined);
      await loadData();
      setRejectTarget(null);
      setRejectionNote("");
    } catch (err: any) {
      alert(err.message || "Gagal menolak pengajuan");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleScheduleSubmit() {
    if (!scheduleTarget) return;
    if (!selectedPeriodId) {
      alert("Pilih periode ujian munaqosah terlebih dahulu");
      return;
    }
    if (!selectedTeacherId) {
      alert("Pilih guru penguji");
      return;
    }
    if (!jadwalTanggal) {
      alert("Pilih tanggal ujian");
      return;
    }

    const waktuStr = `${jadwalWaktuMulai} - ${jadwalWaktuSelesai}`;
    setActionLoading(true);
    try {
      await api.scheduleMunaqosah(scheduleTarget.id, {
        periodId: selectedPeriodId,
        examinerTeacherId: selectedTeacherId,
        jadwalTanggal,
        jadwalWaktu: waktuStr,
      });
      await loadData();
      setScheduleTarget(null);
      setJadwalTanggal("");
    } catch (err: any) {
      alert(err.message || "Gagal menjadwalkan ujian");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreatePeriodSubmit() {
    if (!newPeriodName || !newPeriodStart || !newPeriodEnd) {
      alert("Lengkapi nama periode dan tanggal mulai/selesai");
      return;
    }
    if (!activeAcademicPeriod?.id) {
      alert("Tahun ajaran aktif belum dikonfigurasi di sistem");
      return;
    }
    setCreatingPeriod(true);
    try {
      const res = await api.createMunaqosahPeriod({
        academicPeriodId: activeAcademicPeriod.id,
        nama: newPeriodName,
        tanggalMulai: newPeriodStart,
        tanggalSelesai: newPeriodEnd,
        status: "buka",
      });
      setShowCreatePeriodModal(false);
      setNewPeriodName("");
      setNewPeriodStart("");
      setNewPeriodEnd("");
      await loadData();
      if (res?.data?.id) {
        setSelectedPeriodId(res.data.id);
      }
    } catch (err: any) {
      alert(err.message || "Gagal membuat periode munaqosah");
    } finally {
      setCreatingPeriod(false);
    }
  }

  async function handlePublishToggle() {
    if (!currentPeriod) return;
    const nextState = !currentPeriod.isResultPublished;
    const confirmMsg = nextState
      ? `Rilis hasil nilai ujian "${currentPeriod.nama}" ke siswa dan orang tua sekarang? Nilai angka dan predikat akan langsung dapat dilihat di aplikasi.`
      : `Tarik kembali publikasi nilai "${currentPeriod.nama}"? Nilai akan disembunyikan kembali dari siswa dan orang tua.`;

    if (!confirm(confirmMsg)) return;

    setPublishing(true);
    try {
      await api.publishMunaqosahResults(currentPeriod.id, nextState);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status publikasi nilai");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <KoorShell
      activePath="munaqosah"
      title="Approval & Penjadwalan Munaqosah"
      subtitle="Manajemen Ujian Kenaikan Juz Hafalan & Rilis Nilai Raport"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-brand-line/60 bg-white p-5 shadow-sm md:flex-row md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-purple-100 px-3 py-0.5 text-xs font-bold text-purple-800">
                Munaqosah Tahfidz
              </span>
              {currentPeriod && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    currentPeriod.isResultPublished
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {currentPeriod.isResultPublished ? "Nilai Dirilis ke Ortu" : "Nilai Belum Dirilis"}
                </span>
              )}
            </div>
            <h1 className="mt-1.5 text-lg font-black text-brand-navy">
              {currentPeriod ? currentPeriod.nama : "Manajemen Periode Munaqosah"}
            </h1>
            <p className="text-xs text-brand-text-muted">
              {currentPeriod
                ? `Jadwal Pelaksanaan Periode: ${currentPeriod.tanggalMulai} s.d ${currentPeriod.tanggalSelesai}`
                : "Belum ada periode munaqosah aktif"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector Periode */}
            {periods.length > 0 ? (
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="rounded-xl border border-brand-line bg-gray-50/50 p-2 text-xs font-bold text-brand-navy outline-none focus:border-brand-cyan"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} ({p.status})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 font-semibold">
                Belum ada periode
              </span>
            )}

            {/* Tombol Rilis / Sembunyikan Nilai */}
            {currentPeriod && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePublishToggle}
                disabled={publishing}
                className={`h-9 rounded-xl text-xs font-bold ${
                  currentPeriod.isResultPublished
                    ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                    : "border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : currentPeriod.isResultPublished ? (
                  <>
                    <EyeOff className="mr-1.5 h-3.5 w-3.5" /> Tarik Rilis Nilai
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-3.5 w-3.5" /> Rilis Nilai ke Siswa/Ortu
                  </>
                )}
              </Button>
            )}

            {/* Tombol Cetak Surat Jadwal & Pemberitahuan */}
            {currentPeriod && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  setExportingSchedule(true);
                  try {
                    await exportSuratPenjadwalanPdf(currentPeriod, scheduledList);
                  } catch (err: any) {
                    alert("Gagal mencetak surat jadwal: " + (err?.message || err));
                  } finally {
                    setExportingSchedule(false);
                  }
                }}
                disabled={exportingSchedule || !currentPeriod}
                className="h-9 rounded-xl border-purple-300 text-purple-700 bg-purple-50/70 hover:bg-purple-100 text-xs font-bold"
              >
                {exportingSchedule ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Printer className="mr-1.5 h-3.5 w-3.5" /> Cetak Surat Jadwal
                  </>
                )}
              </Button>
            )}

            {/* Tombol Tambah Periode Baru */}
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const today = new Date();
                const startStr = today.toISOString().slice(0, 10);
                const endDate = new Date(today);
                endDate.setDate(endDate.getDate() + 2); // ~3 hari
                const endStr = endDate.toISOString().slice(0, 10);

                setNewPeriodName(`Munaqosah Periode ${today.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`);
                setNewPeriodStart(startStr);
                setNewPeriodEnd(endStr);
                setShowCreatePeriodModal(true);
              }}
              className="h-9 rounded-xl bg-brand-cyan text-xs font-bold text-white shadow-sm hover:bg-brand-cyan-dark"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Periode Baru
            </Button>
          </div>
        </div>

        {/* Info Box Rentang Sesi Harian Terjadwal */}
        {Object.keys(dailyTimeRanges).length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-purple-200 bg-purple-50/50 p-3.5 text-xs">
            <span className="font-bold text-purple-900 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-purple-600" /> Rentang Sesi Pelaksanaan Hari Ini / Terjadwal:
            </span>
            {Object.entries(dailyTimeRanges).map(([date, info]) => (
              <span key={date} className="rounded-xl bg-white px-2.5 py-1 text-[11px] font-bold text-brand-navy border border-purple-100 shadow-2xs">
                📅 {date}: <span className="text-purple-700">{info.minTime} – {info.maxTime} WIB</span> ({info.count} Santri)
              </span>
            ))}
          </div>
        )}

        {/* Tabs Navigasi */}
        <div className="flex gap-2 border-b border-brand-line/60 pb-2">
          {[
            { key: "pending", label: `Perlu Review (${pendingList.length})` },
            { key: "scheduled", label: `Dijadwalkan (${scheduledList.length})` },
            { key: "history", label: `Riwayat Ujian (${historyList.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? "bg-brand-navy text-white shadow-sm"
                  : "bg-white text-brand-navy/70 border border-brand-line hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
          </div>
        ) : (
          <>
            {/* Tab 1: Pending (TABEL RAPI) */}
            {activeTab === "pending" && (
              <div className="space-y-3">
                {pendingList.length === 0 ? (
                  <div className="rounded-2xl border border-brand-line bg-white p-8 text-center text-xs text-brand-text-muted">
                    Tidak ada pengajuan munaqosah yang pending saat ini.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-brand-line bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-brand-navy">
                        <thead>
                          <tr className="border-b border-brand-line bg-gray-50/70 text-[11px] font-bold text-brand-text-muted uppercase">
                            <th className="py-3 px-4">Santri</th>
                            <th className="py-3 px-3">Kelas</th>
                            <th className="py-3 px-3">Juz Diuji</th>
                            <th className="py-3 px-3">Guru Pembimbing</th>
                            <th className="py-3 px-3">Tanggal Diajukan</th>
                            <th className="py-3 px-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-line/60">
                          {pendingPaginated.map((req) => {
                            const juzText = req.juzList && req.juzList.length > 0 ? req.juzList.join(", ") : req.juzKe;
                            return (
                              <tr key={req.id} className="hover:bg-amber-50/30 transition-colors">
                                <td className="py-3 px-4 font-bold text-brand-navy">{req.studentName}</td>
                                <td className="py-3 px-3 text-brand-text-muted">{req.className}</td>
                                <td className="py-3 px-3">
                                  <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-[10px] font-extrabold text-brand-cyan-dark">
                                    Juz {juzText}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-brand-navy font-semibold">{req.teacherName}</td>
                                <td className="py-3 px-3 text-brand-text-muted">{req.submissionDate}</td>
                                <td className="py-3 px-4 text-right space-x-1.5">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setRejectTarget(req);
                                      setRejectionNote("");
                                    }}
                                    className="h-8 rounded-lg border-red-200 text-xs font-bold text-red-600 hover:bg-red-50"
                                  >
                                    <X className="mr-1 h-3.5 w-3.5" /> Tolak
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setSelectedReq(req)}
                                    className="h-8 rounded-lg bg-brand-cyan text-xs font-bold text-white shadow-xs hover:bg-brand-cyan-dark"
                                  >
                                    <Check className="mr-1 h-3.5 w-3.5" /> Setujui
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {pendingTotalPages > 1 && (
                      <div className="p-3 border-t border-brand-line bg-gray-50/40">
                        <Pagination page={pendingPage} totalPages={pendingTotalPages} onPageChange={setPendingPage} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Scheduled (TABEL RAPI) */}
            {activeTab === "scheduled" && (
              <div className="space-y-3">
                {scheduledList.length === 0 ? (
                  <div className="rounded-2xl border border-brand-line bg-white p-8 text-center text-xs text-brand-text-muted">
                    Belum ada ujian munaqosah yang dijadwalkan.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-brand-line bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-brand-navy">
                        <thead>
                          <tr className="border-b border-brand-line bg-gray-50/70 text-[11px] font-bold text-brand-text-muted uppercase">
                            <th className="py-3 px-4">Santri</th>
                            <th className="py-3 px-3">Kelas</th>
                            <th className="py-3 px-3">Juz Diuji</th>
                            <th className="py-3 px-3">Guru Penguji</th>
                            <th className="py-3 px-3">Jadwal & Waktu Sesi</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-line/60">
                          {scheduledPaginated.map((req) => {
                            const juzText = req.juzList && req.juzList.length > 0 ? req.juzList.join(", ") : req.juzKe;
                            return (
                              <tr key={req.id} className="hover:bg-purple-50/20 transition-colors">
                                <td className="py-3 px-4 font-bold text-brand-navy">{req.studentName}</td>
                                <td className="py-3 px-3 text-brand-text-muted">{req.className}</td>
                                <td className="py-3 px-3">
                                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-700">
                                    Juz {juzText}
                                  </span>
                                </td>
                                <td className="py-3 px-3 font-semibold text-brand-navy">
                                  {req.assignedExaminerName ?? <span className="text-amber-600 italic">Belum di-assign</span>}
                                </td>
                                <td className="py-3 px-3">
                                  {req.examDate ? (
                                    <div className="space-y-0.5">
                                      <p className="font-semibold text-brand-navy">{req.examDate}</p>
                                      {req.examTime && <p className="text-[11px] text-purple-700 font-bold">⏱️ {req.examTime}</p>}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 italic">Belum dijadwalkan</span>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                    {req.status === "disetujui" ? "Disetujui" : "Dijadwalkan"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                      setScheduleTarget(req);
                                      if (req.examinerTeacherId) setSelectedTeacherId(req.examinerTeacherId);
                                      if (req.examDate) setJadwalTanggal(req.examDate);
                                      if (req.examTime && req.examTime.includes(" - ")) {
                                        const [s, e] = req.examTime.split(" - ");
                                        setJadwalWaktuMulai(s);
                                        setJadwalWaktuSelesai(e);
                                      }
                                    }}
                                    className="h-8 rounded-lg bg-purple-600 text-xs font-bold text-white hover:bg-purple-700"
                                  >
                                    Plot Jadwal
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {scheduledTotalPages > 1 && (
                      <div className="p-3 border-t border-brand-line bg-gray-50/40">
                        <Pagination page={scheduledPage} totalPages={scheduledTotalPages} onPageChange={setScheduledPage} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: History (TABEL RAPI) */}
            {activeTab === "history" && (
              <div className="space-y-3">
                {historyList.length === 0 ? (
                  <div className="rounded-2xl border border-brand-line bg-white p-8 text-center text-xs text-brand-text-muted">
                    Belum ada riwayat hasil ujian munaqosah.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-brand-line bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-brand-navy">
                        <thead>
                          <tr className="border-b border-brand-line bg-gray-50/70 text-[11px] font-bold text-brand-text-muted uppercase">
                            <th className="py-3 px-4">Santri</th>
                            <th className="py-3 px-3">Kelas</th>
                            <th className="py-3 px-3">Juz Diuji</th>
                            <th className="py-3 px-3">Tanggal Ujian</th>
                            <th className="py-3 px-3">Hasil / Nilai</th>
                            <th className="py-3 px-3">Catatan</th>
                            <th className="py-3 px-4 text-right">SK Hasil</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-line/60">
                          {historyPaginated.map((req) => {
                            const juzText = req.juzList && req.juzList.length > 0 ? req.juzList.join(", ") : req.juzKe;
                            const finalScore = req.scores?.nilaiAkhir ?? req.nilaiAkhir;
                            const gradeLetter = req.scores?.grade ?? req.grade;
                            const isLulus = req.status === "lulus";
                            return (
                              <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4 font-bold text-brand-navy">{req.studentName}</td>
                                <td className="py-3 px-3 text-brand-text-muted">{req.className}</td>
                                <td className="py-3 px-3 font-bold text-brand-navy">Juz {juzText}</td>
                                <td className="py-3 px-3 text-brand-text-muted">{req.examDate ?? req.submissionDate}</td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                      isLulus
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {isLulus ? "LULUS" : req.status === "ditolak" ? "DITOLAK" : "TIDAK LULUS"}
                                  </span>
                                  {finalScore && (
                                    <span className="ml-2 font-bold text-brand-cyan-dark">
                                      {finalScore} ({gradeLetter ?? "-"})
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-gray-600 italic max-w-xs truncate">
                                  {req.catatanPenguji ? `"${req.catatanPenguji}"` : req.rejectionNote ? `Alasan tolak: "${req.rejectionNote}"` : "-"}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {(req.status === "lulus" || req.status === "tidak_lulus") && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => {
                                        setExportingResultId(req.id);
                                        try {
                                          await exportSuratHasilMunaqosahPdf(req);
                                        } catch (err: any) {
                                          alert("Gagal mencetak SK Hasil: " + (err?.message || err));
                                        } finally {
                                          setExportingResultId(null);
                                        }
                                      }}
                                      disabled={exportingResultId === req.id}
                                      className="h-7 px-2 text-[11px] font-bold border-brand-cyan text-brand-cyan hover:bg-brand-cyan/10"
                                    >
                                      {exportingResultId === req.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <>
                                          <FileText className="mr-1 h-3 w-3" /> Cetak SK
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {historyTotalPages > 1 && (
                      <div className="p-3 border-t border-brand-line bg-gray-50/40">
                        <Pagination page={historyPage} totalPages={historyTotalPages} onPageChange={setHistoryPage} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Tambah Periode Munaqosah Baru */}
      {showCreatePeriodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-brand-line pb-3">
              <h2 className="text-base font-bold text-brand-navy">Tambah Periode Munaqosah</h2>
              <button
                type="button"
                onClick={() => setShowCreatePeriodModal(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-brand-navy">Nama Periode Ujian</label>
                <input
                  type="text"
                  value={newPeriodName}
                  onChange={(e) => setNewPeriodName(e.target.value)}
                  placeholder="Contoh: Munaqosah Semester Ganjil - November 2026"
                  className="mt-1 w-full rounded-xl border border-brand-line p-2.5 font-medium text-brand-navy outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-brand-navy">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={newPeriodStart}
                    onChange={(e) => setNewPeriodStart(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-brand-line p-2 text-brand-navy outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="font-bold text-brand-navy">Tanggal Selesai (~3 Hari)</label>
                  <input
                    type="date"
                    value={newPeriodEnd}
                    onChange={(e) => setNewPeriodEnd(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-brand-line p-2 text-brand-navy outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-purple-50 p-3 text-[11px] text-purple-700">
                Ujian munaqosah umumnya diadakan 4x setahun (Maret, Mei, September, November) selama lebih kurang 3 hari per periode.
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreatePeriodModal(false)}
                disabled={creatingPeriod}
                className="flex-1 rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleCreatePeriodSubmit}
                disabled={creatingPeriod}
                className="flex-1 rounded-xl bg-brand-cyan font-bold text-white hover:bg-brand-cyan-dark"
              >
                {creatingPeriod ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buat Periode"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Review & Setujui */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-brand-navy">Setujui Pengajuan Munaqosah</h3>
            <p className="mt-2 text-xs text-brand-text-muted">
              Setujui santri <strong>{selectedReq.studentName}</strong> untuk mengikuti ujian Juz{" "}
              {selectedReq.juzList && selectedReq.juzList.length > 0 ? selectedReq.juzList.join(", ") : selectedReq.juzKe}?
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedReq(null)}
                className="flex-1 rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleApproveSubmit}
                disabled={actionLoading}
                className="flex-1 rounded-xl bg-brand-cyan font-bold text-white hover:bg-brand-cyan-dark"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Setujui"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tolak Pengajuan (DENGAN OPTIONAL REJECTION NOTE) */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertTriangle className="h-5 w-5" />
              <span>Tolak Pengajuan Munaqosah</span>
            </div>
            <p className="mt-2 text-xs text-brand-text-muted">
              Tolak pengajuan munaqosah untuk <strong>{rejectTarget.studentName}</strong> (Juz{" "}
              {rejectTarget.juzList && rejectTarget.juzList.length > 0 ? rejectTarget.juzList.join(", ") : rejectTarget.juzKe}).
            </p>

            <div className="mt-3">
              <label className="text-[11px] font-bold text-brand-navy">Alasan Penolakan (opsional)</label>
              <textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Contoh: Belum memenuhi syarat kelancaran setoran / diajukan di periode berikutnya..."
                rows={3}
                className="mt-1 w-full rounded-xl border border-brand-line p-2 text-xs text-brand-navy outline-none focus:border-red-400"
              />
              <p className="mt-1 text-[10px] text-gray-400">
                Catatan penolakan ini akan dikirimkan sebagai notifikasi kepada guru pengaju.
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectionNote("");
                }}
                className="flex-1 rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="flex-1 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tolak Pengajuan"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Plot Jadwal & Penguji (DURASI ~1 JAM + BEBAN PENGUJI LIVE) */}
      {scheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-brand-line pb-3">
              <h2 className="text-sm font-bold text-brand-navy">Plot Jadwal &amp; Penguji</h2>
              <button
                type="button"
                onClick={() => setScheduleTarget(null)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="font-bold text-brand-navy">
                  {scheduleTarget.studentName} (Juz {scheduleTarget.juzList && scheduleTarget.juzList.length > 0 ? scheduleTarget.juzList.join(", ") : scheduleTarget.juzKe})
                </p>
                <p className="text-brand-text-muted">{scheduleTarget.className}</p>
              </div>

              <div>
                <label className="font-bold text-brand-navy">Target Periode Ujian</label>
                <select
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line p-2.5 font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                >
                  {periods.length === 0 ? (
                    <option value="">— Belum ada periode aktif —</option>
                  ) : (
                    periods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama} ({p.status})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="font-bold text-brand-navy">Guru Penguji Munaqosah</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line p-2.5 font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                >
                  {teachers.length === 0 ? (
                    <option value="">— Belum ada data guru terdaftar —</option>
                  ) : (
                    teachers.map((t) => {
                      const load = teacherLoads[t.id] ?? 0;
                      return (
                        <option key={t.id} value={t.id}>
                          {t.name} - {load} santri di-assign
                        </option>
                      );
                    })
                  )}
                </select>
                <p className="mt-1 text-[11px] text-gray-500">
                  Semua guru langsung dapat dipilih sebagai penguji. Jumlah santri yang telah di-assign ditampilkan secara live.
                </p>
              </div>

              <div>
                <label className="font-bold text-brand-navy">Tanggal Ujian (dalam rentang periode)</label>
                <input
                  type="date"
                  value={jadwalTanggal}
                  min={currentPeriod?.tanggalMulai}
                  max={currentPeriod?.tanggalSelesai}
                  onChange={(e) => setJadwalTanggal(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line p-2 text-brand-navy outline-none focus:border-brand-cyan"
                />
                {currentPeriod && (
                  <p className="mt-1 text-[10px] text-purple-700">
                    Batas periode: {currentPeriod.tanggalMulai} s.d {currentPeriod.tanggalSelesai} (~3 hari)
                  </p>
                )}
              </div>

              {/* Sesi Jam Ujian (Durasi ~1 Jam) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-brand-navy">Waktu Mulai</label>
                  <input
                    type="time"
                    value={jadwalWaktuMulai}
                    onChange={(e) => {
                      setJadwalWaktuMulai(e.target.value);
                      // Auto set selesai +1 jam
                      const [h, m] = e.target.value.split(":").map(Number);
                      if (!isNaN(h)) {
                        const nextH = String((h + 1) % 24).padStart(2, "0");
                        setJadwalWaktuSelesai(`${nextH}:${String(m).padStart(2, "0")}`);
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-brand-line p-2 text-brand-navy outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="font-bold text-brand-navy">Waktu Selesai (~1 Jam)</label>
                  <input
                    type="time"
                    value={jadwalWaktuSelesai}
                    onChange={(e) => setJadwalWaktuSelesai(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-brand-line p-2 text-brand-navy outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setScheduleTarget(null)}
                className="flex-1 rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleScheduleSubmit}
                disabled={actionLoading}
                className="flex-1 rounded-xl bg-purple-600 font-bold text-white hover:bg-purple-700"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Jadwal"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </KoorShell>
  );
}
