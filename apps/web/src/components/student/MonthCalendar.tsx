import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface DayStatus {
  day: number;
  monthOffset?: number;
  status?: "setoran" | "sakit" | "alpa" | "empty" | "submitted" | "draft";
  date?: Date;
}

interface MonthCalendarProps {
  monthYear?: string;
  days?: DayStatus[];
  initialDate?: Date;
  selectedDate?: Date;
  maxDate?: Date;
  showLegend?: boolean;
  onSelectDate?: (date: Date) => void;
  onMonthChange?: (year: number, month: number) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  getStatusForDate?: (date: Date) => DayStatus["status"];
}

const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES = ["S", "S", "R", "K", "J", "S", "M"];

const DOT_COLORS: Record<string, string> = {
  submitted: "bg-emerald-500",
  setoran: "bg-emerald-500",
  draft: "bg-amber-500",
  sakit: "bg-amber-500",
  alpa: "bg-red-500",
  empty: "bg-gray-300",
};

export function MonthCalendar({
  monthYear: customMonthYear,
  days: customDays,
  initialDate,
  selectedDate: propSelectedDate,
  maxDate: propMaxDate,
  showLegend = true,
  onSelectDate,
  onMonthChange,
  onPrevMonth,
  onNextMonth,
  getStatusForDate,
}: MonthCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = propMaxDate ?? today;
  maxDate.setHours(23, 59, 59, 999);

  const [currentViewDate, setCurrentViewDate] = useState<Date>(
    initialDate ?? new Date()
  );
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date>(
    propSelectedDate ?? today
  );

  const activeSelectedDate = propSelectedDate ?? internalSelectedDate;

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  function handlePrev() {
    if (onPrevMonth) {
      onPrevMonth();
    }
    const newDate = new Date(year, month - 1, 1);
    setCurrentViewDate(newDate);
    if (onMonthChange) {
      onMonthChange(newDate.getFullYear(), newDate.getMonth());
    }
  }

  function handleNext() {
    if (onNextMonth) {
      onNextMonth();
    }
    const newDate = new Date(year, month + 1, 1);
    setCurrentViewDate(newDate);
    if (onMonthChange) {
      onMonthChange(newDate.getFullYear(), newDate.getMonth());
    }
  }

  function handleYearChange(newYear: number) {
    const newDate = new Date(newYear, month, 1);
    setCurrentViewDate(newDate);
    if (onMonthChange) {
      onMonthChange(newDate.getFullYear(), newDate.getMonth());
    }
  }

  function handleMonthSelect(newMonth: number) {
    const newDate = new Date(year, newMonth, 1);
    setCurrentViewDate(newDate);
    if (onMonthChange) {
      onMonthChange(newDate.getFullYear(), newDate.getMonth());
    }
  }

  // Dynamic standard calendar computation (Monday start)
  const calendarGrid = (() => {
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const statusMap = new Map<number, DayStatus["status"]>();
    if (customDays) {
      customDays.forEach((cd) => {
        if (cd.status) statusMap.set(cd.day, cd.status);
      });
    }

    const items = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const date = new Date(year, month - 1, prevDay);
      date.setHours(0, 0, 0, 0);
      items.push({
        day: prevDay,
        isOtherMonth: true,
        status: getStatusForDate?.(date) ?? "empty",
        date,
        isDisabled: date > maxDate,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      date.setHours(0, 0, 0, 0);
      const dayStatus =
        getStatusForDate?.(date) ??
        statusMap.get(d) ??
        "empty";
      items.push({
        day: d,
        isOtherMonth: false,
        status: dayStatus,
        date,
        isDisabled: date > maxDate,
      });
    }

    // Next month padding to fill grid to multiple of 7
    const remaining = (7 - (items.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      date.setHours(0, 0, 0, 0);
      items.push({
        day: i,
        isOtherMonth: true,
        status: getStatusForDate?.(date) ?? "empty",
        date,
        isDisabled: date > maxDate,
      });
    }

    return items;
  })();

  function handleDateClick(item: (typeof calendarGrid)[0]) {
    if (item.isDisabled) return;
    setInternalSelectedDate(item.date);
    if (onSelectDate) {
      onSelectDate(item.date);
    }
  }

  function isSameDay(d1: Date, d2?: Date) {
    if (!d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  return (
    <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          className="p-1 text-brand-navy hover:opacity-70"
          aria-label="Bulan Sebelumnya"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {customMonthYear ? (
          <h2 className="text-base font-bold text-brand-navy">{customMonthYear}</h2>
        ) : (
          <div className="flex items-center gap-1">
            <select
              value={month}
              onChange={(e) => handleMonthSelect(Number(e.target.value))}
              className="cursor-pointer appearance-none bg-transparent font-bold text-brand-navy outline-none text-base hover:text-brand-cyan"
            >
              {INDONESIAN_MONTHS.map((mName, idx) => (
                <option key={mName} value={idx}>
                  {mName}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="cursor-pointer appearance-none bg-transparent font-bold text-brand-navy outline-none text-base hover:text-brand-cyan"
            >
              {Array.from({ length: 10 }, (_, i) => 2020 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={handleNext}
          className="p-1 text-brand-navy hover:opacity-70"
          aria-label="Bulan Berikutnya"
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
        {calendarGrid.map((d, i) => {
          if (d.isOtherMonth) {
            return <div key={`empty-${i}`} className="py-1" />;
          }

          const isSelected = isSameDay(d.date, activeSelectedDate);

          return (
            <button
              key={`${d.date.toISOString()}-${i}`}
              type="button"
              disabled={d.isDisabled}
              onClick={() => handleDateClick(d)}
              className={`flex flex-col items-center gap-0.5 py-1 rounded-xl transition-all ${
                d.isDisabled
                  ? "cursor-not-allowed opacity-30"
                  : "cursor-pointer hover:bg-brand-cyan/10"
              } ${
                isSelected && !d.isDisabled
                  ? "bg-brand-cyan/20 ring-2 ring-brand-cyan font-bold"
                  : ""
              }`}
            >
              <span
                className={
                  d.isDisabled
                    ? "text-gray-400 font-medium"
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
            </button>
          );
        })}
      </div>

      {showLegend && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t border-brand-line/50 pt-3 text-[11px] font-medium text-brand-text-muted">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Setoran</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Izin/Sakit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span>Tidak Setor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gray-300" />
            <span>Belum Setor</span>
          </div>
        </div>
      )}
    </div>
  );
}
