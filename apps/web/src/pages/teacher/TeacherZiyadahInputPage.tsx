import { useState, useEffect } from "react";
import { ChevronDown, Loader2, Save } from "lucide-react";
import { formatLocalDate } from "@/utils/date";
import { toast } from "@/store/toastStore";
import { api } from "@/lib/api";
import { SURAH_LIST } from "@muhsin/shared";
import {
  TTQHeader,
  TTQCategoryTabs,
  TTQScoreSlider,
} from "@/components/teacher/TTQComponents";

interface StudentOption {
  id: string;
  name: string;
  className: string | null;
}

export function TeacherZiyadahInputPage() {
  const hash = window.location.hash;
  const queryParams = new URLSearchParams(hash.split("?")[1] || "");
  const routeDate = queryParams.get("date") || formatLocalDate(new Date());
  const routeStudentId = queryParams.get("studentId") || sessionStorage.getItem("selectedStudentId") || "";

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>(routeStudentId);
  const [surahStart, setSurahStart] = useState("1");
  const [ayatStart, setAyatStart] = useState("1");
  const [surahEnd, setSurahEnd] = useState("1");
  const [ayatEnd, setAyatEnd] = useState("5");
  const [tajwid, setTajwid] = useState(90);
  const [kelancaran, setKelancaran] = useState(85);
  const [catatan, setCatatan] = useState("");
  const [statusKehadiran, setStatusKehadiran] = useState<"Hadir" | "Izin" | "Sakit" | "Alpa">("Hadir");

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

        if (routeStudentId && studentList.some((s) => s.id === routeStudentId)) {
          setSelectedStudentId(routeStudentId);
        } else if (studentList.length > 0 && !selectedStudentId) {
          setSelectedStudentId(studentList[0].id);
        }

        const ziyadah = categories.find(
          (c) => c.code === "ziyadah" || c.name.toLowerCase().includes("ziyadah")
        );
        if (ziyadah) {
          setSubcategoryId(ziyadah.id);
        } else if (categories.length > 0) {
          setSubcategoryId(categories[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat form");
      } finally {
        setInitLoading(false);
      }
    }
    init();
  }, [routeStudentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudentId) {
      toast.warning("Silakan pilih siswa terlebih dahulu");
      return;
    }
    if (!subcategoryId) {
      toast.error("Kategori Ziyadah belum dikonfigurasi");
      return;
    }

    setLoading(true);
    try {
      const sStart = SURAH_LIST.find((s) => s.no === Number(surahStart))?.nameLatin || `Surah ${surahStart}`;
      const sEnd = SURAH_LIST.find((s) => s.no === Number(surahEnd))?.nameLatin || `Surah ${surahEnd}`;

      await api.createSetoran({
        studentId: selectedStudentId,
        subcategoryId,
        date: routeDate,
        scores: {
          tajwid: Number(tajwid),
          kelancaran: Number(kelancaran),
        },
        scoreFieldKeys: ["tajwid", "kelancaran"],
        referenceStart: {
          surah: sStart,
          surahNumber: Number(surahStart),
          ayat: Number(ayatStart),
        },
        referenceEnd: {
          surah: sEnd,
          surahNumber: Number(surahEnd),
          ayat: Number(ayatEnd),
        },
        keterangan: catatan ? `[${statusKehadiran}] ${catatan}` : `[${statusKehadiran}]`,
      });

      toast.success("Penilaian Ziyadah berhasil disimpan");

      sessionStorage.setItem("selectedStudentId", selectedStudentId);
      window.location.hash = `#/ziyadah-view?studentId=${selectedStudentId}&date=${routeDate}`;
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
          {/* 1. Dropdown Siswa */}
          <div className="relative">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-brand-line bg-white py-3 pl-4 pr-10 text-xs font-semibold text-brand-navy outline-none shadow-xs focus:border-brand-cyan"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.className ? `(${s.className})` : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* 2. Dropdown Status Kehadiran */}
          <div className="relative">
            <select
              value={statusKehadiran}
              onChange={(e) => setStatusKehadiran(e.target.value as any)}
              className="w-full appearance-none rounded-2xl border border-brand-line bg-white py-3 pl-4 pr-10 text-xs font-semibold text-brand-navy outline-none shadow-xs focus:border-brand-cyan"
            >
              <option value="Hadir">Hadir</option>
              <option value="Izin">Izin</option>
              <option value="Sakit">Sakit</option>
              <option value="Alpa">Alpa</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* 3. Segmented Tabs Category */}
          <TTQCategoryTabs
            activeCategory="ziyadah"
            mode="input"
            studentId={selectedStudentId}
            date={routeDate}
          />

          {/* 4. Form Awal & Akhir Setoran */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-brand-navy">Awal</label>
                <div className="relative mt-1">
                  <select
                    value={surahStart}
                    onChange={(e) => setSurahStart(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-brand-line bg-white py-2 pl-2.5 pr-7 text-xs font-medium text-brand-navy outline-none focus:border-brand-cyan"
                  >
                    {SURAH_LIST.map((s) => (
                      <option key={s.no} value={s.no}>
                        {s.no}. {s.nameLatin}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-brand-navy">Ayat</label>
                <input
                  type="number"
                  min="1"
                  value={ayatStart}
                  onChange={(e) => setAyatStart(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line bg-white py-2 px-3 text-xs font-medium text-brand-navy outline-none focus:border-brand-cyan"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-brand-navy">Akhir</label>
                <div className="relative mt-1">
                  <select
                    value={surahEnd}
                    onChange={(e) => setSurahEnd(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-brand-line bg-white py-2 pl-2.5 pr-7 text-xs font-medium text-brand-navy outline-none focus:border-brand-cyan"
                  >
                    {SURAH_LIST.map((s) => (
                      <option key={s.no} value={s.no}>
                        {s.no}. {s.nameLatin}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-brand-navy">Ayat</label>
                <input
                  type="number"
                  min="1"
                  value={ayatEnd}
                  onChange={(e) => setAyatEnd(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line bg-white py-2 px-3 text-xs font-medium text-brand-navy outline-none focus:border-brand-cyan"
                />
              </div>
            </div>
          </div>

          {/* 5. Card Penilaian Range */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-xs">
            <h3 className="mb-4 text-xs font-bold text-brand-navy">Penilaian</h3>
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
          </div>

          {/* 6. Catatan Input */}
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

          {/* 7. Action Button */}
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
