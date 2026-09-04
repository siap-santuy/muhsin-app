import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { KoorShell } from "@/components/layout/KoorShell";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toastStore";
import { api } from "@/lib/api";

export function KoorKurikulumPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [gradingScale, setGradingScale] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"categories" | "grading">("categories");

  // Modal State Subcategory / Kategori
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [catFormData, setCatFormData] = useState({
    code: "",
    name: "",
  });

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [subFormData, setSubFormData] = useState({
    code: "",
    name: "",
    includeInRanking: true,
  });

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

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!catFormData.code || !catFormData.name) return;
    setModalLoading(true);
    try {
      await api.createCategory(catFormData);
      toast.success("Kategori kurikulum baru berhasil ditambahkan");
      setIsCatModalOpen(false);
      setCatFormData({ code: "", name: "" });
      loadData();
    } catch (err: any) {
      toast.warning(err.message || "Gagal membuat kategori");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleCreateSubcategory(e: React.FormEvent) {
    e.preventDefault();
    if (!subFormData.code || !subFormData.name || !selectedCatId) return;
    setModalLoading(true);
    try {
      await api.createSubcategory({
        categoryId: selectedCatId,
        code: subFormData.code,
        name: subFormData.name,
        includeInRanking: subFormData.includeInRanking,
        scoreFields: [
          { key: "tajwid", label: "Tajwid", min: 0, max: 100 },
          { key: "kelancaran", label: "Kelancaran", min: 0, max: 100 },
          { key: "makhraj", label: "Makharijul Huruf", min: 0, max: 100 },
        ],
      });
      toast.success("Sub-kategori berhasil ditambahkan");
      setIsSubModalOpen(false);
      setSubFormData({ code: "", name: "", includeInRanking: true });
      loadData();
    } catch (err: any) {
      toast.warning(err.message || "Gagal membuat sub-kategori");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (!window.confirm(`Hapus kategori "${name}" beserta seluruh sub-kategori di dalamnya?`)) return;
    try {
      await api.deleteCategory(id);
      toast.success("Kategori berhasil dihapus");
      loadData();
    } catch (err: any) {
      toast.warning(err.message || "Gagal menghapus kategori");
    }
  }

  async function handleDeleteSubcategory(id: string, name: string) {
    if (!window.confirm(`Hapus sub-kategori "${name}"?`)) return;
    try {
      await api.deleteSubcategory(id);
      toast.success("Sub-kategori berhasil dihapus");
      loadData();
    } catch (err: any) {
      toast.warning(err.message || "Gagal menghapus sub-kategori");
    }
  }

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
        <div className="flex items-center justify-between border-b border-brand-line/60 pb-2">
          <div className="flex gap-2">
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

          {activeTab === "categories" && (
            <button
              type="button"
              onClick={() => setIsCatModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-brand-cyan px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-cyan-dark transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Kategori</span>
            </button>
          )}
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
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCatId(cat.id);
                        setIsSubModalOpen(true);
                      }}
                      className="flex items-center gap-1 rounded-xl bg-brand-cyan/10 px-3 py-1.5 text-xs font-bold text-brand-cyan-dark hover:bg-brand-cyan/20 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Tambah Sub-kategori</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="rounded-xl p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
                        <div className="flex items-center gap-1.5">
                          {sub.includeInRanking ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                              Masuk Ranking
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleDeleteSubcategory(sub.id, sub.name)}
                            className="rounded p-1 text-red-500 hover:bg-red-50 transition-colors"
                            title="Hapus Sub-kategori"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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

        {/* Modal Tambah Kategori */}
        {isCatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-brand-line pb-3">
                <h3 className="text-base font-bold text-brand-navy">Tambah Kategori Kurikulum</h3>
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-navy"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-brand-navy">Kode Kategori</label>
                  <input
                    type="text"
                    required
                    value={catFormData.code}
                    onChange={(e) => setCatFormData({ ...catFormData, code: e.target.value })}
                    placeholder="Contoh: tahsin / tahfidz / hadits"
                    className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-brand-navy">Nama Kategori</label>
                  <input
                    type="text"
                    required
                    value={catFormData.name}
                    onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                    placeholder="Contoh: Program Tahsin Qur'an"
                    className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-brand-line">
                  <button
                    type="button"
                    onClick={() => setIsCatModalOpen(false)}
                    className="rounded-xl border border-brand-line px-4 py-2 text-xs font-bold text-brand-navy hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <Button
                    type="submit"
                    disabled={modalLoading}
                    className="rounded-xl bg-brand-cyan px-5 py-2 text-xs font-bold text-white hover:bg-brand-cyan-dark"
                  >
                    {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tambah Kategori"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Tambah Sub-kategori */}
        {isSubModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-brand-line pb-3">
                <h3 className="text-base font-bold text-brand-navy">Tambah Sub-kategori Penilaian</h3>
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-navy"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubcategory} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-brand-navy">Kode Sub-kategori</label>
                  <input
                    type="text"
                    required
                    value={subFormData.code}
                    onChange={(e) => setSubFormData({ ...subFormData, code: e.target.value })}
                    placeholder="Contoh: ziyadah / sabiq / talaqi"
                    className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-brand-navy">Nama Sub-kategori</label>
                  <input
                    type="text"
                    required
                    value={subFormData.name}
                    onChange={(e) => setSubFormData({ ...subFormData, name: e.target.value })}
                    placeholder="Contoh: Setoran Hafalan Baru (Ziyadah)"
                    className="mt-1 w-full rounded-xl border border-brand-line bg-brand-page px-3.5 py-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="rankingCheck"
                    checked={subFormData.includeInRanking}
                    onChange={(e) => setSubFormData({ ...subFormData, includeInRanking: e.target.checked })}
                    className="h-4 w-4 rounded text-brand-cyan focus:ring-brand-cyan"
                  />
                  <label htmlFor="rankingCheck" className="text-xs font-semibold text-brand-navy cursor-pointer">
                    Hitung dalam ranking santri bulanan
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-brand-line">
                  <button
                    type="button"
                    onClick={() => setIsSubModalOpen(false)}
                    className="rounded-xl border border-brand-line px-4 py-2 text-xs font-bold text-brand-navy hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <Button
                    type="submit"
                    disabled={modalLoading}
                    className="rounded-xl bg-brand-cyan px-5 py-2 text-xs font-bold text-white hover:bg-brand-cyan-dark"
                  >
                    {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tambah Sub-kategori"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </KoorShell>
  );
}
