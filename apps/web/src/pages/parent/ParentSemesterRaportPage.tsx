import {
  ArrowLeft,
  BookOpen,
  Download,
  RotateCcw,
  Star,
} from "lucide-react";
import { AbsensiSection } from "@/components/raport/AbsensiSection";
import { EvaluasiSection } from "@/components/raport/EvaluasiSection";
import { MutabaahSection } from "@/components/raport/MutabaahSection";
import { NilaiTtqSection } from "@/components/raport/NilaiTtqSection";
import { RaportStudentHeader } from "@/components/raport/RaportStudentHeader";
import { Button } from "@/components/ui/button";

interface ParentSemesterRaportPageProps {
  onBack?: () => void;
  semester?: number;
  year?: string;
}

export function ParentSemesterRaportPage({
  onBack,
  semester = 1,
  year = "2026/2027",
}: ParentSemesterRaportPageProps) {
  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      window.location.hash = "#/raport";
    }
  }

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
            subtitle={`Tahun Ajaran ${year}`}
          />

          {/* Nilai TTQ Section */}
          <NilaiTtqSection />

          {/* Hasil Asesmen Sumatif TTQ Section */}
          <section>
            <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-brand-navy">
              HASIL ASESMEN SUMATIF TTQ
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Card Test Tahfidz */}
              <div className="flex flex-col items-center rounded-2xl border border-brand-line bg-white p-3 shadow-sm text-center">
                <div className="flex items-center gap-1 text-[11px] font-bold text-brand-navy">
                  <BookOpen className="h-3.5 w-3.5 text-brand-cyan" />
                  <span>TEST TAHFIDZ</span>
                </div>
                <div className="my-2 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-cyan/10 text-xl font-extrabold text-brand-cyan">
                  B
                </div>
                <p className="text-xs font-bold text-brand-navy">86.2/100</p>
                <span className="mt-1 rounded-full bg-brand-cyan/10 px-2 py-0.5 text-[10px] font-bold text-brand-cyan">
                  جيد جدا
                </span>
                <p className="mt-1 text-[9px] text-brand-text-muted">
                  Al Baqarah:12 - Al Imran:2
                </p>
                <div className="mt-2 grid w-full grid-cols-2 border-t border-brand-line/40 pt-2 text-[9px]">
                  <div>
                    <p className="text-brand-text-muted">Tajwid</p>
                    <p className="font-bold text-brand-navy">86.2</p>
                  </div>
                  <div>
                    <p className="text-brand-text-muted">Kelancaran</p>
                    <p className="font-bold text-brand-navy">86.2</p>
                  </div>
                </div>
              </div>

              {/* Card Test Tilawah */}
              <div className="flex flex-col items-center rounded-2xl border border-brand-line bg-white p-3 shadow-sm text-center">
                <div className="flex items-center gap-1 text-[11px] font-bold text-brand-navy">
                  <RotateCcw className="h-3.5 w-3.5 text-emerald-500" />
                  <span>TEST TILAWAH</span>
                </div>
                <div className="my-2 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-xl font-extrabold text-emerald-500">
                  A
                </div>
                <p className="text-xs font-bold text-brand-navy">93/100</p>
                <span className="mt-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                  ممتاز
                </span>
                <p className="mt-1 text-[9px] text-brand-text-muted">
                  Al Baqarah:1 - Al Imran:10
                </p>
                <div className="mt-2 grid w-full grid-cols-2 border-t border-brand-line/40 pt-2 text-[9px]">
                  <div>
                    <p className="text-brand-text-muted">Tajwid</p>
                    <p className="font-bold text-brand-navy">86.2</p>
                  </div>
                  <div>
                    <p className="text-brand-text-muted">Kelancaran</p>
                    <p className="font-bold text-brand-navy">86.2</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Test Tertulis (Centered) */}
            <div className="mx-auto mt-3 max-w-[65%]">
              <div className="flex flex-col items-center rounded-2xl border border-brand-line bg-white p-3 shadow-sm text-center">
                <div className="flex items-center gap-1 text-[11px] font-bold text-brand-navy">
                  <Star className="h-3.5 w-3.5 text-brand-cyan" />
                  <span>TEST TERTULIS</span>
                </div>
                <div className="my-2 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-cyan/10 text-xl font-extrabold text-brand-cyan">
                  B
                </div>
                <p className="text-xs font-bold text-brand-navy">85.2/100</p>
                <span className="mt-1 rounded-full bg-brand-cyan/10 px-2 py-0.5 text-[10px] font-bold text-brand-cyan">
                  جيد جدا
                </span>
                <p className="mt-1.5 text-[9px] text-brand-text-muted leading-tight">
                  Pengetahuan Ilmu Tajwid Metode Sabiq
                </p>
              </div>
            </div>
          </section>

          {/* Mutaba'ah Yaumiyyah Section */}
          <MutabaahSection />

          {/* Absensi Siswa Section */}
          <AbsensiSection />

          {/* Range Nilai Section */}
          <section>
            <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-brand-navy">
              RANGE NILAI
            </h3>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: "Kurang (D)", range: "< 75", border: "border-red-200 bg-red-50/50 text-red-600" },
                { label: "Cukup (C)", range: "75 - 83", border: "border-amber-200 bg-amber-50/50 text-amber-600" },
                { label: "Baik (B)", range: "84 - 92", border: "border-brand-cyan/40 bg-brand-cyan/5 text-brand-cyan" },
                { label: "Sangat Baik (A)", range: "93 - 100", border: "border-emerald-200 bg-emerald-50/50 text-emerald-600" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl border px-1 py-2 text-center ${item.border}`}
                >
                  <p className="text-[9px] font-bold leading-tight">{item.label}</p>
                  <p className="mt-0.5 text-[10px] font-extrabold">{item.range}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Nilai Akhir Section */}
          <section className="text-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              NILAI AKHIR
            </h3>
            <p className="mt-1 text-3xl font-black tracking-tight text-brand-cyan">
              84.00
            </p>
          </section>

          {/* Evaluasi Guru Pembimbing */}
          <EvaluasiSection showSignatureLine />

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
