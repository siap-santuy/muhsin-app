import { useState, useEffect } from "react";
import { ArrowLeft, Check, Clock, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/Toast";
import { api } from "@/lib/api";

export function TeacherYaumiyahApprovalPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "warning" } | null>(null);

  // Direct Grant Form State
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [grantStartDate, setGrantStartDate] = useState("");
  const [grantEndDate, setGrantEndDate] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [grantDurationHours, setGrantDurationHours] = useState(24);
  const [submittingGrant, setSubmittingGrant] = useState(false);

  // Reject Modal State
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [reqs, studs] = await Promise.all([
        api.getYaumiyahAccessRequests(),
        api.getStudents().catch(() => []),
      ]);
      setRequests(reqs);
      setStudents(studs);
      if (studs.length > 0 && !selectedStudentId) {
        setSelectedStudentId(studs[0].id);
      }
    } catch (err: any) {
      setToast({ message: err.message || "Gagal memuat data antrean", variant: "warning" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      await api.approveYaumiyahAccess(id);
      setToast({ message: "Akses susulan disetujui (aktif 24 jam)", variant: "success" });
      await loadData();
    } catch (err: any) {
      setToast({ message: err.message || "Gagal menyetujui", variant: "warning" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleConfirmReject() {
    if (!rejectingId) return;
    setActionLoading(rejectingId);
    try {
      await api.rejectYaumiyahAccess(rejectingId, rejectionNote);
      setToast({ message: "Permohonan akses ditolak", variant: "success" });
      setRejectingId(null);
      setRejectionNote("");
      await loadData();
    } catch (err: any) {
      setToast({ message: err.message || "Gagal menolak", variant: "warning" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDirectGrant() {
    if (!selectedStudentId || !grantStartDate || !grantEndDate) {
      setToast({ message: "Lengkapi siswa dan tanggal", variant: "warning" });
      return;
    }
    setSubmittingGrant(true);
    try {
      await api.directGrantYaumiyahAccess({
        studentId: selectedStudentId,
        startDate: grantStartDate,
        endDate: grantEndDate,
        reason: grantReason.trim() || undefined,
        durationHours: Number(grantDurationHours) || 24,
      });
      setToast({ message: "Akses susulan berhasil dibuka langsung", variant: "success" });
      setShowGrantModal(false);
      setGrantStartDate("");
      setGrantEndDate("");
      setGrantReason("");
      await loadData();
    } catch (err: any) {
      setToast({ message: err.message || "Gagal membuka akses", variant: "warning" });
    } finally {
      setSubmittingGrant(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between bg-brand-page px-4 py-3">
        <button
          type="button"
          onClick={() => (window.location.hash = "#/dashboard")}
          aria-label="Kembali"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-cyan/10"
        >
          <ArrowLeft className="h-4 w-4 text-brand-cyan" />
        </button>
        <h1 className="text-base font-bold text-brand-navy">Izin Susulan Yaumiyah</h1>
        <Button
          type="button"
          size="sm"
          onClick={() => setShowGrantModal(true)}
          className="h-8 rounded-lg bg-brand-cyan px-2.5 text-xs font-bold text-white hover:bg-brand-cyan-dark"
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Buka Akses
        </Button>
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-12 pt-2">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-brand-line bg-white p-8 text-center text-xs text-brand-text-muted">
            Tidak ada permohonan akses susulan yang menunggu persetujuan.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl border border-brand-line bg-white p-4 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-brand-navy">{req.studentName}</h3>
                    <p className="text-xs text-brand-text-muted">
                      {req.className || "Kelas TTQ"}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    <Clock className="h-3 w-3" /> Menunggu
                  </span>
                </div>

                <div className="mt-3 rounded-xl bg-gray-50 p-2.5 text-xs text-brand-navy">
                  <p className="font-semibold text-brand-cyan">
                    Rentang: {req.startDate === req.endDate ? req.startDate : `${req.startDate} s.d ${req.endDate}`}
                  </p>
                  <p className="mt-1 text-gray-600 italic">&ldquo;{req.reason}&rdquo;</p>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRejectingId(req.id);
                      setRejectionNote("");
                    }}
                    disabled={actionLoading === req.id}
                    className="h-8 flex-1 rounded-lg border-red-300 font-bold text-red-600 hover:bg-red-50"
                  >
                    <X className="mr-1 h-3.5 w-3.5" /> Tolak
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleApprove(req.id)}
                    disabled={actionLoading === req.id}
                    className="h-8 flex-1 rounded-lg bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                  >
                    {actionLoading === req.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Check className="mr-1 h-3.5 w-3.5" /> Setujui 24 Jam
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Reject Note Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-brand-navy">Tolak Permohonan</h3>
            <p className="mt-1 text-xs text-brand-text-muted">
              Berikan catatan penolakan untuk siswa.
            </p>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Contoh: Alasan tidak jelas / melebihi batas..."
              rows={3}
              className="mt-3 w-full rounded-xl border border-brand-line p-2.5 text-xs text-brand-navy focus:border-brand-cyan focus:outline-none"
            />
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectingId(null)}
                className="flex-1 rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700"
              >
                Tolak
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Grant Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-brand-navy">Buka Akses Susulan Langsung</h3>
            <p className="mt-1 text-xs text-brand-text-muted">
              Buka izin input yaumiyah tanpa menunggu permohonan siswa.
            </p>

            <div className="mt-3 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-brand-navy">Siswa</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line bg-gray-50/50 p-2 text-xs font-semibold text-brand-navy outline-none"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.className || "Kelas TTQ"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-brand-navy">Dari Tanggal</label>
                  <input
                    type="date"
                    value={grantStartDate}
                    onChange={(e) => setGrantStartDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-brand-line p-2 text-xs text-brand-navy"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-brand-navy">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={grantEndDate}
                    onChange={(e) => setGrantEndDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-brand-line p-2 text-xs text-brand-navy"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-brand-navy">Durasi Akses Terbuka (Jam)</label>
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={grantDurationHours}
                  onChange={(e) => setGrantDurationHours(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-brand-line p-2 text-xs text-brand-navy"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-brand-navy">Catatan / Alasan Dispensasi</label>
                <textarea
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="Contoh: Dispensasi rawat inap RS..."
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-brand-line p-2 text-xs text-brand-navy"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowGrantModal(false)}
                disabled={submittingGrant}
                className="flex-1 rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleDirectGrant}
                disabled={submittingGrant}
                className="flex-1 rounded-xl bg-brand-cyan font-bold text-white hover:bg-brand-cyan-dark"
              >
                {submittingGrant ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buka Akses"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
