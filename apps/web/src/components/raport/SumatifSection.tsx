export function SumatifSection() {
  return (
    <section>
      <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-brand-navy">
        HASIL ASESMEN SUMATIF TTQ
      </h3>
      <div className="flex flex-col gap-3">
        {/* Row 1: Test Tahfidz & Test Tilawah */}
        <div className="grid grid-cols-2 gap-3">
          {/* Test Tahfidz */}
          <div className="flex flex-col items-center rounded-2xl border border-brand-line bg-white p-3.5 shadow-sm text-center">
            <span className="text-xs font-bold text-brand-navy">TEST TAHFIDZ</span>
            <div className="my-2 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-cyan/10 text-xl font-extrabold text-brand-cyan">
              B
            </div>
            <p className="text-xs font-bold text-brand-navy">86.2/100</p>
            <span className="mt-1 rounded-full bg-brand-cyan/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-cyan">
              جيد جدا
            </span>
            <p className="mt-1.5 text-[9px] text-brand-text-muted">
              Al Baqarah:12 - Al Imran:2
            </p>
            <div className="mt-2 w-full border-t border-brand-line/40 pt-2 flex justify-between text-[10px] text-brand-navy font-semibold px-1">
              <span>Tajwid: 86.2</span>
              <span>Kelancaran: 86.2</span>
            </div>
          </div>

          {/* Test Tilawah */}
          <div className="flex flex-col items-center rounded-2xl border border-brand-line bg-white p-3.5 shadow-sm text-center">
            <span className="text-xs font-bold text-brand-navy">TEST TILAWAH</span>
            <div className="my-2 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl font-extrabold text-emerald-600">
              A
            </div>
            <p className="text-xs font-bold text-brand-navy">93/100</p>
            <span className="mt-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
              ممتاز
            </span>
            <p className="mt-1.5 text-[9px] text-brand-text-muted">
              Al Baqarah:1 - Al Imran:10
            </p>
            <div className="mt-2 w-full border-t border-brand-line/40 pt-2 flex justify-between text-[10px] text-brand-navy font-semibold px-1">
              <span>Tajwid: 86.2</span>
              <span>Kelancaran: 86.2</span>
            </div>
          </div>
        </div>

        {/* Row 2: Test Tertulis (Full width card) */}
        <div className="flex flex-col items-center rounded-2xl border border-brand-line bg-white p-3.5 shadow-sm text-center">
          <span className="text-xs font-bold text-brand-navy">TEST TERTULIS</span>
          <div className="my-2 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-cyan/10 text-xl font-extrabold text-brand-cyan">
            B
          </div>
          <p className="text-xs font-bold text-brand-navy">85.2/100</p>
          <span className="mt-1 rounded-full bg-brand-cyan/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-cyan">
            جيد جدا
          </span>
          <p className="mt-1.5 text-[10px] text-brand-text-muted">
            Pengetahuan Ilmu Tajwid Metode Sabiq
          </p>
        </div>
      </div>
    </section>
  );
}
