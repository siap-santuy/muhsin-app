import { useState, useEffect } from "react";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { EvaluasiSection } from "@/components/raport/EvaluasiSection";
import { MutabaahSection } from "@/components/raport/MutabaahSection";
import { NilaiTtqSection } from "@/components/raport/NilaiTtqSection";
import { RaportStudentHeader } from "@/components/raport/RaportStudentHeader";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface StudentMonthlyRaportPageProps {
  onBack?: () => void;
  month?: string;
  year?: string;
}

export function StudentMonthlyRaportPage({
  onBack,
  month = "Juli",
  year = "2026",
}: StudentMonthlyRaportPageProps) {
  const [raport, setRaport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const displayYear = year.split("/")[0] || year;
  const monthCode = `${displayYear}-07`;

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getMonthlyRaport({ month: monthCode });
        setRaport(data);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [monthCode]);

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
  const nilaiTtq = raport?.nilaiTtq;
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
        <h1 className="text-xl font-bold text-brand-cyan">Raport Bulanan</h1>
        <div className="h-10 w-10" />
      </div>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-4 pb-12 pt-1">
        <div className="flex flex-col gap-5">
          {/* Header Info Student */}
          <RaportStudentHeader
            title={`Raport Bulan ${month} ${displayYear}`}
            studentName={student?.name}
            className={student?.className}
            pembimbingName={student?.pembimbingName}
          />

          {/* Nilai TTQ Section */}
          {nilaiTtq ? (
            <NilaiTtqSection
              tahfidz={nilaiTtq.tahfidz}
              tahsin={nilaiTtq.tahsin}
            />
          ) : (
            <NilaiTtqSection />
          )}

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
              UNDUH RAPORT
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
