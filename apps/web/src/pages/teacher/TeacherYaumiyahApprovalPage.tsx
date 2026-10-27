import { useState, useEffect } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Clock, Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { KoorShell } from "@/components/layout/KoorShell";

export function TeacherYaumiyahApprovalPage() {
  const user = useAuthStore((s) => s.user);
  const isKoor = user?.role === "koordinator_ttq";

  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "warning" } | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Direct Grant Form State (Mendukung Bulk Multi-Santri)
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [grantStartDate, setGrantStartDate] = useState("");
  const [grantEndDate, setGrantEndDate] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [grantDurationHours, setGrantDurationHours] = useState(24);
  const [submittingGrant, setSubmittingGrant] = useState(false);

  // Batas tanggal bulan berjalan untuk Guru
  const today = new Date();
  const currentMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthMinDate = `${currentMonthPrefix}-01`;

  // Reject Modal State
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");

  async function loadData(targetPage = page, status = activeTab === "pending" ? "pending" : "all") {
    setLoading(true);
    try {
      const [res, studs] = await Promise.all([
        api.getYaumiyahAccessRequests({ status: status as any, page: targetPage, limit: 10 }),
        students.length === 0 ? api.getStudents().catch(() => []) : Promise.resolve(students),
      ]);
      setRequests(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotalItems(res.meta?.total || 0);
      setPage(res.meta?.page || 1);
      if (studs.length > 0 && students.length === 0) {
        setStudents(studs);
        if (selectedStudentIds.length === 0) setSelectedStudentIds([studs[0].id]);
      }
    } catch (err: any) {
      setToast({ message: err.message || "Gagal memuat data", variant: "warning" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(1, activeTab === "pending" ? "pending" : "all");
  }, [activeTab]);

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
    if (selectedStudentIds.length === 0 || !grantStartDate || !grantEndDate) {
      setToast({ message: "Pilih minimal satu santri dan lengkapi tanggal", variant: "warning" });
      return;
    }
    if (grantStartDate > grantEndDate) {
      setToast({ message: "Tanggal awal tidak boleh lebih besar dari tanggal akhir", variant: "warning" });
      return;
    }
    if (!isKoor && grantStartDate.slice(0, 7) < currentMonthPrefix) {
      setToast({
        message: "Guru hanya dapat membuka akses untuk bulan berjalan. Untuk bulan lalu, hubungi Koordinator TTQ.",
        variant: "warning",
      });
      return;
    }
    setSubmittingGrant(true);
    try {
      const res = await api.directGrantYaumiyahAccessBulk({
        studentIds: selectedStudentIds,
        startDate: grantStartDate,
        endDate: grantEndDate,
        reason: grantReason.trim() || undefined,
        durationHours: Number(grantDurationHours) || 24,
      });
      const count = res?.count || selectedStudentIds.length;
      setToast({ message: `Akses susulan untuk ${count} santri berhasil dibuka langsung`, variant: "success" });
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

  const content = (
    <div className="space-y-4">
      {/* Tab Switcher & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold text-brand-navy">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeTab === "pending"
                ? "bg-white text-brand-cyan shadow-xs"
                : "text-brand-text-muted hover:text-brand-navy"
            }`}
          >
            Antrean Menunggu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeTab === "history"
                ? "bg-white text-brand-cyan shadow-xs"
                : "text-brand-text-muted hover:text-brand-navy"
            }`}
          >
            Semua Riwayat Susulan
          </button>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setShowGrantModal(true)}
          className="h-8 rounded-lg bg-brand-cyan px-3 text-xs font-bold text-white hover:bg-brand-cyan-dark"
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Buka Akses Manual
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-brand-line bg-white p-8 text-center text-xs text-brand-text-muted">
          {activeTab === "pending"
            ? "Tidak ada permohonan akses susulan yang menunggu persetujuan."
            : "Belum ada riwayat permohonan susulan yaumiyah."}
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
                    {req.className || "Kelas TTQ"} • Diajukan:{" "}
                    {new Date(req.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {req.status === "pending" ? (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    <Clock className="h-3 w-3" /> Menunggu
                  </span>
                ) : req.status === "approved" ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <Check className="h-3 w-3" /> Disetujui
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                    <X className="h-3 w-3" /> Ditolak
                  </span>
                )}
              </div>

              <div className="mt-3 rounded-xl bg-gray-50 p-2.5 text-xs text-brand-navy">
                <p className="font-semibold text-brand-cyan">
                  Rentang: {req.startDate === req.endDate ? req.startDate : `${req.startDate} s.d ${req.endDate}`}
                  {req.isDirectGrant && (
                    <span className="ml-2 rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                      Buka Manual
                    </span>
                  )}
                </p>
                <p className="mt-1 text-gray-600 italic">&ldquo;{req.reason}&rdquo;</p>
                {req.rejectionNote && (
                  <p className="mt-1 text-red-500 text-[11px]">Alasan tolak: {req.rejectionNote}</p>
                )}
              </div>

              {req.status === "pending" && (
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
              )}
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-brand-line/50 pt-3 text-xs text-brand-text-muted">
              <span>
                Total {totalItems} permohonan • Halaman {page} dari {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => loadData(page - 1)}
                  disabled={page <= 1}
                  className="rounded-lg p-1.5 text-brand-navy hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 font-bold text-brand-navy">{page}</span>
                <button
                  type="button"
                  onClick={() => loadData(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded-lg p-1.5 text-brand-navy hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* Direct Grant Modal (Bisa untuk satu maupun banyak santri sekaligus) */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl max-h-[90vh] overflow-y-auto space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-brand-navy">Buka Akses Susulan Langsung</h3>
                <p className="mt-0.5 text-xs text-brand-text-muted">
                  Buka izin input yaumiyah tanpa menunggu permohonan siswa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGrantModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-navy"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Callout Kebijakan Tanggal */}
            {!isKoor ? (
              <p className="text-[11px] text-amber-800 bg-amber-50 rounded-xl p-2.5 border border-amber-200">
                <strong>Kebijakan Guru:</strong> Hanya dapat membuka akses susulan untuk <strong>bulan berjalan ({currentMonthPrefix})</strong> pada santri kelas binaan. Pembukaan bulan lalu hanya dapat melalui Koordinator TTQ.
              </p>
            ) : (
              <p className="text-[11px] text-emerald-800 bg-emerald-50 rounded-xl p-2.5 border border-emerald-200">
                <strong>Mode Koordinator:</strong> Anda memiliki kendali penuh membuka akses untuk tanggal kapan pun dan santri mana pun.
              </p>
            )}

            <div className="space-y-3">
              {/* Pilihan Multi-Santri */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-brand-navy">Pilih Santri</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-brand-cyan bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                      {selectedStudentIds.length} Santri Terpilih
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedStudentIds.length === students.length) {
                          setSelectedStudentIds([]);
                        } else {
                          setSelectedStudentIds(students.map((s) => s.id));
                        }
                      }}
                      className="text-[10px] font-bold text-brand-cyan hover:underline"
                    >
                      {selectedStudentIds.length === students.length ? "Batal Semua" : "Pilih Semua"}
                    </button>
                  </div>
                </div>

                {/* Pencarian Santri */}
                <div className="relative mb-1.5">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Cari nama santri atau kelas..."
                    className="w-full rounded-xl border border-brand-line bg-gray-50/50 pl-8 pr-3 py-1.5 text-xs text-brand-navy outline-none focus:border-brand-cyan"
                  />
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                </div>

                {/* Daftar Checkbox Santri */}
                <div className="max-h-36 overflow-y-auto rounded-xl border border-brand-line/70 bg-gray-50/30 p-2 space-y-1 divide-y divide-brand-line/30">
                  {(() => {
                    const q = studentSearch.toLowerCase();
                    const filteredList = students.filter(
                      (s) =>
                        s.name.toLowerCase().includes(q) ||
                        (s.className && s.className.toLowerCase().includes(q))
                    );

                    // Urutkan: yang tercentang di atas
                    const sortedList = [...filteredList].sort((a, b) => {
                      const aChecked = selectedStudentIds.includes(a.id);
                      const bChecked = selectedStudentIds.includes(b.id);
                      if (aChecked && !bChecked) return -1;
                      if (!aChecked && bChecked) return 1;
                      return a.name.localeCompare(b.name);
                    });

                    if (sortedList.length === 0) {
                      return (
                        <p className="py-2 text-center text-xs text-brand-text-muted">
                          Tidak ada santri ditemukan
                        </p>
                      );
                    }

                    return sortedList.map((s) => {
                      const isChecked = selectedStudentIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                            isChecked ? "bg-cyan-50/70 border border-cyan-200" : "hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudentIds([...selectedStudentIds, s.id]);
                                } else {
                                  setSelectedStudentIds(selectedStudentIds.filter((id) => id !== s.id));
                                }
                              }}
                              className="h-3.5 w-3.5 rounded border-brand-line text-brand-cyan focus:ring-brand-cyan"
                            />
                            <div>
                              <p className={`text-xs font-bold ${isChecked ? "text-cyan-900" : "text-brand-navy"}`}>
                                {s.name}
                              </p>
                              <p className="text-[10px] text-brand-text-muted">{s.className || "Kelas TTQ"}</p>
                            </div>
                          </div>
                        </label>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-brand-navy">Dari Tanggal</label>
                  <input
                    type="date"
                    min={!isKoor ? currentMonthMinDate : undefined}
                    value={grantStartDate}
                    onChange={(e) => setGrantStartDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-brand-line p-2 text-xs text-brand-navy"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-brand-navy">Sampai Tanggal</label>
                  <input
                    type="date"
                    min={!isKoor ? currentMonthMinDate : undefined}
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
                  placeholder="Contoh: Dispensasi kegiatan mukhoyam/kemah atau sakit..."
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-brand-line p-2 text-xs text-brand-navy"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2 pt-2 border-t border-brand-line/60">
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
                disabled={submittingGrant || selectedStudentIds.length === 0}
                className="flex-1 rounded-xl bg-brand-cyan font-bold text-white hover:bg-brand-cyan-dark"
              >
                {submittingGrant ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Buka Akses (${selectedStudentIds.length})`
                )}
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

  if (isKoor) {
    return (
      <KoorShell
        title="Riwayat & Approval Susulan Yaumiyah"
        subtitle="Kelola permohonan dan dispensasi input yaumiyah santri"
        activePath="yaumiyah-approval"
      >
        <div className="mx-auto max-w-4xl p-6">{content}</div>
      </KoorShell>
    );
  }

  // Teacher mobile frame
  return (
    <div className="flex h-screen flex-col bg-brand-page">
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
        <div className="h-10 w-10" />
      </div>
      <main className="flex-1 overflow-y-auto px-4 pb-12 pt-2">{content}</main>
    </div>
  );
}
