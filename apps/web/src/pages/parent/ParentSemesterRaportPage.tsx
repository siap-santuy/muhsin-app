import { useState, useEffect } from "react";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { AbsensiSection } from "@/components/raport/AbsensiSection";
import { DetailTahfidzTahsinSection } from "@/components/raport/DetailTahfidzTahsinSection";
import { EvaluasiSection } from "@/components/raport/EvaluasiSection";
import { MutabaahSection } from "@/components/raport/MutabaahSection";
import { NilaiTtqSection } from "@/components/raport/NilaiTtqSection";
import { RangeNilaiSection } from "@/components/raport/RangeNilaiSection";
import { RaportStudentHeader } from "@/components/raport/RaportStudentHeader";
import { SumatifSection } from "@/components/raport/SumatifSection";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { exportRaportPdf, type SemesterRaportData } from "@/lib/exportRaportPdf";

interface ParentSemesterRaportPageProps {
  onBack?: () => void;
  semester?: string;
  year?: string;
}

export function ParentSemesterRaportPage({
  onBack,
  semester = "Ganjil",
  year = "2026/2027",
}: ParentSemesterRaportPageProps) {
  const [raport, setRaport] = useState<SemesterRaportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const storedChildId = typeof window !== "undefined" ? localStorage.getItem("parent_active_child_id") || undefined : undefined;
        const data = await api.getSemesterRaport({
          studentId: storedChildId,
          semester,
          tahunAjaran: year,
        });
        setRaport(data as SemesterRaportData);
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

  async function handleExportPdf() {
    if (!raport) return;
    try {
      await exportRaportPdf(raport, "SMP ISLAM TERPADU AL FITRAH", "semester");
    } catch (error) {
      console.error("Failed to export PDF:", error);
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
  const nilaiAkhir = raport?.nilaiAkhir ?? 0;
  const nilaiTtq = raport?.nilaiTtq;
  const detailTtq = raport?.detailTtq;
  const absensi = raport?.absensi;
  const sumatif = raport?.sumatif;
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
        <h1 className="text-xl font-bold text-brand-cyan">Raport Ananda</h1>
        <div className="h-10 w-10" />
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-12 pt-1">
        <div className="flex flex-col gap-5">
          {/* Header Info Student */}
          <RaportStudentHeader
            title={`Raport Semester ${semester === "1" ? "Ganjil" : semester === "2" ? "Genap" : semester}`}
            subtitle={`Tahun Ajaran ${year}`}
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

          {/* Hasil Asesmen Sumatif TTQ Section */}
          <SumatifSection data={sumatif} />

          {/* Detail Tahfidz & Tahsin Section */}
          <DetailTahfidzTahsinSection {...detailTtq} />

          {/* Mutaba'ah Yaumiyyah Section */}
          {mutabaah ? (
            <MutabaahSection rows={mutabaah} />
          ) : (
            <MutabaahSection />
          )}

          {/* Absensi Siswa Section */}
          <AbsensiSection data={absensi} />

          {/* Range Nilai & Nilai Akhir Section */}
          <RangeNilaiSection finalScore={nilaiAkhir} />

          {/* Evaluasi Guru Pembimbing */}
          <EvaluasiSection
            evaluationText={evaluasi ?? "Belum ada evaluasi dari ustadz pembimbing untuk semester ini."}
            pembimbingName={student?.pembimbingName}
            showSignatureLine
          />

          {/* Bottom Action Button */}
          <div className="pt-2">
            <Button
              type="button"
              onClick={handleExportPdf}
              className="h-11 w-full rounded-2xl bg-brand-cyan text-xs font-bold text-white shadow-sm hover:bg-brand-cyan-dark print:hidden"
            >
              <Download className="mr-2 h-4 w-4" />
              UNDUH RAPORT ANANDA
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
