import { useState, useEffect } from "react";
import { ArrowLeft, Award, Check, Loader2, X } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, TEACHER_NAV_ITEMS } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toastStore";
import { api } from "@/lib/api";

interface ExamItem {
  id: string;
  assignmentId: string | null;
  studentName: string;
  className: string;
  juzKe: number;
  juzList?: number[] | null;
  status: string;
  examDate: string | null;
  examTime: string | null;
  hasil: string | null;
  scores?: any;
  nilaiAkhir?: number | null;
  grade?: string | null;
  catatanPenguji?: string | null;
}

export function TeacherExaminerPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<ExamItem | null>(null);
  const [tajwid, setTajwid] = useState(85);
  const [kelancaran, setKelancaran] = useState(85);
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await api.getMyMunaqosahExams();
      setExams(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat tugas penguji");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const pending = exams.filter((e) => e.hasil === "belum" || !e.hasil);
  const done = exams.filter((e) => e.hasil === "lulus" || e.hasil === "tidak_lulus");

  const avgScore = Math.round((tajwid + kelancaran) / 2);
  const letterGrade =
    avgScore >= 90 ? "A (Mumtaz)" : avgScore >= 80 ? "B (Jayyid Jiddan)" : avgScore >= 70 ? "C (Jayyid)" : "D (Maqbul)";

  async function handleSubmit(hasil: "lulus" | "tidak_lulus") {
    if (!active?.assignmentId) return;
    const juzText = active.juzList && active.juzList.length > 0 ? active.juzList.join(", ") : active.juzKe;
    if (hasil === "tidak_lulus" && !confirm(`Nyatakan ${active.studentName} TIDAK LULUS Juz ${juzText}?`)) return;

    setSaving(true);
    try {
      await api.submitMunaqosahResult(active.assignmentId, {
        scores: { tajwid, kelancaran },
        hasil,
        catatanPenguji: catatan || undefined,
      });
      toast.success(`Hasil ujian ${hasil === "lulus" ? "LULUS" : "TIDAK LULUS"} tersimpan`);
      setActive(null);
      setCatatan("");
      await load();
    } catch (err) {
      toast.warning(err instanceof Error ? err.message : "Gagal menyimpan hasil");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      <AppHeader />

      <main className="flex-1 overflow-y-auto px-4 pt-1 pb-24">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => (window.location.hash = "#/dashboard")}
              aria-label="Kembali"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-cyan/10"
            >
              <ArrowLeft className="h-4 w-4 text-brand-cyan" />
            </button>
            <div>
              <h1 className="text-base font-extrabold text-brand-navy">Tugas Penguji Munaqosah</h1>
              <p className="text-[11px] text-brand-text-muted">
                {pending.length} menunggu dinilai • {done.length} selesai
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">{error}</div>
          )}

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
            </div>
          ) : pending.length === 0 ? (
            <div className="rounded-2xl border border-brand-line bg-white p-8 text-center text-xs text-brand-text-muted">
              Tidak ada tugas pengujian saat ini.
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((e) => {
                const juzText = e.juzList && e.juzList.length > 0 ? e.juzList.join(", ") : e.juzKe;
                return (
                  <div
                    key={e.assignmentId ?? e.id}
                    className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                        <Award className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-brand-navy">{e.studentName}</h3>
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                            Juz {juzText}
                          </span>
                        </div>
                        <p className="text-xs text-brand-text-muted">
                          {e.className} • Tanggal: {e.examDate ?? "-"}{e.examTime ? ` (${e.examTime})` : ""}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={() => {
                        setActive(e);
                        setTajwid(85);
                        setKelancaran(85);
                        setCatatan("");
                      }}
                      disabled={!e.assignmentId}
                      className="mt-3 h-10 w-full rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-700"
                    >
                      Buka Form Penilaian
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {done.length > 0 && (
            <section className="mt-4">
              <h2 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-brand-navy/60">
                Riwayat Selesai Dinilai ({done.length})
              </h2>
              <div className="space-y-2">
                {done.map((e) => {
                  const juzText = e.juzList && e.juzList.length > 0 ? e.juzList.join(", ") : e.juzKe;
                  const finalScore = e.scores?.nilaiAkhir ?? e.nilaiAkhir;
                  const gradeLetter = e.scores?.grade ?? e.grade;
                  return (
                    <div
                      key={e.assignmentId ?? e.id}
                      className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-3 shadow-xs"
                    >
                      <div>
                        <p className="text-xs font-bold text-brand-navy">
                          {e.studentName} (Juz {juzText})
                        </p>
                        {finalScore && (
                          <p className="text-[11px] text-brand-text-muted">
                            Nilai: <strong className="text-brand-navy">{finalScore}</strong> ({gradeLetter ?? "-"})
                          </p>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${
                          e.hasil === "lulus" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {e.hasil === "lulus" ? "LULUS" : "TIDAK LULUS"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Modal Input Nilai */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-brand-line pb-3">
              <div>
                <h2 className="text-sm font-bold text-brand-navy">
                  Penilaian: {active.studentName}
                </h2>
                <p className="text-[11px] font-semibold text-purple-700">
                  Ujian Juz {active.juzList && active.juzList.length > 0 ? active.juzList.join(", ") : active.juzKe}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between font-bold text-brand-navy">
                  <span>1. Nilai Tajwid (0-100)</span>
                  <span className="text-brand-cyan text-sm">{tajwid}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={tajwid}
                  onChange={(e) => setTajwid(Number(e.target.value))}
                  className="mt-1 w-full"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-brand-navy">
                  <span>2. Nilai Kelancaran (0-100)</span>
                  <span className="text-brand-cyan text-sm">{kelancaran}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={kelancaran}
                  onChange={(e) => setKelancaran(Number(e.target.value))}
                  className="mt-1 w-full"
                />
              </div>

              {/* Rangkuman Nilai & Konversi Huruf */}
              <div className="rounded-2xl border border-brand-line bg-gray-50/70 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-brand-text-muted">Rata-rata Nilai</p>
                  <p className="text-xl font-extrabold text-brand-navy">{avgScore} / 100</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-brand-text-muted">Konversi Predikat</p>
                  <p className="text-xs font-bold text-emerald-700">{letterGrade}</p>
                </div>
              </div>

              <div>
                <label className="font-bold text-brand-navy">Catatan Penguji (opsional)</label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan makhraj, waqaf, atau pesan penguji..."
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-brand-line p-2.5 font-medium text-brand-navy outline-none focus:border-brand-cyan text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit("tidak_lulus")}
                disabled={saving}
                className="h-10 flex-1 rounded-xl border-red-200 text-xs font-bold text-red-600 hover:bg-red-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Nyatakan Tidak Lulus"}
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit("lulus")}
                disabled={saving}
                className="h-10 flex-1 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="mr-1 h-4 w-4" /> Nyatakan Lulus
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav items={TEACHER_NAV_ITEMS} activeIndex={1} />
    </div>
  );
}
