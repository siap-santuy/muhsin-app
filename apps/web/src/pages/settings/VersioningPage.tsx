import { useState } from "react";
import {
  Sparkles,
  Bug,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  Calendar,
  Layers,
  RefreshCw,
} from "lucide-react";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import versionsData from "@/data/versions.json";
import { APP_VERSION } from "@/lib/appVersion";
import { forceUpdateApp } from "@/utils/pwaUpdate";
import type { AppVersionItem } from "@/components/versioning/VersionSliderDrawer";

export function VersioningPage() {
  const versions = versionsData as AppVersionItem[];
  const [expandedVersion, setExpandedVersion] = useState<string | null>(
    () => versions[0]?.version || null
  );

  function toggleExpand(versionStr: string) {
    setExpandedVersion((prev) => (prev === versionStr ? null : versionStr));
  }

  function renderCategoryBadge(cat: string, label: string) {
    switch (cat) {
      case "feature":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
            <Sparkles className="h-3 w-3" />
            {label}
          </span>
        );
      case "fix":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200/60">
            <Bug className="h-3 w-3" />
            {label}
          </span>
        );
      case "improvement":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-brand-cyan border border-cyan-200/60">
            <Zap className="h-3 w-3" />
            {label}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
            <Info className="h-3 w-3" />
            {label}
          </span>
        );
    }
  }

  return (
    <SettingsPageShell
      title="Versi Aplikasi"
      subtitle="Riwayat pembaruan &amp; catatan rilis fitur"
    >
      <div className="flex flex-col gap-4 text-brand-navy">
        {/* Header Banner */}
        <div className="flex items-center gap-3 rounded-2xl border border-brand-line bg-white p-4 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-brand-navy">
                Muhsin App {versions[0]?.version || APP_VERSION}
              </h3>
              <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                Versi Saat Ini
              </span>
            </div>
            <p className="mt-0.5 text-xs text-brand-text-muted">
              Klik kartu versi di bawah untuk melihat rincian pembaruan fitur,
              peningkatan, dan perbaikan bug.
            </p>
          </div>
        </div>

        {/* Force Refresh Action Card */}
        <div className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 shadow-xs">
          <div className="pr-3">
            <h4 className="text-xs font-bold text-brand-navy">Perbarui Aplikasi</h4>
            <p className="text-[11px] text-brand-text-muted">
              Tekan jika pembaruan baru belum tampil di browser atau aplikasi HP Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={() => forceUpdateApp()}
            className="flex items-center gap-1.5 rounded-xl bg-brand-cyan px-3 py-2 text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90 active:scale-95 shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Muat Ulang</span>
          </button>
        </div>

        {/* Version List Accordion */}
        <div className="space-y-3">
          {versions.map((ver) => {
            const isExpanded = expandedVersion === ver.version;

            return (
              <div
                key={ver.version}
                className={`rounded-2xl border transition-all ${
                  isExpanded
                    ? "border-brand-cyan/70 bg-cyan-50/20 shadow-xs"
                    : "border-brand-line bg-white hover:border-brand-line/80"
                }`}
              >
                {/* Header Card (Clickable) */}
                <button
                  type="button"
                  onClick={() => toggleExpand(ver.version)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-brand-navy">
                        {ver.version}
                      </span>
                      {ver.isLatest ? (
                        <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                          {ver.badge || "Terbaru"}
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                          {ver.badge || "Stabil"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-bold text-brand-navy/90">
                      {ver.title}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-brand-text-muted">
                      <Calendar className="h-3 w-3" />
                      <span>{ver.releaseDate}</span>
                    </div>
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-brand-navy shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-brand-line/60 bg-white/80 p-4 pt-3 space-y-3 rounded-b-2xl">
                    {ver.summary && (
                      <p className="text-xs text-brand-navy/80 italic border-l-2 border-brand-cyan pl-2.5">
                        {ver.summary}
                      </p>
                    )}

                    <div className="space-y-2 pt-1">
                      <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-brand-navy">
                        Daftar Pembaruan:
                      </h4>
                      <div className="space-y-2.5">
                        {ver.changes.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 text-xs text-brand-navy"
                          >
                            <div className="pt-0.5 shrink-0">
                              {renderCategoryBadge(
                                item.category,
                                item.categoryLabel
                              )}
                            </div>
                            <span className="leading-relaxed">
                              {item.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="rounded-2xl border border-brand-line/60 bg-gray-50/70 p-3.5 text-center">
          <p className="text-[11px] text-brand-text-muted">
            Memiliki masukan atau menemukan kendala? Laporkan melalui menu
            Bantuan &amp; Panduan.
          </p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
