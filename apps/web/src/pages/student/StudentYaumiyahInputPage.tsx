import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, BookOpen, CalendarDays, Info, Loader2, Sun, Moon } from "lucide-react";
import {
  DayStripPicker,
  type DayItem,
} from "@/components/student/DayStripPicker";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import type { SholatFardhu } from "@muhsin/shared";

function generateDays(): DayItem[] {
  const days: DayItem[] = [];
  const today = new Date();
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  for (let i = 4; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayName = dayNames[d.getDay()];
    const dayNum = d.getDate();
    const fullDate = d.toISOString().slice(0, 10);
    days.push({
      dayName,
      dayNum,
      fullDate,
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
}

export function StudentYaumiyahInputPage({ onBack }: StudentYaumiyahInputPageProps) {
  const days = generateDays();
  const [selectedDayIdx, setSelectedDayIdx] = useState(4); // Today
  const [surahStart, setSurahStart] = useState("1");
  const [ayatStart, setAyatStart] = useState("1");
  const [surahEnd, setSurahEnd] = useState("1");
  const [ayatEnd, setAyatEnd] = useState("7");
  const [notTilawah, setNotTilawah] = useState(false);
  const [sholatState, setSholatState] = useState<Record<string, string>>({
    Subuh: "BA",
    Dzuhur: "BA",
    Ashar: "BA",
    Maghrib: "BA",
    Isya: "BA",
  });
  const [rawatibState, setRawatibState] = useState<Record<string, boolean>>({});
  const [ibadahState, setIbadahState] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "warning" } | null>(null);

  const selectedDate = days[selectedDayIdx]?.fullDate ?? new Date().toISOString().slice(0, 10);

  useEffect(() => {
    // Load existing data if available for this date
    async function loadDateData() {
      try {
        const existing = await api.getDailyIbadah(selectedDate);
        if (existing) {
          if (existing.sholatFardhu) {
            setSholatState({
              Subuh: existing.sholatFardhu.subuh || "BA",
              Dzuhur: existing.sholatFardhu.dzuhur || "BA",
              Ashar: existing.sholatFardhu.ashar || "BA",
              Maghrib: existing.sholatFardhu.maghrib || "BA",
              Isya: existing.sholatFardhu.isya || "BA",
            });
          }
          if (Array.isArray(existing.sholatRawatib)) {
            const rawMap: Record<string, boolean> = {};
            existing.sholatRawatib.forEach((r: string) => {
              rawMap[r] = true;
            });
            setRawatibState(rawMap);
          }
          setIbadahState({
            Tahajud: !!existing.tahajud,
            Dhuha: !!existing.dhuha,
            Puasa: !!existing.puasaSunnah,
          });
          if (existing.tilawah) {
            setSurahStart(String(existing.tilawah.surahStart || 1));
            setAyatStart(String(existing.tilawah.ayatStart || 1));
            setSurahEnd(String(existing.tilawah.surahEnd || 1));
            setAyatEnd(String(existing.tilawah.ayatEnd || 7));
            setNotTilawah(false);
          }
        }
      } catch {
        // No data yet, clean form
      }
    }
    loadDateData();
  }, [selectedDate]);

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
      const sholatFardhu: Partial<SholatFardhu> = {
        subuh: (sholatState["Subuh"] || "BA") as any,
        dzuhur: (sholatState["Dzuhur"] || "BA") as any,
        ashar: (sholatState["Ashar"] || "BA") as any,
        maghrib: (sholatState["Maghrib"] || "BA") as any,
        isya: (sholatState["Isya"] || "BA") as any,
      };

      await api.saveDailyIbadahDraft({
        date: selectedDate,
        sholatFardhu: sholatFardhu as SholatFardhu,
        sholatRawatib: getRawatibArray(),
        tahajud: !!ibadahState["Tahajud"],
        dhuha: !!ibadahState["Dhuha"],
        puasaSunnah: ibadahState["Puasa"] ? "senin" : null,
        tilawah: notTilawah
          ? null
          : {
              surahStart: Number(surahStart),
              ayatStart: Number(ayatStart),
              surahEnd: Number(surahEnd),
              ayatEnd: Number(ayatEnd),
            },
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
      const sholatFardhu: Partial<SholatFardhu> = {
        subuh: (sholatState["Subuh"] || "BA") as any,
        dzuhur: (sholatState["Dzuhur"] || "BA") as any,
        ashar: (sholatState["Ashar"] || "BA") as any,
        maghrib: (sholatState["Maghrib"] || "BA") as any,
        isya: (sholatState["Isya"] || "BA") as any,
      };

      await api.submitDailyIbadah({
        date: selectedDate,
        sholatFardhu: sholatFardhu as SholatFardhu,
        sholatRawatib: getRawatibArray(),
        tahajud: !!ibadahState["Tahajud"],
        dhuha: !!ibadahState["Dhuha"],
        puasaSunnah: ibadahState["Puasa"] ? "senin" : null,
        tilawah: notTilawah
          ? null
          : {
              surahStart: Number(surahStart),
              ayatStart: Number(ayatStart),
              surahEnd: Number(surahEnd),
              ayatEnd: Number(ayatEnd),
            },
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
            onSelectDay={setSelectedDayIdx}
          />

          {/* Tilawah Section */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
                <BookOpen className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold text-brand-navy">Tilawah Qur&apos;an</h2>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                id="notTilawah"
                checked={notTilawah}
                onChange={(e) => setNotTilawah(e.target.checked)}
                className="h-4 w-4 rounded text-brand-cyan focus:ring-brand-cyan"
              />
              <label htmlFor="notTilawah" className="text-xs font-semibold text-brand-navy">
                Tidak tilawah hari ini
              </label>
            </div>

            {!notTilawah ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-brand-navy">Surah Ke (1-114)</label>
                  <input
                    type="number"
                    min="1"
                    max="114"
                    value={surahStart}
                    onChange={(e) => {
                      setSurahStart(e.target.value);
                      setSurahEnd(e.target.value);
                    }}
                    className="mt-1 w-full rounded-xl border border-brand-line bg-gray-50 p-2 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-brand-navy">Ayat Mulai - Selesai</label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      min="1"
                      value={ayatStart}
                      onChange={(e) => setAyatStart(e.target.value)}
                      className="w-full rounded-xl border border-brand-line bg-gray-50 p-2 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      min="1"
                      value={ayatEnd}
                      onChange={(e) => setAyatEnd(e.target.value)}
                      className="w-full rounded-xl border border-brand-line bg-gray-50 p-2 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                    />
                  </div>
                </div>
              </div>
            ) : null}
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

            <div className="mt-3 divide-y divide-brand-line/40">
              {SHOLAT_LIST.map((sholat) => (
                <div key={sholat} className="py-2.5">
                  <span className="text-xs font-bold text-brand-navy">{sholat}</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {SHOLAT_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectOption(sholat, opt)}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                          sholatState[sholat] === opt
                            ? "bg-brand-cyan text-white shadow-sm"
                            : "bg-gray-100 text-brand-navy hover:bg-gray-200"
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
                      ? "border-brand-cyan bg-brand-cyan text-white font-bold"
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
            <div className="mt-3 grid grid-cols-3 gap-2">
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
                  className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition-all ${
                    ibadahState[item]
                      ? "border-indigo-600 bg-indigo-600 text-white font-bold"
                      : "border-brand-line bg-white text-brand-navy hover:border-indigo-300"
                  }`}
                >
                  {item}
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
          SIMPAN DRAFT
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="h-11 flex-1 rounded-xl bg-brand-cyan font-bold text-white shadow-sm hover:bg-brand-cyan-dark disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "KIRIM SEKARANG"}
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
