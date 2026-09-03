import { useState, useEffect } from "react";
import { ArrowLeft, ChevronDown, Loader2, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toastStore";
import { api } from "@/lib/api";
import { SURAH_LIST } from "@muhsin/shared";

interface StudentOption {
  id: string;
  name: string;
  className: string | null;
}

export function TeacherMurojaahInputPage() {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [surahStart, setSurahStart] = useState("1");
  const [ayatStart, setAyatStart] = useState("1");
  const [surahEnd, setSurahEnd] = useState("1");
  const [ayatEnd, setAyatEnd] = useState("7");
  const [tajwid, setTajwid] = useState("95");
  const [kelancaran, setKelancaran] = useState("98");
  const [makhraj, setMakhraj] = useState("95");
  const [catatan, setCatatan] = useState("");
  const [statusKehadiran, setStatusKehadiran] = useState<"setoran" | "sakit" | "izin" | "alpa">("setoran");
  const todayStr = formatLocalDate(new Date());
  const [date, setDate] = useState(() => todayStr);

  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [studentList, categories] = await Promise.all([
          api.getStudents(),
          api.getAssessmentCategories(),
        ]);

        setStudents(studentList);

        const preselectedId = sessionStorage.getItem("selectedStudentId");
        if (preselectedId && studentList.some((s) => s.id === preselectedId)) {
          setSelectedStudentId(preselectedId);
        } else if (studentList.length > 0) {
          setSelectedStudentId(studentList[0].id);
        }

        const murojaah = categories.find(
          (c) => c.code === "murojaah" || c.name.toLowerCase().includes("muroja")
        );
        if (murojaah) {
          setSubcategoryId(murojaah.id);
        } else if (categories.length > 0) {
          setSubcategoryId(categories[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data awal");
      } finally {
        setInitLoading(false);
      }
    }
    init();
  }, []);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  async function handleSave() {
    if (!selectedStudentId) {
      const msg = "Pilih santri terlebih dahulu";
      setError(msg);
      toast.warning(msg);
      return;
    }
    if (!subcategoryId) {
      const msg = "Kategori Muroja'ah tidak ditemukan";
      setError(msg);
      toast.warning(msg);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const sStart = SURAH_LIST.find((s) => s.no === Number(surahStart))?.nameLatin ?? `Surah ${surahStart}`;
      const sEnd = SURAH_LIST.find((s) => s.no === Number(surahEnd))?.nameLatin ?? `Surah ${surahEnd}`;

      const savedEntry = await api.createSetoran({
        studentId: selectedStudentId,
        subcategoryId: subcategoryId,
        date: date,
        referenceStart: { surah: sStart, ayat: Number(ayatStart), surahNo: Number(surahStart) },
        referenceEnd: { surah: sEnd, ayat: Number(ayatEnd), surahNo: Number(surahEnd) },
        scores: {
          tajwid: Number(tajwid),
          kelancaran: Number(kelancaran),
          makhraj: Number(makhraj),
        },
        keterangan: statusKehadiran !== "setoran" ? statusKehadiran : catatan || null,
        scoreFieldKeys: ["tajwid", "kelancaran", "makhraj"],
      });

      sessionStorage.setItem("lastSetoranId", savedEntry.id);
      toast.success("Setoran Muroja'ah berhasil disimpan!");
      setTimeout(() => {
        window.location.hash = "#/ziyadah-view";
      }, 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mencatat setoran";
      setError(msg);
      toast.warning(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    window.location.hash = "#/dashboard";
  }

  if (initLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-page">
        <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
      </div>
    );
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
        <h1 className="text-lg font-bold text-brand-cyan">
          Input Muroja&apos;ah (Tahfidz)
        </h1>
        <div className="h-10 w-10" />
      </div>

      {/* Main Body */}
      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-1">
        <div className="flex flex-col gap-4">
          {error && (
            <div className="rounded-2xl bg-red-50 p-3 text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          {/* Pilih Santri Card */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <label className="text-xs font-bold text-brand-navy">
              Pilih Santri Bimbingan
            </label>
            <div className="relative mt-2">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-brand-line bg-gray-50/50 py-3 pl-3 pr-9 text-xs font-bold text-brand-navy outline-none focus:border-brand-cyan"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.className ?? "Kelas TTQ"})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            {selectedStudent && (
              <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-purple-50 p-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-xs font-extrabold text-purple-700">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-navy">
                    {selectedStudent.name}
                  </p>
                  <p className="text-[10px] text-brand-text-muted">
                    {selectedStudent.className ?? "Kelas Halaqah"}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Tanggal & Kehadiran Card */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-brand-navy">
                Tanggal Setoran
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-brand-line bg-gray-50/50 px-3 py-1.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="mt-3">
              <label className="text-[11px] font-semibold text-brand-text-muted">
                Status Kehadiran
              </label>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                {[
                  { id: "setoran", label: "Setoran" },
                  { id: "sakit", label: "Sakit" },
                  { id: "izin", label: "Izin" },
                  { id: "alpa", label: "Alpa" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusKehadiran(st.id as any)}
                    className={`rounded-xl py-2 text-xs font-bold transition-all border ${
                      statusKehadiran === st.id
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-gray-50 text-brand-navy border-brand-line/60 hover:bg-gray-100"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Materi Hafalan Murojaah Card */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-brand-line/40 pb-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <Repeat className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold text-brand-navy">
                Materi Hafalan Muroja&apos;ah
              </h2>
            </div>

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
                        setSurahStart(e.target.value);
                        if (Number(surahEnd) < Number(e.target.value)) {
                          setSurahEnd(e.target.value);
                        }
                      }}
                      className="w-full appearance-none rounded-xl border border-brand-line bg-gray-50/50 py-2.5 pl-3 pr-8 text-xs font-semibold text-brand-navy outline-none focus:border-purple-500"
                    >
                      {SURAH_LIST.map((s) => (
                        <option key={s.no} value={String(s.no)}>
                          {s.no}. {s.nameLatin}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <div className="w-20 shrink-0">
                  <label className="text-[10px] font-bold tracking-wider text-brand-navy uppercase">
                    Ayat
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={ayatStart}
                    onChange={(e) => setAyatStart(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-brand-line bg-gray-50/50 py-2.5 px-3 text-center text-xs font-semibold text-brand-navy outline-none focus:border-purple-500"
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
                      className="w-full appearance-none rounded-xl border border-brand-line bg-gray-50/50 py-2.5 pl-3 pr-8 text-xs font-semibold text-brand-navy outline-none focus:border-purple-500"
                    >
                      {SURAH_LIST.map((s) => (
                        <option key={s.no} value={String(s.no)}>
                          {s.no}. {s.nameLatin}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <div className="w-20 shrink-0">
                  <label className="text-[10px] font-bold tracking-wider text-brand-navy uppercase">
                    Ayat
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={ayatEnd}
                    onChange={(e) => setAyatEnd(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-brand-line bg-gray-50/50 py-2.5 px-3 text-center text-xs font-semibold text-brand-navy outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Penilaian Aspek (Scores) Card */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-brand-navy mb-3">
              Penilaian Aspek (Skala 0 - 100)
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-navy">Tajwid</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tajwid}
                  onChange={(e) => setTajwid(e.target.value)}
                  className="w-16 rounded-xl border border-brand-line bg-gray-50/50 py-1.5 text-center text-xs font-bold text-purple-700 outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-navy">Kelancaran</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={kelancaran}
                  onChange={(e) => setKelancaran(e.target.value)}
                  className="w-16 rounded-xl border border-brand-line bg-gray-50/50 py-1.5 text-center text-xs font-bold text-purple-700 outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-navy">Makhraj Huruf</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={makhraj}
                  onChange={(e) => setMakhraj(e.target.value)}
                  className="w-16 rounded-xl border border-brand-line bg-gray-50/50 py-1.5 text-center text-xs font-bold text-purple-700 outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </section>

          {/* Catatan / Evaluasi */}
          <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <label className="text-xs font-bold text-brand-navy">
              Catatan &amp; Evaluasi Guru Pembimbing
            </label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Hafalan lancar, mutqin..."
              className="mt-2 w-full rounded-xl border border-brand-line bg-gray-50/50 p-3 text-xs font-medium text-brand-navy outline-none placeholder:text-gray-400 focus:border-purple-500"
            />
          </section>
        </div>
      </main>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex gap-3 border-t border-brand-line bg-white px-4 py-3 shadow-lg">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={loading}
          className="h-11 flex-1 rounded-xl border-brand-line text-xs font-bold text-brand-navy hover:bg-gray-50"
        >
          BATAL
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="h-11 flex-1 rounded-xl bg-purple-600 font-bold text-white shadow-sm hover:bg-purple-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "SIMPAN SETORAN"}
        </Button>
      </div>
    </div>
  );
}
