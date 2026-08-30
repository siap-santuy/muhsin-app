import { useState } from "react";
import { ArrowLeft, BookOpen, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function TeacherZiyadahInputPage() {
  const [student, setStudent] = useState("Fulan bin Fulan");
  const [surah, setSurah] = useState("Al-Baqarah");
  const [ayatMulai, setAyatMulai] = useState("1");
  const [ayatSelesai, setAyatSelesai] = useState("5");
  const [tajwid, setTajwid] = useState("90");
  const [kelancaran, setKelancaran] = useState("85");
  const [catatan, setCatatan] = useState("Makhraj huruf fa dan 'ain perlu diperhatikan.");
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    try {
      await api.createSetoran({
        studentId: "00000000-0000-0000-0000-000000000001",
        subcategoryId: "00000000-0000-0000-0000-000000000002",
        date: new Date().toISOString().slice(0, 10),
        referenceStart: { surah, ayat: Number(ayatMulai) },
        referenceEnd: { surah, ayat: Number(ayatSelesai) },
        scores: {
          tajwid: Number(tajwid),
          kelancaran: Number(kelancaran),
        },
        keterangan: catatan,
        scoreFieldKeys: ["tajwid", "kelancaran"],
      });
    } catch {
      // Offline/demo fallback
    }

    setSaved(true);
    setTimeout(() => {
      window.location.hash = "#/ziyadah-view";
    }, 1000);
  }

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between bg-brand-page px-4 py-3">
        <button
          type="button"
          onClick={() => (window.location.hash = "#/dashboard")}
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
          {/* Siswa Selector */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              SISWA
            </label>
              <select
                value={student}
                onChange={(e) => setStudent(e.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-bold text-brand-navy outline-none shadow-sm transition-all focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 cursor-pointer"
              >
              <option value="Fulan bin Fulan">Fulan bin Fulan (9991239201)</option>
              <option value="Ahmad Abdullah">Ahmad Abdullah (9991239202)</option>
              <option value="Muhammad Ali">Muhammad Ali (9991239203)</option>
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
                  value={ayatMulai}
                  onChange={(e) => setAyatMulai(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-brand-navy">Ayat Selesai</label>
                <input
                  type="number"
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
                  value={tajwid}
                  onChange={(e) => setTajwid(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-bold text-brand-cyan outline-none focus:border-brand-cyan"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-brand-navy">Kelancaran</label>
                <input
                  type="number"
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
                className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-medium text-brand-navy outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          {/* Save Button */}
          <Button
            type="button"
            onClick={handleSave}
            className="h-11 w-full rounded-xl bg-brand-cyan font-bold uppercase tracking-wider text-white shadow-sm hover:bg-brand-cyan-dark"
          >
            {saved ? (
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
