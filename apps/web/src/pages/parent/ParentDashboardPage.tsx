import { useState, useEffect } from "react";
import {
  BookOpen,
  BookOpenCheck,
  HeartHandshake,
  Mic,
  NotebookPen,
  Repeat,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { DailyQuote } from "@/components/student/DailyQuote";
import { ProgressGrid, type ProgressItem } from "@/components/student/ProgressGrid";
import { MascotTip } from "@/components/ui/MascotTip";
import { MenuCard } from "@/components/ui/MenuCard";
import { ReminderBanner } from "@/components/ui/ReminderBanner";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";

const QUOTE = {
  text: '"Sesungguhnya Allah mencintai orang-orang yang berbuat ihsan."',
  source: "(QS. Al-Baqarah: 195)",
};

export function ParentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api.getDashboardSummary()
      .then(setSummary)
      .catch(() => {
        // Fallback
      });
  }, []);

  const parentName = summary?.parentName ?? user?.name ?? "Orang Tua";
  const childName = summary?.childName ?? "Ananda";
  const childClass = summary?.childClassName ?? "Kelas VII";
  const isFilled = summary?.isYaumiyahTodayFilled ?? true;

  const progressItems: ProgressItem[] = [
    {
      label: "Ziyadah",
      value: "85%",
      caption: "Target 20 halaman",
      percent: 85,
      icon: BookOpen,
      iconClass: "bg-brand-cyan/10 text-brand-cyan",
      barClass: "bg-brand-cyan",
      trackClass: "bg-brand-cyan/15",
    },
    {
      label: "Tahsin",
      value: "60%",
      caption: "Target 20 pertemuan",
      percent: 60,
      icon: Mic,
      iconClass: "bg-brand-navy/10 text-brand-navy",
      barClass: "bg-brand-navy",
      trackClass: "bg-brand-navy/15",
    },
    {
      label: "Murojaah",
      value: "100%",
      caption: "Target terjaga",
      percent: 100,
      icon: Repeat,
      iconClass: "bg-emerald-500/10 text-emerald-500",
      barClass: "bg-emerald-500",
      trackClass: "bg-emerald-500/15",
    },
    {
      label: "Yaumiyah",
      value: "90%",
      caption: "27 dari 30 hari",
      percent: 90,
      icon: HeartHandshake,
      iconClass: "bg-purple-500/10 text-purple-500",
      barClass: "bg-purple-500",
      trackClass: "bg-purple-500/15",
    },
  ];

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      <AppHeader />
      <main className="flex-1 overflow-y-auto px-4 pt-1 pb-4">
        <div className="flex flex-col gap-4">
          <section className="flex items-end justify-between">
            <div>
              <h1 className="text-xl font-bold leading-snug text-brand-navy">
                Assalamu&apos;alaikum,
              </h1>
              <p className="text-lg font-semibold leading-snug text-brand-navy">
                {parentName}
              </p>
              <p className="text-xs text-brand-text-muted">
                Wali dari {childName} &mdash; {childClass}
              </p>
            </div>
          </section>

          {!isFilled ? (
            <ReminderBanner
              text={`${childName} belum mengisi ibadah yaumiyah hari ini.`}
              action="Ingatkan"
            />
          ) : null}

          <DailyQuote text={QUOTE.text} source={QUOTE.source} />

          <ProgressGrid title={`Progres ${childName} Bulan Ini`} items={progressItems} />

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-brand-navy">
              Menu Pantauan Orang Tua
            </h2>

            <MenuCard
              icon={BookOpenCheck}
              iconClass="bg-brand-cyan/15 text-brand-cyan-dark"
              title="Capaian &amp; Target Hafalan"
              description={`Lihat riwayat hafalan &amp; target ${childName}`}
              onPress={() => (window.location.hash = "#/tahfidz-summary")}
            />

            <MenuCard
              icon={HeartHandshake}
              iconClass="bg-emerald-500/15 text-emerald-600"
              title="Jurnal Ibadah Yaumiyah"
              description={`Pantau sholat 5 waktu &amp; tilawah harian`}
              onPress={() => (window.location.hash = "#/yaumiyah")}
            />

            <MenuCard
              icon={NotebookPen}
              iconClass="bg-purple-500/15 text-purple-600"
              title="Raport Bulanan &amp; Semester"
              description={`Evaluasi berkala &amp; catatan guru pembimbing`}
              onPress={() => (window.location.hash = "#/raport")}
            />
          </section>

          <MascotTip message="Dukungan dan apresiasi dari orang tua adalah kunci semangat ananda dalam menjaga hafalan Al-Qur'an." />
        </div>
      </main>
      <BottomNav activeIndex={0} />
    </div>
  );
}
