import { useState } from "react";
import { ArrowLeft, BookOpen, CalendarDays, Info, Sun, Moon } from "lucide-react";
import {
  DayStripPicker,
  type DayItem,
} from "@/components/student/DayStripPicker";
import { Button } from "@/components/ui/button";

const DAYS_MOCK: DayItem[] = [
  { dayName: "Sen", dayNum: 9, fullDate: "Senin, 9 Oktober 2023", status: "empty" },
  { dayName: "Sel", dayNum: 10, fullDate: "Selasa, 10 Oktober 2023", status: "setoran" },
  { dayName: "Rab", dayNum: 11, fullDate: "Rabu, 11 Oktober 2023", status: "sakit" },
  { dayName: "Kam", dayNum: 12, fullDate: "Kamis, 12 Oktober 2023", status: "empty" },
  { dayName: "Jum", dayNum: 13, fullDate: "Jumat, 13 Oktober 2023", status: "empty" },
];

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
  const [selectedDayIdx, setSelectedDayIdx] = useState(2);
  const [notTilawah, setNotTilawah] = useState(false);
  const [sholatState, setSholatState] = useState<Record<string, string>>({
    Subuh: "BA",
    Dzuhur: "BA",
    Ashar: "BA",
    Maghrib: "BA",
    Isya: "",
  });
  const [rawatibState, setRawatibState] = useState<Record<string, boolean>>({});
  const [ibadahState, setIbadahState] = useState<Record<string, boolean>>({});

  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      window.location.hash = "#/yaumiyah";
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
      <main className="flex-1 overflow-y-auto px-4 pt-1">
        <div className="flex flex-col gap-4">
          <DayStripPicker
            days={DAYS_MOCK}
            selectedIndex={selectedDayIdx}
            onSelectDay={setSelectedDayIdx}
          />

          {/* Card Tilawah Qur'an */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
                <BookOpen className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold text-brand-navy">
                Tilawah Qur&apos;an
              </h2>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-brand-navy uppercase">
                    AWAL SURAH
                  </label>
                  <select
                    disabled={notTilawah}
                    className="mt-1 w-full rounded-xl border border-brand-line bg-white px-3 py-2 text-xs font-semibold text-brand-navy outline-none disabled:opacity-50"
                  >
                    <option value="">Pilih Surah</option>
                    <option value="1">1. Al-Fatihah</option>
                    <option value="2">2. Al-Baqarah</option>
                  </select>
                </div>
                <div className="w-20">
                  <label className="text-[10px] font-bold text-brand-navy uppercase">
                    AYAT
                  </label>
                  <input
                    type="number"
                    defaultValue={1}
                    disabled={notTilawah}
                    className="mt-1 w-full rounded-xl border border-brand-line bg-white px-3 py-2 text-center text-xs font-semibold text-brand-navy outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-brand-navy uppercase">
                    AKHIR SURAH
                  </label>
                  <select
                    disabled={notTilawah}
                    className="mt-1 w-full rounded-xl border border-brand-line bg-white px-3 py-2 text-xs font-semibold text-brand-navy outline-none disabled:opacity-50"
                  >
                    <option value="">Pilih Surah</option>
                    <option value="1">1. Al-Fatihah</option>
                    <option value="2">2. Al-Baqarah</option>
                  </select>
                </div>
                <div className="w-20">
                  <label className="text-[10px] font-bold text-brand-navy uppercase">
                    AYAT
                  </label>
                  <input
                    type="number"
                    defaultValue={254}
                    disabled={notTilawah}
                    className="mt-1 w-full rounded-xl border border-brand-line bg-white px-3 py-2 text-center text-xs font-semibold text-brand-navy outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="my-2 border-t border-dashed border-brand-line/60" />

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-navy">
                  Tidak tilawah hari ini
                </span>
                <input
                  type="checkbox"
                  checked={notTilawah}
                  onChange={(e) => setNotTilawah(e.target.checked)}
                  className="h-5 w-5 check-cyan"
                />
              </div>
            </div>
          </section>

          {/* Card Sholat Fardhu */}
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
              <Info className="h-4 w-4 text-brand-text-muted" />
            </div>

            <div className="mt-4 divide-y divide-brand-line/40">
              {SHOLAT_LIST.map((sholat) => (
                <div
                  key={sholat}
                  className="flex items-center justify-between py-2.5"
                >
                  <span className="text-xs font-bold text-brand-navy">
                    {sholat}
                  </span>
                  <div className="flex gap-1.5">
                    {SHOLAT_OPTIONS.map((opt) => {
                      const active = sholatState[sholat] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSelectOption(sholat, opt)}
                          className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold transition-all ${
                            active
                              ? "bg-brand-cyan text-white shadow-sm"
                              : "bg-gray-100 text-brand-navy hover:bg-gray-200"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Card Sholat Sunnah Rawatib */}
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
              {RAWATIB_LIST.map((item) => {
                const active = !!rawatibState[item];
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setRawatibState((prev) => ({ ...prev, [item]: !prev[item] }))
                    }
                    className={`rounded-xl border px-2.5 py-2 text-center text-xs font-semibold transition-colors ${
                      active
                        ? "border-brand-cyan bg-brand-cyan text-white shadow-sm"
                        : "bg-gray-100 text-brand-navy"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Card Ibadah Lainnya */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                <Moon className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold text-brand-navy">
                Sunnah Lainnya
              </h2>
            </div>
            <div className="mt-3 flex items-center justify-between">
              {IBADAH_LAINNYA_LIST.map((item) => {
                const active = !!ibadahState[item];
                return (
                  <label
                    key={item}
                    className="flex items-center gap-2 py-2 px-4"
                  >
                    <span className="text-xs font-bold text-brand-navy">
                      {item}
                    </span>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() =>
                        setIbadahState((prev) => ({ ...prev, [item]: !prev[item] }))
                      }
                   className="h-5 w-5 check-cyan"
                    />
                  </label>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* Sticky Bottom Actions */}
      <div className="shrink-0 flex gap-3 border-t border-brand-line bg-white px-4 py-3 shadow-sm">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          className="h-10 flex-1 rounded-xl border-brand-amber text-xs font-bold text-brand-amber hover:bg-brand-amber/10"
        >
          SIMPAN
        </Button>
        <Button
          type="button"
          onClick={handleBack}
          className="h-10 flex-1 rounded-xl bg-brand-cyan text-xs font-bold text-white shadow-sm hover:bg-brand-cyan-dark"
        >
          KIRIM
        </Button>
      </div>
    </div>
  );
}
