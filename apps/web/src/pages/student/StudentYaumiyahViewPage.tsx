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
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const CODE_LABELS: Record<string, { desc: string; status: "success" | "warning" | "danger" | "off" }> = {
  BA: { desc: "Berjamaah di awal waktu", status: "success" },
  MA: { desc: "Munfarid di awal waktu", status: "success" },
  BT: { desc: "Berjamaah tidak di awal waktu", status: "warning" },
  MT: { desc: "Munfarid tidak di awal waktu", status: "warning" },
  H: { desc: "Haid", status: "danger" },
  T: { desc: "Tidak sholat", status: "off" },
};

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

export function StudentYaumiyahViewPage() {
  const days = generateDays();
  const [selectedDayIdx, setSelectedDayIdx] = useState(4); // Default to today (index 4)
  const [ibadah, setIbadah] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const selectedDate = days[selectedDayIdx]?.fullDate ?? new Date().toISOString().slice(0, 10);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const storedDate = sessionStorage.getItem("viewIbadahDate");
        const targetDate = storedDate || selectedDate;
        if (storedDate) {
          sessionStorage.removeItem("viewIbadahDate");
        }

        const data = await api.getDailyIbadah(targetDate);
        setIbadah(data);
      } catch {
        setIbadah(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedDate]);

  function handleBack() {
    window.location.hash = "#/yaumiyah";
  }

  function handleEdit() {
    sessionStorage.setItem("inputIbadahDate", selectedDate);
    window.location.hash = "#/yaumiyah-input";
  }

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
        <h1 className="text-xl font-bold text-brand-cyan">Jurnal Ibadah</h1>
        <div className="h-10 w-10" />
      </div>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-4 pt-1">
        <div className="flex flex-col gap-4">
          <DayStripPicker
            days={days}
            selectedIndex={selectedDayIdx}
            onSelectDay={setSelectedDayIdx}
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
                      ? `Surah ${tilawah.surahStart}: ${tilawah.ayatStart}-${tilawah.ayatEnd}`
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
                  <Info className="h-4 w-4 text-brand-text-muted" />
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
                <div className="mt-3 divide-y divide-brand-line/40 flex justify-between">
                  {[
                    { name: "Tahajud", done: !!ibadah?.tahajud },
                    { name: "Dhuha", done: !!ibadah?.dhuha },
                    { name: "Puasa", done: !!ibadah?.puasaSunnah },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-2 px-4 py-2"
                    >
                      <span className="text-xs font-bold text-brand-navy">
                        {item.name}
                      </span>
                      {item.done ? (
                        <CheckCircle2 className="h-4 w-4 text-brand-cyan" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
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
          variant="outline"
          onClick={handleEdit}
          className="h-10 flex-1 rounded-xl border-brand-amber text-xs font-bold text-brand-amber hover:bg-brand-amber/10"
        >
          UBAH
        </Button>
        <Button
          type="button"
          onClick={handleBack}
          className="h-10 flex-1 rounded-xl bg-brand-cyan text-xs font-bold text-white shadow-sm hover:bg-brand-cyan-dark"
        >
          KEMBALI
        </Button>
      </div>
    </div>
  );
}
