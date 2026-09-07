import { useState } from "react";
import {
  X,
  Sparkles,
  Bug,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  Tag,
  Calendar,
} from "lucide-react";
import versionsData from "@/data/versions.json";

export interface VersionChange {
  category: "feature" | "fix" | "improvement" | "info" | string;
  categoryLabel: string;
  description: string;
}

export interface AppVersionItem {
  version: string;
  releaseDate: string;
  isLatest: boolean;
  badge?: string;
  title: string;
  summary?: string;
  changes: VersionChange[];
}

interface VersionSliderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedVersion?: string;
}

export function VersionSliderDrawer({
  isOpen,
  onClose,
  initialSelectedVersion,
}: VersionSliderDrawerProps) {
  const versions = versionsData as AppVersionItem[];
  const [expandedVersion, setExpandedVersion] = useState<string | null>(
    () => initialSelectedVersion || versions[0]?.version || null
  );

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in">
      {/* Backdrop Click Handler */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl border-t border-brand-line bg-white shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Drawer Pull Handle Indicator */}
        <div className="flex w-full justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-gray-300" />
        </div>

        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-brand-line/60 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-brand-navy">
                Riwayat Versi &amp; Pembaruan
              </h2>
              <p className="text-[11px] text-brand-text-muted">
                Catatan rilis fitur dan perbaikan aplikasi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Version List Scroll Area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
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
                {/* Header Card (Clickable to Toggle) */}
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
                        Daftar Perubahan:
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

        {/* Drawer Footer */}
        <div className="border-t border-brand-line/60 bg-gray-50 px-5 py-3 text-center rounded-b-3xl">
          <p className="text-[11px] text-brand-text-muted">
            Muhsin App &bull; Evaluasi &amp; Pembaruan Berkelanjutan
          </p>
        </div>
      </div>
    </div>
  );
}
