import { ArrowLeft, Edit2, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TeacherMurojaahViewPage() {
  return (
    <div className="flex h-screen flex-col bg-brand-page">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between bg-brand-page px-4 py-3">
        <button
          type="button"
          onClick={() => (window.location.hash = "#/dashboard")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-cyan/10"
        >
          <ArrowLeft className="h-4 w-4 text-brand-cyan" />
        </button>
        <h1 className="text-xl font-bold text-brand-cyan">Detail Muroja&apos;ah</h1>
        <div className="h-10 w-10" />
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-12 pt-1">
        <div className="flex flex-col gap-4">
          {/* Card Info Student */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <Repeat className="h-7 w-7" />
            </div>
            <h2 className="mt-2 text-base font-bold text-brand-navy">Fulan bin Fulan</h2>
            <p className="text-xs text-brand-text-muted">NIS: 9991239201 &bull; VII Abu Bakar</p>
            <span className="mt-2 inline-block rounded-full bg-emerald-50 px-3 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-200">
              Muroja&apos;ah Terjaga
            </span>
          </div>

          {/* Details Card */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-brand-line/40 pb-2">
              <span className="text-xs font-bold text-brand-navy">Tanggal Setoran</span>
              <span className="text-xs font-bold text-emerald-600">Selasa, 3 Nov 2025</span>
            </div>

            <div className="flex items-center justify-between border-b border-brand-line/40 pb-2">
              <span className="text-xs font-bold text-brand-navy">Capaian Muroja&apos;ah</span>
              <span className="text-xs font-bold text-brand-navy">Al-Fatihah: 1-7</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
                <p className="text-[10px] font-bold text-brand-navy">Nilai Tajwid</p>
                <p className="text-lg font-extrabold text-emerald-600">95</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
                <p className="text-[10px] font-bold text-brand-navy">Nilai Kelancaran</p>
                <p className="text-lg font-extrabold text-emerald-600">98</p>
              </div>
            </div>
          </div>

          {/* Catatan Evaluasi Card */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
            <h3 className="text-xs font-bold text-brand-navy">Catatan Evaluasi Guru</h3>
            <p className="mt-1 text-xs italic text-brand-navy">
              &ldquo;Sangat baik dan terjaga mutabaah murojaahnya.&rdquo;
            </p>
          </div>

          {/* Edit Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => (window.location.hash = "#/murojaah-input")}
            className="h-11 w-full rounded-xl border-2 border-emerald-500 text-xs font-bold text-emerald-600 hover:bg-emerald-50"
          >
            <Edit2 className="mr-2 h-4 w-4" /> UBAH MUROJA&apos;AH
          </Button>
        </div>
      </main>
    </div>
  );
}
