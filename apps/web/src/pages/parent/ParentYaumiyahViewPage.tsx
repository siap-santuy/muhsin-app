import { useState, useEffect } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Info,
  Loader2,
  Moon,
  Sun,
  XCircle,
} from "lucide-react";
import {
  DayStripPicker,
  type DayItem,
} from "@/components/student/DayStripPicker";
import { SholatInfoModal } from "@/components/yaumiyah/SholatInfoModal";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { SURAH_LIST } from "@muhsin/shared";

const CODE_LABELS: Record<string, { desc: string; status: "success" | "warning" | "danger" | "off" }> = {
  BA: { desc: "Berjamaah di awal waktu", status: "success" },
  MA: { desc: "Munfarid di awal waktu", status: "success" },
  BT: { desc: "Berjamaah tidak di awal waktu", status: "warning" },
  MT: { desc: "Munfarid tidak di awal waktu", status: "warning" },
  H: { desc: "Haid", status: "danger" },
  T: { desc: "Tidak sholat", status: "off" },
};

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getCenteredDays(centerDateStr: string): DayItem[] {
  const target = parseLocalDate(centerDateStr);
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const days: DayItem[] = [];

  for (let offset = -2; offset <= 2; offset++) {
    const d = new Date(target);
    d.setDate(d.getDate() + offset);
    days.push({
      dayName: dayNames[d.getDay()],
      dayNum: d.getDate(),
      fullDate: formatLocalDate(d),
      status: "empty",
    });
  }
  return days;
}

interface ParentYaumiyahViewPageProps {
  onBack?: () => void;
  initialDate?: string;
}

export function ParentYaumiyahViewPage({ onBack, initialDate: propInitialDate }: ParentYaumiyahViewPageProps) {
  const [selectedDate, setSelectedDate] = useState(() => propInitialDate || formatLocalDate(new Date()));
  const [days, setDays] = useState<DayItem[]>(() => getCenteredDays(propInitialDate || formatLocalDate(new Date())));
  const selectedDayIdx = 2; // Always index 2 (center item)

  const [ibadah, setIbadah] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSholatInfo, setShowSholatInfo] = useState(false);

  // Sync if propInitialDate changes from route
  useEffect(() => {
    if (propInitialDate && propInitialDate !== selectedDate) {
      setSelectedDate(propInitialDate);
    }
  }, [propInitialDate]);

  // Recalculate centered days whenever selectedDate changes
  useEffect(() => {
    setDays((prevDays) => {
      const newCentered = getCenteredDays(selectedDate);
      const statusMap = new Map(prevDays.map((d) => [d.fullDate, d.status]));
      return newCentered.map((d) => ({
        ...d,
        status: statusMap.get(d.fullDate) ?? "empty",
      }));
    });
  }, [selectedDate]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const storedChildId = typeof window !== "undefined" ? localStorage.getItem("parent_active_child_id") || undefined : undefined;
        const months = Array.from(new Set(days.map((d) => d.fullDate.slice(0, 7))));
        const [dashData, ...historyResults] = await Promise.all([
          api.getDashboardSummary(),
          ...months.map((m) => api.getDailyIbadahHistory({ studentId: storedChildId, month: m })),
        ]);
        setSummary(dashData);
        if (dashData?.childId && typeof window !== "undefined") {
          localStorage.setItem("parent_active_child_id", dashData.childId);
        }
        const historyMap = new Map<string, "submitted" | "draft">();
        historyResults.flat().forEach((h: any) => {
          if (h?.date) {
            historyMap.set(h.date, h.status === "submitted" ? "submitted" : "draft");
          }
        });
        setDays((prevDays) =>
          prevDays.map((d) => ({
            ...d,
            status: historyMap.get(d.fullDate) ?? "empty",
          }))
        );
      } catch {
        // Keep existing
      }
    }
    loadHistory();
  }, [selectedDate]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const storedChildId = typeof window !== "undefined" ? localStorage.getItem("parent_active_child_id") || undefined : undefined;
        const data = await api.getDailyIbadah(selectedDate, storedChildId);
        setIbadah(data);
      } catch {
        setIbadah(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedDate]);

  function handleSelectDay(idx: number) {
    const clickedDate = days[idx]?.fullDate;
    if (clickedDate && clickedDate !== selectedDate) {
      setSelectedDate(clickedDate);
      window.location.hash = `#/yaumiyah-view?date=${clickedDate}`;
    }
  }

  function handlePrev() {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() - 1);
    const newDate = formatLocalDate(d);
    setSelectedDate(newDate);
    window.location.hash = `#/yaumiyah-view?date=${newDate}`;
  }

  function handleNext() {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() + 1);
    const newDate = formatLocalDate(d);
    setSelectedDate(newDate);
    window.location.hash = `#/yaumiyah-view?date=${newDate}`;
  }

  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      window.location.hash = "#/yaumiyah";
    }
  }

  const childName = summary?.childName ?? "Ananda";
  const fardhu = ibadah?.sholatFardhu ?? {};
  const rawatibList: string[] = ibadah?.sholatRawatib ?? [];
  const tilawah = ibadah?.tilawah;

  const sholatRows = [
    { name: "Subuh", code: fardhu.subuh },
    { name: "Dzuhur", code: fardhu.dzuhur },
    { name: "Ashar", code: fardhu.ashar },
    { name: "Maghrib", code: fardhu.maghrib },
    { name: "Isya", code: fardhu.isya },
  ];

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between bg-brand-page px-4 py-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Kembali"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-cyan/10"
        >
          <ArrowLeft className="h-4 w-4 text-brand-cyan" />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold text-brand-cyan">Jurnal Ibadah</h1>
          <p className="text-[11px] font-semibold text-brand-navy">Ananda: {childName}</p>
        </div>
        <div className="h-10 w-10" />
      </div>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-4 pt-1 pb-6">
        <div className="flex flex-col gap-4">
          <DayStripPicker
            days={days}
            selectedIndex={selectedDayIdx}
            onSelectDay={handleSelectDay}
            onPrev={handlePrev}
            onNext={handleNext}
          />

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
            </div>
          ) : !ibadah ? (
            <div className="rounded-2xl border border-brand-line bg-white p-8 text-center text-xs text-brand-text-muted">
              Belum ada catatan ibadah untuk tanggal {selectedDate}.
            </div>
          ) : (
            <>
              {/* Tilawah Qur'an Card */}
              <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <h2 className="text-base font-bold text-brand-navy">
                    Tilawah Qur&apos;an
                  </h2>
                </div>
                <div className="mt-3 rounded-xl border border-brand-line/60 bg-gray-50 px-3 py-2.5">
                  <p className="text-xs font-bold tracking-wider text-brand-cyan uppercase">
                    {tilawah && tilawah.surahStart
                      ? (() => {
                          const sStart = SURAH_LIST.find((s) => s.no === tilawah.surahStart);
                          const sEnd = SURAH_LIST.find((s) => s.no === tilawah.surahEnd);
                          const startName = sStart?.nameLatin || `Surah ${tilawah.surahStart}`;
                          if (tilawah.surahStart === tilawah.surahEnd || !tilawah.surahEnd) {
                            return `${startName}: ${tilawah.ayatStart}-${tilawah.ayatEnd}`;
                          }
                          const endName = sEnd?.nameLatin || `Surah ${tilawah.surahEnd}`;
                          return `${startName}:${tilawah.ayatStart} — ${endName}:${tilawah.ayatEnd}`;
                        })()
                      : "Tidak ada tilawah hari ini"}
                  </p>
                </div>
              </section>

              {/* Sholat Fardhu Card */}
              <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                      <CalendarDays className="h-4 w-4" />
                    </span>
                    <h2 className="text-base font-bold text-brand-navy">
                      Sholat Fardhu
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSholatInfo(true)}
                    aria-label="Informasi Kode Sholat"
                    className="flex items-center gap-1 rounded-lg p-1 text-brand-text-muted hover:bg-gray-100 hover:text-brand-cyan transition-colors"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 divide-y divide-brand-line/40">
                  {sholatRows.map((row) => {
                    const info = CODE_LABELS[row.code] ?? {
                      desc: "Belum diisi",
                      status: "off" as const,
                    };
                    return (
                      <div
                        key={row.name}
                        className="flex items-center justify-between py-2.5"
                      >
                        <span className="text-xs font-bold text-brand-navy">
                          {row.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-medium ${
                              info.status === "success"
                                ? "text-brand-cyan"
                                : info.status === "warning"
                                ? "text-amber-500"
                                : info.status === "danger"
                                ? "text-red-500"
                                : "text-gray-400"
                            }`}
                          >
                            {info.desc}
                          </span>
                          {info.status === "success" ? (
                            <CheckCircle2 className="h-4 w-4 text-brand-cyan" />
                          ) : info.status === "warning" ? (
                            <CheckCircle2 className="h-4 w-4 text-amber-500" />
                          ) : info.status === "danger" ? (
                            <CheckCircle2 className="h-4 w-4 text-red-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Sunnah Rawatib Card */}
              <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                    <Sun className="h-4 w-4" />
                  </span>
                  <h2 className="text-base font-bold text-brand-navy">
                    Sunnah Rawatib
                  </h2>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {rawatibList.length === 0 ? (
                    <p className="col-span-2 text-xs text-brand-text-muted">
                      Tidak ada sholat rawatib tercatat.
                    </p>
                  ) : (
                    rawatibList.map((item) => (
                      <div
                        key={item}
                        className="rounded-xl border border-brand-cyan/40 bg-brand-cyan/5 px-2.5 py-2 text-center text-xs font-semibold text-brand-cyan"
                      >
                        {item}
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Sunnah Lainnya Card */}
              <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Moon className="h-4 w-4" />
                  </span>
                  <h2 className="text-base font-bold text-brand-navy">
                    Sunnah Lainnya
                  </h2>
                </div>
                <div className="mt-3 flex items-center justify-between px-2">
                  {[
                    { name: "Tahajud", done: !!ibadah?.tahajud },
                    { name: "Dhuha", done: !!ibadah?.dhuha },
                    { name: "Puasa", done: !!ibadah?.puasaSunnah },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2"
                    >
                      <span className="text-xs font-bold text-brand-navy">
                        {item.name}
                      </span>
                      {item.done ? (
                        <CheckCircle2 className="h-4 w-4 text-brand-cyan" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* Sticky Bottom Actions */}
      <div className="shrink-0 flex gap-3 border-t border-brand-line bg-white px-4 py-3 shadow-sm">
        <Button
          type="button"
          onClick={handleBack}
          className="h-11 w-full rounded-xl bg-brand-cyan font-bold text-white shadow-sm hover:bg-brand-cyan-dark"
        >
          KEMBALI
        </Button>
      </div>

      <SholatInfoModal
        isOpen={showSholatInfo}
        onClose={() => setShowSholatInfo(false)}
      />
    </div>
  );
}
