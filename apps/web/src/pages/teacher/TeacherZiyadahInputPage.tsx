import { useState, useEffect } from "react";
import { ArrowLeft, BookOpen, Check, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toastStore";
import { api } from "@/lib/api";

interface StudentOption {
  id: string;
  name: string;
}

export function TeacherZiyadahInputPage() {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [surah, setSurah] = useState("Al-Baqarah");
  const [ayatMulai, setAyatMulai] = useState("1");
  const [ayatSelesai, setAyatSelesai] = useState("5");
  const [tajwid, setTajwid] = useState("90");
  const [kelancaran, setKelancaran] = useState("85");
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

        const ziyadah = categories.find(
          (c) => c.code === "ziyadah" || c.name.toLowerCase().includes("ziyadah")
        );
        if (ziyadah) {
          setSubcategoryId(ziyadah.id);
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
      const msg = "Pilih siswa terlebih dahulu";
      setError(msg);
      toast.warning(msg);
      return;
    }
    if (!subcategoryId) {
      const msg = "Kategori Ziyadah tidak ditemukan";
      setError(msg);
      toast.warning(msg);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const savedEntry = await api.createSetoran({
        studentId: selectedStudentId,
        subcategoryId: subcategoryId,
        date: new Date().toISOString().slice(0, 10),
        referenceStart: { surah, ayat: Number(ayatMulai) },
        referenceEnd: { surah, ayat: Number(ayatSelesai) },
        scores: {
          tajwid: Number(tajwid),
          kelancaran: Number(kelancaran),
        },
        keterangan: catatan || null,
        scoreFieldKeys: ["tajwid", "kelancaran"],
      });

      sessionStorage.setItem("lastSetoranId", savedEntry.id);
      toast.success("Setoran Ziyadah berhasil disimpan!");
      setSaved(true);
      setTimeout(() => {
        window.location.hash = "#/ziyadah-view";
      }, 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mencatat setoran";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
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
          onClick={() => (window.location.hash = "#/students")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-cyan/10"
        >
          <ArrowLeft className="h-4 w-4 text-brand-cyan" />
        </button>
        <h1 className="text-xl font-bold text-brand-cyan">Input Ziyadah</h1>
        <div className="h-10 w-10" />
      </div>

      {/* Form */}
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
              className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-bold text-brand-navy outline-none shadow-sm transition-all focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 cursor-pointer"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Hafalan Form */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-brand-line/40 pb-2">
              <BookOpen className="h-4 w-4 text-brand-cyan" />
              <h2 className="text-sm font-bold text-brand-navy">Capaian Hafalan</h2>
            </div>

            <div>
              <label className="text-[11px] font-bold text-brand-navy">Surah</label>
              <input
                type="text"
                value={surah}
                onChange={(e) => setSurah(e.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-brand-navy">Ayat Mulai</label>
                <input
                  type="number"
                  min="1"
                  value={ayatMulai}
                  onChange={(e) => setAyatMulai(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-brand-navy">Ayat Selesai</label>
                <input
                  type="number"
                  min="1"
                  value={ayatSelesai}
                  onChange={(e) => setAyatSelesai(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                />
              </div>
            </div>
          </div>

          {/* Penilaian Form */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-brand-navy border-b border-brand-line/40 pb-2">
              Nilai Performance (0 - 100)
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-brand-navy">Tajwid</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tajwid}
                  onChange={(e) => setTajwid(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-bold text-brand-cyan outline-none focus:border-brand-cyan"
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
                  className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-bold text-brand-cyan outline-none focus:border-brand-cyan"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-brand-navy">Catatan Evaluasi</label>
              <textarea
                rows={3}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan untuk siswa (opsional)..."
                className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-medium text-brand-navy outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          {/* Save Button */}
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="h-11 w-full rounded-xl bg-brand-cyan font-bold uppercase tracking-wider text-white shadow-sm hover:bg-brand-cyan-dark disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Tersimpan!
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Simpan Setoran Ziyadah
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
