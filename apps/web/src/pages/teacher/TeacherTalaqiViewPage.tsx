import { useState, useEffect } from "react";
import { ChevronDown, Edit, Loader2 } from "lucide-react";
import { formatLocalDate } from "@/utils/date";
import { api } from "@/lib/api";
import {
  TTQHeader,
  TTQCategoryTabs,
} from "@/components/teacher/TTQComponents";

interface StudentOption {
  id: string;
  name: string;
  className: string | null;
}

export function TeacherTalaqiViewPage() {
  const hash = window.location.hash;
  const queryParams = new URLSearchParams(hash.split("?")[1] || "");
  const routeDate = queryParams.get("date") || formatLocalDate(new Date());
  const routeStudentId = queryParams.get("studentId") || sessionStorage.getItem("selectedStudentId") || "";

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(routeStudentId);
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const studentList = await api.getStudents();
        setStudents(studentList);

        const currentId = routeStudentId || (studentList[0] ? studentList[0].id : "");
        setSelectedStudentId(currentId);

        if (currentId) {
          const categories = await api.getAssessmentCategories();
          const talaqi = categories.find(
            (c) => c.code === "talaqi" || c.name.toLowerCase().includes("talaqi")
          );

          const history = await api.getSetoranHistory({
            studentId: currentId,
            subcategoryId: talaqi?.id,
          });

          const found = history.find((h: any) => h.date === routeDate) || history[0];
          setEntry(found || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat detail talaqi");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [routeStudentId, routeDate]);

  function handleStudentChange(newId: string) {
    setSelectedStudentId(newId);
    sessionStorage.setItem("selectedStudentId", newId);
    window.location.hash = `#/talaqi-view?studentId=${newId}&date=${routeDate}`;
  }

  function handleEdit() {
    window.location.hash = `#/talaqi-input?studentId=${selectedStudentId}&date=${routeDate}`;
  }

  const startSurah = entry?.referenceStart?.surah || "Al-Fatihah";
  const startAyat = entry?.referenceStart?.ayat ?? 1;
  const endSurah = entry?.referenceEnd?.surah || "Al-Fatihah";
  const endAyat = entry?.referenceEnd?.ayat ?? 7;

  const kelancaranScore = entry?.scores?.kelancaran ?? 90;

  let rawCatatan = entry?.keterangan || "";
  let statusKehadiran = "Hadir";
  if (rawCatatan.startsWith("[")) {
    const match = rawCatatan.match(/^\[(.*?)\]\s*(.*)$/);
    if (match) {
      statusKehadiran = match[1] || "Hadir";
      rawCatatan = match[2] || "";
    }
  }

  if (loading) {
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

        <div className="flex flex-col gap-4">
          {/* 1. Dropdown Siswa */}
          <div className="relative">
            <select
              value={selectedStudentId}
              onChange={(e) => handleStudentChange(e.target.value)}
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

          {/* 2. Status Kehadiran Pill */}
          <div className="flex justify-end">
            <span className="rounded-full border border-emerald-400 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-600">
              {statusKehadiran}
            </span>
          </div>

          {/* 3. Segmented Tabs Category */}
          <TTQCategoryTabs
            activeCategory="talaqi"
            mode="view"
            studentId={selectedStudentId}
            date={routeDate}
          />

          {/* 4. Detail Surah & Ayat */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-bold text-brand-navy">Awal</p>
                <div className="mt-1 flex items-center justify-between rounded-xl border border-brand-line bg-gray-50/70 py-2.5 px-3">
                  <span className="text-xs font-bold text-brand-navy truncate">{startSurah}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-brand-navy">Ayat</p>
                <div className="mt-1 flex items-center rounded-xl border border-brand-line bg-gray-50/70 py-2.5 px-3">
                  <span className="text-xs font-bold text-brand-navy">{startAyat}</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-brand-navy">Akhir</p>
                <div className="mt-1 flex items-center justify-between rounded-xl border border-brand-line bg-gray-50/70 py-2.5 px-3">
                  <span className="text-xs font-bold text-brand-navy truncate">{endSurah}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-brand-navy">Ayat</p>
                <div className="mt-1 flex items-center rounded-xl border border-brand-line bg-gray-50/70 py-2.5 px-3">
                  <span className="text-xs font-bold text-brand-navy">{endAyat}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Card Penilaian */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-xs">
            <h3 className="mb-3 text-xs font-bold text-brand-navy">Penilaian</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-navy">Kelancaran</span>
              <span className="text-sm font-extrabold text-[#22bad0]">{kelancaranScore}</span>
            </div>
          </div>

          {/* 6. Catatan Pembimbing Box */}
          <div className="rounded-2xl border-l-4 border-[#f5a623] bg-[#fffaf0] p-4 shadow-xs">
            <p className="text-xs italic text-brand-navy leading-relaxed">
              &quot;{rawCatatan || "Santri menyimak dan menirukan talaqi dengan sangat baik dan tertib."}&quot;
            </p>
            <p className="mt-2 text-[11px] font-bold text-brand-navy">
              - Ustadz Pembimbing
            </p>
          </div>

          {/* 7. Action Button: Ubah Penilaian */}
          <button
            type="button"
            onClick={handleEdit}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f5a623] hover:bg-[#e09612] active:scale-[0.99] py-3.5 text-xs font-extrabold tracking-wider text-white shadow-sm transition-all"
          >
            <Edit className="h-4 w-4" />
            <span>UBAH PENILAIAN</span>
          </button>
        </div>
      </div>
    </div>
  );
}
