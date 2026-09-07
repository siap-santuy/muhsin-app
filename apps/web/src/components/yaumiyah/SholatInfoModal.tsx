import { X, CalendarDays, CheckCircle2, Clock, Ban, AlertCircle } from "lucide-react";

interface SholatInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SholatCodeInfo {
  code: string;
  label: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  icon: typeof CheckCircle2;
  pointsNote?: string;
}

const SHOLAT_CODES: SholatCodeInfo[] = [
  {
    code: "BA",
    label: "Berjamaah di Awal Waktu",
    description: "Melaksanakan sholat fardhu secara berjamaah tepat saat waktu sholat masuk.",
    badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-700",
    badgeText: "Sangat Dianjurkan",
    icon: CheckCircle2,
    pointsNote: "Bobot poin tertinggi",
  },
  {
    code: "MA",
    label: "Munfarid di Awal Waktu",
    description: "Melaksanakan sholat fardhu sendirian di awal waktu sholat.",
    badgeBg: "bg-teal-50 border-teal-200 text-teal-700",
    badgeText: "Awal Waktu",
    icon: CheckCircle2,
    pointsNote: "Bobot poin tinggi",
  },
  {
    code: "BT",
    label: "Berjamaah Tidak di Awal Waktu",
    description: "Melaksanakan sholat fardhu secara berjamaah namun sudah melewati awal waktu sholat.",
    badgeBg: "bg-amber-50 border-amber-200 text-amber-700",
    badgeText: "Berjamaah",
    icon: Clock,
    pointsNote: "Bobot poin sedang",
  },
  {
    code: "MT",
    label: "Munfarid Tidak di Awal Waktu",
    description: "Melaksanakan sholat fardhu sendirian dan tidak di awal waktu sholat.",
    badgeBg: "bg-orange-50 border-orange-200 text-orange-700",
    badgeText: "Sendiri",
    icon: Clock,
    pointsNote: "Bobot poin cukup",
  },
  {
    code: "H",
    label: "Haid (Khusus Siswi)",
    description: "Kondisi berhalangan syar'i bagi siswi. Status ini tercatat dan tidak mengurangi nilai ibadah.",
    badgeBg: "bg-rose-50 border-rose-200 text-rose-700",
    badgeText: "Udzur Syar'i",
    icon: AlertCircle,
    pointsNote: "Tidak mengurangi evaluasi",
  },
  {
    code: "T",
    label: "Tidak Sholat",
    description: "Terlewat atau tidak menunaikan kewajiban sholat fardhu pada hari bersangkutan.",
    badgeBg: "bg-gray-100 border-gray-300 text-gray-700",
    badgeText: "Alpa / Terlewat",
    icon: Ban,
    pointsNote: "0 poin",
  },
];

export function SholatInfoModal({ isOpen, onClose }: SholatInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in">
      {/* Backdrop Click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet / Drawer Panel */}
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl border-t border-brand-line bg-white shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Drag Handle Bar */}
        <div className="flex w-full justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-line/60 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-brand-navy">
                Panduan Kode Sholat Fardhu
              </h2>
              <p className="text-[11px] text-brand-text-muted">
                Keterangan status pelaksanaan sholat harian
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {SHOLAT_CODES.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.code}
                className="flex items-start gap-3 rounded-xl border border-brand-line/70 bg-gray-50/40 p-3 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-cyan text-white text-xs font-black shadow-xs">
                  {item.code}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-brand-navy leading-snug">
                      {item.label}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${item.badgeBg}`}
                    >
                      <IconComp className="h-3 w-3" />
                      {item.badgeText}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-brand-text-muted leading-relaxed">
                    {item.description}
                  </p>
                  {item.pointsNote ? (
                    <p className="mt-1 text-[10px] font-medium text-brand-cyan">
                      • {item.pointsNote}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Button */}
        <div className="border-t border-brand-line/60 p-4 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-brand-cyan py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#159db5] transition-colors"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
