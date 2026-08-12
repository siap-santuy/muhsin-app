import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Info,
  Moon,
  Sun,
  XCircle,
} from "lucide-react";
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

interface SholatRecord {
  name: string;
  desc: string;
  status: "success" | "warning" | "danger" | "off";
}

const SHOLAT_RECORDS: SholatRecord[] = [
  {
    name: "Subuh",
    desc: "Berjamaah di awal waktu",
    status: "success",
  },
  {
    name: "Dzuhur",
    desc: "Sendiri di awal waktu",
    status: "success",
  },
  {
    name: "Ashar",
    desc: "Sendiri, tidak di awal waktu",
    status: "warning",
  },
  {
    name: "Maghrib",
    desc: "Haid",
    status: "danger",
  },
  {
    name: "Isya",
    desc: "Tidak sholat",
    status: "off",
  },
];

interface StudentYaumiyahViewPageProps {
  onBack?: () => void;
  onEdit?: () => void;
}

export function StudentYaumiyahViewPage({
  onBack,
  onEdit,
}: StudentYaumiyahViewPageProps) {
  const [selectedDayIdx, setSelectedDayIdx] = useState(2);

  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      window.location.hash = "#/student-yaumiyah";
    }
  }

  function handleEdit() {
    if (onEdit) {
      onEdit();
    } else {
      window.location.hash = "#/student-yaumiyah-input";
    }
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
      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-1">
        <div className="flex flex-col gap-4">
          <DayStripPicker
            days={DAYS_MOCK}
            selectedIndex={selectedDayIdx}
            onSelectDay={setSelectedDayIdx}
          />

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
              <p className="text-xs font-bold tracking-wider text-brand-cyan">
                AL - BAQARAH: 1-3
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
              {SHOLAT_RECORDS.map((rec) => (
                <div
                  key={rec.name}
                  className="flex items-center justify-between py-2.5"
                >
                  <span className="text-xs font-bold text-brand-navy">
                    {rec.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-medium ${
                        rec.status === "success"
                          ? "text-brand-cyan"
                          : rec.status === "warning"
                          ? "text-amber-500"
                          : rec.status === "danger"
                          ? "text-red-500"
                          : "text-gray-400"
                      }`}
                    >
                      {rec.desc}
                    </span>
                    {rec.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-brand-cyan" />
                    ) : rec.status === "warning" ? (
                      <CheckCircle2 className="h-4 w-4 text-amber-500" />
                    ) : rec.status === "danger" ? (
                      <CheckCircle2 className="h-4 w-4 text-red-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
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
              {[
                "Qabliyah Subuh",
                "Qobliyah Ashar",
                "Ba'diyah Maghrib",
                "Ba'diyah Isya",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-brand-cyan/40 bg-brand-cyan/5 px-2.5 py-2 text-center text-xs font-semibold text-brand-cyan"
                >
                  {item}
                </div>
              ))}
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
          </section>
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
          KIRIM
        </Button>
      </div>
    </div>
  );
}
