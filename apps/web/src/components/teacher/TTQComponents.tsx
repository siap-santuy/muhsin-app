import { ArrowLeft, Calendar, ChevronDown } from "lucide-react";

export type TTQCategoryType = "ziyadah" | "murojaah" | "sabiq" | "talaqi";

export function formatIndonesianFullDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return `${dayNames[dateObj.getDay()]}, ${d} ${monthNames[m - 1]} ${y}`;
}

interface TTQHeaderProps {
  date: string;
  onBack?: () => void;
}

export function TTQHeader({ date, onBack }: TTQHeaderProps) {
  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      window.location.hash = "#/student-list";
    }
  }

  return (
    <div className="flex flex-col items-center pt-3 pb-2">
      <div className="relative flex w-full items-center justify-center">
        <button
          type="button"
          onClick={handleBack}
          className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-extrabold text-brand-cyan tracking-wide">
          TTQ
        </h1>
      </div>
      <p className="mt-4 text-xs font-bold text-brand-navy">
        {formatIndonesianFullDate(date)}
      </p>
    </div>
  );
}

interface TTQCategoryTabsProps {
  activeCategory: TTQCategoryType;
  onChangeCategory: (cat: TTQCategoryType) => void;
}

export function TTQCategoryTabs({
  activeCategory,
  onChangeCategory,
}: TTQCategoryTabsProps) {
  const tabs: Array<{ id: TTQCategoryType; label: string }> = [
    { id: "ziyadah", label: "Ziyadah" },
    { id: "murojaah", label: "Muroja'ah" },
    { id: "sabiq", label: "Sabiq" },
    { id: "talaqi", label: "Talaqi" },
  ];

  return (
    <div className="flex rounded-2xl border border-brand-line bg-white p-1.5 shadow-xs">
      {tabs.map((t) => {
        const isActive = activeCategory === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChangeCategory(t.id)}
            className={`flex-1 rounded-xl py-2 text-center text-xs font-bold transition-all ${
              isActive
                ? "bg-[#22bad0] text-white shadow-xs"
                : "text-brand-navy hover:text-brand-cyan"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

interface TTQAttendanceRowProps {
  mode: "input" | "view";
  value: string;
  onChange?: (val: "Hadir" | "Izin" | "Sakit" | "Alpa") => void;
}

export function TTQAttendanceRow({
  mode,
  value,
  onChange,
}: TTQAttendanceRowProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 text-brand-navy">
        <Calendar className="h-5 w-5 text-brand-navy" />
        <span className="text-sm font-extrabold text-brand-navy">
          Status Kehadiran
        </span>
      </div>

      {mode === "input" ? (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange?.(e.target.value as any)}
            className="appearance-none rounded-xl border border-brand-line bg-white py-1.5 pl-3 pr-8 text-xs font-bold text-brand-navy outline-none shadow-xs focus:border-brand-cyan"
          >
            <option value="Hadir">Hadir</option>
            <option value="Izin">Izin</option>
            <option value="Sakit">Sakit</option>
            <option value="Alpa">Alpa</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        </div>
      ) : (
        <span className="rounded-full border border-emerald-400 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-600">
          {value || "Hadir"}
        </span>
      )}
    </div>
  );
}

interface TTQScoreSliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

export function TTQScoreSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
}: TTQScoreSliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-brand-navy">{label}</span>
        <span className="text-lg font-extrabold text-[#22bad0]">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#22bad0]"
      />
    </div>
  );
}
