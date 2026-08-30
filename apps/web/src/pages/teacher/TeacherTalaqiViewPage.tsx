import { useState, useEffect } from "react";
import { ArrowLeft, Edit2, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function TeacherTalaqiViewPage() {
  const [entry, setEntry] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const lastId = sessionStorage.getItem("lastSetoranId");
        if (lastId) {
          const data = await api.getSetoranById(lastId);
          setEntry(data);

          if (data.studentId) {
            const s = await api.getStudentById(data.studentId);
            setStudent(s);
          }
        } else {
          const list = await api.getSetoranHistory();
          if (list.length > 0) {
            setEntry(list[0]);
            const s = await api.getStudentById(list[0].studentId);
            setStudent(s);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat detail talaqi");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-page">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  const studentName = student?.name ?? "Siswa";
  const className = student?.className ?? "";
  const materi = entry?.referenceStart?.materi ?? "Materi Talaqi";
  const scores = entry?.scores ?? {};
  const catatan = entry?.keterangan ?? "Tidak ada catatan.";
  const dateStr = entry?.date ?? new Date().toISOString().slice(0, 10);

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between bg-brand-page px-4 py-3">
        <button
          type="button"
          onClick={() => (window.location.hash = "#/students")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10"
        >
          <ArrowLeft className="h-4 w-4 text-indigo-600" />
        </button>
        <h1 className="text-xl font-bold text-indigo-600">Detail Talaqi</h1>
        <div className="h-10 w-10" />
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-12 pt-1">
        <div className="flex flex-col gap-4">
          {error ? (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
              {error}
            </div>
          ) : null}

          {/* Student Info Card */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Volume2 className="h-7 w-7" />
            </div>
            <h2 className="mt-2 text-base font-bold text-brand-navy">{studentName}</h2>
            <p className="text-xs text-brand-text-muted">{className ? `Kelas: ${className}` : ""}</p>
            <span className="mt-2 inline-block rounded-full bg-indigo-50 px-3 py-0.5 text-[10px] font-bold text-indigo-600 border border-indigo-200">
              Talaqi Terverifikasi
            </span>
          </div>

          {/* Details Card */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-brand-line/40 pb-2">
              <span className="text-xs font-bold text-brand-navy">Tanggal Setoran</span>
              <span className="text-xs font-bold text-indigo-600">{dateStr}</span>
            </div>

            <div className="flex items-center justify-between border-b border-brand-line/40 pb-2">
              <span className="text-xs font-bold text-brand-navy">Materi Talaqi</span>
              <span className="text-xs font-bold text-brand-navy">{materi}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-center">
                <p className="text-[10px] font-bold text-brand-navy">Makhroj</p>
                <p className="text-lg font-extrabold text-indigo-600">{scores.makhroj ?? 0}</p>
              </div>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-center">
                <p className="text-[10px] font-bold text-brand-navy">Tajwid</p>
                <p className="text-lg font-extrabold text-indigo-600">{scores.tajwid ?? 0}</p>
              </div>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-center">
                <p className="text-[10px] font-bold text-brand-navy">Kelancaran</p>
                <p className="text-lg font-extrabold text-indigo-600">{scores.kelancaran ?? 0}</p>
              </div>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-center">
                <p className="text-[10px] font-bold text-brand-navy">Fashohah</p>
                <p className="text-lg font-extrabold text-indigo-600">{scores.fashohah ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Catatan Card */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm">
            <h3 className="text-xs font-bold text-brand-navy">Catatan Evaluasi Guru</h3>
            <p className="mt-1 text-xs italic text-brand-navy">
              &ldquo;{catatan}&rdquo;
            </p>
          </div>

          {/* Edit Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => (window.location.hash = "#/talaqi-input")}
            className="h-11 w-full rounded-xl border-2 border-indigo-500 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
          >
            <Edit2 className="mr-2 h-4 w-4" /> INPUT TALAQI LAIN
          </Button>
        </div>
      </main>
    </div>
  );
}
