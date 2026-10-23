import { useEffect, useMemo, useState } from "react";
import {
  Crown,
  BookOpen,
  FileText,
  Lock,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  Search,
  X,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";
import type { StudentAchievementsSummary, StudentBadge } from "@muhsin/shared";

interface StudentAchievementsPageProps {
  studentId?: string;
}

export function StudentAchievementsPage({ studentId }: StudentAchievementsPageProps) {
  const [data, setData] = useState<StudentAchievementsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<"all" | "surah" | "juz" | "sabiq">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unlocked" | "in_progress" | "locked">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<StudentBadge | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getStudentAchievements(studentId)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || "Gagal memuat pencapaian siswa");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [studentId]);

  const filteredBadges = useMemo(() => {
    if (!data?.badges) return [];
    const list = data.badges.filter((b) => {
      // Filter kategori
      if (activeCategory !== "all" && b.category !== activeCategory) {
        return false;
      }
      // Filter status
      if (statusFilter !== "all" && b.status !== statusFilter) {
        return false;
      }
      // Filter pencarian
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) ||
          b.subtitle.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q)
        );
      }
      return true;
    });

    // Auto-sort: yang sudah dapat badge (unlocked) paling atas, lalu in_progress, lalu locked
    const statusWeight: Record<string, number> = {
      unlocked: 3,
      in_progress: 2,
      locked: 1,
    };

    return [...list].sort((a, b) => {
      const weightDiff = (statusWeight[b.status] || 0) - (statusWeight[a.status] || 0);
      if (weightDiff !== 0) return weightDiff;
      // Jika sama-sama in_progress, prioritaskan yang progress-nya lebih tinggi
      if (a.status === "in_progress" && b.status === "in_progress") {
        if (b.progressPercent !== a.progressPercent) {
          return b.progressPercent - a.progressPercent;
        }
      }
      // Urutan stabil berdasarkan kode/nomor
      return Number(a.code) - Number(b.code);
    });
  }, [data, activeCategory, statusFilter, searchQuery]);

  function handleBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.hash = "#/dashboard";
    }
  }

  return (
    <div className="min-h-screen bg-brand-page pb-12">
      {/* Top Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-brand-line/60 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Kembali"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-brand-navy hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-brand-navy">Peta Pencapaian & Badge</h1>
            <p className="text-[11px] font-medium text-brand-muted">
              Koleksi capaian hafalan Al-Qur'an & Sabiq Tahsin
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pt-4 space-y-4">
        {/* Loading / Error State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-cyan border-t-transparent" />
            <p className="text-xs font-semibold text-brand-muted">Menghitung perolehan badge...</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center">
            <p className="text-xs font-semibold text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 text-xs font-bold text-rose-800 underline"
            >
              Coba lagi
            </button>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Hero Progress Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-[#1e3a5f] to-[#122844] p-5 text-white shadow-lg">
              <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                <Crown className="h-44 w-44" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                    <Sparkles className="h-3 w-3" />
                    Koleksi Penghafal
                  </span>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">
                    {data.totalUnlocked}{" "}
                    <span className="text-sm font-semibold text-white/70">
                      / {data.totalBadges} Badge Terbuka
                    </span>
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-amber-400">
                    {data.overallPercent}%
                  </span>
                  <p className="text-[10px] font-medium text-white/60">Total Tuntas</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-500"
                  style={{ width: `${data.overallPercent}%` }}
                />
              </div>

              {/* Stats Grid */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-white/60">Surah Selesai</span>
                  <span className="text-sm font-black text-emerald-400">
                    {data.surahStats.unlocked}{" "}
                    <span className="text-[10px] font-normal text-white/60">/ {data.surahStats.total}</span>
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-white/60">Juz Mutqin</span>
                  <span className="text-sm font-black text-amber-300">
                    {data.juzStats.unlocked}{" "}
                    <span className="text-[10px] font-normal text-white/60">/ {data.juzStats.total}</span>
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-white/60">Sabiq Tahsin</span>
                  <span className="text-sm font-black text-sky-400">
                    {data.sabiqStats.unlocked}{" "}
                    <span className="text-[10px] font-normal text-white/60">/ {data.sabiqStats.total}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex rounded-2xl border border-brand-line bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                  activeCategory === "all"
                    ? "bg-brand-navy text-white shadow-sm"
                    : "text-brand-navy/70 hover:bg-black/5"
                }`}
              >
                Semua ({data.totalBadges})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory("surah")}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                  activeCategory === "surah"
                    ? "bg-brand-navy text-white shadow-sm"
                    : "text-brand-navy/70 hover:bg-black/5"
                }`}
              >
                Surah ({data.surahStats.unlocked}/{data.surahStats.total})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory("juz")}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                  activeCategory === "juz"
                    ? "bg-brand-navy text-white shadow-sm"
                    : "text-brand-navy/70 hover:bg-black/5"
                }`}
              >
                Juz ({data.juzStats.unlocked}/{data.juzStats.total})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory("sabiq")}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                  activeCategory === "sabiq"
                    ? "bg-brand-navy text-white shadow-sm"
                    : "text-brand-navy/70 hover:bg-black/5"
                }`}
              >
                Sabiq ({data.sabiqStats.unlocked}/{data.sabiqStats.total})
              </button>
            </div>

            {/* Search & Status Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-muted" />
                <input
                  type="text"
                  placeholder="Cari nama surah, juz, atau jilid..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-brand-line bg-white py-2 pl-9 pr-3 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(
                  [
                    { id: "all", label: "Semua" },
                    { id: "unlocked", label: "Terbuka" },
                    { id: "in_progress", label: "Sedang Dihafal" },
                    { id: "locked", label: "Terkunci" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-colors ${
                      statusFilter === f.id
                        ? "bg-brand-cyan text-white"
                        : "bg-white border border-brand-line text-brand-navy hover:bg-gray-50"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Badges Gallery - Flexbox Wrap with Center Justify */}
            {filteredBadges.length === 0 ? (
              <div className="rounded-2xl border border-brand-line bg-white p-8 text-center">
                <p className="text-xs font-semibold text-brand-muted">
                  Tidak ada badge yang cocok dengan filter.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4.5 py-1">
                {filteredBadges.map((badge) => (
                  <BadgeCircularCard
                    key={badge.id}
                    badge={badge}
                    onClick={() => setSelectedBadge(badge)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Detail Badge */}
      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
}

function BadgeCircularCard({
  badge,
  onClick,
}: {
  badge: StudentBadge;
  onClick: () => void;
}) {
  const isUnlocked = badge.status === "unlocked";
  const isInProgress = badge.status === "in_progress";

  // Desain Ring Progress SVG:
  // - Radius: 25.5 (diameter viewBox 58x58) -> keliling C ≈ 2 * PI * 25.5 ≈ 160.22
  const circumference = 160.22;
  const strokeDashoffset = isUnlocked
    ? 0
    : isInProgress
    ? circumference - (circumference * badge.progressPercent) / 100
    : circumference;

  const getTheme = () => {
    if (isUnlocked) {
      if (badge.category === "juz") {
        return {
          innerBg: "bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-md shadow-amber-400/25 ring-2 ring-amber-100",
          ringColor: "text-amber-500",
          bgIcon: "text-black/25",
          numberText: "text-white drop-shadow-md",
          labelText: "text-amber-900 font-extrabold",
        };
      }
      if (badge.category === "sabiq") {
        return {
          innerBg: "bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 shadow-md shadow-sky-500/25 ring-2 ring-sky-100",
          ringColor: "text-sky-500",
          bgIcon: "text-black/25",
          numberText: "text-white drop-shadow-md",
          labelText: "text-sky-900 font-extrabold",
        };
      }
      // Surah (Emerald)
      return {
        innerBg: "bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-100",
        ringColor: "text-emerald-500",
        bgIcon: "text-black/25",
        numberText: "text-white drop-shadow-md",
        labelText: "text-emerald-900 font-extrabold",
      };
    }

    if (isInProgress) {
      // Sedang Dihafal: Ring menyala sesuai progres persentase, dalam lingkaran tetap lembut
      const ringColor =
        badge.category === "juz"
          ? "text-amber-500"
          : badge.category === "sabiq"
          ? "text-sky-500"
          : "text-emerald-500";
      const numberColor =
        badge.category === "juz"
          ? "text-amber-700"
          : badge.category === "sabiq"
          ? "text-sky-700"
          : "text-emerald-700";
      return {
        innerBg: "bg-white border border-brand-line/50 shadow-xs",
        ringColor,
        bgIcon: "text-gray-300/35",
        numberText: `${numberColor} font-black`,
        labelText: "text-brand-navy font-bold",
      };
    }

    // Locked: Grayscale netral
    return {
      innerBg: "bg-gray-50/80 border border-gray-200/70",
      ringColor: "text-transparent",
      bgIcon: "text-gray-400/20",
      numberText: "text-gray-400",
      labelText: "text-gray-400",
    };
  };

  const theme = getTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-[90px] sm:w-[104px] flex-col items-center justify-start p-1.5 text-center transition-all cursor-pointer active:scale-95 shrink-0"
    >
      {/* 1. Kontainer Lingkaran Badge dengan SVG Progress Ring */}
      <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center transition-all duration-300 group-hover:scale-105 shrink-0">
        {/* SVG Progress Ring di sekeliling lingkaran */}
        <svg
          className="absolute inset-0 h-full w-full -rotate-90 pointer-events-none"
          viewBox="0 0 58 58"
        >
          {/* Track Ring Abu-abu Halus */}
          <circle
            cx="29"
            cy="29"
            r="25.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className={isInProgress ? "text-gray-200" : "text-transparent"}
          />
          {/* Active Progress Ring Menyala */}
          {(isInProgress || isUnlocked) && (
            <circle
              cx="29"
              cy="29"
              r="25.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className={`transition-all duration-700 ease-out ${theme.ringColor}`}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
              }}
            />
          )}
        </svg>

        {/* Lingkaran Inti Badge (Berjarak pas dari ring) */}
        <div
          className={`relative flex h-11 w-11 sm:h-12.5 sm:w-12.5 items-center justify-center rounded-full overflow-hidden ${theme.innerBg}`}
        >
          {/* Ikon Background dengan Opacity Rendah */}
          <div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-transform ${theme.bgIcon}`}
          >
            {badge.category === "juz" ? (
              <Crown className="h-6.5 w-6.5 sm:h-7.5 sm:w-7.5" />
            ) : badge.category === "sabiq" ? (
              <FileText className="h-6 w-6 sm:h-7 sm:w-7" />
            ) : (
              <BookOpen className="h-6 w-6 sm:h-7 sm:w-7" />
            )}
          </div>

          {/* Angka Perwakilan di Tengah Lingkaran */}
          <span
            className={`relative z-10 text-sm sm:text-base font-black tracking-tight ${theme.numberText}`}
          >
            {badge.code}
          </span>
        </div>

        {/* Checklist jika sudah tuntas */}
        {isUnlocked && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-100 text-emerald-600" />
          </span>
        )}
      </div>

      {/* 2. Label Nama Badge Ringkas di Bawah Lingkaran */}
      <div className="mt-1.5 w-full px-0.5">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-muted block leading-none mb-1">
          {badge.category === "surah"
            ? "Surah"
            : badge.category === "juz"
            ? "Juz"
            : "Jilid"}
        </span>
        <h4
          className={`text-xs leading-tight line-clamp-1 truncate w-full ${theme.labelText}`}
          title={badge.title}
        >
          {badge.category === "surah"
            ? badge.title.replace(/^Penghafal\s+/i, "")
            : badge.category === "juz"
            ? `Juz ${badge.code}`
            : `Jilid ${badge.code}`}
        </h4>
      </div>
    </button>
  );
}

function BadgeDetailModal({
  badge,
  onClose,
}: {
  badge: StudentBadge;
  onClose: () => void;
}) {
  const isUnlocked = badge.status === "unlocked";
  const isInProgress = badge.status === "in_progress";

  const getTheme = () => {
    if (badge.category === "juz") {
      return {
        icon: <Crown className="h-10 w-10 text-white" />,
        bgGlow: "bg-amber-400 text-white shadow-xl shadow-amber-400/40",
        pill: "bg-amber-100 text-amber-800 border-amber-200",
        label: "Hafizh Juz",
        barColor: "bg-amber-400",
      };
    }
    if (badge.category === "sabiq") {
      return {
        icon: <FileText className="h-10 w-10 text-white" />,
        bgGlow: "bg-sky-500 text-white shadow-xl shadow-sky-500/40",
        pill: "bg-sky-100 text-sky-800 border-sky-200",
        label: "Sabiq Tahsin",
        barColor: "bg-sky-500",
      };
    }
    return {
      icon: <BookOpen className="h-10 w-10 text-white" />,
      bgGlow: "bg-emerald-500 text-white shadow-xl shadow-emerald-500/40",
      pill: "bg-emerald-100 text-emerald-800 border-emerald-200",
      label: "Hafalan Surah",
      barColor: "bg-emerald-500",
    };
  };

  const theme = getTheme();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl border border-brand-line animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Ikon Emblem Besar */}
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
            isUnlocked
              ? theme.bgGlow
              : isInProgress
              ? "bg-brand-cyan text-white shadow-lg shadow-brand-cyan/30"
              : "bg-gray-200 text-gray-400"
          }`}
        >
          {isUnlocked || isInProgress ? (
            theme.icon
          ) : (
            <Lock className="h-9 w-9 text-gray-400" />
          )}
        </div>

        {/* Tag Kategori & Status */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${theme.pill}`}
          >
            <Sparkles className="h-3 w-3" />
            {theme.label}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              isUnlocked
                ? "bg-emerald-100 text-emerald-700"
                : isInProgress
                ? "bg-cyan-100 text-cyan-800"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {isUnlocked ? "Tuntas" : isInProgress ? "Sedang Dihafal" : "Terkunci"}
          </span>
        </div>

        {/* Judul & Detail Informasi */}
        <h3 className="mt-2.5 text-lg font-black text-brand-navy leading-snug">
          {badge.title}
        </h3>
        <p className="mt-1 text-xs font-semibold text-brand-muted">
          {badge.subtitle}
        </p>

        {/* Card Progres di dalam Modal */}
        <div className="mt-4 rounded-2xl border border-brand-line/60 bg-gray-50 p-3.5 text-left">
          <div className="flex items-center justify-between text-xs font-bold text-brand-navy">
            <span>Capaian</span>
            <span className="text-brand-cyan-dark">{badge.progressPercent}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isUnlocked ? theme.barColor : "bg-brand-cyan"
              }`}
              style={{ width: `${badge.progressPercent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-brand-muted font-medium">
            <span>
              {badge.currentValue} dari {badge.targetValue} {badge.unit}
            </span>
            <span>
              {isUnlocked
                ? "100% Selesai"
                : `${badge.targetValue - badge.currentValue} ${badge.unit} tersisa`}
            </span>
          </div>

          {isUnlocked && badge.unlockedAt && (
            <div className="mt-3 flex items-center gap-1.5 border-t border-brand-line/60 pt-2 text-[11px] font-semibold text-emerald-700">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              <span>Diraih pada tanggal: {badge.unlockedAt}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-brand-navy py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-navy/90 active:scale-[0.98] transition-all"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
