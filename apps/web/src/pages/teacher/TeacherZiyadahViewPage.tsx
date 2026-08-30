import { useState, useEffect } from "react";
import { ArrowLeft, BookOpen, Edit2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function TeacherZiyadahViewPage() {
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
          // Fallback fetch history
          const list = await api.getSetoranHistory();
          if (list.length > 0) {
            setEntry(list[0]);
            const s = await api.getStudentById(list[0].studentId);
            setStudent(s);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat detail setoran");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-page">
        <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
      </div>
    );
  }

  const studentName = student?.name ?? "Siswa";
  const studentEmail = student?.email ?? "";
  const className = student?.className ?? "";
  const surahName = entry?.referenceStart?.surah ?? "Al-Qur'an";
  const ayatMulai = entry?.referenceStart?.ayat ?? 1;
  const ayatSelesai = entry?.referenceEnd?.ayat ?? 1;
  const tajwidScore = entry?.scores?.tajwid ?? 0;
  const kelancaranScore = entry?.scores?.kelancaran ?? 0;
  const catatan = entry?.keterangan ?? "Tidak ada catatan.";
  const dateStr = entry?.date ?? new Date().toISOString().slice(0, 10);

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between bg-brand-page px-4 py-3">
        <button
          type="button"
          onClick={() => (window.location.hash = "#/students")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-cyan/10"
        >
          <ArrowLeft className="h-4 w-4 text-brand-cyan" />
        </button>
        <h1 className="text-xl font-bold text-brand-cyan">Detail Ziyadah</h1>
        <div className="h-10 w-10" />
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-12 pt-1">
        <div className="flex flex-col gap-4">
          {error ? (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
              {error}
            </div>
          ) : null}

          {/* Card Info Student */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-cyan/10 text-brand-cyan">
              <BookOpen className="h-7 w-7" />
            </div>
            <h2 className="mt-2 text-base font-bold text-brand-navy">{studentName}</h2>
            <p className="text-xs text-brand-text-muted">
              {className ? `Kelas: ${className}` : studentEmail}
            </p>
            <span className="mt-2 inline-block rounded-full bg-emerald-50 px-3 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-200">
              Setoran Terverifikasi
            </span>
          </div>

          {/* Details Card */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-brand-line/40 pb-2">
              <span className="text-xs font-bold text-brand-navy">Tanggal Setoran</span>
              <span className="text-xs font-bold text-brand-cyan">{dateStr}</span>
            </div>

            <div className="flex items-center justify-between border-b border-brand-line/40 pb-2">
              <span className="text-xs font-bold text-brand-navy">Capaian Hafalan</span>
              <span className="text-xs font-bold text-brand-navy">
                {surahName}: {ayatMulai}-{ayatSelesai}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl border border-brand-cyan/30 bg-brand-cyan/5 p-3 text-center">
                <p className="text-[10px] font-bold text-brand-navy">Nilai Tajwid</p>
                <p className="text-lg font-extrabold text-brand-cyan">{tajwidScore}</p>
              </div>
              <div className="rounded-xl border border-brand-cyan/30 bg-brand-cyan/5 p-3 text-center">
                <p className="text-[10px] font-bold text-brand-navy">Nilai Kelancaran</p>
                <p className="text-lg font-extrabold text-brand-cyan">{kelancaranScore}</p>
              </div>
            </div>
          </div>

          {/* Catatan Evaluasi Card */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
            <h3 className="text-xs font-bold text-brand-navy">Catatan Evaluasi Guru</h3>
            <p className="mt-1 text-xs italic text-brand-navy">
              &ldquo;{catatan}&rdquo;
            </p>
          </div>

          {/* Edit Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => (window.location.hash = "#/ziyadah-input")}
            className="h-11 w-full rounded-xl border-2 border-brand-cyan text-xs font-bold text-brand-cyan hover:bg-brand-cyan/10"
          >
            <Edit2 className="mr-2 h-4 w-4" /> INPUT SETORAN LAIN
          </Button>
        </div>
      </main>
    </div>
  );
}
