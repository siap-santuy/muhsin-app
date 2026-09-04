export interface DetailTahfidzTahsinProps {
  ziyadah?: number;
  murojaah?: number;
  makhroj?: number;
  mad?: number;
  ghunnah?: number;
  kelancaran?: number;
}

export function DetailTahfidzTahsinSection({
  ziyadah = 0,
  murojaah = 0,
  makhroj = 0,
  mad = 0,
  ghunnah = 0,
  kelancaran = 0,
}: DetailTahfidzTahsinProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Detail Tahfidz */}
      <section>
        <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-brand-navy">
          DETAIL TAHFIDZ
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-xl border border-brand-cyan/40 bg-brand-cyan/5 px-3 py-2.5 shadow-2xs">
            <span className="text-xs font-bold text-brand-navy">Ziyadah</span>
            <span className="text-xs font-extrabold text-brand-cyan-dark">{ziyadah}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-brand-cyan/40 bg-brand-cyan/5 px-3 py-2.5 shadow-2xs">
            <span className="text-xs font-bold text-brand-navy">Muroja&apos;ah</span>
            <span className="text-xs font-extrabold text-brand-cyan-dark">{murojaah}</span>
          </div>
        </div>
      </section>

      {/* Detail Tahsin */}
      <section>
        <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-brand-navy">
          DETAIL TAHSIN
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center justify-center rounded-xl border border-purple-300 bg-purple-50/50 py-2 text-center shadow-2xs">
            <span className="text-[10px] font-bold text-brand-navy">Makhroj</span>
            <span className="mt-0.5 text-xs font-extrabold text-purple-700">{makhroj}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-amber-300 bg-amber-50/50 py-2 text-center shadow-2xs">
            <span className="text-[10px] font-bold text-brand-navy">Mad</span>
            <span className="mt-0.5 text-xs font-extrabold text-amber-700">{mad}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-orange-300 bg-orange-50/50 py-2 text-center shadow-2xs">
            <span className="text-[10px] font-bold text-brand-navy">Ghunnah</span>
            <span className="mt-0.5 text-xs font-extrabold text-orange-700">{ghunnah}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-300 bg-slate-50/50 py-2 text-center shadow-2xs">
            <span className="text-[10px] font-bold text-brand-navy">Kelancaran</span>
            <span className="mt-0.5 text-xs font-extrabold text-slate-800">{kelancaran}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
