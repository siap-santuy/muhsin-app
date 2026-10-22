import { useEffect, useMemo, useState } from "react";
import {
  Crown,
  BookOpen,
  Layers,
  Lock,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  Search,
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
    return data.badges.filter((b) => {
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

            {/* Badges Grid */}
            {filteredBadges.length === 0 ? (
              <div className="rounded-2xl border border-brand-line bg-white p-8 text-center">
                <p className="text-xs font-semibold text-brand-muted">
                  Tidak ada badge yang cocok dengan filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BadgeCard({ badge }: { badge: StudentBadge }) {
  const isUnlocked = badge.status === "unlocked";
  const isInProgress = badge.status === "in_progress";

  const getBadgeIcon = () => {
    if (badge.category === "juz") {
      return <Crown className="h-5 w-5" />;
    }
    if (badge.category === "sabiq") {
      return <Layers className="h-5 w-5" />;
    }
    return <BookOpen className="h-5 w-5" />;
  };

  const getTheme = () => {
    if (!isUnlocked && !isInProgress) {
      // Locked
      return {
        cardBorder: "border-gray-200 bg-gray-50/70 opacity-70",
        iconBox: "bg-gray-200 text-gray-400",
        barColor: "bg-gray-300",
        badgePill: "bg-gray-100 text-gray-500",
      };
    }

    if (badge.category === "juz") {
      return {
        cardBorder: isUnlocked
          ? "border-amber-300 bg-gradient-to-br from-amber-50/60 to-white shadow-sm"
          : "border-brand-line bg-white",
        iconBox: isUnlocked ? "bg-amber-400 text-white shadow-md shadow-amber-400/20" : "bg-amber-100 text-amber-600",
        barColor: "bg-amber-400",
        badgePill: isUnlocked ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600",
      };
    }

    if (badge.category === "sabiq") {
      return {
        cardBorder: isUnlocked
          ? "border-sky-300 bg-gradient-to-br from-sky-50/60 to-white shadow-sm"
          : "border-brand-line bg-white",
        iconBox: isUnlocked ? "bg-sky-500 text-white shadow-md shadow-sky-500/20" : "bg-sky-100 text-sky-600",
        barColor: "bg-sky-500",
        badgePill: isUnlocked ? "bg-sky-100 text-sky-700" : "bg-gray-100 text-gray-600",
      };
    }

    // Surah default (Emerald)
    return {
      cardBorder: isUnlocked
        ? "border-emerald-300 bg-gradient-to-br from-emerald-50/60 to-white shadow-sm"
        : "border-brand-line bg-white",
      iconBox: isUnlocked ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-emerald-100 text-emerald-600",
      barColor: "bg-emerald-500",
      badgePill: isUnlocked ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600",
    };
  };

  const theme = getTheme();

  return (
    <div className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all ${theme.cardBorder}`}>
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.iconBox}`}>
              {getBadgeIcon()}
            </div>
            <div>
              <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${theme.badgePill}`}>
                {badge.category === "surah" ? `Surah ${badge.code}` : badge.category === "juz" ? `Juz ${badge.code}` : `Jilid ${badge.code}`}
              </span>
              <h3 className="text-xs font-bold text-brand-navy line-clamp-1">{badge.title}</h3>
            </div>
          </div>

          <div className="shrink-0">
            {isUnlocked ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            ) : !isInProgress ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-400">
                <Lock className="h-3 w-3" />
              </span>
            ) : (
              <span className="text-[10px] font-bold text-brand-cyan">
                {badge.progressPercent}%
              </span>
            )}
          </div>
        </div>

        <p className="mt-2 text-[11px] font-medium text-brand-muted line-clamp-1">
          {badge.subtitle}
        </p>
      </div>

      <div className="mt-3">
        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${theme.barColor}`}
            style={{ width: `${badge.progressPercent}%` }}
          />
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-brand-muted">
          <span>
            {badge.currentValue} / {badge.targetValue} {badge.unit}
          </span>
          {isUnlocked && badge.unlockedAt ? (
            <span className="text-emerald-700 font-semibold">Tuntas ({badge.unlockedAt})</span>
          ) : isInProgress ? (
            <span className="text-brand-cyan font-semibold">Sedang Dihafal</span>
          ) : (
            <span className="text-gray-400">Belum Disetor</span>
          )}
        </div>
      </div>
    </div>
  );
}
