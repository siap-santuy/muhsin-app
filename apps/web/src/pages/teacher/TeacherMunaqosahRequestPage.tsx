import { useState, useEffect } from "react";
import { ArrowLeft, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toastStore";
import { api } from "@/lib/api";

export function TeacherMunaqosahRequestPage({ initialStudentId }: { initialStudentId?: string }) {
  const [students, setStudents] = useState<Array<{ id: string; name: string; className?: string | null }>>([]);
  const [periods, setPeriods] = useState<Array<{ id: string; nama: string; status: string }>>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId ?? "");
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [selectedJuz, setSelectedJuz] = useState<number[]>([30]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function toggleJuz(juz: number) {
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
      toast.warning("Pilih minimal 1 juz untuk diuji");
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
                  <option value="">Tidak ada periode munaqosah aktif</option>
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
            <p className="mt-2 text-[11px] text-brand-text-muted">
              Catatan: 1 siswa hanya dapat diajukan 1 kali ujian pada setiap periode munaqosah.
            </p>
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
              Klik pada nomor juz untuk memilih/membatalkan. Siswa bisa munaqosah lebih dari 1 juz sekaligus (misal Juz 29 & 30).
            </p>

            {/* Quick Chips for Popular Juz */}
            <div className="mt-3 flex flex-wrap gap-1.5 border-b border-brand-line/50 pb-3">
              <span className="text-[10px] font-bold text-gray-400 self-center mr-1">Pilihan Cepat:</span>
              {[30, 29, 28, 1, 2].map((j) => {
                const isSelected = selectedJuz.includes(j);
                return (
                  <button
                    key={j}
                    type="button"
                    onClick={() => toggleJuz(j)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                      isSelected
                        ? "bg-brand-cyan text-white shadow-xs"
                        : "bg-gray-100 text-brand-navy hover:bg-gray-200"
                    }`}
                  >
                    Juz {j}
                  </button>
                );
              })}
            </div>

            {/* Grid 1-30 */}
            <div className="mt-3 grid grid-cols-6 gap-2">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => {
                const isSelected = selectedJuz.includes(j);
                return (
                  <button
                    key={j}
                    type="button"
                    onClick={() => toggleJuz(j)}
                    className={`flex h-10 flex-col items-center justify-center rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? "border-brand-cyan bg-brand-cyan text-white shadow-xs"
                        : "border-brand-line bg-white text-brand-navy hover:border-brand-cyan/50"
                    }`}
                  >
                    <span>{j}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="h-11 w-full rounded-xl bg-brand-cyan font-bold uppercase tracking-wider text-white shadow-md hover:bg-brand-cyan-dark"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Kirim Pengajuan ke Koordinator"}
          </Button>
        </div>
      </main>
    </div>
  );
}
