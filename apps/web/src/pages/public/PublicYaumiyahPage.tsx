import { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Info,
  Loader2,
  Moon,
  Search,
  Sun,
  User,
  X,
} from "lucide-react";
import {
  DayStripPicker,
  type DayItem,
} from "@/components/student/DayStripPicker";
import { SholatInfoModal } from "@/components/yaumiyah/SholatInfoModal";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { SURAH_LIST } from "@muhsin/shared";
import { useTenantStore } from "@/store/tenantStore";

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

const IBADAH_LAINNYA_LIST = ["Tahajud", "Dhuha", "Puasa"];

interface ClassItem {
  id: string;
  name: string;
}

interface StudentItem {
  id: string;
  name: string;
  classId?: string | null;
}

export function PublicYaumiyahPage() {
  const school = useTenantStore((s) => s.school);
  const resolveTenant = useTenantStore((s) => s.resolveTenant);

  const todayStr = formatLocalDate(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [days, setDays] = useState<DayItem[]>(() => getCenteredDays(todayStr));
  const selectedDayIdx = 2;

  // Class & Student selection
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [studentsList, setStudentsList] = useState<StudentItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form states
  const [surahStart, setSurahStart] = useState("");
  const [ayatStart, setAyatStart] = useState("");
  const [surahEnd, setSurahEnd] = useState("");
  const [ayatEnd, setAyatEnd] = useState("");
  const [notTilawah, setNotTilawah] = useState(false);
  const [showSholatInfo, setShowSholatInfo] = useState(false);
  const [sholatState, setSholatState] = useState<Record<string, string>>({
    Subuh: "",
    Dzuhur: "",
    Ashar: "",
    Maghrib: "",
    Isya: "",
  });
  const [rawatibState, setRawatibState] = useState<Record<string, boolean>>({});
  const [ibadahState, setIbadahState] = useState<Record<string, boolean>>({});

  // Status & submission states
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "warning" } | null>(null);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    studentName: string;
    expEarned?: number;
    streak?: number;
  } | null>(null);

  // 1. Resolve tenant on mount
  useEffect(() => {
    resolveTenant();
  }, [resolveTenant]);

  const schoolSlug = school?.slug || "alfitrah";

  // 2. Load classes when school resolved
  useEffect(() => {
    if (!schoolSlug) return;
    let isMounted = true;
    async function loadClasses() {
      try {
        const cls = await api.getPublicClasses(schoolSlug);
        if (isMounted) setClassesList(cls);
      } catch (err) {
        console.error("Gagal memuat kelas", err);
      }
    }
    loadClasses();
    return () => {
      isMounted = false;
    };
  }, [schoolSlug]);

  // 3. Load students when class selected
  useEffect(() => {
    if (!schoolSlug || !selectedClassId) {
      setStudentsList([]);
      setSelectedStudent(null);
      return;
    }
    let isMounted = true;
    async function loadStudents() {
      try {
        const st = await api.getPublicStudents(schoolSlug, selectedClassId);
        if (isMounted) {
          setStudentsList(st);
          setSelectedStudent(null);
          setStudentSearch("");
        }
      } catch (err) {
        console.error("Gagal memuat siswa", err);
      }
    }
    loadStudents();
    return () => {
      isMounted = false;
    };
  }, [schoolSlug, selectedClassId]);

  // Close combobox on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return studentsList;
    const q = studentSearch.toLowerCase().trim();
    return studentsList.filter((s) => s.name.toLowerCase().includes(q));
  }, [studentsList, studentSearch]);

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

  // 4. Check if student already submitted on selected date
  useEffect(() => {
    if (!selectedStudent || !schoolSlug) {
      setIsAlreadySubmitted(false);
      return;
    }

    let isMounted = true;
    async function checkStatus() {
      setCheckingStatus(true);
      try {
        const res = await api.getPublicDailyIbadahStatus(schoolSlug, selectedStudent!.id, selectedDate);
        if (!isMounted) return;

        if (res?.status === "submitted") {
          setIsAlreadySubmitted(true);
          // Populate existing data view
          const rec = res.record;
          if (rec) {
            if (rec.sholatFardhu) {
              setSholatState({
                Subuh: rec.sholatFardhu.subuh || "",
                Dzuhur: rec.sholatFardhu.dzuhur || "",
                Ashar: rec.sholatFardhu.ashar || "",
                Maghrib: rec.sholatFardhu.maghrib || "",
                Isya: rec.sholatFardhu.isya || "",
              });
            }
            if (Array.isArray(rec.sholatRawatib)) {
              const rawMap: Record<string, boolean> = {};
              rec.sholatRawatib.forEach((r: string) => {
                rawMap[r] = true;
              });
              setRawatibState(rawMap);
            }
            setIbadahState({
              Tahajud: !!rec.tahajud,
              Dhuha: !!rec.dhuha,
              Puasa: !!rec.puasaSunnah,
            });
            if (rec.tilawah) {
              setSurahStart(rec.tilawah.surahStart ? String(rec.tilawah.surahStart) : "");
              setAyatStart(rec.tilawah.ayatStart ? String(rec.tilawah.ayatStart) : "");
              setSurahEnd(rec.tilawah.surahEnd ? String(rec.tilawah.surahEnd) : "");
              setAyatEnd(rec.tilawah.ayatEnd ? String(rec.tilawah.ayatEnd) : "");
              setNotTilawah(false);
            } else {
              setNotTilawah(true);
            }
          }
        } else {
          setIsAlreadySubmitted(false);
          resetFormFields();
        }
      } catch (err) {
        if (isMounted) setIsAlreadySubmitted(false);
      } finally {
        if (isMounted) setCheckingStatus(false);
      }
    }

    checkStatus();
    return () => {
      isMounted = false;
    };
  }, [selectedStudent, selectedDate, schoolSlug]);

  function resetFormFields() {
    setSholatState({ Subuh: "", Dzuhur: "", Ashar: "", Maghrib: "", Isya: "" });
    setRawatibState({});
    setIbadahState({});
    setSurahStart("");
    setAyatStart("");
    setSurahEnd("");
    setAyatEnd("");
    setNotTilawah(false);
  }

  function handleSelectDay(idx: number) {
    const clickedDate = days[idx]?.fullDate;
    if (clickedDate && clickedDate !== selectedDate && clickedDate <= todayStr) {
      setSelectedDate(clickedDate);
    }
  }

  function handlePrev() {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatLocalDate(d));
  }

  function handleNext() {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() + 1);
    const nextStr = formatLocalDate(d);
    if (nextStr <= todayStr) {
      setSelectedDate(nextStr);
    }
  }

  function handleSelectOption(sholat: string, opt: string) {
    if (isAlreadySubmitted) return;
    setSholatState((prev) => ({
      ...prev,
      [sholat]: prev[sholat] === opt ? "" : opt,
    }));
  }

  function getRawatibArray(): string[] {
    return Object.entries(rawatibState)
      .filter(([_, checked]) => checked)
      .map(([name]) => name);
  }

  async function handleSubmit() {
    if (!selectedClassId) {
      setToast({ message: "Pilih kelas terlebih dahulu", variant: "warning" });
      return;
    }
    if (!selectedStudent) {
      setToast({ message: "Pilih nama siswa terlebih dahulu", variant: "warning" });
      return;
    }
    if (isAlreadySubmitted) {
      setToast({ message: "Ibadah tanggal ini sudah terkirim", variant: "warning" });
      return;
    }

    setLoading(true);
    try {
      const sholatFardhu: Record<string, string> = {};
      if (sholatState["Subuh"]) sholatFardhu.subuh = sholatState["Subuh"];
      if (sholatState["Dzuhur"]) sholatFardhu.dzuhur = sholatState["Dzuhur"];
      if (sholatState["Ashar"]) sholatFardhu.ashar = sholatState["Ashar"];
      if (sholatState["Maghrib"]) sholatFardhu.maghrib = sholatState["Maghrib"];
      if (sholatState["Isya"]) sholatFardhu.isya = sholatState["Isya"];

      const hasTilawah = !notTilawah && surahStart && ayatStart;

      const res = await api.submitPublicDailyIbadah(schoolSlug, {
        studentId: selectedStudent.id,
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

      setIsAlreadySubmitted(true);
      setSubmitResult({
        success: true,
        studentName: selectedStudent.name,
        expEarned: res?.data?.expEarned ?? 0,
        streak: res?.data?.currentStreak ?? 1,
      });
      setToast({ message: "Ibadah yaumiyah berhasil dikirim!", variant: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Gagal mengirim ibadah", variant: "warning" });
    } finally {
      setLoading(false);
    }
  }

  function handleResetForNextStudent() {
    setSelectedStudent(null);
    setStudentSearch("");
    setIsAlreadySubmitted(false);
    setSubmitResult(null);
    resetFormFields();
  }

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-brand-line/50 bg-white px-4 py-3 shadow-xs">
        <button
          type="button"
          onClick={() => (window.location.hash = "#/login")}
          aria-label="Ke Halaman Login"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-brand-navy hover:bg-slate-200 transition-colors"
          title="Login Petugas / Guru"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            {school?.logoUrl ? (
              <img src={school.logoUrl} alt="" className="h-6 w-6 object-contain" />
            ) : null}
            <h1 className="text-sm font-extrabold text-brand-navy">
              {school?.name || "Muhsin App"}
            </h1>
          </div>
          <span className="text-[11px] font-semibold text-brand-cyan">
            Input Yaumiyah Siswa
          </span>
        </div>
        <button
          type="button"
          onClick={() => (window.location.hash = "#/login")}
          className="text-[11px] font-bold text-slate-500 hover:text-brand-cyan transition-colors"
        >
          Login
        </button>
      </div>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-4 pt-3 pb-6">
        <div className="flex flex-col gap-4">
          {/* Pilot Trial Notice */}
          <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-3 text-xs text-sky-900 shadow-xs">
            <p className="font-bold flex items-center gap-1.5 text-sky-950">
              <span className="inline-block h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
              Uji Coba Pengisian Yaumiyah Mandiri
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-sky-800">
              Silakan pilih kelas dan nama ananda untuk mengisi catatan ibadah harian. Data langsung terintegrasi otomatis ke sistem sekolah.
            </p>
          </div>

          {/* Selector Section: Kelas & Nama Siswa */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm space-y-3">
            {/* 1. Dropdown Kelas */}
            <div>
              <label className="text-[10px] font-bold tracking-wider text-brand-navy uppercase">
                1. Pilih Kelas
              </label>
              <div className="relative mt-1">
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setSubmitResult(null);
                  }}
                  className={`w-full appearance-none rounded-xl border border-brand-line bg-gray-50/60 py-2.5 pl-3.5 pr-9 text-xs font-bold outline-none focus:border-brand-cyan transition-colors ${
                    selectedClassId ? "text-brand-navy" : "text-gray-400"
                  }`}
                >
                  <option value="">-- Pilih Kelas Terlebih Dahulu --</option>
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id} className="text-brand-navy">
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* 2. Searchable Combobox Nama Siswa */}
            <div ref={dropdownRef} className="relative">
              <label className="text-[10px] font-bold tracking-wider text-brand-navy uppercase">
                2. Pilih &amp; Cari Nama Siswa
              </label>

              {/* Input / Display Button */}
              <div
                onClick={() => {
                  if (selectedClassId) setIsDropdownOpen(true);
                }}
                className={`mt-1 flex items-center justify-between rounded-xl border border-brand-line bg-gray-50/60 py-2.5 px-3 text-xs font-semibold cursor-pointer transition-colors ${
                  !selectedClassId
                    ? "opacity-50 cursor-not-allowed bg-gray-100"
                    : isDropdownOpen
                    ? "border-brand-cyan ring-2 ring-brand-cyan/20 bg-white"
                    : "hover:border-brand-cyan/50"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <User className="h-4 w-4 shrink-0 text-brand-cyan" />
                  {selectedStudent ? (
                    <span className="font-bold text-brand-navy truncate">
                      {selectedStudent.name}
                    </span>
                  ) : (
                    <span className="text-gray-400">
                      {selectedClassId ? "Cari / pilih nama siswa..." : "Pilih kelas terlebih dahulu"}
                    </span>
                  )}
                </div>

                {selectedStudent ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetForNextStudent();
                    }}
                    className="p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <Search className="h-4 w-4 text-gray-400 shrink-0" />
                )}
              </div>

              {/* Dropdown List with Search Input */}
              {isDropdownOpen && selectedClassId ? (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-hidden rounded-2xl border border-brand-line bg-white shadow-xl flex flex-col">
                  {/* Sticky Search Field */}
                  <div className="p-2 border-b border-brand-line/60 bg-gray-50/70">
                    <div className="relative">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Ketik untuk mencari nama..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full rounded-xl border border-brand-line bg-white py-2 pl-8 pr-3 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                      />
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  {/* Filtered Student Options */}
                  <div className="flex-1 overflow-y-auto divide-y divide-brand-line/30 p-1">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudent(s);
                            setIsDropdownOpen(false);
                            setSubmitResult(null);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors ${
                            selectedStudent?.id === s.id
                              ? "bg-brand-cyan/10 font-bold text-brand-cyan"
                              : "hover:bg-gray-50 text-brand-navy"
                          }`}
                        >
                          <span className="truncate">{s.name}</span>
                          {selectedStudent?.id === s.id ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-brand-cyan shrink-0 ml-2" />
                          ) : null}
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-gray-400">
                        {studentSearch
                          ? `Tidak ada siswa bernama "${studentSearch}"`
                          : "Belum ada siswa di kelas ini"}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {/* Date Picker Strip */}
          <DayStripPicker
            days={days}
            selectedIndex={selectedDayIdx}
            onSelectDay={handleSelectDay}
            onPrev={handlePrev}
            onNext={handleNext}
            maxDate={todayStr}
          />

          {/* Already Submitted Warning / Status Banner */}
          {selectedStudent && (
            <div>
              {checkingStatus ? (
                <div className="flex items-center justify-center p-3 text-xs text-brand-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-cyan mr-2" />
                  Memeriksa status yaumiyah...
                </div>
              ) : isAlreadySubmitted ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-sm flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-emerald-950">
                      Yaumiyah Tanggal Ini Sudah Terkirim
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-800">
                      Alhamdulillah, catatan ibadah untuk ananda{" "}
                      <span className="font-bold">{selectedStudent.name}</span> pada tanggal{" "}
                      <span className="font-bold">{selectedDate}</span> sudah berhasil terdata di sistem.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetForNextStudent}
                      className="mt-2 text-xs font-bold text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
                    >
                      Input untuk siswa lain &rarr;
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

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
                        disabled={isAlreadySubmitted}
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
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <div className="w-20 shrink-0">
                    <label className="text-[10px] font-bold tracking-wider text-brand-navy uppercase">
                      Ayat
                    </label>
                    <input
                      disabled={isAlreadySubmitted}
                      type="number"
                      min="1"
                      placeholder="Ayat"
                      max={SURAH_LIST.find((s) => s.no === Number(surahStart))?.totalAyat ?? 999}
                      value={ayatStart}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAyatStart(val);
                        if (!ayatEnd) setAyatEnd(val);
                      }}
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
                        disabled={isAlreadySubmitted}
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
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <div className="w-20 shrink-0">
                    <label className="text-[10px] font-bold tracking-wider text-brand-navy uppercase">
                      Ayat
                    </label>
                    <input
                      disabled={isAlreadySubmitted}
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
                disabled={isAlreadySubmitted}
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
              <button
                type="button"
                onClick={() => setShowSholatInfo(true)}
                aria-label="Informasi Kode Sholat"
                className="flex items-center gap-1 rounded-lg p-1 text-brand-text-muted hover:bg-gray-100 hover:text-brand-cyan transition-colors"
              >
                <Info className="h-4 w-4" />
              </button>
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
                        disabled={isAlreadySubmitted}
                        onClick={() => handleSelectOption(sholat, opt)}
                        className={`h-7 w-7 rounded-md text-[11px] font-bold transition-all border ${
                          sholatState[sholat] === opt
                            ? "bg-brand-cyan text-white border-brand-cyan shadow-sm"
                            : "bg-white text-brand-navy border-brand-line/80 hover:bg-gray-50"
                        } disabled:opacity-75`}
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
                  disabled={isAlreadySubmitted}
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
                  } disabled:opacity-75`}
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
                  disabled={isAlreadySubmitted}
                  onClick={() =>
                    setIbadahState((prev) => ({
                      ...prev,
                      [item]: !prev[item],
                    }))
                  }
                  className="flex items-center gap-2 text-xs font-bold text-brand-navy disabled:opacity-75"
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
        {isAlreadySubmitted ? (
          <Button
            type="button"
            onClick={handleResetForNextStudent}
            className="h-11 w-full rounded-xl bg-brand-cyan font-bold text-white shadow-sm hover:bg-brand-cyan-dark"
          >
            INPUT SISWA LAIN
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !selectedStudent || !selectedClassId}
            className="h-11 w-full rounded-xl bg-brand-cyan font-bold text-white shadow-sm hover:bg-brand-cyan-dark disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : !selectedStudent ? (
              "PILIH SISWA TERLEBIH DAHULU"
            ) : (
              "KIRIM IBADAH"
            )}
          </Button>
        )}
      </div>

      {/* Success Modal */}
      {submitResult?.success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-navy">Alhamdulillah!</h3>
              <p className="mt-1 text-xs text-brand-text-muted">
                Ibadah yaumiyah ananda{" "}
                <span className="font-bold text-brand-navy">{submitResult.studentName}</span>{" "}
                berhasil tercatat.
              </p>
            </div>

            {submitResult.expEarned ? (
              <div className="flex justify-center gap-4 py-2 border-y border-brand-line/60">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">EXP Didapat</p>
                  <p className="text-base font-extrabold text-brand-cyan">+{submitResult.expEarned} XP</p>
                </div>
                {submitResult.streak ? (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Streak Ibadah</p>
                    <p className="text-base font-extrabold text-amber-500">{submitResult.streak} Hari 🔥</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="pt-2 flex flex-col gap-2">
              <Button
                type="button"
                onClick={handleResetForNextStudent}
                className="h-10 w-full rounded-xl bg-brand-cyan font-bold text-white hover:bg-brand-cyan-dark"
              >
                Input Siswa Lain
              </Button>
              <button
                type="button"
                onClick={() => setSubmitResult(null)}
                className="text-xs font-semibold text-brand-text-muted hover:text-brand-navy py-1"
              >
                Lihat Catatan Tanggal Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      ) : null}

      <SholatInfoModal
        isOpen={showSholatInfo}
        onClose={() => setShowSholatInfo(false)}
      />
    </div>
  );
}
