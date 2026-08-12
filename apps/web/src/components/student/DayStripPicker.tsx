import { ChevronLeft, ChevronRight } from "lucide-react";

export interface DayItem {
  dayName: string;
  dayNum: number;
  fullDate: string;
  status?: "setoran" | "sakit" | "alpa" | "empty";
}

interface DayStripPickerProps {
  days: DayItem[];
  selectedIndex: number;
  onSelectDay: (index: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

const DOT_COLORS: Record<string, string> = {
  setoran: "bg-emerald-500",
  sakit: "bg-amber-500",
  alpa: "bg-red-500",
  empty: "bg-gray-300",
};

export function DayStripPicker({
  days,
  selectedIndex,
  onSelectDay,
  onPrev,
  onNext,
}: DayStripPickerProps) {
  const selectedDay = days[selectedIndex];

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full items-center justify-between px-2">
        <button
          type="button"
          onClick={onPrev}
          className="p-1 text-brand-navy hover:opacity-70"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          {days.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={`${item.dayName}-${item.dayNum}`}
                type="button"
                onClick={() => onSelectDay(idx)}
                className={`flex flex-col items-center justify-center rounded-xl transition-all ${
                  isSelected
                    ? "border-2 border-brand-cyan bg-white px-3 py-2 shadow-sm"
                    : "px-2 py-1"
                }`}
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
                {item.status ? (
                  <span
                    className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                      DOT_COLORS[item.status] ?? "bg-transparent"
                    }`}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onNext}
          className="p-1 text-brand-navy hover:opacity-70"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {selectedDay ? (
        <span className="mt-2 text-xs font-semibold text-brand-navy">
          {selectedDay.fullDate}
        </span>
      ) : null}
    </div>
  );
}
