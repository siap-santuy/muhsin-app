import { useState, useEffect } from "react";
import { ArrowLeft, Edit2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function TeacherSabiqViewPage() {
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
        setError(err instanceof Error ? err.message : "Gagal memuat detail sabiq");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-page">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  const studentName = student?.name ?? "Siswa";
  const className = student?.className ?? "";
  const jilid = entry?.referenceStart?.jilid ?? "Sabiq";
  const halMulai = entry?.referenceStart?.halaman ?? 1;
  const halSelesai = entry?.referenceEnd?.halaman ?? 1;
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
          className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10"
        >
          <ArrowLeft className="h-4 w-4 text-purple-600" />
        </button>
        <h1 className="text-xl font-bold text-purple-600">Detail Sabiq (Tahsin)</h1>
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
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-purple-600">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="mt-2 text-base font-bold text-brand-navy">{studentName}</h2>
            <p className="text-xs text-brand-text-muted">{className ? `Kelas: ${className}` : ""}</p>
            <span className="mt-2 inline-block rounded-full bg-purple-50 px-3 py-0.5 text-[10px] font-bold text-purple-600 border border-purple-200">
              Sabiq Terverifikasi
            </span>
          </div>

          {/* Details Card */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-brand-line/40 pb-2">
              <span className="text-xs font-bold text-brand-navy">Tanggal Setoran</span>
              <span className="text-xs font-bold text-purple-600">{dateStr}</span>
            </div>

            <div className="flex items-center justify-between border-b border-brand-line/40 pb-2">
              <span className="text-xs font-bold text-brand-navy">Materi Sabiq</span>
              <span className="text-xs font-bold text-brand-navy">
                {jilid} (Hal: {halMulai}-{halSelesai})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 text-center">
                <p className="text-[10px] font-bold text-brand-navy">Makhroj</p>
                <p className="text-lg font-extrabold text-purple-600">{scores.makhroj ?? 0}</p>
              </div>
              <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 text-center">
                <p className="text-[10px] font-bold text-brand-navy">Tajwid</p>
                <p className="text-lg font-extrabold text-purple-600">{scores.tajwid ?? 0}</p>
              </div>
              <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 text-center">
                <p className="text-[10px] font-bold text-brand-navy">Kelancaran</p>
                <p className="text-lg font-extrabold text-purple-600">{scores.kelancaran ?? 0}</p>
              </div>
              <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 text-center">
                <p className="text-[10px] font-bold text-brand-navy">Fashohah</p>
                <p className="text-lg font-extrabold text-purple-600">{scores.fashohah ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Catatan Card */}
          <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 shadow-sm">
            <h3 className="text-xs font-bold text-brand-navy">Catatan Evaluasi Guru</h3>
            <p className="mt-1 text-xs italic text-brand-navy">
              &ldquo;{catatan}&rdquo;
            </p>
          </div>

          {/* Edit Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => (window.location.hash = "#/sabiq-input")}
            className="h-11 w-full rounded-xl border-2 border-purple-500 text-xs font-bold text-purple-600 hover:bg-purple-50"
          >
            <Edit2 className="mr-2 h-4 w-4" /> INPUT SABIQ LAIN
          </Button>
        </div>
      </main>
    </div>
  );
}
