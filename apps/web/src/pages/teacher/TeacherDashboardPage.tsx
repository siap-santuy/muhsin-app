import {
  BookOpen,
  CheckCircle,
  Clock,
  Mic,
  PenLine,
  Repeat,
  Users,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, TEACHER_NAV_ITEMS } from "@/components/layout/BottomNav";
import { DailyQuote } from "@/components/student/DailyQuote";
import { MascotTip } from "@/components/ui/MascotTip";
import { MenuCard } from "@/components/ui/MenuCard";
import { useAuthStore } from "@/store/authStore";

const QUOTE = {
  text: '"Sebaik-baik kalian adalah yang mempelajari Al-Qur\'an dan mengajarkannya."',
  source: "(HR. Bukhari)",
};

const STATS = [
  {
    label: "Total Siswa",
    value: "15",
    subtext: "Halaqah VII Abu Bakar",
    icon: Users,
    color: "bg-brand-cyan/10 text-brand-cyan",
  },
  {
    label: "Setoran Hari Ini",
    value: "12/15",
    subtext: "80% Sudah Setor",
    icon: CheckCircle,
    color: "bg-emerald-500/10 text-emerald-500",
  },
  {
    label: "Belum Setor",
    value: "3",
    subtext: "Perlu Diingatkan",
    icon: Clock,
    color: "bg-amber-500/10 text-amber-500",
  },
];

export function TeacherDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const name = user?.name ?? "Ustadz Arai Kurnia";

  return (
    <div className="flex h-screen flex-col bg-white">
      <AppHeader />
      <main className="flex-1 overflow-y-auto px-4 pt-1 pb-4">
        <div className="flex flex-col gap-4">
          <section className="flex items-end justify-between">
            <div>
              <h1 className="text-xl font-bold leading-snug text-brand-navy">
                Assalamu&apos;alaikum,
              </h1>
              <p className="text-lg font-semibold leading-snug text-brand-navy">
                {name}
              </p>
              <p className="text-xs text-brand-text-muted">
                Guru Pembimbing TTQ &mdash; Kelas VII Abu Bakar
              </p>
            </div>
          </section>

          {/* Quick Stats Grid */}
          <section className="grid grid-cols-3 gap-2">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex flex-col items-center rounded-2xl border border-brand-line bg-white p-3 text-center shadow-sm"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="mt-2 text-base font-extrabold text-brand-navy">
                    {stat.value}
                  </span>
                  <span className="text-[10px] font-bold text-brand-navy">
                    {stat.label}
                  </span>
                  <span className="mt-0.5 text-[9px] text-brand-text-muted">
                    {stat.subtext}
                  </span>
                </div>
              );
            })}
          </section>

          <DailyQuote text={QUOTE.text} source={QUOTE.source} />

          {/* Menu Actions */}
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-brand-navy">
              Menu Pembimbing TTQ
            </h2>

            <MenuCard
              icon={Users}
              iconClass="bg-brand-cyan/15 text-brand-cyan-dark"
              title="Daftar Siswa Halaqah"
              description="Kelola data siswa &amp; lihat progres setoran"
              onPress={() => (window.location.hash = "#/students")}
            />

            <MenuCard
              icon={BookOpen}
              iconClass="bg-emerald-500/15 text-emerald-600"
              title="Input Ziyadah (Tahfidz)"
              description="Catat hafalan baru Al-Qur'an siswa"
              onPress={() => (window.location.hash = "#/ziyadah-input")}
            />

            <MenuCard
              icon={Repeat}
              iconClass="bg-purple-500/15 text-purple-600"
              title="Input Muroja'ah (Tahfidz)"
              description="Evaluasi hafalan lama siswa"
              onPress={() => (window.location.hash = "#/murojaah-input")}
            />

            <MenuCard
              icon={Mic}
              iconClass="bg-amber-500/15 text-amber-600"
              title="Input Sabiq & Talaqi (Tahsin)"
              description="Nilai kelancaran & makhroj tahsin"
              onPress={() => (window.location.hash = "#/talaqi-input")}
            />

            <MenuCard
              icon={PenLine}
              iconClass="bg-brand-navy/15 text-brand-navy"
              title="Manajemen Raport Siswa"
              description="Input evaluasi bulanan & semester"
              onPress={() => (window.location.hash = "#/raport")}
            />
          </section>

          <MascotTip message="Barakallahu fiik Ustadz! Semoga senantiasa diberikan kelancaran dalam membimbing hafalan para siswa." />
        </div>
      </main>
      <BottomNav items={TEACHER_NAV_ITEMS} activeIndex={0} />
    </div>
  );
}
