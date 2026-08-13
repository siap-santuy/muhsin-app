import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  Check,
  CheckCircle2,
  Download,
  Moon,
  RotateCcw,
  Sparkles,
  Star,
  Sun,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentSemesterRaportPageProps {
  onBack?: () => void;
}

export function StudentSemesterRaportPage({ onBack }: StudentSemesterRaportPageProps) {
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
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-cyan/10">
              <BookOpen className="h-10 w-10 text-brand-cyan" />
            </div>
            <h2 className="mt-3 text-xl font-bold text-brand-navy">
              Raport Semester 2
            </h2>
            <h3 className="text-lg font-bold text-brand-navy">
              Tahun Ajaran 2026/2027
            </h3>
            <p className="mt-1 text-xs font-semibold text-brand-navy">
              Fulan bin Fulan (9991239201)
            </p>
            <p className="text-xs text-brand-text-muted">
              VII Abu Bakar Ash-Shiddiq
            </p>
            <p className="mt-1 text-[11px] text-brand-text-muted">
              Pembimbing:
            </p>
            <p className="text-xs font-semibold text-brand-navy">
              Arai Kurnia Ramadhan
            </p>

            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600 border border-emerald-200">
              <Check className="h-3 w-3" />
              Terverifikasi
            </span>
          </div>

          {/* Nilai TTQ Section */}
          <section>
            <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-brand-navy">
              NILAI TTQ
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Card Tahfidz */}
              <div className="flex flex-col items-center rounded-2xl border border-brand-line bg-white p-3.5 shadow-sm text-center">
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-navy">
                  <BookOpen className="h-3.5 w-3.5 text-brand-cyan" />
                  <span>TAHFIDZ</span>
                </div>
                <div className="my-2 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan/10 text-2xl font-extrabold text-brand-cyan">
                  B
                </div>
                <p className="text-xs font-bold text-brand-navy">86.2/100</p>
                <span className="mt-1 rounded-full bg-brand-cyan/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-cyan">
                  جيد جدا
                </span>
                <p className="mt-1.5 text-[9px] text-brand-text-muted">
                  Al Baqarah:12 - Al Imran:2
                </p>
              </div>

              {/* Card Tahsin */}
              <div className="flex flex-col items-center rounded-2xl border border-brand-line bg-white p-3.5 shadow-sm text-center">
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-navy">
                  <Sparkles className="h-3.5 w-3.5 text-brand-cyan" />
                  <span>TAHSIN</span>
                </div>
                <div className="my-2 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan/10 text-2xl font-extrabold text-brand-cyan">
                  B
                </div>
                <p className="text-xs font-bold text-brand-navy">85.2/100</p>
                <span className="mt-1 rounded-full bg-brand-cyan/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-cyan">
                  جيد جدا
                </span>
                <p className="mt-1.5 text-[9px] text-brand-text-muted">
                  Sabiq Jilid 3:162
                </p>
              </div>
            </div>
          </section>

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
          <section>
            <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-brand-navy">
              MUTABA'AH YAUMIYYAH
            </h3>
            <div className="rounded-2xl border border-brand-line bg-white px-4 py-2 shadow-sm divide-y divide-brand-line/40">
              {[
                { icon: BookOpen, label: "Tilawah", ratio: "30/30", grade: "A", color: "text-emerald-500" },
                { icon: CalendarCheck, label: "Shalat Fardhu", ratio: "150/150", grade: "B", color: "text-brand-cyan" },
                { icon: Sun, label: "Shalat Sunnah", ratio: "240/240", grade: "C", color: "text-amber-500" },
                { icon: Moon, label: "Tahajud", ratio: "30/30", grade: "C", color: "text-amber-500" },
                { icon: Sun, label: "Dhuha", ratio: "30/30", grade: "C", color: "text-amber-500" },
                { icon: UtensilsCrossed, label: "Shaum", ratio: "8/8", grade: "D", color: "text-red-500" },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-brand-cyan" />
                      <span className="text-xs font-bold text-brand-navy">{row.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-brand-text-muted">{row.ratio}</span>
                      <span className={`text-sm font-extrabold ${row.color}`}>{row.grade}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Absensi Siswa Section */}
          <section>
            <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-brand-navy">
              ABSENSI SISWA
            </h3>
            <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-4 border-b border-brand-line/40 pb-3">
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>KEHADIRAN</span>
                  </div>
                  <p className="mt-1 text-lg font-extrabold text-brand-navy">20/20</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
                    <XCircle className="h-3.5 w-3.5" />
                    <span>TIDAK SETORAN</span>
                  </div>
                  <p className="mt-1 text-lg font-extrabold text-brand-navy">0</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] font-bold text-amber-500">SAKIT</p>
                  <p className="text-sm font-bold text-brand-navy">0</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-amber-500">IZIN</p>
                  <p className="text-sm font-bold text-brand-navy">0</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-red-500">ALPA</p>
                  <p className="text-sm font-bold text-brand-navy">0</p>
                </div>
              </div>
            </div>
          </section>

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
          <section>
            <h3 className="mb-2 text-left text-xs font-bold text-brand-navy">
              Evaluasi Guru Pembimbing
            </h3>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm flex flex-col justify-between min-h-[140px]">
              <p className="text-xs font-medium italic leading-relaxed text-brand-navy">
                &ldquo;Ananda Fulan menunjukkan progress yang baik, harap orang tua membantu mengingatkan untuk mengulangi pelajaran dan murojaah di rumah.&rdquo;
              </p>
              <div className="mt-6 text-right">
                <p className="text-xs font-bold text-amber-600">Pembimbing</p>
                <div className="my-2 border-b border-amber-300 w-36 ml-auto" />
                <p className="text-xs font-bold text-amber-600">
                  Arai Kurnia Ramadhan
                </p>
              </div>
            </div>
          </section>

          {/* Bottom Action Button */}
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-2xl border-2 border-brand-cyan text-xs font-bold text-brand-cyan hover:bg-brand-cyan/10"
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
