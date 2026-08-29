import { useState } from "react";
import {
  CheckCircle2,
  Copy,
  Info,
  Lock,
  Plus,
} from "lucide-react";
import { KoorShell } from "@/components/layout/KoorShell";
import { Pagination } from "@/components/ui/Pagination";

interface ScoreField {
  key: string;
  label: string;
  min: number;
  max: number;
  isLocked: boolean;
}

interface Subcategory {
  id: string;
  code: string;
  name: string;
  includeInRanking: boolean;
  scoreFields: ScoreField[];
}

interface Category {
  id: string;
  code: string;
  name: string;
  subcategories: Subcategory[];
}

const INITIAL_CATEGORIES: Category[] = [
  {
    id: "cat_tahfidz",
    code: "TAHFIDZ",
    name: "Tahfidz Al-Qur'an",
    subcategories: [
      {
        id: "sub_ziyadah",
        code: "ZIYADAH",
        name: "Ziyadah (Hafalan Baru)",
        includeInRanking: true,
        scoreFields: [
          { key: "tajwid_surah", label: "Tajwid (Per Surah)", min: 0, max: 100, isLocked: true },
          { key: "kelancaran_surah", label: "Kelancaran (Per Surah)", min: 0, max: 100, isLocked: true },
          { key: "tajwid_total", label: "Tajwid (Keseluruhan)", min: 0, max: 100, isLocked: true },
          { key: "kelancaran_total", label: "Kelancaran (Keseluruhan)", min: 0, max: 100, isLocked: true },
        ],
      },
      {
        id: "sub_murojaah",
        code: "MUROJAAH",
        name: "Muroja'ah (Hafalan Lama)",
        includeInRanking: false,
        scoreFields: [
          { key: "tajwid", label: "Tajwid", min: 0, max: 100, isLocked: true },
          { key: "kelancaran", label: "Kelancaran", min: 0, max: 100, isLocked: true },
        ],
      },
    ],
  },
  {
    id: "cat_tahsin",
    code: "TAHSIN",
    name: "Tahsin & Tilawah",
    subcategories: [
      {
        id: "sub_sabiq",
        code: "SABIQ",
        name: "Sabiq (Bacaan Baru)",
        includeInRanking: false,
        scoreFields: [
          { key: "mad", label: "Mad", min: 0, max: 100, isLocked: true },
          { key: "makhroj", label: "Makhroj", min: 0, max: 100, isLocked: true },
          { key: "ghunnah", label: "Ghunnah", min: 0, max: 100, isLocked: true },
          { key: "kelancaran", label: "Kelancaran", min: 0, max: 100, isLocked: true },
        ],
      },
      {
        id: "sub_talaqi",
        code: "TALAQI",
        name: "Talaqi (Kelancaran)",
        includeInRanking: false,
        scoreFields: [
          { key: "kelancaran", label: "Kelancaran", min: 0, max: 100, isLocked: true },
        ],
      },
    ],
  },
];

const GRADING_SCALE = [
  { min: 91, max: 100, letter: "A", labelLatin: "Mumtaz", labelArab: "ممتاز" },
  { min: 80, max: 90, letter: "B", labelLatin: "Jayyid Jiddan", labelArab: "جيد جدا" },
  { min: 70, max: 79, letter: "C", labelLatin: "Jayyid", labelArab: "جيد" },
  { min: 51, max: 69, letter: "D", labelLatin: "Maqbul", labelArab: "مقبول" },
  { min: 31, max: 50, letter: "E", labelLatin: "Dhaif", labelArab: "ضعيف" },
  { min: 0, max: 30, letter: "F", labelLatin: "Dhaif Jiddan", labelArab: "ضعيف جدا" },
];

export function KoorKurikulumPage() {
  const [activeTab, setActiveTab] = useState<"kategori" | "grading" | "versioning">("kategori");
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [gradingPage, setGradingPage] = useState(1);

  const GRADING_PAGE_SIZE = 4;
  const totalGradingPages = Math.max(1, Math.ceil(GRADING_SCALE.length / GRADING_PAGE_SIZE));
  const paginatedGrading = GRADING_SCALE.slice(
    (gradingPage - 1) * GRADING_PAGE_SIZE,
    gradingPage * GRADING_PAGE_SIZE
  );

  return (
    <KoorShell
      activePath="kurikulum"
      title="Pengaturan Kurikulum & Penilaian TTQ"
      subtitle="Konfigurasi 2-Level Kategori, Field Penilaian Dinamis, & Skala Nilai"
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-brand-line/60 bg-white p-5 shadow-sm md:flex-row md:items-center">
          <div>
            <h1 className="text-lg font-black text-brand-navy">
              Struktur Penilaian TTQ (SaaS Multi-Tenant)
            </h1>
            <p className="text-xs text-brand-text-muted">
              Tahun Ajaran 2026/2027 &bull; Struktur 2 Level (Kategori &gt; Sub-kategori)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => alert("Clone struktur dari tahun ajaran sebelumnya")}
              className="flex items-center gap-1.5 rounded-xl border border-brand-line bg-white px-3.5 py-2 text-xs font-bold text-brand-navy shadow-sm hover:border-brand-cyan"
            >
              <Copy className="h-4 w-4 text-brand-navy/60" />
              <span>Clone Struktur Periode</span>
            </button>
            <button
              type="button"
              onClick={() => alert("Tambah Kategori Baru")}
              className="flex items-center gap-1.5 rounded-xl bg-brand-navy px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-navy/90"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Kategori</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-brand-line/40 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("kategori")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "kategori"
                ? "bg-brand-navy text-white shadow-xs"
                : "bg-white text-brand-navy border border-brand-line/60 hover:bg-brand-page"
            }`}
          >
            Kategori &amp; Sub-Kategori Penilaian
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("grading")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "grading"
                ? "bg-brand-navy text-white shadow-xs"
                : "bg-white text-brand-navy border border-brand-line/60 hover:bg-brand-page"
            }`}
          >
            Skala Konversi Value (Grading Scale)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("versioning")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "versioning"
                ? "bg-brand-navy text-white shadow-xs"
                : "bg-white text-brand-navy border border-brand-line/60 hover:bg-brand-page"
            }`}
          >
            Aturan Penguncian &amp; Periode
          </button>
        </div>

        {/* Tab 1: Kategori & Sub-kategori */}
        {activeTab === "kategori" && (
          <div className="space-y-6">
            {/* Info Banner Locking Rules */}
            <div className="flex items-start gap-3 rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4 text-xs text-brand-navy">
              <Info className="h-5 w-5 shrink-0 text-brand-cyan-dark" />
              <div>
                <p className="font-bold">
                  Aturan Fleksibilitas Penilaian (PROJECT.md #4.2.1)
                </p>
                <p className="mt-0.5 text-brand-text-muted">
                  Menambah sub-kategori/field baru <span className="font-semibold text-brand-navy">selalu diperbolehkan</span>. Field yang sudah pernah diisi nilai oleh guru ditandai <span className="font-bold text-amber-700">🔒 Terkunci</span> agar rekapitulasi nilai 1 tahun ajaran tetap konsisten. Restrukturisasi total bebas dilakukan saat berganti tahun ajaran baru.
                </p>
              </div>
            </div>

            {/* List Categories */}
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="space-y-4 rounded-2xl border border-brand-line/60 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-brand-line/40 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-navy text-xs font-black text-white">
                      {cat.code.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-brand-navy">
                        {cat.name}
                      </h3>
                      <span className="text-[10px] font-bold text-brand-text-muted">
                        Kode: {cat.code} &bull; {cat.subcategories.length} Sub-Kategori
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => alert(`Tambah Sub-kategori ke ${cat.name}`)}
                    className="flex items-center gap-1 rounded-lg bg-brand-navy/10 px-3 py-1.5 text-xs font-bold text-brand-navy hover:bg-brand-navy hover:text-white transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Sub-Kategori</span>
                  </button>
                </div>

                {/* Subcategories list */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {cat.subcategories.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex flex-col justify-between rounded-xl border border-brand-line/40 bg-brand-page p-4"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="rounded-md bg-brand-navy/5 px-1.5 py-0.5 text-[9px] font-extrabold text-brand-navy">
                              {sub.code}
                            </span>
                            <h4 className="mt-1 text-xs font-bold text-brand-navy">
                              {sub.name}
                            </h4>
                          </div>

                          {sub.includeInRanking ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800">
                              Basis Ranking Utama
                            </span>
                          ) : null}
                        </div>

                        {/* Dynamic Score Fields */}
                        <div className="mt-3 space-y-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                            Field Penilaian (JSONB Score Fields):
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {sub.scoreFields.map((field) => (
                              <span
                                key={field.key}
                                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold ${
                                  field.isLocked
                                    ? "border-amber-200 bg-amber-50 text-amber-900"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-900"
                                }`}
                              >
                                {field.isLocked ? (
                                  <Lock className="h-2.5 w-2.5 text-amber-600" />
                                ) : (
                                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                )}
                                <span>{field.label}</span>
                                <span className="text-[9px] text-gray-400">
                                  ({field.min}-{field.max})
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-brand-line/20 pt-2.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => alert(`Tambah Field ke ${sub.name}`)}
                          className="font-bold text-brand-cyan-dark hover:underline"
                        >
                          + Tambah Field Baru
                        </button>
                        <button
                          type="button"
                          onClick={() => alert(`Edit ${sub.name}`)}
                          className="text-gray-500 hover:text-brand-navy"
                        >
                          Edit Sub-Kategori
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Grading Scale */}
        {activeTab === "grading" && (
          <div className="rounded-2xl border border-brand-line/60 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-brand-line/40 pb-3">
              <div>
                <h3 className="text-sm font-bold text-brand-navy">
                  Skala Konversi Nilai Setoran &rarr; Huruf Mutu
                </h3>
                <p className="text-xs text-brand-text-muted">
                  Konversi otomatis nilai angka rata-rata setoran ke sebutan Latin &amp; Arab
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert("Ubah Skala Grading")}
                className="rounded-xl border border-brand-line px-3 py-1.5 text-xs font-bold text-brand-navy hover:border-brand-cyan"
              >
                Edit Skala
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-brand-navy">
                <thead className="bg-brand-page text-[11px] font-bold uppercase tracking-wider text-brand-text-muted">
                  <tr>
                    <th className="px-4 py-3">Rentang Angka</th>
                    <th className="px-4 py-3">Huruf Mutu</th>
                    <th className="px-4 py-3">Kategori Mutu (Latin)</th>
                    <th className="px-4 py-3">Kategori Mutu (Arab)</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line/40 font-medium">
                  {paginatedGrading.map((gr) => (
                    <tr key={gr.letter} className="hover:bg-brand-page/50">
                      <td className="px-4 py-3 font-bold">
                        {gr.min} &ndash; {gr.max}
                      </td>
                      <td className="px-4 py-3 font-black text-brand-navy text-sm">
                        {gr.letter}
                      </td>
                      <td className="px-4 py-3 font-semibold">{gr.labelLatin}</td>
                      <td className="px-4 py-3 font-bold text-right md:text-left text-brand-navy">
                        {gr.labelArab}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                          Aktif
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-brand-line/40 pt-3 sm:flex-row sm:items-center sm:justify-between text-xs text-brand-text-muted">
              <span>Menampilkan <span className="font-bold text-brand-navy">{paginatedGrading.length}</span> dari <span className="font-bold text-brand-navy">{GRADING_SCALE.length}</span> skala nilai</span>
              <Pagination page={gradingPage} totalPages={totalGradingPages} onPageChange={setGradingPage} />
            </div>
          </div>
        )}

        {/* Tab 3: Aturan Penguncian & Restrukturisasi */}
        {activeTab === "versioning" && (
          <div className="rounded-2xl border border-brand-line/60 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-brand-navy">
              Mekanisme Kunci &amp; Versioning Tahun Ajaran
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <span>Kunci Berbasis Pemakaian Data</span>
                </div>
                <p className="text-xs text-amber-900/80 leading-relaxed">
                  Begitu ada minimal 1 data setoran siswa yang tercatat memakai field tertentu, field tersebut otomatis terkunci untuk dihapus/diubah namanya selama tahun ajaran berjalan.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs">
                  <Copy className="h-4 w-4 text-emerald-600" />
                  <span>Restrukturisasi Pergantian Tahun</span>
                </div>
                <p className="text-xs text-emerald-900/80 leading-relaxed">
                  Di awal tahun ajaran baru, Koordinator dapat meng-copy struktur periode lama ke periode baru. Baris baru belum punya data, sehingga bebas diubah/dihapus total tanpa merusak laporan histori.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </KoorShell>
  );
}

export default function KoorKurikulumPageWrapper() {
  return <KoorKurikulumPage />;
}
