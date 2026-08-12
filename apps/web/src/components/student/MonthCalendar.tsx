import { ChevronLeft, ChevronRight } from "lucide-react";

export interface DayStatus {
  day: number;
  monthOffset?: number;
  status?: "setoran" | "sakit" | "alpa" | "empty";
}

interface MonthCalendarProps {
  monthYear: string;
  days: DayStatus[];
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}

const DAY_NAMES = ["S", "S", "R", "K", "J", "S", "M"];

const DOT_COLORS: Record<string, string> = {
  setoran: "bg-emerald-500",
  sakit: "bg-amber-500",
  alpa: "bg-red-500",
  empty: "bg-gray-300",
};

export function MonthCalendar({
  monthYear,
  days,
  onPrevMonth,
  onNextMonth,
}: MonthCalendarProps) {
  return (
    <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-1 text-brand-navy hover:opacity-70"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-base font-bold text-brand-navy">{monthYear}</h2>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-1 text-brand-navy hover:opacity-70"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-7 text-center">
        {DAY_NAMES.map((name, i) => (
          <span key={`${name}-${i}`} className="text-xs font-bold text-brand-navy">
            {name}
          </span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-y-2 text-center text-xs font-medium">
        {days.map((d, i) => {
          const isOtherMonth = d.monthOffset && d.monthOffset !== 0;
          return (
            <div key={i} className="flex flex-col items-center gap-0.5 py-1">
              <span
                className={
                  isOtherMonth
                    ? "text-gray-300"
                    : "font-semibold text-brand-navy"
                }
              >
                {d.day}
              </span>
              {d.status ? (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    DOT_COLORS[d.status] ?? "bg-transparent"
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
