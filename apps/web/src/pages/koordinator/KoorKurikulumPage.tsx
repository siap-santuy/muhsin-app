import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { KoorShell } from "@/components/layout/KoorShell";
import { api } from "@/lib/api";

export function KoorKurikulumPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [gradingScale, setGradingScale] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"categories" | "grading">("categories");

  async function loadData() {
    try {
      const [cats, scale] = await Promise.all([
        api.getKurikulumCategories(),
        api.getGradingScale(),
      ]);
      setCategories(cats);
      setGradingScale(scale);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <KoorShell
      activePath="kurikulum"
      title="Kurikulum & Skema Penilaian TTQ"
      subtitle="Konfigurasi Kategori, Field Penilaian & Skala Nilai (PRD #4.1)"
    >
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-brand-line/60 bg-white p-5 shadow-sm md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-brand-cyan-dark">
                Tahun Ajaran: 2026/2027 (Aktif)
              </span>
            </div>
            <h1 className="mt-2 text-lg font-black text-brand-navy">
              Konfigurasi Penilaian TTQ Dinamis
            </h1>
            <p className="text-xs text-brand-text-muted">
              Data-driven: Seluruh sub-kategori, field nilai &amp; skala konversi dikonfigurasi per sekolah
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-brand-line/60 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "categories"
                ? "bg-brand-navy text-white shadow-sm"
                : "bg-white text-brand-navy/70 border border-brand-line hover:bg-gray-50"
            }`}
          >
            Kategori &amp; Field Nilai ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("grading")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "grading"
                ? "bg-brand-navy text-white shadow-sm"
                : "bg-white text-brand-navy/70 border border-brand-line hover:bg-gray-50"
            }`}
          >
            Skala Konversi Nilai Huruf
          </button>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
          </div>
        ) : activeTab === "categories" ? (
          <div className="space-y-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-brand-line/60 pb-3">
                  <div>
                    <span className="rounded-md bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-brand-cyan-dark">
                      KODE: {cat.code}
                    </span>
                    <h2 className="mt-1 text-base font-black text-brand-navy">
                      {cat.name}
                    </h2>
                  </div>
                </div>

                {/* Subcategories list */}
                <div className="grid gap-3 md:grid-cols-2">
                  {cat.subcategories.map((sub: any) => (
                    <div
                      key={sub.id}
                      className="rounded-xl border border-brand-line/60 bg-gray-50/50 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-brand-navy">
                          {sub.name}
                        </h3>
                        {sub.includeInRanking ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                            Masuk Ranking
                          </span>
                        ) : null}
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">
                          Field Penilaian Dinamis ({sub.scoreFields.length}):
                        </p>
                        <div className="space-y-1">
                          {sub.scoreFields.map((field: any) => (
                            <div
                              key={field.key}
                              className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-navy border border-brand-line/40"
                            >
                              <span>{field.label}</span>
                              <span className="text-[10px] font-bold text-brand-cyan">
                                Range: {field.min} - {field.max}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Tab Grading Scale */
          <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-brand-navy border-b border-brand-line/60 pb-3">
              Tabel Skala Konversi Nilai Angka ke Huruf
            </h2>
            <div className="divide-y divide-brand-line/40">
              {gradingScale.map((scale) => (
                <div
                  key={scale.letter}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-cyan/10 text-base font-extrabold text-brand-cyan">
                      {scale.letter}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-brand-navy">
                        {scale.labelLatin} ({scale.labelArab})
                      </p>
                      <p className="text-[10px] text-brand-text-muted">
                        Rentang Nilai: {scale.min} &mdash; {scale.max}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 border border-emerald-200">
                    Aktif
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </KoorShell>
  );
}
