import {
  BookOpen,
  FileText,
  HeartHandshake,
  Home,
  Mic,
  NotebookPen,
  Repeat,
  User,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, type NavItem } from "@/components/layout/BottomNav";
import { DailyQuote } from "@/components/student/DailyQuote";
import { ProgressGrid, type ProgressItem } from "@/components/student/ProgressGrid";
import { MascotTip } from "@/components/ui/MascotTip";
import { MenuCard } from "@/components/ui/MenuCard";
import { ReminderBanner } from "@/components/ui/ReminderBanner";
import { useAuthStore } from "@/store/authStore";

const QUOTE = {
  text: '"Sesungguhnya Allah mencintai orang-orang yang berbuat ihsan."',
  source: "(QS. Al-Baqarah: 195)",
};

const PROGRESS: ProgressItem[] = [
  {
    label: "Tahfidz",
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
    barClass: "bg-[#10b981]",
    trackClass: "bg-[#d3e4fe]",
  },
  {
    label: "Yaumiyah",
    value: "92%",
    caption: "Konsistensi ibadah",
    percent: 92,
    icon: HeartHandshake,
    iconClass: "bg-[#8b5cf6]/10 text-[#8b5cf6]",
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

const MASCOT_MESSAGE =
  "\u201cMaa syaa Allah! Fulan sangat rajin hari ini. Jangan lupa berikan apresiasi ya, Ummi/Abi!\u201d";

export function ParentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const name = user?.name ?? "Ummu Fulan";

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
            </div>
          </section>
          <ReminderBanner
            text="Fulan belum mengisi ibadah hari ini"
            action="Ingatkan!"
          />
          <ProgressGrid title="Progres Bulan Ini" items={PROGRESS} />
          <DailyQuote text={QUOTE.text} source={QUOTE.source} />
          <MenuCard
            icon={BookOpen}
            iconClass="bg-emerald-500/15 text-emerald-600"
            title="Raport & Pencapaian"
            description="Lihat rapor dan pencapaian Fulan"
          />
          <MenuCard
            icon={NotebookPen}
            iconClass="bg-brand-cyan/15 text-brand-cyan-dark"
            title="Ibadah Yaumiyah"
            description="Lihat catatan ibadah harian Fulan"
          />
          <MascotTip message={MASCOT_MESSAGE} />
        </div>
      </main>
      <BottomNav items={NAV_ITEMS} activeIndex={0} />
    </div>
  );
}
