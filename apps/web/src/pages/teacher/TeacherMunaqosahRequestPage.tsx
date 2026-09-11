import { useState, useEffect } from "react";
import { ArrowLeft, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toastStore";
import { api } from "@/lib/api";

export function TeacherMunaqosahRequestPage({ initialStudentId }: { initialStudentId?: string }) {
  const [students, setStudents] = useState<Array<{ id: string; name: string; className?: string | null }>>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId ?? "");
  const [juzKe, setJuzKe] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getStudents();
        setStudents(data);
        if (initialStudentId && data.some((s: { id: string }) => s.id === initialStudentId)) {
          setSelectedStudentId(initialStudentId);
        } else if (data.length && !selectedStudentId) {
          setSelectedStudentId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat daftar siswa");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit() {
    if (!selectedStudentId) return;
    try {
      await api.createMunaqosahRequest({ studentId: selectedStudentId, juzKe });
      toast.success("Permintaan Munaqosah berhasil terkirim");
      window.location.hash = "#/dashboard";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim permintaan";
      setError(msg);
      toast.warning(msg);
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
        <h1 className="text-lg font-bold text-brand-cyan">Permintaan Munaqosah</h1>
        <div className="h-10 w-10" />
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-1">
        <div className="flex flex-col gap-4">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">{error}</div>
          )}

          {/* Pilih Siswa */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <label className="text-xs font-bold text-brand-navy">Siswa</label>
            <div className="relative mt-2">
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-brand-line bg-gray-50/50 py-3 pl-3 pr-9 text-xs font-bold text-brand-navy outline-none focus:border-brand-cyan"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.className ?? "Kelas TTQ"})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </section>

          {/* Juz Ke */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <label className="text-xs font-bold text-brand-navy">Juz Ke‑</label>
            <input
              type="number"
              min={1}
              max={30}
              value={juzKe}
              onChange={e => setJuzKe(Number(e.target.value))}
              className="mt-2 w-full rounded-xl border border-brand-line bg-gray-50/50 py-2.5 px-3 text-xs font-bold text-brand-navy outline-none focus:border-brand-cyan"
            />
          </section>

          <Button type="button" onClick={handleSubmit} className="h-11 w-full rounded-xl bg-brand-cyan font-bold uppercase text-white">
            Kirim Permintaan
          </Button>
        </div>
      </main>
    </div>
  );
}
