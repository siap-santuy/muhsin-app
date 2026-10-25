import { useState, useEffect } from "react";
import { ArrowLeft, ChevronDown, Loader2, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toastStore";
import { api } from "@/lib/api";

export function TeacherMunaqosahRequestPage({ initialStudentId }: { initialStudentId?: string }) {
  const [students, setStudents] = useState<Array<{ id: string; name: string; className?: string | null }>>([]);
  const [periods, setPeriods] = useState<Array<{ id: string; nama: string; status: string }>>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId ?? "");
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [selectedJuz, setSelectedJuz] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Eligibility Info per selected student
  const [passedJuz, setPassedJuz] = useState<number[]>([]);
  const [pendingJuz, setPendingJuz] = useState<number[]>([]);
  const [loadingEligibility, setLoadingEligibility] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [studentData, periodData] = await Promise.all([
          api.getStudents(),
          api.getMunaqosahPeriods().catch(() => []),
        ]);
        setStudents(studentData);
        setPeriods(periodData);

        const openPeriod = periodData.find((p) => p.status === "buka") || periodData[0];
        if (openPeriod) {
          setSelectedPeriodId(openPeriod.id);
        }

        if (initialStudentId && studentData.some((s: { id: string }) => s.id === initialStudentId)) {
          setSelectedStudentId(initialStudentId);
        } else if (studentData.length && !selectedStudentId) {
          setSelectedStudentId(studentData[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Fetch eligibility when student changes
  useEffect(() => {
    if (!selectedStudentId) return;
    setLoadingEligibility(true);
    api.getStudentEligibility(selectedStudentId)
      .then((res) => {
        setPassedJuz(res.passedJuz || []);
        setPendingJuz(res.pendingJuz || []);
        // Set default chosen juz to first available from 30 down
        const available = [30, 29, 28, 27, 26, 1, 2].find(
          (j) => !res.passedJuz.includes(j) && !res.pendingJuz.includes(j)
        );
        setSelectedJuz(available ? [available] : []);
      })
      .catch(() => {
        setPassedJuz([]);
        setPendingJuz([]);
      })
      .finally(() => setLoadingEligibility(false));
  }, [selectedStudentId]);

  function toggleJuz(juz: number) {
    if (passedJuz.includes(juz)) {
      toast.warning(`Juz ${juz} sudah LULUS munaqosah sebelumnya`);
      return;
    }
    if (pendingJuz.includes(juz)) {
      toast.warning(`Juz ${juz} sedang dalam proses pengajuan/ujian`);
      return;
    }

    if (selectedJuz.includes(juz)) {
      if (selectedJuz.length === 1) {
        toast.warning("Pilih minimal 1 juz untuk ujian");
        return;
      }
      setSelectedJuz(selectedJuz.filter((j) => j !== juz));
    } else {
      setSelectedJuz([...selectedJuz, juz].sort((a, b) => a - b));
    }
  }

  async function handleSubmit() {
    if (!selectedStudentId) {
      toast.warning("Pilih siswa terlebih dahulu");
      return;
    }
    if (selectedJuz.length === 0) {
      toast.warning("Pilih minimal 1 juz yang belum pernah diujikan");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.createMunaqosahRequest({
        studentId: selectedStudentId,
        juzList: selectedJuz,
        juzKe: selectedJuz[0],
        periodId: selectedPeriodId || undefined,
      });
      toast.success(`Pengajuan Munaqosah Juz ${selectedJuz.join(", ")} berhasil dikirim ke Koordinator`);
      window.location.hash = "#/dashboard";
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim pengajuan";
      setError(msg);
      toast.warning(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    window.location.hash = "#/dashboard";
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-page">
        <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between bg-brand-page px-4 py-3">
        <button type="button" onClick={handleBack} aria-label="Kembali" className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-cyan/10">
          <ArrowLeft className="h-4 w-4 text-brand-cyan" />
        </button>
        <h1 className="text-base font-bold text-brand-navy">Ajukan Ujian Munaqosah</h1>
        <div className="h-10 w-10" />
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-1">
        <div className="flex flex-col gap-4">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200">
              {error}
            </div>
          )}

          {/* Pilih Periode Ujian */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <label className="text-xs font-bold text-brand-navy">Target Periode Munaqosah</label>
            <div className="relative mt-2">
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-brand-line bg-gray-50/50 py-3 pl-3 pr-9 text-xs font-bold text-brand-navy outline-none focus:border-brand-cyan"
              >
                {periods.length === 0 ? (
                  <option value="">— Belum ada periode aktif, hubungi Koordinator —</option>
                ) : (
                  periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} ({p.status === "buka" ? "Buka / Aktif" : p.status})
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </section>

          {/* Pilih Siswa */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <label className="text-xs font-bold text-brand-navy">Siswa Calon Peserta</label>
            <div className="relative mt-2">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-brand-line bg-gray-50/50 py-3 pl-3 pr-9 text-xs font-bold text-brand-navy outline-none focus:border-brand-cyan"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.className ?? "Kelas TTQ"})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            {loadingEligibility ? (
              <p className="mt-2 text-[11px] text-gray-400 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Memeriksa histori juz siswa...
              </p>
            ) : (
              <div className="mt-2.5 flex flex-wrap gap-2 text-[10px]">
                {passedJuz.length > 0 && (
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 border border-emerald-200">
                    ✓ Sudah Lulus: Juz {passedJuz.join(", ")}
                  </span>
                )}
                {pendingJuz.length > 0 && (
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 font-bold text-amber-700 border border-amber-200">
                    ⏳ Sedang Berjalan: Juz {pendingJuz.join(", ")}
                  </span>
                )}
              </div>
            )}
          </section>

          {/* Pilih Juz (Multi-Juz) */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-brand-navy">Juz yang Diuji (Bisa &ge; 1 Juz)</label>
              <span className="text-[11px] font-extrabold text-brand-cyan">
                {selectedJuz.length} Juz Dipilih: [{selectedJuz.join(", ")}]
              </span>
            </div>
            <p className="mt-1 text-[11px] text-brand-text-muted">
              Juz yang sudah pernah lulus atau sedang dalam antrean otomatis dinonaktifkan (disabled).
            </p>

            {/* Legend */}
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[10px] text-brand-text-muted border-b border-brand-line/50 pb-2.5">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-100 border border-emerald-400" /> Sudah Lulus
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-100 border border-amber-400" /> Sedang Proses
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-brand-cyan" /> Terpilih
              </span>
            </div>

            {/* Grid 1-30 */}
            <div className="mt-3 grid grid-cols-6 gap-2">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => {
                const isPassed = passedJuz.includes(j);
                const isPending = pendingJuz.includes(j);
                const isSelected = selectedJuz.includes(j);
                const isDisabled = isPassed || isPending;

                let btnClass = "border-brand-line bg-white text-brand-navy hover:border-brand-cyan/50";
                if (isSelected) {
                  btnClass = "border-brand-cyan bg-brand-cyan text-white shadow-xs";
                } else if (isPassed) {
                  btnClass = "border-emerald-200 bg-emerald-50 text-emerald-600 opacity-80 cursor-not-allowed";
                } else if (isPending) {
                  btnClass = "border-amber-200 bg-amber-50 text-amber-600 opacity-80 cursor-not-allowed";
                }

                return (
                  <button
                    key={j}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => toggleJuz(j)}
                    className={`relative flex h-12 flex-col items-center justify-center rounded-xl border text-xs font-bold transition-all ${btnClass}`}
                  >
                    <span>{j}</span>
                    {isPassed && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                    {isPending && <Clock className="h-3 w-3 text-amber-600" />}
                  </button>
                );
              })}
            </div>
          </section>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selectedJuz.length === 0}
            className="h-11 w-full rounded-xl bg-brand-cyan font-bold uppercase tracking-wider text-white shadow-md hover:bg-brand-cyan-dark disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Kirim Pengajuan ke Koordinator"}
          </Button>
        </div>
      </main>
    </div>
  );
}
