import { FileText, Home, NotebookPen, PenLine, User } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, type NavItem } from "@/components/layout/BottomNav";
import { DailyQuote } from "@/components/student/DailyQuote";
import { ProgressGrid, type ProgressItem } from "@/components/student/ProgressGrid";
import { StreakLevelBanner } from "@/components/student/StreakLevelBanner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

const QUOTE = {
  text: '"Sesungguhnya Allah mencintai orang-orang yang berbuat ihsan."',
  source: "(QS. Al-Baqarah: 195)",
};

const PROGRESS: ProgressItem[] = [
  {
    label: "Tahfidz",
    value: "75%",
    caption: "12 dari 16 target",
    percent: 75,
    barClass: "bg-brand-cyan",
    trackClass: "bg-brand-cyan/15",
  },
  {
    label: "Tahsin",
    value: "60%",
    caption: "9 dari 15 target",
    percent: 60,
    barClass: "bg-brand-navy",
    trackClass: "bg-brand-navy/15",
  },
  {
    label: "Murojaah",
    value: "90%",
    caption: "18 dari 20 target",
    percent: 90,
    barClass: "bg-[#7aa7f0]",
    trackClass: "bg-[#d3e4fe]",
  },
  {
    label: "Yaumiyah",
    value: "5/7",
    caption: "5 dari 7 hari",
    percent: 71,
    barClass: "bg-[#8b5cf6]",
    trackClass: "bg-[#8b5cf6]/15",
  },
];

const NAV_ITEMS: NavItem[] = [
  { label: "Beranda", icon: Home },
  { label: "Yaumiyah", icon: NotebookPen },
  { label: "Raport", icon: FileText },
  { label: "Profil", icon: User },
];

export function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name.split(" ")[0] ?? "Santri";

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      <AppHeader />
      <main className="flex-1 overflow-y-auto px-4 pt-1 pb-4">
        <div className="flex flex-col gap-3">
          <section className="flex items-end justify-between">
            <div>
              <h1 className="text-xl font-bold text-brand-navy">
                Assalamu&apos;alaikum,
              </h1>
              <p className="text-lg font-semibold text-brand-navy">
                {firstName}!
              </p>
              <p className="mt-1 text-sm text-brand-text-muted">
                Siap melanjutkan petualangan ilmumu hari ini?
              </p>
            </div>
          </section>
          <DailyQuote text={QUOTE.text} source={QUOTE.source} />
          <StreakLevelBanner streak={5} level={3} />
          <ProgressGrid title="Progres Bulan Ini" items={PROGRESS} />
          <Button
            type="button"
            className="h-[38px] w-full rounded-lg bg-brand-cyan text-white shadow-[0_1px_0_#159db5] hover:bg-brand-cyan-dark"
          >
            <PenLine /> Isi Ibadah Hari Ini
          </Button>
        </div>
      </main>
      <BottomNav items={NAV_ITEMS} activeIndex={0} />
    </div>
  );
}
