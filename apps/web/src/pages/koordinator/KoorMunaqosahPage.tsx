import { useState } from "react";
import {
  Award,
  X,
} from "lucide-react";
import { KoorShell } from "@/components/layout/KoorShell";
import { Pagination } from "@/components/ui/Pagination";

interface MunaqosahRequest {
  id: string;
  studentName: string;
  class: string;
  juz: number;
  teacherName: string;
  submissionDate: string;
  status: "diajukan" | "disetujui" | "dijadwalkan" | "lulus" | "ditolak";
  assignedExaminer?: string;
  examDate?: string;
}

const INITIAL_REQUESTS: MunaqosahRequest[] = [
  {
    id: "mr1",
    studentName: "Ahmad Abdullah",
    class: "VII Abu Bakar",
    juz: 30,
    teacherName: "Ust. Arai Kurnia",
    submissionDate: "16 Aug 2026",
    status: "diajukan",
  },
  {
    id: "mr2",
    studentName: "Fathimah Az-Zahra",
    class: "VIII Khadijah",
    juz: 29,
    teacherName: "Ustdh. Maryam",
    submissionDate: "17 Aug 2026",
    status: "diajukan",
  },
  {
    id: "mr3",
    studentName: "Umar Al-Faruq",
    class: "IX Ali",
    juz: 1,
    teacherName: "Ust. Hamzah",
    submissionDate: "10 Aug 2026",
    status: "dijadwalkan",
    assignedExaminer: "Ust. Zulkifli Al-Hafiz",
    examDate: "20 Aug 2026, 09:00",
  },
  {
    id: "mr4",
    studentName: "Muhammad Ali",
    class: "VII Umar",
    juz: 30,
    teacherName: "Ust. Zulkifli",
    submissionDate: "01 Aug 2026",
    status: "lulus",
    assignedExaminer: "Ust. Arai Kurnia",
    examDate: "05 Aug 2026",
  },
];

const EXAMINERS_POOL = [
  { name: "Ust. Zulkifli Al-Hafiz", capacity: 5, assignedCount: 3 },
  { name: "Ustdh. Maryam S.Ag", capacity: 5, assignedCount: 4 },
  { name: "Ust. Hamzah S.Pd", capacity: 4, assignedCount: 1 },
];

export function KoorMunaqosahPage() {
  const [requests, setRequests] = useState<MunaqosahRequest[]>(INITIAL_REQUESTS);
  const [selectedReq, setSelectedReq] = useState<MunaqosahRequest | null>(null);
  const [selectedExaminer, setSelectedExaminer] = useState(EXAMINERS_POOL[0].name);
  const [examDate, setExamDate] = useState("2026-08-25T09:00");
  const [activeTab, setActiveTab] = useState<"pending" | "scheduled" | "history">("pending");
  const [scheduledPage, setScheduledPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  const pendingList = requests.filter((r) => r.status === "diajukan");
  const scheduledList = requests.filter((r) => r.status === "dijadwalkan" || r.status === "disetujui");
  const historyList = requests.filter((r) => r.status === "lulus" || r.status === "ditolak");

  const PAGE_SIZE = 3;
  const scheduledTotalPages = Math.max(1, Math.ceil(scheduledList.length / PAGE_SIZE));
  const scheduledPaginated = scheduledList.slice((scheduledPage - 1) * PAGE_SIZE, scheduledPage * PAGE_SIZE);

  const historyTotalPages = Math.max(1, Math.ceil(historyList.length / PAGE_SIZE));
  const historyPaginated = historyList.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

  function handleApproveSubmit() {
    if (!selectedReq) return;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedReq.id
          ? {
              ...r,
              status: "dijadwalkan",
              assignedExaminer: selectedExaminer,
              examDate: examDate.replace("T", " "),
            }
          : r
      )
    );
    setSelectedReq(null);
    alert(`Pengajuan Munaqosah ${selectedReq.studentName} berhasil disetujui & dijadwalkan!`);
  }

  function handleReject(id: string) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "ditolak" } : r))
    );
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
                Periode Ujian: Agustus 2026
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

        {/* 4-Step Workflow Banner */}
        <div className="rounded-2xl border border-brand-line/60 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-brand-navy mb-3">
            Alur Kerja Munaqosah 4 Tahap (PRD #4.3c):
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 text-center">
            <div className="rounded-xl bg-brand-page p-2.5">
              <span className="text-[10px] font-bold text-brand-cyan-dark">Tahap 1</span>
              <p className="text-xs font-bold text-brand-navy">1. Deteksi System</p>
              <p className="text-[9px] text-brand-text-muted">Otomatis hitung 1 Juz</p>
            </div>
            <div className="rounded-xl bg-brand-page p-2.5">
              <span className="text-[10px] font-bold text-brand-cyan-dark">Tahap 2</span>
              <p className="text-xs font-bold text-brand-navy">2. Pengajuan Guru</p>
              <p className="text-[9px] text-brand-text-muted">Guru pilih siswa siap</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5">
              <span className="text-[10px] font-bold text-amber-700">Tahap 3 (Anda)</span>
              <p className="text-xs font-bold text-amber-900">3. Approval &amp; Assign</p>
              <p className="text-[9px] text-amber-800">Koordinator plot penguji</p>
            </div>
            <div className="rounded-xl bg-brand-page p-2.5">
              <span className="text-[10px] font-bold text-brand-cyan-dark">Tahap 4</span>
              <p className="text-xs font-bold text-brand-navy">4. Hasil &amp; Achievement</p>
              <p className="text-[9px] text-brand-text-muted">Penguji beri Lulus &amp; Badge</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-brand-line/40 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "pending"
                ? "bg-brand-navy text-white shadow-xs"
                : "bg-white text-brand-navy border border-brand-line/60 hover:bg-brand-page"
            }`}
          >
            Pengajuan Perlu Approval ({pendingList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("scheduled")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "scheduled"
                ? "bg-brand-navy text-white shadow-xs"
                : "bg-white text-brand-navy border border-brand-line/60 hover:bg-brand-page"
            }`}
          >
            Telah Dijadwalkan ({scheduledList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "history"
                ? "bg-brand-navy text-white shadow-xs"
                : "bg-white text-brand-navy border border-brand-line/60 hover:bg-brand-page"
            }`}
          >
            Riwayat Ujian ({historyList.length})
          </button>
        </div>

        {/* Tab Content: Pending List */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            {pendingList.length === 0 ? (
              <div className="rounded-2xl border border-brand-line/60 bg-white p-8 text-center text-xs text-brand-text-muted">
                Tidak ada pengajuan Munaqosah yang pending saat ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {pendingList.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col justify-between rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900">
                            Juz {req.juz}
                          </span>
                          <h3 className="mt-2 text-base font-black text-brand-navy">
                            {req.studentName}
                          </h3>
                          <p className="text-xs font-semibold text-brand-cyan-dark">
                            {req.class}
                          </p>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          Diajukan: {req.submissionDate}
                        </span>
                      </div>

                      <div className="mt-3 rounded-xl bg-brand-page p-3 text-xs">
                        <p className="text-brand-text-muted">
                          Diajukan oleh Guru Pembimbing:
                        </p>
                        <p className="font-bold text-brand-navy">
                          {req.teacherName}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 border-t border-brand-line/40 pt-3">
                      <button
                        type="button"
                        onClick={() => setSelectedReq(req)}
                        className="flex-1 rounded-xl bg-brand-navy py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-navy/90"
                      >
                        Setujui &amp; Assign Penguji
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(req.id)}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Scheduled */}
        {activeTab === "scheduled" && (
          <div className="rounded-2xl border border-brand-line/60 bg-white p-4 shadow-sm space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-brand-navy">
                <thead className="bg-brand-page text-[11px] font-bold uppercase text-brand-text-muted">
                  <tr>
                    <th className="px-4 py-3">Nama Siswa &amp; Kelas</th>
                    <th className="px-4 py-3">Target Juz</th>
                    <th className="px-4 py-3">Guru Pembimbing</th>
                    <th className="px-4 py-3">Guru Penguji Assigned</th>
                    <th className="px-4 py-3">Jadwal Ujian</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line/40 font-medium">
                  {scheduledPaginated.map((req) => (
                    <tr key={req.id}>
                      <td className="px-4 py-3 font-bold">{req.studentName} ({req.class})</td>
                      <td className="px-4 py-3 font-extrabold text-amber-800">Juz {req.juz}</td>
                      <td className="px-4 py-3">{req.teacherName}</td>
                      <td className="px-4 py-3 font-bold text-brand-cyan-dark">
                        {req.assignedExaminer ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-brand-navy">{req.examDate ?? "-"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-brand-cyan-dark">
                          Dijadwalkan
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-brand-line/40 pt-3 sm:flex-row sm:items-center sm:justify-between text-xs text-brand-text-muted">
              <span>Total <span className="font-bold text-brand-navy">{scheduledList.length}</span> ujian dijadwalkan</span>
              <Pagination page={scheduledPage} totalPages={scheduledTotalPages} onPageChange={setScheduledPage} />
            </div>
          </div>
        )}

        {/* Tab Content: History */}
        {activeTab === "history" && (
          <div className="rounded-2xl border border-brand-line/60 bg-white p-4 shadow-sm space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-brand-navy">
                <thead className="bg-brand-page text-[11px] font-bold uppercase text-brand-text-muted">
                  <tr>
                    <th className="px-4 py-3">Nama Siswa</th>
                    <th className="px-4 py-3">Juz Ujian</th>
                    <th className="px-4 py-3">Guru Penguji</th>
                    <th className="px-4 py-3">Hasil Akhir</th>
                    <th className="px-4 py-3">Achievement Awarded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line/40 font-medium">
                  {historyPaginated.map((req) => (
                    <tr key={req.id}>
                      <td className="px-4 py-3 font-bold">{req.studentName}</td>
                      <td className="px-4 py-3 font-bold">Juz {req.juz}</td>
                      <td className="px-4 py-3">{req.assignedExaminer}</td>
                      <td className="px-4 py-3">
                        {req.status === "lulus" ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                            LULUS
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-extrabold text-red-800">
                            DITOLAK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {req.status === "lulus" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                            <Award className="h-3 w-3 text-amber-600" />
                            Badge Juz {req.juz} Awarded
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-brand-line/40 pt-3 sm:flex-row sm:items-center sm:justify-between text-xs text-brand-text-muted">
              <span>Total <span className="font-bold text-brand-navy">{historyList.length}</span> riwayat ujian</span>
              <Pagination page={historyPage} totalPages={historyTotalPages} onPageChange={setHistoryPage} />
            </div>
          </div>
        )}

        {/* Modal Approval & Assign Penguji */}
        {selectedReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedReq(null)}
            />
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-brand-line/40 pb-3">
                <h3 className="text-sm font-black text-brand-navy">
                  Approval &amp; Assign Penguji Munaqosah
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="rounded-lg p-1 text-gray-400 hover:text-brand-navy"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-xl bg-brand-page p-3 text-xs space-y-1">
                <p className="font-bold text-brand-navy">{selectedReq.studentName}</p>
                <p className="text-brand-text-muted">
                  Kelas: {selectedReq.class} &bull; Target: Juz {selectedReq.juz}
                </p>
                <p className="text-brand-text-muted">
                  Pembimbing: {selectedReq.teacherName}
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-brand-navy block mb-1">
                    Pilih Guru Penguji (Pool Penguji Munaqosah):
                  </label>
                  <select
                    value={selectedExaminer}
                    onChange={(e) => setSelectedExaminer(e.target.value)}
                    className="w-full rounded-xl border border-brand-line/60 bg-white p-2.5 font-semibold text-brand-navy outline-none"
                  >
                    {EXAMINERS_POOL.map((ex) => (
                      <option key={ex.name} value={ex.name}>
                        {ex.name} (Kapasitas: {ex.assignedCount}/{ex.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-brand-navy block mb-1">
                    Jadwal Waktu Ujian:
                  </label>
                  <input
                    type="datetime-local"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full rounded-xl border border-brand-line/60 bg-white p-2.5 font-semibold text-brand-navy outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="flex-1 rounded-xl border border-brand-line bg-white py-2 text-xs font-bold text-brand-navy hover:bg-brand-page"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApproveSubmit}
                  className="flex-1 rounded-xl bg-brand-navy py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-navy/90"
                >
                  Setujui &amp; Plot Ujian
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </KoorShell>
  );
}

export default function KoorMunaqosahPageWrapper() {
  return <KoorMunaqosahPage />;
}
