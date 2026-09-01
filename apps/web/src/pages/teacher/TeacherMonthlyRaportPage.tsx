import { useState, useEffect } from "react";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { AbsensiSection } from "@/components/raport/AbsensiSection";
import { DetailTahfidzTahsinSection } from "@/components/raport/DetailTahfidzTahsinSection";
import { EvaluasiSection } from "@/components/raport/EvaluasiSection";
import { MutabaahSection } from "@/components/raport/MutabaahSection";
import { NilaiTtqSection } from "@/components/raport/NilaiTtqSection";
import { RaportStudentHeader } from "@/components/raport/RaportStudentHeader";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const MONTH_MAP: Record<string, string> = {
  juli: "07",
  agustus: "08",
  september: "09",
  oktober: "10",
  november: "11",
  desember: "12",
  januari: "01",
  februari: "02",
  maret: "03",
  april: "04",
  mei: "05",
  juni: "06",
};

interface TeacherMonthlyRaportPageProps {
  onBack?: () => void;
  studentId?: string;
  month?: string;
  year?: string;
}

export function TeacherMonthlyRaportPage({
  onBack,
  studentId,
  month = "September",
  year = "2026/2027",
}: TeacherMonthlyRaportPageProps) {
  const [raport, setRaport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const cleanMonth = (month || "").trim().toLowerCase();
  const monthNum = MONTH_MAP[cleanMonth] ?? (cleanMonth.padStart(2, "0").slice(0, 2) || "09");
  const [startYear, endYear] = (year || "2026/2027").split("/").map((s) => s.trim());
  const numericMonth = Number(monthNum);
  const targetYear = numericMonth >= 7 ? startYear : (endYear || startYear);
  const monthCode = `${targetYear}-${monthNum}`;

  useEffect(() => {
    async function load() {
      try {
        const targetId = studentId || sessionStorage.getItem("selectedStudentId") || undefined;
        const data = await api.getMonthlyRaport({
          studentId: targetId,
          month: monthCode,
        });
        setRaport(data);
      } catch (err) {
        console.error("Failed to load teacher monthly raport:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId, monthCode]);

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
        <h1 className="text-xl font-bold text-brand-cyan">Raport Bulanan Siswa</h1>
        <div className="h-10 w-10" />
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-12 pt-1">
        <div className="flex flex-col gap-5">
          <RaportStudentHeader
            title={`Raport Bulan ${month} ${targetYear}`}
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

          {/* Detail Tahfidz & Tahsin Section */}
          <DetailTahfidzTahsinSection />

          {/* Mutaba'ah Yaumiyyah Section */}
          {mutabaah ? (
            <MutabaahSection rows={mutabaah} />
          ) : (
            <MutabaahSection />
          )}

          {/* Absensi Siswa Section */}
          <AbsensiSection />

          {/* Evaluasi Guru Pembimbing */}
          <EvaluasiSection
            evaluationText={evaluasi}
            pembimbingName={student?.pembimbingName}
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
