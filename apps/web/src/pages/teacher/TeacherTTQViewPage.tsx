import { useState, useEffect } from "react";
import { Edit, Loader2, BookOpen, ShieldCheck, RefreshCw, X, Check } from "lucide-react";
import { formatLocalDate } from "@/utils/date";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import {
  TTQHeader,
  TTQAttendanceRow,
  type TTQCategoryType,
} from "@/components/teacher/TTQComponents";

interface StudentOption {
  id: string;
  name: string;
  className: string | null;
}

interface TeacherTTQViewPageProps {
  initialCategory?: TTQCategoryType;
}

export function TeacherTTQViewPage({
  initialCategory = "ziyadah",
}: TeacherTTQViewPageProps) {
  const currentUser = useAuthStore((s) => s.user);
  const hash = window.location.hash;
  const queryParams = new URLSearchParams(hash.split("?")[1] || "");
  const routeDate = queryParams.get("date") || formatLocalDate(new Date());
  const routeStudentId =
    queryParams.get("studentId") ||
    sessionStorage.getItem("selectedStudentId") ||
    "";

  const [student, setStudent] = useState<StudentOption | null>(null);
  const [entry, setEntry] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal ubah kategori
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedTargetCatId, setSelectedTargetCatId] = useState<string>("");
  const [submittingChange, setSubmittingChange] = useState(false);

  const categoryTitle =
    initialCategory === "ziyadah"
      ? "Ziyadah"
      : initialCategory === "murojaah"
      ? "Muroja'ah"
      : initialCategory === "sabiq"
      ? "Sabiq"
      : "Talaqi";

  useEffect(() => {
    async function init() {
      try {
        const [studentList, catList] = await Promise.all([
          api.getStudents(),
          api.getAssessmentCategories(),
        ]);

        setCategories(catList);
        const currentStudent =
          studentList.find((s) => s.id === routeStudentId) || studentList[0] || null;
        setStudent(currentStudent);

        if (currentStudent) {
          const cat = catList.find(
            (c) =>
              c.code?.toLowerCase() === initialCategory.toLowerCase() ||
              c.code?.toLowerCase().includes(initialCategory.toLowerCase()) ||
              c.name
                ?.toLowerCase()
                .includes(initialCategory === "murojaah" ? "muroja" : initialCategory)
          );

          const history = await api.getSetoranHistory({
            studentId: currentStudent.id,
            subcategoryId: cat?.id,
          });

          const found =
            history.find((h: any) => h.date === routeDate) || history[0];
          setEntry(found || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [routeStudentId, routeDate, initialCategory]);

  function handleEdit() {
    if (student?.id) {
      window.location.hash = `#/${initialCategory}-input?studentId=${student.id}&date=${routeDate}`;
    }
  }

  async function handleConfirmCategoryChange() {
    if (!entry?.id || !selectedTargetCatId) return;
    const targetCat = categories.find((c) => c.id === selectedTargetCatId);
    if (!targetCat) return;

    setSubmittingChange(true);
    try {
      // Map skor yang kompatibel dengan field subkategori baru
      const targetFields = (targetCat.scoreFields || []).map((f: any) => f.key);
      const newScores: Record<string, number> = {};
      for (const key of targetFields) {
        newScores[key] = entry.scores?.[key] !== undefined ? Number(entry.scores[key]) : 80;
      }

      await api.correctSetoran(entry.id, {
        targetSubcategoryId: targetCat.id,
        scores: newScores,
        scoreFieldKeys: targetFields,
        referenceStart: entry.referenceStart,
        referenceEnd: entry.referenceEnd,
        keterangan: entry.keterangan,
      });

      toast.success(`Kategori berhasil diubah ke ${targetCat.name}`);
      setIsCategoryModalOpen(false);

      // Redirect ke tab kategori yang baru
      const targetCode = targetCat.code?.toLowerCase() || "";
      const routePrefix = targetCode.includes("ziyadah")
        ? "ziyadah"
        : targetCode.includes("muroja")
        ? "murojaah"
        : targetCode.includes("sabiq")
        ? "sabiq"
        : "talaqi";

      window.location.hash = `#/${routePrefix}-view?studentId=${student?.id}&date=${routeDate}`;
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah kategori");
    } finally {
      setSubmittingChange(false);
    }
  }

  // Parse attendance & notes
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
          {/* 1. Header Siswa & Kategori Fokus (Single Source of Truth) */}
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
                  {student?.name ?? "Siswa"}
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

          {/* 2. Status Kehadiran (Horizontal Row with Badge Pill) */}
          <TTQAttendanceRow mode="view" value={statusKehadiran} />

          {/* 3. Detail Card (Clean without form borders, exactly matching Figma) */}
          <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-brand-navy" />
              <h3 className="text-sm font-extrabold text-brand-navy">
                {initialCategory === "sabiq"
                  ? "Tahsin"
                  : initialCategory === "talaqi"
                  ? "Tahfidz"
                  : "Tahfidz"}
              </h3>
            </div>

            {initialCategory === "sabiq" ? (
              <p className="text-sm font-extrabold uppercase tracking-wide text-[#22bad0]">
                {entry?.referenceStart?.jilid
                  ? entry?.referenceEnd?.jilid &&
                    entry.referenceEnd.jilid !== entry.referenceStart.jilid
                    ? `Jilid ${entry.referenceStart.jilid} Hal: ${entry.referenceStart.halaman ?? 1} s/d Jilid ${entry.referenceEnd.jilid} Hal: ${entry.referenceEnd.halaman ?? 1}`
                    : `Jilid ${entry.referenceStart.jilid}: ${entry.referenceStart.halaman ?? 1}${
                        entry?.referenceEnd?.halaman &&
                        entry.referenceEnd.halaman !== entry.referenceStart.halaman
                          ? ` - ${entry.referenceEnd.halaman}`
                          : ""
                      }`
                  : "-"}
              </p>
            ) : (
              <p className="text-sm font-extrabold uppercase tracking-wide text-[#22bad0]">
                {entry?.referenceStart?.surah
                  ? entry?.referenceEnd?.surah &&
                    entry.referenceEnd.surah !== entry.referenceStart.surah
                    ? `${entry.referenceStart.surah}: ${entry.referenceStart.ayat ?? 1} s/d ${entry.referenceEnd.surah}: ${entry.referenceEnd.ayat ?? 1}`
                    : `${entry.referenceStart.surah}: ${entry.referenceStart.ayat ?? 1}${
                        entry?.referenceEnd?.ayat &&
                        entry.referenceEnd.ayat !== entry.referenceStart.ayat
                          ? `-${entry.referenceEnd.ayat}`
                          : ""
                      }`
                  : "-"}
              </p>
            )}
          </div>

          {/* 4. Card Penilaian (Clean lines matching Figma) */}
          <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-brand-navy" />
              <h3 className="text-sm font-extrabold text-brand-navy">
                Penilaian
              </h3>
            </div>

            {initialCategory === "sabiq" ? (
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-navy">
                    Makhraj
                  </span>
                  <span className="text-base font-extrabold text-[#22bad0]">
                    {entry?.scores?.makhraj ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-navy">
                    Mad
                  </span>
                  <span className="text-base font-extrabold text-[#22bad0]">
                    {entry?.scores?.mad ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-navy">
                    Ghunnah
                  </span>
                  <span className="text-base font-extrabold text-[#22bad0]">
                    {entry?.scores?.ghunnah ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-navy">
                    Qolqolah
                  </span>
                  <span className="text-base font-extrabold text-[#22bad0]">
                    {entry?.scores?.qolqolah ?? 0}
                  </span>
                </div>
              </div>
            ) : initialCategory === "talaqi" ? (
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-navy">
                    Kelancaran
                  </span>
                  <span className="text-base font-extrabold text-[#22bad0]">
                    {entry?.scores?.kelancaran ?? 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-navy">
                    Tajwid
                  </span>
                  <span className="text-base font-extrabold text-[#22bad0]">
                    {entry?.scores?.tajwid ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-navy">
                    Kelancaran
                  </span>
                  <span className="text-base font-extrabold text-[#22bad0]">
                    {entry?.scores?.kelancaran ?? 0}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 5. Catatan (Opsional) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-brand-navy">
              Catatan (Opsional)
            </label>
            {rawCatatan?.trim() ? (
              <div className="rounded-2xl border-l-4 border-[#f5a623] bg-[#fffbf2] p-4 shadow-xs">
                <p className="text-xs italic text-brand-navy leading-relaxed">
                  &quot;{rawCatatan.trim()}&quot;
                </p>
                <p className="mt-2.5 text-[11px] font-bold text-brand-navy">
                  - {currentUser?.name || "Ustadz Pembimbing"}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-brand-line bg-gray-50/70 p-3.5 text-center">
                <p className="text-xs text-brand-text-muted">
                  Tidak ada catatan evaluasi untuk setoran ini.
                </p>
              </div>
            )}
          </div>

          {/* 6. Action Buttons: Ubah Penilaian & Ubah Kategori (Sejajar) */}
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleEdit}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#f5a623] hover:bg-[#e09612] active:scale-[0.99] py-3.5 text-xs font-extrabold tracking-wider text-white shadow-sm transition-all"
            >
              <Edit className="h-4 w-4" />
              <span>UBAH PENILAIAN</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const other = categories.find((c) => c.id !== entry?.subcategoryId);
                setSelectedTargetCatId(other?.id || "");
                setIsCategoryModalOpen(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-brand-cyan bg-white text-brand-cyan hover:bg-brand-cyan/10 active:scale-[0.99] py-3.5 text-xs font-extrabold tracking-wider shadow-sm transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              <span>UBAH KATEGORI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Dialog Ubah Kategori */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-brand-line bg-white p-5 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-brand-line/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-extrabold text-brand-navy">
                  Ubah Kategori Setoran
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-brand-text-muted">
                Pindahkan nilai setoran santri dari kategori <b>{categoryTitle}</b> ke kategori yang seharusnya:
              </p>

              <div className="space-y-2">
                {categories.map((cat) => {
                  const isCurrent = cat.id === entry?.subcategoryId;
                  const isSelected = selectedTargetCatId === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => setSelectedTargetCatId(cat.id)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                        isCurrent
                          ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                          : isSelected
                          ? "border-brand-cyan bg-cyan-50/50 shadow-xs ring-1 ring-brand-cyan"
                          : "border-brand-line hover:border-brand-cyan/60"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-brand-navy">
                          {cat.name}
                        </p>
                        <p className="text-[10px] text-brand-text-muted">
                          {isCurrent ? "Kategori saat ini" : `${cat.scoreFields?.length || 0} kriteria penilaian`}
                        </p>
                      </div>
                      {isSelected && !isCurrent && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-cyan text-white">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl bg-amber-50 p-2.5 text-[11px] text-amber-800 border border-amber-200/60">
                Poin EXP santri tetap aman dan tidak akan terhitung ganda (double).
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                disabled={submittingChange}
                className="flex-1 rounded-xl border border-brand-line py-2.5 text-xs font-bold text-brand-navy hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCategoryChange}
                disabled={submittingChange || !selectedTargetCatId}
                className="flex-1 rounded-xl bg-brand-cyan hover:bg-[#1bb0c7] py-2.5 text-xs font-extrabold text-white shadow-xs transition-all disabled:opacity-50"
              >
                {submittingChange ? "Menyimpan..." : "Terapkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TeacherZiyadahViewPage() {
  return <TeacherTTQViewPage initialCategory="ziyadah" />;
}

export function TeacherMurojaahViewPage() {
  return <TeacherTTQViewPage initialCategory="murojaah" />;
}

export function TeacherSabiqViewPage() {
  return <TeacherTTQViewPage initialCategory="sabiq" />;
}

export function TeacherTalaqiViewPage() {
  return <TeacherTTQViewPage initialCategory="talaqi" />;
}
