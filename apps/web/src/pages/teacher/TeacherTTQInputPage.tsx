import { useState, useEffect } from "react";
import { Loader2, Save, BookOpen } from "lucide-react";
import { formatLocalDate } from "@/utils/date";
import { toast } from "@/store/toastStore";
import { api } from "@/lib/api";
import { SURAH_LIST } from "@muhsin/shared";
import {
  TTQHeader,
  TTQAttendanceRow,
  TTQScoreSlider,
  type TTQCategoryType,
} from "@/components/teacher/TTQComponents";

interface StudentOption {
  id: string;
  name: string;
  className: string | null;
}

interface TeacherTTQInputPageProps {
  initialCategory?: TTQCategoryType;
}

export function TeacherTTQInputPage({
  initialCategory = "ziyadah",
}: TeacherTTQInputPageProps) {
  const hash = window.location.hash;
  const queryParams = new URLSearchParams(hash.split("?")[1] || "");
  const routeDate = queryParams.get("date") || formatLocalDate(new Date());
  const routeStudentId =
    queryParams.get("studentId") ||
    sessionStorage.getItem("selectedStudentId") ||
    "";

  const [student, setStudent] = useState<StudentOption | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [statusKehadiran, setStatusKehadiran] = useState<
    "Hadir" | "Izin" | "Sakit" | "Alpa"
  >("Hadir");

  // Form State: Ziyadah / Murojaah / Talaqi (Surah & Ayat) - Default kosong / placeholder
  const [surahStart, setSurahStart] = useState("");
  const [ayatStart, setAyatStart] = useState("");
  const [surahEnd, setSurahEnd] = useState("");
  const [ayatEnd, setAyatEnd] = useState("");

  // Form State: Sabiq (Jilid & Halaman) - Default kosong / placeholder
  const [jilidStart, setJilidStart] = useState("");
  const [halamanStart, setHalamanStart] = useState("");
  const [jilidEnd, setJilidEnd] = useState("");
  const [halamanEnd, setHalamanEnd] = useState("");

  // Scores (Default 0 untuk penilaian pertama kali)
  const [tajwid, setTajwid] = useState(0);
  const [kelancaran, setKelancaran] = useState(0);
  const [makhraj, setMakhraj] = useState(0);
  const [mad, setMad] = useState(0);
  const [ghunnah, setGhunnah] = useState(0);
  const [qolqolah, setQolqolah] = useState(0);

  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [studentList, catList] = await Promise.all([
          api.getStudents(),
          api.getAssessmentCategories(),
        ]);

        setCategories(catList);

        const foundStudent =
          studentList.find((s) => s.id === routeStudentId) ||
          (studentList.length > 0 ? studentList[0] : null);
        setStudent(foundStudent);

        // Jika sudah ada data setoran sebelumnya di tanggal tersebut, populate nilainya
        if (foundStudent) {
          const cat = catList.find(
            (c: any) =>
              c.code === initialCategory ||
              c.name
                .toLowerCase()
                .includes(initialCategory === "murojaah" ? "muroja" : initialCategory)
          );

          if (cat?.id) {
            const history = await api.getSetoranHistory({
              studentId: foundStudent.id,
              subcategoryId: cat.id,
            });
            const existing = history.find((h: any) => h.date === routeDate);
            if (existing) {
              if (existing.scores?.tajwid !== undefined) setTajwid(Number(existing.scores.tajwid));
              if (existing.scores?.kelancaran !== undefined) setKelancaran(Number(existing.scores.kelancaran));
              if (existing.scores?.makhraj !== undefined) setMakhraj(Number(existing.scores.makhraj));
              if (existing.scores?.mad !== undefined) setMad(Number(existing.scores.mad));
              if (existing.scores?.ghunnah !== undefined) setGhunnah(Number(existing.scores.ghunnah));
              if (existing.scores?.qolqolah !== undefined) setQolqolah(Number(existing.scores.qolqolah));

              if (existing.referenceStart?.surahNumber) setSurahStart(String(existing.referenceStart.surahNumber));
              if (existing.referenceStart?.ayat) setAyatStart(String(existing.referenceStart.ayat));
              if (existing.referenceEnd?.surahNumber) setSurahEnd(String(existing.referenceEnd.surahNumber));
              if (existing.referenceEnd?.ayat) setAyatEnd(String(existing.referenceEnd.ayat));

              if (existing.referenceStart?.jilid) setJilidStart(String(existing.referenceStart.jilid));
              if (existing.referenceStart?.halaman) setHalamanStart(String(existing.referenceStart.halaman));
              if (existing.referenceEnd?.jilid) setJilidEnd(String(existing.referenceEnd.jilid));
              if (existing.referenceEnd?.halaman) setHalamanEnd(String(existing.referenceEnd.halaman));

              if (existing.keterangan) {
                const match = existing.keterangan.match(/^\[(.*?)\]\s*(.*)$/);
                if (match) {
                  if (match[1]) setStatusKehadiran(match[1] as any);
                  setCatatan(match[2] || "");
                } else {
                  setCatatan(existing.keterangan);
                }
              }
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat form");
      } finally {
        setInitLoading(false);
      }
    }
    init();
  }, [routeStudentId, routeDate, initialCategory]);

  function getSubcategoryId(catType: TTQCategoryType): string | null {
    const found = categories.find(
      (c) =>
        c.code === catType ||
        c.name.toLowerCase().includes(catType === "murojaah" ? "muroja" : catType)
    );
    return found?.id || categories[0]?.id || null;
  }

  const categoryTitle =
    initialCategory === "ziyadah"
      ? "Ziyadah"
      : initialCategory === "murojaah"
      ? "Muroja'ah"
      : initialCategory === "sabiq"
      ? "Sabiq"
      : "Talaqi";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!student?.id) {
      toast.warning("Data santri tidak ditemukan");
      return;
    }

    const subcategoryId = getSubcategoryId(initialCategory);
    if (!subcategoryId) {
      toast.error(`Kategori ${categoryTitle} belum dikonfigurasi`);
      return;
    }

    setLoading(true);
    try {
      let scores: Record<string, number> = {};
      let scoreFieldKeys: string[] = [];
      let referenceStart: any = null;
      let referenceEnd: any = null;

      if (statusKehadiran === "Hadir") {
        if (initialCategory === "ziyadah" || initialCategory === "murojaah") {
          scores = { tajwid: Number(tajwid), kelancaran: Number(kelancaran) };
          scoreFieldKeys = ["tajwid", "kelancaran"];
          if (surahStart) {
            const sStart =
              SURAH_LIST.find((s) => s.no === Number(surahStart))?.nameLatin ||
              `Surah ${surahStart}`;
            const sEnd = surahEnd
              ? SURAH_LIST.find((s) => s.no === Number(surahEnd))?.nameLatin ||
                `Surah ${surahEnd}`
              : sStart;
            referenceStart = {
              surah: sStart,
              surahNumber: Number(surahStart),
              ayat: ayatStart ? Number(ayatStart) : 1,
            };
            referenceEnd = {
              surah: sEnd,
              surahNumber: surahEnd ? Number(surahEnd) : Number(surahStart),
              ayat: ayatEnd ? Number(ayatEnd) : Number(ayatStart || 1),
            };
          }
        } else if (initialCategory === "sabiq") {
          scores = {
            makhraj: Number(makhraj),
            mad: Number(mad),
            ghunnah: Number(ghunnah),
            qolqolah: Number(qolqolah),
          };
          scoreFieldKeys = ["makhraj", "mad", "ghunnah", "qolqolah"];
          if (jilidStart) {
            referenceStart = {
              jilid: Number(jilidStart),
              halaman: halamanStart ? Number(halamanStart) : 1,
            };
            referenceEnd = {
              jilid: jilidEnd ? Number(jilidEnd) : Number(jilidStart),
              halaman: halamanEnd
                ? Number(halamanEnd)
                : Number(halamanStart || 1),
            };
          }
        } else if (initialCategory === "talaqi") {
          scores = { kelancaran: Number(kelancaran) };
          scoreFieldKeys = ["kelancaran"];
          if (surahStart) {
            const sStart =
              SURAH_LIST.find((s) => s.no === Number(surahStart))?.nameLatin ||
              `Surah ${surahStart}`;
            const sEnd = surahEnd
              ? SURAH_LIST.find((s) => s.no === Number(surahEnd))?.nameLatin ||
                `Surah ${surahEnd}`
              : sStart;
            referenceStart = {
              surah: sStart,
              surahNumber: Number(surahStart),
              ayat: ayatStart ? Number(ayatStart) : 1,
            };
            referenceEnd = {
              surah: sEnd,
              surahNumber: surahEnd ? Number(surahEnd) : Number(surahStart),
              ayat: ayatEnd ? Number(ayatEnd) : Number(ayatStart || 1),
            };
          }
        }
      }

      await api.createSetoran({
        studentId: student.id,
        subcategoryId,
        date: routeDate,
        scores,
        scoreFieldKeys,
        referenceStart,
        referenceEnd,
        keterangan: catatan
          ? `[${statusKehadiran}] ${catatan}`
          : `[${statusKehadiran}]`,
      });

      toast.success(`Penilaian ${categoryTitle} berhasil disimpan`);

      sessionStorage.setItem("selectedStudentId", student.id);
      window.location.hash = `#/student-list`;
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  }

  if (initLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-page">
        <Loader2 className="h-8 w-8 animate-spin text-[#22bad0]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-page px-4 pb-12">
      <div className="mx-auto max-w-md">
        <TTQHeader date={routeDate} />

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 1. Header Santri & Kategori Fokus (Single Source of Truth) */}
          <div className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-line bg-gray-50 overflow-hidden">
                <img
                  src="/brand/moon_star_icon.svg"
                  alt="Avatar"
                  className="h-6 w-6 object-contain"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-navy leading-tight">
                  {student?.name ?? "Santri"}
                </h3>
                <p className="mt-0.5 text-xs text-brand-text-muted">
                  {student?.className ?? "Kelas TTQ"}
                </p>
              </div>
            </div>

            <span className="rounded-xl bg-brand-cyan/10 px-3 py-1.5 text-xs font-extrabold text-[#159db5]">
              {categoryTitle}
            </span>
          </div>

          {/* 2. Status Kehadiran (Horizontal Row) */}
          <TTQAttendanceRow
            mode="input"
            value={statusKehadiran}
            onChange={setStatusKehadiran}
          />

          {/* Form Setoran & Penilaian hanya tampil jika status Hadir */}
          {statusKehadiran === "Hadir" && (
            <>
              {/* 3. Form Awal & Akhir Setoran Sesuai Kategori */}
              <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-5 w-5 text-brand-navy" />
                  <h3 className="text-sm font-extrabold text-brand-navy">
                    {categoryTitle}
                  </h3>
                </div>

                {initialCategory === "sabiq" ? (
                  /* Form Sabiq (Jilid & Halaman) */
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-brand-navy">
                        AWAL JILID
                      </label>
                      <select
                        value={jilidStart}
                        onChange={(e) => setJilidStart(e.target.value)}
                        className="mt-1 w-full appearance-none rounded-xl border border-brand-line bg-white py-2.5 pl-3 pr-7 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                      >
                        <option value="">Pilih Jilid...</option>
                        {[1, 2, 3, 4, 5, 6].map((j) => (
                          <option key={j} value={j}>
                            Jilid {j}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-brand-navy">
                        HALAMAN
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Contoh: 1"
                        value={halamanStart}
                        onChange={(e) => setHalamanStart(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-brand-line bg-white py-2 px-3 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-brand-navy">
                        AKHIR JILID
                      </label>
                      <select
                        value={jilidEnd}
                        onChange={(e) => setJilidEnd(e.target.value)}
                        className="mt-1 w-full appearance-none rounded-xl border border-brand-line bg-white py-2.5 pl-3 pr-7 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                      >
                        <option value="">Pilih Jilid...</option>
                        {[1, 2, 3, 4, 5, 6].map((j) => (
                          <option key={j} value={j}>
                            Jilid {j}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-brand-navy">
                        HALAMAN
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Contoh: 5"
                        value={halamanEnd}
                        onChange={(e) => setHalamanEnd(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-brand-line bg-white py-2 px-3 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                      />
                    </div>
                  </div>
                ) : (
                  /* Form Surah & Ayat untuk Ziyadah, Murojaah, Talaqi */
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-brand-navy">
                        AWAL SURAH
                      </label>
                      <select
                        value={surahStart}
                        onChange={(e) => setSurahStart(e.target.value)}
                        className="mt-1 w-full appearance-none rounded-xl border border-brand-line bg-white py-2.5 pl-2.5 pr-7 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                      >
                        <option value="">Pilih Surah...</option>
                        {SURAH_LIST.map((s) => (
                          <option key={s.no} value={s.no}>
                            {s.no}. {s.nameLatin}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-brand-navy">
                        AYAT
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Contoh: 1"
                        value={ayatStart}
                        onChange={(e) => setAyatStart(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-brand-line bg-white py-2 px-3 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-brand-navy">
                        AKHIR SURAH
                      </label>
                      <select
                        value={surahEnd}
                        onChange={(e) => setSurahEnd(e.target.value)}
                        className="mt-1 w-full appearance-none rounded-xl border border-brand-line bg-white py-2.5 pl-2.5 pr-7 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                      >
                        <option value="">Pilih Surah...</option>
                        {SURAH_LIST.map((s) => (
                          <option key={s.no} value={s.no}>
                            {s.no}. {s.nameLatin}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-brand-navy">
                        AYAT
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Contoh: 5"
                        value={ayatEnd}
                        onChange={(e) => setAyatEnd(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-brand-line bg-white py-2 px-3 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Card Penilaian Range Sliders */}
              <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-xs">
                <h3 className="mb-4 text-xs font-bold text-brand-navy">Penilaian</h3>

                {initialCategory === "sabiq" ? (
                  <div className="flex flex-col gap-4">
                    <TTQScoreSlider
                      label="Makhraj"
                      value={makhraj}
                      onChange={setMakhraj}
                    />
                    <TTQScoreSlider label="Mad" value={mad} onChange={setMad} />
                    <TTQScoreSlider
                      label="Ghunnah"
                      value={ghunnah}
                      onChange={setGhunnah}
                    />
                    <TTQScoreSlider
                      label="Qolqolah"
                      value={qolqolah}
                      onChange={setQolqolah}
                    />
                  </div>
                ) : initialCategory === "talaqi" ? (
                  <div className="flex flex-col gap-4">
                    <TTQScoreSlider
                      label="Kelancaran"
                      value={kelancaran}
                      onChange={setKelancaran}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <TTQScoreSlider
                      label="Tajwid"
                      value={tajwid}
                      onChange={setTajwid}
                    />
                    <TTQScoreSlider
                      label="Kelancaran"
                      value={kelancaran}
                      onChange={setKelancaran}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* 5. Catatan Input */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-xs">
            <label className="text-xs font-bold text-brand-navy">
              Catatan (Opsional)
            </label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tambahkan catatan evaluasi santri..."
              className="mt-2 w-full rounded-xl border border-brand-line p-3 text-xs text-brand-navy outline-none placeholder:text-gray-400 focus:border-brand-cyan"
            />
          </div>

          {/* 6. Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00c950] hover:bg-[#00b046] active:scale-[0.99] py-3.5 text-xs font-extrabold tracking-wider text-white shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>SIMPAN PENILAIAN</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export function TeacherZiyadahInputPage() {
  return <TeacherTTQInputPage initialCategory="ziyadah" />;
}

export function TeacherMurojaahInputPage() {
  return <TeacherTTQInputPage initialCategory="murojaah" />;
}

export function TeacherSabiqInputPage() {
  return <TeacherTTQInputPage initialCategory="sabiq" />;
}

export function TeacherTalaqiInputPage() {
  return <TeacherTTQInputPage initialCategory="talaqi" />;
}
