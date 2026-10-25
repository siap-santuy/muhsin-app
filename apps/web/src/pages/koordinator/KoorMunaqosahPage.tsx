import { useState, useEffect } from "react";
import {
  Award,
  Check,
  Loader2,
  X,
  Plus,
  Send,
  EyeOff,
} from "lucide-react";
import { KoorShell } from "@/components/layout/KoorShell";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

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
  examDate?: string | null;
  examTime?: string | null;
  hasil?: string | null;
  scores?: any;
  nilaiAkhir?: number | null;
  grade?: string | null;
  catatanPenguji?: string | null;
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
  const [activeAcademicPeriod, setActiveAcademicPeriod] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<MunaqosahRequestItem | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [jadwalTanggal, setJadwalTanggal] = useState("");
  const [jadwalWaktu, setJadwalWaktu] = useState("");
  const [scheduleTarget, setScheduleTarget] = useState<MunaqosahRequestItem | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "scheduled" | "history" | "pool">("pending");
  const [examiners, setExaminers] = useState<Array<{ id: string; teacherId: string; teacherName: string; kapasitasSiswa: number; terpakai: number }>>([]);
  const [poolTeacherId, setPoolTeacherId] = useState("");
  const [poolKapasitas, setPoolKapasitas] = useState(10);
  const [actionLoading, setActionLoading] = useState(false);
  const [scheduledPage, setScheduledPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  // Modal Tambah Periode State
  const [showCreatePeriodModal, setShowCreatePeriodModal] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState("");
  const [newPeriodStart, setNewPeriodStart] = useState("");
  const [newPeriodEnd, setNewPeriodEnd] = useState("");
  const [creatingPeriod, setCreatingPeriod] = useState(false);
  const [publishing, setPublishing] = useState(false);

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

  useEffect(() => {
    if (!selectedPeriodId) return;
    api.getMunaqosahExaminers(selectedPeriodId)
      .then((list) => setExaminers(Array.isArray(list) ? list : []))
      .catch(() => setExaminers([]));
  }, [selectedPeriodId]);

  const currentPeriod = periods.find((p) => p.id === selectedPeriodId) || periods[0];

  const pendingList = requests.filter((r) => r.status === "diajukan");
  const scheduledList = requests.filter(
    (r) => r.status === "dijadwalkan" || r.status === "disetujui"
  );
  const historyList = requests.filter(
    (r) => r.status === "lulus" || r.status === "tidak_lulus" || r.status === "ditolak"
  );

  const PAGE_SIZE = 5;
  const scheduledTotalPages = Math.max(1, Math.ceil(scheduledList.length / PAGE_SIZE));
  const scheduledPaginated = scheduledList.slice(
    (scheduledPage - 1) * PAGE_SIZE,
    scheduledPage * PAGE_SIZE
  );

  const historyTotalPages = Math.max(1, Math.ceil(historyList.length / PAGE_SIZE));
  const historyPaginated = historyList.slice(
    (historyPage - 1) * PAGE_SIZE,
    historyPage * PAGE_SIZE
  );

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

  async function handleScheduleSubmit() {
    if (!scheduleTarget) return;
    if (!selectedPeriodId || !selectedTeacherId || !jadwalTanggal) {
      alert("Lengkapi periode, penguji, dan tanggal ujian");
      return;
    }
    setActionLoading(true);
    try {
      await api.scheduleMunaqosah(scheduleTarget.id, {
        periodId: selectedPeriodId,
        examinerTeacherId: selectedTeacherId,
        jadwalTanggal,
        jadwalWaktu: jadwalWaktu || undefined,
      });
      await loadData();
      setScheduleTarget(null);
      setJadwalTanggal("");
      setJadwalWaktu("");
    } catch (err: any) {
      alert(err.message || "Gagal menjadwalkan ujian");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(id: string) {
    if (!confirm("Yakin ingin menolak pengajuan ini?")) return;
    try {
      await api.rejectMunaqosah(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menolak pengajuan");
    }
  }

  async function refreshPool() {
    if (!selectedPeriodId) return;
    try {
      const list = await api.getMunaqosahExaminers(selectedPeriodId);
      setExaminers(Array.isArray(list) ? list : []);
    } catch {
      setExaminers([]);
    }
  }

  async function handleSavePool() {
    const teacherId = poolTeacherId || selectedTeacherId;
    if (!selectedPeriodId || !teacherId) {
      alert("Pilih periode dan guru penguji");
      return;
    }
    setActionLoading(true);
    try {
      await api.saveMunaqosahExaminer(selectedPeriodId, { teacherId, kapasitasSiswa: poolKapasitas });
      setPoolTeacherId("");
      await refreshPool();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan penguji");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemovePool(teacherId: string, teacherName: string) {
    if (!selectedPeriodId) return;
    if (!confirm(`Hapus ${teacherName} dari pool penguji?`)) return;
    try {
      await api.removeMunaqosahExaminer(selectedPeriodId, teacherId);
      await refreshPool();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus penguji");
    }
  }

  async function handleCreatePeriodSubmit() {
    if (!newPeriodName || !newPeriodStart || !newPeriodEnd) {
      alert("Lengkapi nama periode dan tanggal mulai/selesai");
      return;
    }
    if (!activeAcademicPeriod?.id) {
      alert("Tahun ajaran aktif belum dikonfigurasi");
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
      ? `Rilis hasil ujian untuk "${currentPeriod.nama}" ke siswa dan orang tua sekarang? Nilai angka dan predikat akan langsung dapat dilihat di aplikasi.`
      : `Tarik kembali publikasi nilai untuk "${currentPeriod.nama}"? Siswa dan orang tua tidak akan dapat melihat nilai di aplikasi.`;

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
                ? `Pelaksanaan: ${currentPeriod.tanggalMulai} s.d ${currentPeriod.tanggalSelesai}`
                : "Belum ada periode munaqosah aktif"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector Periode */}
            {periods.length > 0 && (
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
                    <EyeOff className="mr-1.5 h-3.5 w-3.5" /> Tarik Rilis
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-3.5 w-3.5" /> Rilis Nilai ke Siswa/Ortu
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

        {/* Tabs */}
        <div className="flex gap-2 border-b border-brand-line/60 pb-2">
          {[
            { key: "pending", label: `Perlu Review (${pendingList.length})` },
            { key: "scheduled", label: `Dijadwalkan (${scheduledList.length})` },
            { key: "history", label: `Riwayat Ujian (${historyList.length})` },
            { key: "pool", label: `Pool Penguji (${examiners.length})` },
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
            {/* Tab 1: Pending */}
            {activeTab === "pending" && (
              <div className="space-y-3">
                {pendingList.length === 0 ? (
                  <div className="rounded-2xl border border-brand-line bg-white p-8 text-center text-xs text-brand-text-muted">
                    Tidak ada pengajuan munaqosah yang pending saat ini.
                  </div>
                ) : (
                  pendingList.map((req) => {
                    const juzText = req.juzList && req.juzList.length > 0 ? req.juzList.join(", ") : req.juzKe;
                    return (
                      <div
                        key={req.id}
                        className="flex flex-col justify-between gap-4 rounded-2xl border border-brand-line bg-white p-4 shadow-sm md:flex-row md:items-center"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                            <Award className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-brand-navy">
                                {req.studentName}
                              </h3>
                              <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-brand-cyan-dark">
                                Juz {juzText}
                              </span>
                            </div>
                            <p className="text-xs text-brand-text-muted">
                              {req.className} • Diajukan oleh: {req.teacherName} ({req.submissionDate})
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleReject(req.id)}
                            className="h-9 rounded-xl border-red-200 text-xs font-bold text-red-600 hover:bg-red-50"
                          >
                            <X className="mr-1 h-3.5 w-3.5" /> Tolak
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setSelectedReq(req)}
                            className="h-9 rounded-xl bg-brand-cyan text-xs font-bold text-white shadow-sm hover:bg-brand-cyan-dark"
                          >
                            <Check className="mr-1 h-3.5 w-3.5" /> Review &amp; Setujui
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 2: Scheduled */}
            {activeTab === "scheduled" && (
              <div className="space-y-3">
                {scheduledPaginated.length === 0 ? (
                  <div className="rounded-2xl border border-brand-line bg-white p-8 text-center text-xs text-brand-text-muted">
                    Belum ada ujian munaqosah yang dijadwalkan.
                  </div>
                ) : (
                  scheduledPaginated.map((req) => {
                    const juzText = req.juzList && req.juzList.length > 0 ? req.juzList.join(", ") : req.juzKe;
                    return (
                      <div
                        key={req.id}
                        className="flex flex-col gap-3 rounded-2xl border border-brand-line bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-brand-navy">
                              {req.studentName}
                            </h3>
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                              Juz {juzText}
                            </span>
                          </div>
                          <p className="text-xs text-brand-text-muted">
                            {req.className} • Penguji: {req.assignedExaminerName ?? "Menunggu Penugasan"}
                            {req.examDate ? ` • ${req.examDate}${req.examTime ? ` (${req.examTime})` : ""}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 border border-emerald-200">
                            {req.status === "disetujui" ? "Disetujui" : "Dijadwalkan"}
                          </span>
                          <Button
                            type="button"
                            onClick={() => setScheduleTarget(req)}
                            className="h-9 rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-700"
                          >
                            Plot Jadwal
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
                {scheduledTotalPages > 1 && (
                  <Pagination
                    page={scheduledPage}
                    totalPages={scheduledTotalPages}
                    onPageChange={setScheduledPage}
                  />
                )}
              </div>
            )}

            {/* Tab 3: History */}
            {activeTab === "history" && (
              <div className="space-y-3">
                {historyPaginated.length === 0 ? (
                  <div className="rounded-2xl border border-brand-line bg-white p-8 text-center text-xs text-brand-text-muted">
                    Belum ada riwayat hasil ujian munaqosah.
                  </div>
                ) : (
                  historyPaginated.map((req) => {
                    const juzText = req.juzList && req.juzList.length > 0 ? req.juzList.join(", ") : req.juzKe;
                    const finalScore = req.scores?.nilaiAkhir ?? req.nilaiAkhir;
                    const gradeLetter = req.scores?.grade ?? req.grade;
                    return (
                      <div
                        key={req.id}
                        className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-brand-navy">
                              {req.studentName}
                            </h3>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-brand-navy">
                              Juz {juzText}
                            </span>
                          </div>
                          <p className="text-xs text-brand-text-muted">
                            {req.className} • Tanggal: {req.examDate ?? req.submissionDate}
                            {finalScore && (
                              <span className="ml-2 font-semibold text-brand-cyan-dark">
                                • Nilai: {finalScore} ({gradeLetter ?? "-"})
                              </span>
                            )}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            req.status === "lulus"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {req.status === "lulus" ? "LULUS" : "TIDAK LULUS / DITOLAK"}
                        </span>
                      </div>
                    );
                  })
                )}
                {historyTotalPages > 1 && (
                  <Pagination
                    page={historyPage}
                    totalPages={historyTotalPages}
                    onPageChange={setHistoryPage}
                  />
                )}
              </div>
            )}

            {/* Tab 4: Pool Penguji */}
            {activeTab === "pool" && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-brand-navy">Tambah Penguji ke Pool</h3>
                  <p className="text-xs text-brand-text-muted">
                    Periode: {periods.find((p) => p.id === selectedPeriodId)?.nama ?? "-"}
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <select
                      value={poolTeacherId || selectedTeacherId}
                      onChange={(e) => {
                        setPoolTeacherId(e.target.value);
                        setSelectedTeacherId(e.target.value);
                      }}
                      className="rounded-xl border border-brand-line p-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                    >
                      <option value="">Pilih Guru...</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={poolKapasitas}
                      onChange={(e) => setPoolKapasitas(Number(e.target.value))}
                      placeholder="Kapasitas Siswa"
                      className="rounded-xl border border-brand-line p-2.5 text-xs text-brand-navy outline-none focus:border-brand-cyan"
                    />
                    <Button
                      type="button"
                      onClick={handleSavePool}
                      disabled={actionLoading}
                      className="h-10 rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-700"
                    >
                      Simpan ke Pool
                    </Button>
                  </div>
                </div>

                {examiners.length === 0 ? (
                  <div className="rounded-2xl border border-brand-line bg-white p-8 text-center text-xs text-brand-text-muted">
                    Belum ada guru yang ditugaskan ke pool penguji periode ini.
                  </div>
                ) : (
                  examiners.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 shadow-sm"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-brand-navy">{ex.teacherName}</h4>
                        <p className="text-xs text-brand-text-muted">
                          Kapasitas: {ex.terpakai} / {ex.kapasitasSiswa} Siswa Terjadwal
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemovePool(ex.teacherId, ex.teacherName)}
                        className="h-8 rounded-lg border-red-200 text-xs font-bold text-red-600 hover:bg-red-50"
                      >
                        Hapus
                      </Button>
                    </div>
                  ))
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
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
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

      {/* Modal Plot Jadwal */}
      {scheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
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
                <label className="font-bold text-brand-navy">Periode Ujian</label>
                <select
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line p-2.5 font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                >
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-brand-navy">Guru Penguji (dari pool)</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line p-2.5 font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                >
                  <option value="">Pilih Penguji...</option>
                  {examiners.map((ex) => (
                    <option key={ex.teacherId} value={ex.teacherId}>
                      {ex.teacherName} ({ex.terpakai}/{ex.kapasitasSiswa} Terpakai)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-brand-navy">Tanggal Ujian</label>
                  <input
                    type="date"
                    value={jadwalTanggal}
                    onChange={(e) => setJadwalTanggal(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-brand-line p-2 text-brand-navy outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="font-bold text-brand-navy">Waktu (opsional)</label>
                  <input
                    type="time"
                    value={jadwalWaktu}
                    onChange={(e) => setJadwalWaktu(e.target.value)}
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
