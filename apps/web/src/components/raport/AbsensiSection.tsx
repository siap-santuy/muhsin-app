import { CheckCircle2, XCircle } from "lucide-react";

export interface AbsensiData {
  kehadiranRatio: string;
  tidakSetoranCount: number;
  sakitCount: number;
  izinCount: number;
  alpaCount: number;
}

export interface AbsensiSectionProps {
  data?: AbsensiData;
}

const DEFAULT_DATA: AbsensiData = {
  kehadiranRatio: "20/20",
  tidakSetoranCount: 0,
  sakitCount: 0,
  izinCount: 0,
  alpaCount: 0,
};

export function AbsensiSection({ data = DEFAULT_DATA }: AbsensiSectionProps) {
  return (
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
            <p className="mt-1 text-lg font-extrabold text-brand-navy">
              {data.kehadiranRatio}
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
              <XCircle className="h-3.5 w-3.5" />
              <span>TIDAK SETORAN</span>
            </div>
            <p className="mt-1 text-lg font-extrabold text-brand-navy">
              {data.tidakSetoranCount}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] font-bold text-amber-500">SAKIT</p>
            <p className="text-sm font-bold text-brand-navy">{data.sakitCount}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-500">IZIN</p>
            <p className="text-sm font-bold text-brand-navy">{data.izinCount}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-red-500">ALPA</p>
            <p className="text-sm font-bold text-brand-navy">{data.alpaCount}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
