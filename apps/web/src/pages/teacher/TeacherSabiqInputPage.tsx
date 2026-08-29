import { useState } from "react";
import { ArrowLeft, Check, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TeacherSabiqInputPage() {
  const [student, setStudent] = useState("Fulan bin Fulan");
  const [jilid, setJilid] = useState("Sabiq Jilid 3");
  const [halamanMulai, setHalamanMulai] = useState("1");
  const [halamanSelesai, setHalamanSelesai] = useState("5");
  const [makhroj, setMakhroj] = useState("92");
  const [tajwid, setTajwid] = useState("95");
  const [kelancaran, setKelancaran] = useState("90");
  const [fashohah, setFashohah] = useState("88");
  const [catatan, setCatatan] = useState("Bagus, bacaan tartil dan makhraj fasih.");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => {
      window.location.hash = "#/sabiq-view";
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
        <h1 className="text-xl font-bold text-brand-cyan">Input Sabiq (Tahsin)</h1>
        <div className="h-10 w-10" />
      </div>

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

          {/* Form Sabiq */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-brand-line/40 pb-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <h2 className="text-sm font-bold text-brand-navy">Materi Sabiq Tahsin</h2>
            </div>

            <div>
              <label className="text-[11px] font-bold text-brand-navy">Jilid / Buku</label>
              <input
                type="text"
                value={jilid}
                onChange={(e) => setJilid(e.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-brand-navy">Halaman Mulai</label>
                <input
                  type="number"
                  value={halamanMulai}
                  onChange={(e) => setHalamanMulai(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-brand-navy">Halaman Selesai</label>
                <input
                  type="number"
                  value={halamanSelesai}
                  onChange={(e) => setHalamanSelesai(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                />
              </div>
            </div>
          </div>

          {/* Nilai 4 Aspek */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-brand-navy border-b border-brand-line/40 pb-2">
              Detail 4 Aspek Tahsin
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-brand-navy">Makhroj</label>
                <input
                  type="number"
                  value={makhroj}
                  onChange={(e) => setMakhroj(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-bold text-purple-600 outline-none focus:border-brand-cyan"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-brand-navy">Tajwid</label>
                <input
                  type="number"
                  value={tajwid}
                  onChange={(e) => setTajwid(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-bold text-purple-600 outline-none focus:border-brand-cyan"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-brand-navy">Kelancaran</label>
                <input
                  type="number"
                  value={kelancaran}
                  onChange={(e) => setKelancaran(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-bold text-purple-600 outline-none focus:border-brand-cyan"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-brand-navy">Fashohah</label>
                <input
                  type="number"
                  value={fashohah}
                  onChange={(e) => setFashohah(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-line bg-white p-2.5 text-xs font-bold text-purple-600 outline-none focus:border-brand-cyan"
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
            className="h-11 w-full rounded-xl bg-purple-600 font-bold uppercase tracking-wider text-white shadow-sm hover:bg-purple-700"
          >
            {saved ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Tersimpan!
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Simpan Sabiq Tahsin
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
