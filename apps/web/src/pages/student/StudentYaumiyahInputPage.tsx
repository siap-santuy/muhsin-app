import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, BookOpen, CalendarDays, Info, Loader2, Sun, Moon } from "lucide-react";
import {
  DayStripPicker,
  type DayItem,
} from "@/components/student/DayStripPicker";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { SURAH_LIST } from "@muhsin/shared";

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

const SHOLAT_OPTIONS = ["BA", "MA", "BT", "MT", "H", "T"];
const SHOLAT_LIST = ["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"];

const RAWATIB_LIST = [
  "Qabliyah Subuh",
  "Qabliyah Dzuhur",
  "Ba'diyah Dzuhur",
  "Qabliyah Ashar",
  "Ba'diyah Maghrib",
  "Ba'diyah Isya",
];

const IBADAH_LAINNYA_LIST = [
  "Tahajud",
  "Dhuha",
  "Puasa",
];

interface StudentYaumiyahInputPageProps {
  onBack?: () => void;
  initialDate?: string;
}

export function StudentYaumiyahInputPage({ onBack, initialDate: propInitialDate }: StudentYaumiyahInputPageProps) {
  const todayStr = formatLocalDate(new Date());
  const [selectedDate, setSelectedDate] = useState(() => propInitialDate || todayStr);
  const [days, setDays] = useState<DayItem[]>(() => getCenteredDays(propInitialDate || todayStr));
  const selectedDayIdx = 2; // Always index 2 (center item)

  const [surahStart, setSurahStart] = useState("");
  const [ayatStart, setAyatStart] = useState("");
  const [surahEnd, setSurahEnd] = useState("");
  const [ayatEnd, setAyatEnd] = useState("");
  const [notTilawah, setNotTilawah] = useState(false);
  const [sholatState, setSholatState] = useState<Record<string, string>>({
    Subuh: "",
    Dzuhur: "",
    Ashar: "",
    Maghrib: "",
    Isya: "",
  });
  const [rawatibState, setRawatibState] = useState<Record<string, boolean>>({});
  const [ibadahState, setIbadahState] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "warning" } | null>(null);

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

  // Load history to populate dots in DayStripPicker
  useEffect(() => {
    async function loadHistory() {
      try {
        const months = Array.from(new Set(days.map((d) => d.fullDate.slice(0, 7))));
        const results = await Promise.all(
          months.map((m) => api.getDailyIbadahHistory({ month: m }))
        );
        const historyMap = new Map<string, "submitted" | "draft">();
        results.flat().forEach((h: any) => {
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
    // Reset or load existing data if available for this date
    async function loadDateData() {
      try {
        const existing = await api.getDailyIbadah(selectedDate);
        if (existing) {
          if (existing.sholatFardhu) {
            setSholatState({
              Subuh: existing.sholatFardhu.subuh || "",
              Dzuhur: existing.sholatFardhu.dzuhur || "",
              Ashar: existing.sholatFardhu.ashar || "",
              Maghrib: existing.sholatFardhu.maghrib || "",
              Isya: existing.sholatFardhu.isya || "",
            });
          } else {
            setSholatState({ Subuh: "", Dzuhur: "", Ashar: "", Maghrib: "", Isya: "" });
          }
          if (Array.isArray(existing.sholatRawatib)) {
            const rawMap: Record<string, boolean> = {};
            existing.sholatRawatib.forEach((r: string) => {
              rawMap[r] = true;
            });
            setRawatibState(rawMap);
          } else {
            setRawatibState({});
          }
          setIbadahState({
            Tahajud: !!existing.tahajud,
            Dhuha: !!existing.dhuha,
            Puasa: !!existing.puasaSunnah,
          });
          if (existing.tilawah) {
            setSurahStart(existing.tilawah.surahStart ? String(existing.tilawah.surahStart) : "");
            setAyatStart(existing.tilawah.ayatStart ? String(existing.tilawah.ayatStart) : "");
            setSurahEnd(existing.tilawah.surahEnd ? String(existing.tilawah.surahEnd) : "");
            setAyatEnd(existing.tilawah.ayatEnd ? String(existing.tilawah.ayatEnd) : "");
            setNotTilawah(false);
          } else {
            setSurahStart("");
            setAyatStart("");
            setSurahEnd("");
            setAyatEnd("");
            setNotTilawah(existing.tilawah === null);
          }
        } else {
          // Clean/empty form
          setSholatState({ Subuh: "", Dzuhur: "", Ashar: "", Maghrib: "", Isya: "" });
          setRawatibState({});
          setIbadahState({});
          setSurahStart("");
          setAyatStart("");
          setSurahEnd("");
          setAyatEnd("");
          setNotTilawah(false);
        }
      } catch {
        // Clean/empty form on error
        setSholatState({ Subuh: "", Dzuhur: "", Ashar: "", Maghrib: "", Isya: "" });
        setRawatibState({});
        setIbadahState({});
        setSurahStart("");
        setAyatStart("");
        setSurahEnd("");
        setAyatEnd("");
        setNotTilawah(false);
      }
    }
    loadDateData();
  }, [selectedDate]);

  function handleSelectDay(idx: number) {
    const clickedDate = days[idx]?.fullDate;
    if (clickedDate && clickedDate !== selectedDate && clickedDate <= todayStr) {
      setSelectedDate(clickedDate);
      window.location.hash = `#/yaumiyah-input?date=${clickedDate}`;
    }
  }

  function handlePrev() {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() - 1);
    const newDate = formatLocalDate(d);
    setSelectedDate(newDate);
    window.location.hash = `#/yaumiyah-input?date=${newDate}`;
  }

  function handleNext() {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() + 1);
    const newDate = formatLocalDate(d);
    if (newDate > todayStr) return;
    setSelectedDate(newDate);
    window.location.hash = `#/yaumiyah-input?date=${newDate}`;
  }

  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      window.location.hash = "#/yaumiyah";
    }
  }

  const handleCloseToast = useCallback(() => setToast(null), []);

  function getRawatibArray(): string[] {
    return Object.keys(rawatibState).filter((k) => rawatibState[k]);
  }

  async function handleSaveDraft() {
    setLoading(true);
    try {
      const sholatFardhu: Record<string, string> = {};
      if (sholatState["Subuh"]) sholatFardhu.subuh = sholatState["Subuh"];
      if (sholatState["Dzuhur"]) sholatFardhu.dzuhur = sholatState["Dzuhur"];
      if (sholatState["Ashar"]) sholatFardhu.ashar = sholatState["Ashar"];
      if (sholatState["Maghrib"]) sholatFardhu.maghrib = sholatState["Maghrib"];
      if (sholatState["Isya"]) sholatFardhu.isya = sholatState["Isya"];

      const hasTilawah = !notTilawah && surahStart && ayatStart;

      await api.saveDailyIbadahDraft({
        date: selectedDate,
        sholatFardhu: Object.keys(sholatFardhu).length > 0 ? (sholatFardhu as any) : null,
        sholatRawatib: getRawatibArray(),
        tahajud: !!ibadahState["Tahajud"],
        dhuha: !!ibadahState["Dhuha"],
        puasaSunnah: ibadahState["Puasa"] ? "senin" : null,
        tilawah: hasTilawah
          ? {
              surahStart: Number(surahStart),
              ayatStart: Number(ayatStart),
              surahEnd: Number(surahEnd || surahStart),
              ayatEnd: Number(ayatEnd || ayatStart),
            }
          : null,
      });
      setToast({ message: "Draft ibadah berhasil disimpan", variant: "warning" });
    } catch (err: any) {
      setToast({ message: err.message || "Gagal menyimpan draft", variant: "warning" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const sholatFardhu: Record<string, string> = {};
      if (sholatState["Subuh"]) sholatFardhu.subuh = sholatState["Subuh"];
      if (sholatState["Dzuhur"]) sholatFardhu.dzuhur = sholatState["Dzuhur"];
      if (sholatState["Ashar"]) sholatFardhu.ashar = sholatState["Ashar"];
      if (sholatState["Maghrib"]) sholatFardhu.maghrib = sholatState["Maghrib"];
      if (sholatState["Isya"]) sholatFardhu.isya = sholatState["Isya"];

      const hasTilawah = !notTilawah && surahStart && ayatStart;

      await api.submitDailyIbadah({
        date: selectedDate,
        sholatFardhu: Object.keys(sholatFardhu).length > 0 ? (sholatFardhu as any) : null,
        sholatRawatib: getRawatibArray(),
        tahajud: !!ibadahState["Tahajud"],
        dhuha: !!ibadahState["Dhuha"],
        puasaSunnah: ibadahState["Puasa"] ? "senin" : null,
        tilawah: hasTilawah
          ? {
              surahStart: Number(surahStart),
              ayatStart: Number(ayatStart),
              surahEnd: Number(surahEnd || surahStart),
              ayatEnd: Number(ayatEnd || ayatStart),
            }
          : null,
      });
      setToast({ message: "Ibadah yaumiyah berhasil dikirim!", variant: "success" });
      setTimeout(handleBack, 1200);
    } catch (err: any) {
      setToast({ message: err.message || "Gagal mengirim ibadah", variant: "warning" });
    } finally {
      setLoading(false);
    }
  }

  function handleSelectOption(sholat: string, opt: string) {
    setSholatState((prev) => ({
      ...prev,
      [sholat]: prev[sholat] === opt ? "" : opt,
    }));
  }

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
        <h1 className="text-xl font-bold text-brand-cyan">Jurnal Ibadah</h1>
        <div className="h-10 w-10" />
      </div>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-4 pt-1 pb-4">
        <div className="flex flex-col gap-4">
          <DayStripPicker
            days={days}
            selectedIndex={selectedDayIdx}
            onSelectDay={handleSelectDay}
            onPrev={handlePrev}
            onNext={handleNext}
            maxDate={todayStr}
          />

          {/* Tilawah Section */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
                <BookOpen className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold text-brand-navy">Tilawah Qur&apos;an</h2>
            </div>

            {!notTilawah ? (
              <div className="mt-3 flex flex-col gap-3">
                {/* Awal Surah & Ayat */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold tracking-wider text-brand-navy uppercase">
                      Awal Surah
                    </label>
                    <div className="relative mt-1">
                      <select
                        value={surahStart}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSurahStart(val);
                          if (!surahEnd) setSurahEnd(val);
                        }}
                        className={`w-full appearance-none rounded-xl border border-brand-line bg-gray-50/50 py-2.5 pl-3 pr-8 text-xs font-semibold outline-none focus:border-brand-cyan ${
                          surahStart ? "text-brand-navy" : "text-gray-400"
                        }`}
                      >
                        <option value="" disabled hidden>
                          Pilih Surah
                        </option>
                        <option value="">-- Pilih Surah --</option>
                        {SURAH_LIST.map((s) => (
                          <option key={s.no} value={String(s.no)} className="text-brand-navy">
                            {s.no}. {s.nameLatin}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="w-20 shrink-0">
                    <label className="text-[10px] font-bold tracking-wider text-brand-navy uppercase">
                      Ayat
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ayat"
                      max={SURAH_LIST.find((s) => s.no === Number(surahStart))?.totalAyat ?? 999}
                      value={ayatStart}
                      onChange={(e) => setAyatStart(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-brand-line bg-gray-50/50 py-2.5 px-3 text-center text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Akhir Surah & Ayat */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold tracking-wider text-brand-navy uppercase">
                      Akhir Surah
                    </label>
                    <div className="relative mt-1">
                      <select
                        value={surahEnd}
                        onChange={(e) => setSurahEnd(e.target.value)}
                        className={`w-full appearance-none rounded-xl border border-brand-line bg-gray-50/50 py-2.5 pl-3 pr-8 text-xs font-semibold outline-none focus:border-brand-cyan ${
                          surahEnd ? "text-brand-navy" : "text-gray-400"
                        }`}
                      >
                        <option value="" disabled hidden>
                          Pilih Surah
                        </option>
                        <option value="">-- Pilih Surah --</option>
                        {SURAH_LIST.map((s) => (
                          <option key={s.no} value={String(s.no)} className="text-brand-navy">
                            {s.no}. {s.nameLatin}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="w-20 shrink-0">
                    <label className="text-[10px] font-bold tracking-wider text-brand-navy uppercase">
                      Ayat
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ayat"
                      max={SURAH_LIST.find((s) => s.no === Number(surahEnd))?.totalAyat ?? 999}
                      value={ayatEnd}
                      onChange={(e) => setAyatEnd(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-brand-line bg-gray-50/50 py-2.5 px-3 text-center text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {/* Switch: Tidak tilawah hari ini */}
            <div className="mt-4 flex items-center justify-between border-t border-dashed border-brand-line/60 pt-3">
              <span className="text-xs font-bold text-brand-navy">
                Tidak tilawah hari ini
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={notTilawah}
                onClick={() => setNotTilawah(!notTilawah)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notTilawah ? "bg-brand-cyan" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    notTilawah ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Sholat Fardhu Section */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-brand-line/40 pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <h2 className="text-base font-bold text-brand-navy">Sholat Fardhu</h2>
              </div>
              <Info className="h-4 w-4 text-brand-text-muted" />
            </div>

            <div className="mt-2 divide-y divide-brand-line/30">
              {SHOLAT_LIST.map((sholat) => (
                <div key={sholat} className="flex items-center justify-between py-2">
                  <span className="text-xs font-bold text-brand-navy">{sholat}</span>
                  <div className="flex items-center gap-1">
                    {SHOLAT_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectOption(sholat, opt)}
                        className={`h-7 w-7 rounded-md text-[11px] font-bold transition-all border ${
                          sholatState[sholat] === opt
                            ? "bg-brand-cyan text-white border-brand-cyan shadow-sm"
                            : "bg-white text-brand-navy border-brand-line/80 hover:bg-gray-50"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Rawatib Section */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-brand-line/40 pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                <Sun className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold text-brand-navy">Sunnah Rawatib</h2>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {RAWATIB_LIST.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setRawatibState((prev) => ({
                      ...prev,
                      [item]: !prev[item],
                    }))
                  }
                  className={`rounded-xl border p-2 text-center text-xs font-semibold transition-all ${
                    rawatibState[item]
                      ? "border-brand-cyan bg-brand-cyan text-white font-bold shadow-sm"
                      : "border-brand-line bg-white text-brand-navy hover:border-brand-cyan/40"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          {/* Sunnah Lainnya Section */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-brand-line/40 pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                <Moon className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold text-brand-navy">Sunnah Lainnya</h2>
            </div>
            <div className="mt-3 flex items-center justify-between px-2">
              {IBADAH_LAINNYA_LIST.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setIbadahState((prev) => ({
                      ...prev,
                      [item]: !prev[item],
                    }))
                  }
                  className="flex items-center gap-2 text-xs font-bold text-brand-navy"
                >
                  <span>{item}</span>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                      ibadahState[item]
                        ? "border-brand-cyan bg-brand-cyan text-white shadow-sm"
                        : "border-brand-line bg-white"
                    }`}
                  >
                    {ibadahState[item] && (
                      <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Sticky Bottom Actions */}
      <div className="shrink-0 flex gap-3 border-t border-brand-line bg-white px-4 py-3 shadow-sm">
        <Button
          type="button"
          variant="outline"
          onClick={handleSaveDraft}
          disabled={loading}
          className="h-11 flex-1 rounded-xl border-brand-amber font-bold text-brand-amber hover:bg-brand-amber/10"
        >
          SIMPAN
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="h-11 flex-1 rounded-xl bg-brand-cyan font-bold text-white shadow-sm hover:bg-brand-cyan-dark disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "KIRIM"}
        </Button>
      </div>

      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={handleCloseToast}
        />
      ) : null}
    </div>
  );
}
