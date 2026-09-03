import { ChevronLeft, ChevronRight } from "lucide-react";

export interface DayItem {
  dayName: string;
  dayNum: number;
  fullDate: string;
  status?: "setoran" | "sakit" | "alpa" | "empty" | "submitted" | "draft";
}

interface DayStripPickerProps {
  days: DayItem[];
  selectedIndex: number;
  onSelectDay: (index: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  maxDate?: string;
}

const DOT_COLORS: Record<string, string> = {
  submitted: "bg-emerald-500",
  setoran: "bg-emerald-500",
  draft: "bg-amber-500",
  sakit: "bg-amber-500",
  alpa: "bg-red-500",
  empty: "bg-gray-300",
};

const ITEM_H = 56; // fixed height — prevents layout shift on selection change

function formatIndonesianFullDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return `${dayNames[dateObj.getDay()]}, ${d} ${monthNames[m - 1]} ${y}`;
}

function getTodayLocalDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DayStripPicker({
  days,
  selectedIndex,
  onSelectDay,
  onPrev,
  onNext,
  maxDate,
}: DayStripPickerProps) {
  const todayStr = getTodayLocalDate();
  const effectiveMaxDate = maxDate || todayStr;
  const selectedDay = days[selectedIndex] ?? days[2] ?? days[0];
  const isNextDisabled = selectedDay ? selectedDay.fullDate >= effectiveMaxDate : false;

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full items-center justify-between gap-1 px-1">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Hari sebelumnya"
          className="shrink-0 rounded-lg p-1.5 text-brand-navy hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* 5 Day Cards Grid centered */}
        <div className="flex flex-1 items-center justify-center gap-1.5">
          {days.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const disabled = item.fullDate > effectiveMaxDate;
            return (
              <button
                key={`${item.fullDate}-${idx}`}
                type="button"
                onClick={() => !disabled && onSelectDay(idx)}
                disabled={disabled}
                className={`flex flex-1 max-w-[56px] flex-col items-center justify-center rounded-xl border-2 py-1 transition-all ${
                  isSelected
                    ? "border-brand-cyan bg-white shadow-sm scale-105 z-10"
                    : "border-transparent bg-transparent hover:bg-gray-50/80 opacity-85"
                } ${disabled ? "cursor-not-allowed opacity-30 pointer-events-none" : "cursor-pointer"}`}
                style={{ height: `${ITEM_H}px` }}
              >
                <span
                  className={`text-[10px] font-bold ${
                    isSelected ? "text-brand-cyan" : "text-brand-text-muted"
                  }`}
                >
                  {item.dayName}
                </span>
                <span
                  className={`text-base font-bold ${
                    isSelected ? "text-brand-cyan" : "text-brand-navy"
                  }`}
                >
                  {item.dayNum}
                </span>
                {item.status && item.status !== "empty" ? (
                  <span
                    className={`mt-1 h-2 w-2 rounded-full ring-1 ring-white shadow-xs ${
                      DOT_COLORS[item.status] ?? "bg-gray-300"
                    }`}
                  />
                ) : (
                  <span className="mt-1 h-2 w-2 rounded-full bg-gray-200" />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
          aria-label="Hari berikutnya"
          className={`shrink-0 rounded-lg p-1.5 text-brand-navy transition-colors ${
            isNextDisabled
              ? "cursor-not-allowed opacity-30 pointer-events-none"
              : "hover:bg-gray-100"
          }`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {selectedDay ? (
        <span className="mt-2 text-xs font-semibold text-brand-navy">
          {formatIndonesianFullDate(selectedDay.fullDate)}
        </span>
      ) : null}
    </div>
  );
}
