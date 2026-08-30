import { useState, useEffect } from "react";
import {
  Award,
  Check,
  Loader2,
  X,
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
  status: "diajukan" | "disetujui" | "dijadwalkan" | "lulus" | "tidak_lulus" | "ditolak";
  submissionDate: string;
  assignedExaminerName?: string | null;
  examDate?: string | null;
  examTime?: string | null;
}

export function KoorMunaqosahPage() {
  const [requests, setRequests] = useState<MunaqosahRequestItem[]>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<MunaqosahRequestItem | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "scheduled" | "history">("pending");
  const [actionLoading, setActionLoading] = useState(false);
  const [scheduledPage, setScheduledPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  async function loadData() {
    try {
      const [reqs, teacherList] = await Promise.all([
        api.getMunaqosahRequests(),
        api.getTeachers(),
      ]);
      setRequests(reqs);
      setTeachers(teacherList);
      if (teacherList.length > 0) {
        setSelectedTeacherId(teacherList[0].id);
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
      // Approve request
      await api.approveMunaqosah(selectedReq.id);
      await loadData();
      setSelectedReq(null);
    } catch (err: any) {
      alert(err.message || "Gagal menyetujui pengajuan");
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

  return (
    <KoorShell
      activePath="munaqosah"
      title="Approval & Penjadwalan Munaqosah"
      subtitle="Manajemen Ujian Kenaikan Juz Hafalan (PRD #4.3c)"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-brand-line/60 bg-white p-5 shadow-sm md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                Periode Ujian Aktif
              </span>
            </div>
            <h1 className="mt-2 text-lg font-black text-brand-navy">
              Antrian Approval Munaqosah Ujian Juz
            </h1>
            <p className="text-xs text-brand-text-muted">
              Meninjau pengajuan dari guru pembimbing &amp; menentukan guru penguji dari pool
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
              <span className="text-amber-700">Pending Review: </span>
              <span className="text-sm font-black">{pendingList.length} Siswa</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
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
            {/* Tab 1: Pending */}
            {activeTab === "pending" && (
              <div className="space-y-3">
                {pendingList.length === 0 ? (
                  <div className="rounded-2xl border border-brand-line bg-white p-8 text-center text-xs text-brand-text-muted">
                    Tidak ada pengajuan munaqosah yang pending saat ini.
                  </div>
                ) : (
                  pendingList.map((req) => (
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
                              Juz {req.juzKe}
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
                  ))
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
                  scheduledPaginated.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-brand-navy">
                            {req.studentName}
                          </h3>
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                            Juz {req.juzKe}
                          </span>
                        </div>
                        <p className="text-xs text-brand-text-muted">
                          {req.className} • Penguji: {req.assignedExaminerName ?? "Menunggu Penugasan"}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 border border-emerald-200">
                        {req.status === "disetujui" ? "Disetujui" : "Dijadwalkan"}
                      </span>
                    </div>
                  ))
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
                  historyPaginated.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 shadow-sm"
                    >
                      <div>
                        <h3 className="text-sm font-bold text-brand-navy">
                          {req.studentName} (Juz {req.juzKe})
                        </h3>
                        <p className="text-xs text-brand-text-muted">
                          {req.className} • Tanggal: {req.submissionDate}
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
                  ))
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
          </>
        )}

        {/* Modal Approval & Assignment */}
        {selectedReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-brand-line pb-3">
                <h2 className="text-base font-bold text-brand-navy">
                  Setujui Pengajuan Munaqosah
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="my-4 space-y-3 text-xs">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="font-bold text-brand-navy">
                    {selectedReq.studentName} ({selectedReq.className})
                  </p>
                  <p className="text-brand-text-muted">
                    Ujian: Juz {selectedReq.juzKe} • Pembimbing: {selectedReq.teacherName}
                  </p>
                </div>

                <div>
                  <label className="font-bold text-brand-navy">Pilih Guru Penguji</label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-brand-line p-2.5 font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedReq(null)}
                  className="h-10 rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleApproveSubmit}
                  disabled={actionLoading}
                  className="h-10 rounded-xl bg-brand-cyan font-bold text-white hover:bg-brand-cyan-dark"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Konfirmasi & Setujui"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </KoorShell>
  );
}
