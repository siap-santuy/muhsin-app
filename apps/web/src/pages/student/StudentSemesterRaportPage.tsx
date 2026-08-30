import { useState, useEffect } from "react";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { EvaluasiSection } from "@/components/raport/EvaluasiSection";
import { MutabaahSection } from "@/components/raport/MutabaahSection";
import { RaportStudentHeader } from "@/components/raport/RaportStudentHeader";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface StudentSemesterRaportPageProps {
  onBack?: () => void;
  semester?: string;
  year?: string;
}

export function StudentSemesterRaportPage({
  onBack,
  semester = "Ganjil",
  year = "2026/2027",
}: StudentSemesterRaportPageProps) {
  const [raport, setRaport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getSemesterRaport({
          semester,
          tahunAjaran: year,
        });
        setRaport(data);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [semester, year]);

  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      window.location.hash = "#/raport";
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-page">
        <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
      </div>
    );
  }

  const student = raport?.student;
  const nilaiAkhir = raport?.nilaiAkhir ?? 86.5;
  const gradeAkhir = raport?.gradeAkhir ?? "B";
  const arabicPredicate = raport?.arabicPredicate ?? "جيد جدا";
  const kategoriList = raport?.kategoriList ?? [];
  const mutabaah = raport?.mutabaah;
  const evaluasi = raport?.evaluasi;

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between bg-brand-page px-4 py-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Kembali"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-cyan/10"
        >
          <ArrowLeft className="h-4 w-4 text-brand-cyan" />
        </button>
        <h1 className="text-xl font-bold text-brand-cyan">Raport Semester</h1>
        <div className="h-10 w-10" />
      </div>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-4 pb-12 pt-1">
        <div className="flex flex-col gap-5">
          {/* Header Info Student */}
          <RaportStudentHeader
            title={`Raport Semester ${semester}`}
            subtitle={`T.A. ${year}`}
            studentName={student?.name}
            className={student?.className}
            pembimbingName={student?.pembimbingName}
          />

          {/* Nilai Akhir Card */}
          <div className="flex flex-col items-center rounded-2xl border-2 border-brand-cyan bg-white p-4 shadow-sm text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              NILAI AKHIR SEMESTER
            </p>
            <div className="my-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-cyan text-3xl font-extrabold text-white shadow-md">
              {gradeAkhir}
            </div>
            <p className="text-base font-extrabold text-brand-navy">{nilaiAkhir}</p>
            <span className="mt-1 rounded-full bg-brand-cyan/10 px-3 py-0.5 text-xs font-bold text-brand-cyan">
              {arabicPredicate}
            </span>
          </div>

          {/* Rincian Kategori Nilai */}
          <section>
            <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-brand-navy">
              RINCIAN NILAI PROGRAM
            </h3>
            <div className="space-y-2.5">
              {kategoriList.map((kat: any) => (
                <div
                  key={kat.name}
                  className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-3.5 shadow-sm"
                >
                  <div>
                    <h4 className="text-xs font-bold text-brand-navy">{kat.name}</h4>
                    <p className="text-[10px] text-brand-text-muted">
                      Predikat: {kat.arabicPredicate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-navy">{kat.score}</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-cyan/10 text-xs font-extrabold text-brand-cyan">
                      {kat.grade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Mutaba'ah Yaumiyyah Section */}
          {mutabaah ? (
            <MutabaahSection rows={mutabaah} />
          ) : (
            <MutabaahSection />
          )}

          {/* Evaluasi Guru Pembimbing */}
          <EvaluasiSection
            evaluationText={evaluasi}
            pembimbingName={student?.pembimbingName}
            showSignatureLine
          />

          {/* Bottom Action Button */}
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
              className="h-11 w-full rounded-2xl border-2 border-brand-cyan text-xs font-bold text-brand-cyan hover:bg-brand-cyan/10 print:hidden"
            >
              <Download className="mr-2 h-4 w-4" />
              UNDUH RAPORT LENGKAP
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
