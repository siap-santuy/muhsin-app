import { ShieldCheck, Lock, Eye, Server } from "lucide-react";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";

export function PrivacyPage() {
  return (
    <SettingsPageShell title="Kebijakan Privasi" subtitle="Komitmen perlindungan data Muhsin App">
      <div className="flex flex-col gap-4 text-brand-navy">
        {/* Header Hero */}
        <div className="flex flex-col items-center rounded-2xl border border-brand-line bg-white p-5 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-base font-bold">Privasi &amp; Keamanan Data</h2>
          <p className="mt-1 text-xs text-brand-text-muted">
            Komitmen kami menjaga kerahasiaan data anak, keluarga, dan penilaian sekolah.
          </p>
        </div>

        {/* Section List */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-brand-line/40 pb-2">
              <Lock className="h-4 w-4 text-brand-cyan" />
              <h3 className="text-xs font-bold uppercase tracking-wider">1. Isolasi Data Multi-Tenant</h3>
            </div>
            <p className="mt-2 text-xs text-brand-navy/90 leading-relaxed">
              Setiap sekolah beroperasi dalam lingkungan terisolasi yang dienkripsi (`school_id`). Data siswa, nilai TTQ, dan ibadah yaumiyah sekolah lain tidak dapat diakses atau dilihat oleh pihak luar.
            </p>
          </div>

          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-brand-line/40 pb-2">
              <Eye className="h-4 w-4 text-brand-cyan" />
              <h3 className="text-xs font-bold uppercase tracking-wider">2. Akses Berbasis Peran (RBAC)</h3>
            </div>
            <p className="mt-2 text-xs text-brand-navy/90 leading-relaxed">
              Akses informasi dibatasi secara ketat berdasarkan peran: Siswa hanya dapat melihat progres sendiri, Orang Tua hanya melihat progres anak kandung, dan Guru Pembimbing hanya melihat siswa bimbingan di halaqahnya.
            </p>
          </div>

          <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-brand-line/40 pb-2">
              <Server className="h-4 w-4 text-brand-cyan" />
              <h3 className="text-xs font-bold uppercase tracking-wider">3. Enkripsi &amp; Penyimpanan</h3>
            </div>
            <p className="mt-2 text-xs text-brand-navy/90 leading-relaxed">
              Kata sandi di-hash menggunakan standar enkripsi modern (bcrypt/argon2). Transmisi data selalu menggunakan protokol HTTPS aman untuk mencegah penyadapan data di jaringan.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-brand-cyan/5 p-3 text-center text-[11px] text-brand-text-muted border border-brand-cyan/20">
          Terakhir diperbarui: 16 Agustus 2026 &bull; Tim Pengembang Muhsin App
        </div>
      </div>
    </SettingsPageShell>
  );
}
