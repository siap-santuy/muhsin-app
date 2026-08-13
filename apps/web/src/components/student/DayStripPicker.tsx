import { useRef, useLayoutEffect, useCallback, useState } from "react";
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

// ponytail: fixed item width keeps offset math simple; upgrade to measured widths if items vary
const ITEM_W = 48;
const GAP = 8;
const ITEM_H = 56; // fixed height — prevents layout shift on selection change
const SWIPE_THRESHOLD = 30; // px drag before snapping to next/prev

export function DayStripPicker({
  days,
  selectedIndex,
  onSelectDay,
  onPrev,
  onNext,
}: DayStripPickerProps) {
  const selectedDay = days[selectedIndex];
  const trackRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);

  // Touch/drag state
  const dragRef = useRef({ startX: 0, dragging: false });

  // Measure container once + on resize
  useLayoutEffect(() => {
    const el = trackRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerW(entry.contentRect.width));
    ro.observe(el);
    setContainerW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Offset so selectedIndex is centered
  const totalItemW = ITEM_W + GAP;
  const centerOffset = containerW / 2 - ITEM_W / 2;
  const translateX = centerOffset - selectedIndex * totalItemW;

  const clampIdx = useCallback(
    (i: number) => Math.max(0, Math.min(days.length - 1, i)),
    [days.length],
  );

  const handlePrev = useCallback(() => {
    if (onPrev) return onPrev();
    onSelectDay(clampIdx(selectedIndex - 1));
  }, [onPrev, selectedIndex, onSelectDay, clampIdx]);

  const handleNext = useCallback(() => {
    if (onNext) return onNext();
    onSelectDay(clampIdx(selectedIndex + 1));
  }, [onNext, selectedIndex, onSelectDay, clampIdx]);

  // --- Touch handlers ---
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragRef.current = { startX: e.touches[0].clientX, dragging: true };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!dragRef.current.dragging) return;
      const dx = e.changedTouches[0].clientX - dragRef.current.startX;
      dragRef.current.dragging = false;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      // swipe left → next, swipe right → prev
      if (dx < 0) handleNext();
      else handlePrev();
    },
    [handleNext, handlePrev],
  );

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full items-center justify-between px-2">
        <button
          type="button"
          onClick={handlePrev}
          className="shrink-0 p-1 text-brand-navy hover:opacity-70"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Carousel viewport */}
        <div
          className="relative flex-1 overflow-hidden"
          style={{ height: `${ITEM_H}px` }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            ref={trackRef}
            className="flex h-full items-center transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(${translateX}px)`,
              gap: `${GAP}px`,
            }}
          >
            {days.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={`${item.dayName}-${item.dayNum}`}
                  type="button"
                  onClick={() => onSelectDay(idx)}
                  className={`flex shrink-0 flex-col items-center justify-center rounded-xl border-2 transition-colors ${
                    isSelected
                      ? "border-brand-cyan bg-white shadow-sm"
                      : "border-transparent"
                  }`}
                  style={{ width: `${ITEM_W}px`, height: `${ITEM_H}px` }}
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
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="shrink-0 p-1 text-brand-navy hover:opacity-70"
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
