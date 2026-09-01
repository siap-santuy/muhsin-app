import { useState, useEffect } from "react";
import {
  BookOpen,
  Loader2,
  Mic,
  Repeat,
  Sparkles,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, TEACHER_NAV_ITEMS } from "@/components/layout/BottomNav";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";

export function TeacherDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardSummary()
      .then((data) => {
        setSummary(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const name = summary?.teacherName ?? user?.name ?? "Ustadz Pembimbing";
  const className = summary?.className ?? "Zubair bin Awwam";
  const konsistensiPercent = summary?.konsistensiIbadahPercent ?? 92;
  const breakdown = summary?.todayBreakdown ?? {
    ziyadahCount: 18,
    murojaahCount: 15,
    tahsinCount: 9,
    totalTarget: 20,
  };
  const totalSetor = summary?.setorHariIniCount ?? (breakdown.ziyadahCount + breakdown.murojaahCount + breakdown.tahsinCount);
  const totalCapacity = (breakdown.totalTarget ?? 20) * 3; // 3 programs
  const setorPercent = Math.min(100, Math.round((totalSetor / Math.max(1, totalCapacity)) * 100));

  // Extract class badge (e.g. VII, VIII, IX)
  const classBadgeMatch = className.match(/^(VII|VIII|IX|X|XI|XII|\d+)/i);
  const classBadge = classBadgeMatch ? classBadgeMatch[0].toUpperCase() : "VII";

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      <AppHeader />

      <main className="flex-1 overflow-y-auto px-4 pt-1 pb-20">
        <div className="flex flex-col gap-4">
          {/* Greeting */}
          <section>
            <h1 className="text-xl font-bold text-brand-navy">
              Assalamu&apos;alaikum,
            </h1>
            <p className="text-lg font-bold text-brand-navy">
              {name}!
            </p>
            <p className="text-xs text-brand-text-muted mt-0.5">
              Guru Pembimbing TTQ &mdash; Kelas {className}
            </p>
          </section>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
            </div>
          ) : (
            <>
              {/* Card 1: Card Kelas (Konsistensi Ibadah) */}
              <div className="flex flex-col rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 px-2 items-center justify-center rounded-lg bg-brand-cyan/10 text-xs font-bold text-brand-cyan">
                    {classBadge}
                  </span>
                  <h2 className="text-sm font-bold text-brand-navy">
                    Kelas {className}
                  </h2>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-brand-navy">
                      {konsistensiPercent}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-brand-cyan/15">
                    <div
                      className="h-full rounded-full bg-brand-cyan transition-all"
                      style={{ width: `${konsistensiPercent}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-brand-text-muted">
                    Konsistensi ibadah yaumiyah santri
                  </p>
                </div>
              </div>

              {/* Card 2: Setoran TTQ Hari ini */}
              <div className="flex flex-col rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-brand-navy">
                    Setoran TTQ Hari ini
                  </h2>
                  <span className="text-xs font-bold text-brand-cyan">
                    {totalSetor}/{totalCapacity} Santri
                  </span>
                </div>

                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-brand-cyan/15">
                  <div
                    className="h-full rounded-full bg-brand-cyan transition-all"
                    style={{ width: `${setorPercent}%` }}
                  />
                </div>

                {/* 3 Column Metrics */}
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-brand-line/40 pt-3 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-semibold text-brand-text-muted">
                      Ziyadah
                    </span>
                    <span className="mt-1 text-sm font-extrabold text-brand-cyan-dark">
                      {breakdown.ziyadahCount}/{breakdown.totalTarget}
                    </span>
                  </div>
                  <div className="flex flex-col items-center border-x border-brand-line/40">
                    <span className="text-[11px] font-semibold text-brand-text-muted">
                      Muroja&apos;ah
                    </span>
                    <span className="mt-1 text-sm font-extrabold text-brand-cyan-dark">
                      {breakdown.murojaahCount}/{breakdown.totalTarget}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-semibold text-brand-text-muted">
                      Tahsin
                    </span>
                    <span className="mt-1 text-sm font-extrabold text-brand-cyan-dark">
                      {breakdown.tahsinCount}/{breakdown.totalTarget}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Menu Input Nilai TTQ (4 Grid Cards) */}
              <section>
                <h2 className="text-sm font-bold text-brand-navy mb-3">
                  Menu Input Nilai TTQ
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {/* Ziyadah */}
                  <button
                    type="button"
                    onClick={() => (window.location.hash = "#/ziyadah-input")}
                    className="flex flex-col items-center justify-center rounded-2xl border border-brand-line bg-white p-4 shadow-sm hover:border-brand-cyan/40 hover:shadow-md active:scale-95 transition-all text-center"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <span className="mt-2.5 text-xs font-bold text-brand-navy">
                      Ziyadah (Tahfidz)
                    </span>
                    <span className="mt-0.5 text-[10px] text-brand-text-muted">
                      Setoran hafalan baru
                    </span>
                  </button>

                  {/* Murojaah */}
                  <button
                    type="button"
                    onClick={() => (window.location.hash = "#/murojaah-input")}
                    className="flex flex-col items-center justify-center rounded-2xl border border-brand-line bg-white p-4 shadow-sm hover:border-brand-cyan/40 hover:shadow-md active:scale-95 transition-all text-center"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                      <Repeat className="h-6 w-6" />
                    </div>
                    <span className="mt-2.5 text-xs font-bold text-brand-navy">
                      Muroja&apos;ah (Tahfidz)
                    </span>
                    <span className="mt-0.5 text-[10px] text-brand-text-muted">
                      Ulang hafalan lama
                    </span>
                  </button>

                  {/* Sabiq */}
                  <button
                    type="button"
                    onClick={() => (window.location.hash = "#/sabiq-input")}
                    className="flex flex-col items-center justify-center rounded-2xl border border-brand-line bg-white p-4 shadow-sm hover:border-brand-cyan/40 hover:shadow-md active:scale-95 transition-all text-center"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <span className="mt-2.5 text-xs font-bold text-brand-navy">
                      Sabiq (Tahsin)
                    </span>
                    <span className="mt-0.5 text-[10px] text-brand-text-muted">
                      Setoran bacaan buku
                    </span>
                  </button>

                  {/* Talaqi */}
                  <button
                    type="button"
                    onClick={() => (window.location.hash = "#/talaqi-input")}
                    className="flex flex-col items-center justify-center rounded-2xl border border-brand-line bg-white p-4 shadow-sm hover:border-brand-cyan/40 hover:shadow-md active:scale-95 transition-all text-center"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <Mic className="h-6 w-6" />
                    </div>
                    <span className="mt-2.5 text-xs font-bold text-brand-navy">
                      Talaqi (Tahsin)
                    </span>
                    <span className="mt-0.5 text-[10px] text-brand-text-muted">
                      Bimbingan guru
                    </span>
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <BottomNav items={TEACHER_NAV_ITEMS} activeIndex={0} />
    </div>
  );
}
