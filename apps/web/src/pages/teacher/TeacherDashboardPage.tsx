import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  Edit3,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, TEACHER_NAV_ITEMS } from "@/components/layout/BottomNav";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";

interface ClassProgress {
  badge: string;
  badgeBg: string;
  badgeText: string;
  name: string;
  percentage: number;
  progressColor: string;
  targetLabel: string;
}

interface AttentionStudent {
  name: string;
  className: string;
  grade: string;
}

const DEFAULT_CLASS_PROGRESS: ClassProgress[] = [];

const DEFAULT_ATTENTION_STUDENTS: AttentionStudent[] = [];

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

  const rawName = summary?.teacherName ?? user?.name ?? "Arai Kurnia Ramadhan";
  const cleanName = rawName.replace(/^(ustadzah|ustadz)\s+/i, "").trim();
  const gender = (summary?.gender ?? user?.gender ?? "").trim().toLowerCase();
  const displayName =
    gender === "ikhwan"
      ? `Ustadz ${cleanName}`
      : gender === "akhwat"
      ? `Ustadzah ${cleanName}`
      : cleanName;
  const totalClasses = summary?.totalClassesToday ?? 2;
  const completedClasses = summary?.completedClassesToday ?? 1;

  const classProgressList: ClassProgress[] = summary?.classProgress ?? DEFAULT_CLASS_PROGRESS;
  const attentionStudents: AttentionStudent[] = summary?.attentionStudents ?? DEFAULT_ATTENTION_STUDENTS;

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      <AppHeader />

      <main className="flex-1 overflow-y-auto px-4 pt-2 pb-24">
        <div className="flex flex-col gap-4">
          {/* Greeting */}
          <section>
            <h1 className="text-[17px] font-semibold text-brand-navy">
              Assalamu&apos;alaikum,
            </h1>
            <p className="text-xl font-extrabold text-brand-navy leading-tight">
              {displayName}
            </p>
          </section>

          {/* Daily Quote Box */}
          <div className="rounded-lg border-l-2 border-brand-cyan bg-[#4dd4e8]/5 p-4 shadow-xs">
            <p className="text-xs font-medium leading-relaxed text-[#159db5]">
              &quot;Sesungguhnya Allah mencintai orang-orang yang berbuat ihsan.&quot;
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[#159db5]">
              (QS. Al-Baqarah: 195)
            </p>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
            </div>
          ) : (
            <>
              {/* Card Total Sesi Hari Ini */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#159db5] to-[#4dd4e8] p-4 text-white shadow-sm">
                <div className="relative z-10 flex flex-col">
                  <span className="text-xs font-medium text-white/80">
                    Total Sesi Hari Ini
                  </span>
                  <span className="mt-1 text-2xl font-bold">
                    {totalClasses} Kelas
                  </span>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-xs">
                      {completedClasses} Selesai
                    </span>
                  </div>
                </div>

                {/* Decorative Calendar Watermark */}
                <Calendar className="pointer-events-none absolute -bottom-1 -right-1 h-20 w-20 text-white/20" />
              </div>

              {/* Action Button: Berikan Penilaian Hari Ini */}
              <button
                type="button"
                onClick={() => (window.location.hash = "#/student-list")}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#22bad0] py-3 text-xs font-bold tracking-wider text-white shadow-sm transition-all hover:bg-[#1bb0c5] active:scale-[0.99]"
              >
                <Edit3 className="h-4 w-4" />
                <span>BERIKAN PENILAIAN HARI INI</span>
              </button>

              {/* Section: Progres Bulan Ini */}
              <section className="mt-1">
                <h2 className="text-base font-bold text-brand-navy">
                  Progres Bulan Ini
                </h2>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  {classProgressList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col justify-between rounded-2xl border border-brand-line bg-white p-3.5 shadow-xs"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-[11px] font-bold ${item.badgeBg} ${item.badgeText}`}
                        >
                          {item.badge}
                        </span>
                        <span className="text-xs font-bold leading-tight text-brand-navy">
                          {item.name}
                        </span>
                      </div>

                      <div className="mt-3">
                        <span className="text-xl font-extrabold text-[#0b1c30]">
                          {item.percentage}%
                        </span>

                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${item.progressColor} transition-all`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>

                        <p className="mt-1.5 text-[10px] text-brand-text-muted">
                          {item.targetLabel}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Card Menu: Lihat Raport Terakhir */}
              <div
                onClick={() => (window.location.hash = "#/raport")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    window.location.hash = "#/raport";
                  }
                }}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-brand-line bg-white p-4 shadow-xs transition-colors hover:bg-gray-50 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-navy">
                      Lihat Raport Terakhir
                    </h3>
                    <p className="text-[11px] text-brand-text-muted">
                      Rekapitulasi pencapaian bulanan
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-brand-navy/60" />
              </div>

              {/* Card: Siswa Perlu Perhatian */}
              <div className="rounded-xl border border-brand-line bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
                  <AlertTriangle className="h-4 w-4 text-[#ff5722]" />
                  <h3 className="text-sm font-bold text-brand-navy">
                    Siswa Perlu Perhatian
                  </h3>
                </div>

                <div className="mt-3 flex flex-col gap-2.5">
                  {attentionStudents.length === 0 ? (
                    <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-4 text-center">
                      <p className="text-xs font-semibold text-emerald-700">
                        Alhamdulillah, semua siswa memiliki kehadiran dan nilai yang baik bulan ini.
                      </p>
                    </div>
                  ) : (
                    attentionStudents.map((student, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-[#ff5722]/30 bg-[#ffdad6]/20 px-3 py-2.5"
                      >
                        <div>
                          <p className="text-xs font-bold text-brand-navy">
                            {student.name}
                          </p>
                          <p className="text-[10px] text-brand-text-muted">
                            {student.className}
                          </p>
                        </div>

                        <span className="text-xs font-extrabold text-[#ff5722]">
                          {student.grade}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <BottomNav items={TEACHER_NAV_ITEMS} activeIndex={0} />
    </div>
  );
}

