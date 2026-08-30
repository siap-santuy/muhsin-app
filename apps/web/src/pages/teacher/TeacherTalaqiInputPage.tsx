import { useState, useEffect } from "react";
import { ArrowLeft, Check, Loader2, Save, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface StudentOption {
  id: string;
  name: string;
}

export function TeacherTalaqiInputPage() {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [materi, setMateri] = useState("Surah An-Naba: 1-10");
  const [makhroj, setMakhroj] = useState("85");
  const [tajwid, setTajwid] = useState("90");
  const [kelancaran, setKelancaran] = useState("88");
  const [fashohah, setFashohah] = useState("82");
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [saved, setSaved] = useState(false);
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

        const talaqi = categories.find(
          (c) => c.code === "talaqi" || c.name.toLowerCase().includes("talaqi")
        );
        if (talaqi) {
          setSubcategoryId(talaqi.id);
        } else if (categories.length > 0) {
          setSubcategoryId(categories[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data");
      } finally {
        setInitLoading(false);
      }
    }
    init();
  }, []);

  async function handleSave() {
    if (!selectedStudentId) {
      setError("Pilih siswa terlebih dahulu");
      return;
    }
    if (!subcategoryId) {
      setError("Kategori Talaqi tidak ditemukan");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const savedEntry = await api.createSetoran({
        studentId: selectedStudentId,
        subcategoryId: subcategoryId,
        date: new Date().toISOString().slice(0, 10),
        referenceStart: { materi },
        scores: {
          makhroj: Number(makhroj),
          tajwid: Number(tajwid),
          kelancaran: Number(kelancaran),
          fashohah: Number(fashohah),
        },
        keterangan: catatan || null,
        scoreFieldKeys: ["makhroj", "tajwid", "kelancaran", "fashohah"],
      });

      sessionStorage.setItem("lastSetoranId", savedEntry.id);
      setSaved(true);
      setTimeout(() => {
        window.location.hash = "#/talaqi-view";
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencatat talaqi");
    } finally {
      setLoading(false);
    }
  }

  if (initLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-page">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between bg-brand-page px-4 py-3">
        <button
          type="button"
          onClick={() => (window.location.hash = "#/students")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10"
        >
          <ArrowLeft className="h-4 w-4 text-indigo-600" />
        </button>
        <h1 className="text-xl font-bold text-indigo-600">Input Talaqi</h1>
        <div className="h-10 w-10" />
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-12 pt-1">
        <div className="flex flex-col gap-4">
          {error ? (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
              {error}
            </div>
          ) : null}

          {/* Siswa Selector */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              SISWA
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-bold text-brand-navy outline-none shadow-sm transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 cursor-pointer"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Form Talaqi */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-brand-line/40 pb-2">
              <Volume2 className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-brand-navy">Materi Talaqi</h2>
            </div>

            <div>
              <label className="text-[11px] font-bold text-brand-navy">Materi / Ayat</label>
              <input
                type="text"
                value={materi}
                onChange={(e) => setMateri(e.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Nilai 4 Aspek */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-brand-navy border-b border-brand-line/40 pb-2">
              Detail Penilaian Talaqi (0 - 100)
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-brand-navy">Makhroj</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={makhroj}
                  onChange={(e) => setMakhroj(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-bold text-indigo-600 outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-brand-navy">Tajwid</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tajwid}
                  onChange={(e) => setTajwid(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-bold text-indigo-600 outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-brand-navy">Kelancaran</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={kelancaran}
                  onChange={(e) => setKelancaran(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-bold text-indigo-600 outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-brand-navy">Fashohah</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={fashohah}
                  onChange={(e) => setFashohah(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-bold text-indigo-600 outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-brand-navy">Catatan Evaluasi</label>
              <textarea
                rows={3}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan talaqi..."
                className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-medium text-brand-navy outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Save Button */}
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="h-11 w-full rounded-xl bg-indigo-600 font-bold uppercase tracking-wider text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Tersimpan!
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Simpan Talaqi
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
