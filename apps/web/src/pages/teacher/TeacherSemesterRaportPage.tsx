import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Download,
  Edit3,
  RotateCcw,
  Save,
  Star,
} from "lucide-react";
import { AbsensiSection } from "@/components/raport/AbsensiSection";
import { EvaluasiSection } from "@/components/raport/EvaluasiSection";
import { MutabaahSection } from "@/components/raport/MutabaahSection";
import { NilaiTtqSection } from "@/components/raport/NilaiTtqSection";
import { RaportStudentHeader } from "@/components/raport/RaportStudentHeader";
import { Button } from "@/components/ui/button";

interface TeacherSemesterRaportPageProps {
  onBack?: () => void;
  semester?: number;
  year?: string;
  student?: string;
}

export function TeacherSemesterRaportPage({
  onBack,
  semester = 1,
  year = "2026/2027",
  student = "Fulan bin Fulan",
}: TeacherSemesterRaportPageProps) {
  const [evalText, setEvalText] = useState(
    "Ananda Fulan menunjukkan progress yang baik, harap orang tua membantu mengingatkan untuk mengulangi pelajaran dan murojaah di rumah."
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isVerified, setIsVerified] = useState(true);

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
        <h1 className="text-xl font-bold text-brand-cyan">Kelola Raport Semester</h1>
        <div className="h-10 w-10" />
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-12 pt-1">
        <div className="flex flex-col gap-5">
          <RaportStudentHeader
            title={`Raport Semester ${semester}`}
            subtitle={`Tahun Ajaran ${year}`}
            studentName={student}
            isVerified={isVerified}
          />

          {/* Verification toggle for teacher */}
          <div className="flex items-center justify-between rounded-xl border border-brand-line bg-white p-3 shadow-sm">
            <span className="text-xs font-bold text-brand-navy">Status Verifikasi Raport</span>
            <Button
              type="button"
              variant={isVerified ? "default" : "outline"}
              onClick={() => setIsVerified(!isVerified)}
              className={`h-8 text-xs font-bold ${
                isVerified
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "border-brand-cyan text-brand-cyan"
              }`}
            >
              {isVerified ? (
                <>
                  <Check className="mr-1 h-3.5 w-3.5" /> Terverifikasi
                </>
              ) : (
                "Verifikasi Sekarang"
              )}
            </Button>
          </div>

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
              </div>
            </div>

            {/* Card Test Tertulis */}
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
              </div>
            </div>
          </section>

          <MutabaahSection />
          <AbsensiSection />

          {/* Nilai Akhir Section */}
          <section className="text-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              NILAI AKHIR
            </h3>
            <p className="mt-1 text-3xl font-black tracking-tight text-brand-cyan">
              84.00
            </p>
          </section>

          {/* Teacher Editable Evaluasi Section */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-brand-navy">
                Evaluasi Guru Pembimbing
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1 text-[11px] font-bold text-brand-cyan"
              >
                <Edit3 className="h-3.5 w-3.5" />
                {isEditing ? "Batal Edit" : "Edit Evaluasi"}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-2 rounded-2xl border border-brand-line bg-white p-3 shadow-sm">
                <textarea
                  rows={4}
                  value={evalText}
                  onChange={(e) => setEvalText(e.target.value)}
                  className="w-full rounded-xl border border-brand-line p-2.5 text-xs font-medium text-brand-navy outline-none focus:border-brand-cyan"
                />
                <Button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="h-9 w-full rounded-xl bg-brand-cyan text-xs font-bold text-white shadow-sm"
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" /> Simpan Catatan Evaluasi
                </Button>
              </div>
            ) : (
              <EvaluasiSection evaluationText={evalText} showSignatureLine />
            )}
          </section>

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
              className="h-11 w-full rounded-2xl border-2 border-brand-cyan text-xs font-bold text-brand-cyan hover:bg-brand-cyan/10 print:hidden"
            >
              <Download className="mr-2 h-4 w-4" /> UNDUH RAPORT
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
