export interface RangeNilaiProps {
  finalScore?: number;
}

export function RangeNilaiSection({ finalScore = 84.0 }: RangeNilaiProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Range Nilai */}
      <section>
        <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-brand-navy">
          RANGE NILAI
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-2 text-xs font-bold text-rose-700">
            <span>Kurang (D)</span>
            <span>&lt; 75</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-2 text-xs font-bold text-amber-700">
            <span>Cukup (C)</span>
            <span>75 - 83</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-brand-cyan/40 bg-brand-cyan/5 px-4 py-2 text-xs font-bold text-brand-cyan-dark">
            <span>Baik (B)</span>
            <span>84 - 92</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-2 text-xs font-bold text-emerald-700">
            <span>Sangat Baik (A)</span>
            <span>93 - 100</span>
          </div>
        </div>
      </section>

      {/* Nilai Akhir */}
      <section className="flex flex-col items-center justify-center rounded-2xl border-2 border-brand-cyan/40 bg-white p-5 shadow-sm text-center">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-navy">
          NILAI AKHIR
        </h3>
        <div className="mt-2 text-4xl font-extrabold text-[#0D5C75]">
          {finalScore.toFixed(2)}
        </div>
      </section>
    </div>
  );
}
