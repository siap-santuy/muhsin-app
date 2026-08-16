import { ArrowLeft, Download } from "lucide-react";
import { AbsensiSection } from "@/components/raport/AbsensiSection";
import { EvaluasiSection } from "@/components/raport/EvaluasiSection";
import { MutabaahSection } from "@/components/raport/MutabaahSection";
import { NilaiTtqSection } from "@/components/raport/NilaiTtqSection";
import { RaportStudentHeader } from "@/components/raport/RaportStudentHeader";
import { Button } from "@/components/ui/button";

interface ParentMonthlyRaportPageProps {
  onBack?: () => void;
  month?: string;
  year?: string;
}

export function ParentMonthlyRaportPage({
  onBack,
  month = "Juli",
  year = "2026",
}: ParentMonthlyRaportPageProps) {
  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      window.location.hash = "#/raport";
    }
  }

  const displayYear = year.split("/")[0] || year;

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
          <RaportStudentHeader title={`Raport Bulan ${month} ${displayYear}`} />

          {/* Nilai TTQ Section */}
          <NilaiTtqSection />

          {/* Detail Tahfidz Section */}
          <section>
            <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-brand-navy">
              DETAIL TAHFIDZ
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-brand-cyan/40 bg-brand-cyan/5 px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-brand-navy">Ziyadah</p>
                <p className="text-xs font-bold text-brand-cyan">85.2</p>
              </div>
              <div className="rounded-xl border border-brand-cyan/40 bg-brand-cyan/5 px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-brand-navy">Muroja&apos;ah</p>
                <p className="text-xs font-bold text-brand-cyan">85.2</p>
              </div>
            </div>
          </section>

          {/* Detail Tahsin Section */}
          <section>
            <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-brand-navy">
              DETAIL TAHSIN
            </h3>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: "Makhroj", val: "85.2" },
                { label: "Mad", val: "85.2" },
                { label: "Ghunnah", val: "85.2" },
                { label: "Kelancaran", val: "85.2" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-purple-200 bg-purple-50/50 px-1.5 py-2 text-center"
                >
                  <p className="text-[10px] font-bold text-brand-navy truncate">
                    {item.label}
                  </p>
                  <p className="text-xs font-bold text-purple-600">{item.val}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Mutaba'ah Yaumiyyah Section */}
          <MutabaahSection />

          {/* Absensi Siswa Section */}
          <AbsensiSection />

          {/* Evaluasi Guru Pembimbing */}
          <EvaluasiSection />

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
