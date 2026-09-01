import { useState, useEffect } from "react";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { AbsensiSection } from "@/components/raport/AbsensiSection";
import { EvaluasiSection } from "@/components/raport/EvaluasiSection";
import { MutabaahSection } from "@/components/raport/MutabaahSection";
import { NilaiTtqSection } from "@/components/raport/NilaiTtqSection";
import { RangeNilaiSection } from "@/components/raport/RangeNilaiSection";
import { RaportStudentHeader } from "@/components/raport/RaportStudentHeader";
import { SumatifSection } from "@/components/raport/SumatifSection";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface TeacherSemesterRaportPageProps {
  onBack?: () => void;
  studentId?: string;
  semester?: string;
  year?: string;
}

export function TeacherSemesterRaportPage({
  onBack,
  studentId,
  semester = "Ganjil",
  year = "2026/2027",
}: TeacherSemesterRaportPageProps) {
  const [raport, setRaport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const targetId = studentId || sessionStorage.getItem("selectedStudentId") || undefined;
        const data = await api.getSemesterRaport({
          studentId: targetId,
          semester,
          tahunAjaran: year,
        });
        setRaport(data);
      } catch (err) {
        console.error("Failed to load teacher semester raport:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId, semester, year]);

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
  const nilaiAkhir = raport?.nilaiAkhir ?? 84.0;
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
        <h1 className="text-xl font-bold text-brand-cyan">Raport Semester Siswa</h1>
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
          <NilaiTtqSection />

          {/* Hasil Asesmen Sumatif TTQ Section */}
          <SumatifSection />

          {/* Mutaba'ah Yaumiyyah Section */}
          {mutabaah ? (
            <MutabaahSection rows={mutabaah} />
          ) : (
            <MutabaahSection />
          )}

          {/* Absensi Siswa Section */}
          <AbsensiSection />

          {/* Range Nilai & Nilai Akhir Section */}
          <RangeNilaiSection finalScore={nilaiAkhir} />

          {/* Evaluasi Guru Pembimbing */}
          <EvaluasiSection
            evaluationText={evaluasi}
            pembimbingName={student?.pembimbingName}
            showSignatureLine
          />

          <div className="pt-2">
            <Button
              type="button"
              onClick={() => window.print()}
              className="h-11 w-full rounded-2xl bg-brand-cyan text-xs font-bold text-white shadow-sm hover:bg-brand-cyan-dark print:hidden"
            >
              <Download className="mr-2 h-4 w-4" />
              UNDUH RAPORT SISWA
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
