import { Heart, ShieldCheck, Star } from "lucide-react";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";

export function AboutPage() {
  return (
    <SettingsPageShell title="Tentang Muhsin App" subtitle="Informasi versi &amp; pengembang">
      <div className="flex flex-col gap-4 text-brand-navy">
        {/* App Card */}
        <div className="flex flex-col items-center rounded-2xl border border-brand-line bg-white p-6 text-center shadow-sm">
          <img
            src="/brand/TTQ_Logo.png"
            alt="Logo TTQ Al Fitrah"
            className="h-28 w-28 object-contain"
          />
          <h2 className="mt-3 text-lg font-extrabold text-brand-navy">Muhsin App</h2>
          <p className="text-xs font-semibold text-brand-cyan">v1.0.0 (MVP Release)</p>
          <p className="mt-2 text-xs text-brand-text-muted max-w-[280px]">
            SaaS Manajemen &amp; Monitoring Program Tahsin, Tahfidz Qur&apos;an, dan Ibadah Yaumiyah Siswa Sekolah Islam Terpadu.
          </p>
        </div>

        {/* Vision & Mission Card */}
        <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-brand-line/40 pb-2">
            <Star className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Visi &amp; Fitur Unggulan</h3>
          </div>
          <ul className="space-y-2 text-xs text-brand-navy/90">
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan mt-1.5 shrink-0" />
              <span><strong>Gamifikasi Ihsan:</strong> EXP, Level, dan Streak harian untuk memotivasi istiqomah ibadah santri.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan mt-1.5 shrink-0" />
              <span><strong>Multi-Tenant Flex:</strong> Struktur penilaian Tahfidz/Tahsin yang dinamis sesuai kurikulum sekolah.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan mt-1.5 shrink-0" />
              <span><strong>Transparansi Orang Tua:</strong> Laporan bulanan dan monitoring progres harian secara real-time.</span>
            </li>
          </ul>
        </div>

        {/* Institution Info */}
        <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm space-y-2 text-center">
          <div className="flex items-center justify-center gap-2 text-brand-cyan font-bold text-xs">
            <ShieldCheck className="h-4 w-4" />
            <span>SMP ISLAM TERPADU AL FITRAH</span>
          </div>
          <p className="text-[11px] text-brand-text-muted">
            Pilot Project Implementation &bull; Jaringan Sekolah Islam Terpadu (JSIT)
          </p>
        </div>

        {/* Footer */}
        <div className="text-center py-2">
          <p className="text-xs text-brand-text-muted flex items-center justify-center gap-1">
            Dibuat dengan <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> untuk kebaikan ummat
          </p>
          <p className="mt-1 text-[10px] text-brand-text-muted">&copy; 2026 Muhsin App. Hak Cipta Dilindungi.</p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
