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

const QUOTE = {
  text: '"Sesungguhnya Allah mencintai orang-orang yang berbuat ihsan."',
  source: "(QS. Al-Baqarah: 195)",
};

const PROGRESS: ProgressItem[] = [
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

const MASCOT_MESSAGE =
  "\u201cMaa syaa Allah! Fulan sangat rajin hari ini. Jangan lupa berikan apresiasi ya, Ummi/Abi!\u201d";

// ponytail: mock target ziyadah — replace with API (PRD 4.3b)
const MOCK_TARGET = { from: "Al-Baqarah: 1", to: "Al-Baqarah: 75", progress: "Ayat 48" };

export function ParentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const name = user?.name ?? "Ummu Fulan";

  function handleGoToRaport() {
    window.location.hash = "#/raport";
  }

  function handleGoToYaumiyah() {
    window.location.hash = "#/yaumiyah";
  }

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
            onAction={() => (window.location.hash = "#/notifications")}
          />
          <div onClick={() => (window.location.hash = "#/tahfidz-summary")} className="cursor-pointer">
            <ProgressGrid title="Progres Bulan Ini" items={PROGRESS} />
          </div>
          {/* Target Ziyadah Ananda (PRD 4.3b) */}
          <div className="flex items-center gap-3 rounded-2xl border border-brand-cyan/30 bg-brand-cyan/5 px-4 py-3">
            <BookOpenCheck className="h-6 w-6 shrink-0 text-brand-cyan" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-brand-navy">Target Ziyadah Ananda</p>
              <p className="text-xs text-brand-text-muted truncate">
                {MOCK_TARGET.from} — {MOCK_TARGET.to}
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-brand-cyan/15 px-2 py-1 text-[10px] font-bold text-brand-cyan-dark">
              {MOCK_TARGET.progress}
            </span>
          </div>
          <DailyQuote text={QUOTE.text} source={QUOTE.source} />
          <MenuCard
            icon={BookOpen}
            iconClass="bg-emerald-500/15 text-emerald-600"
            title="Raport & Pencapaian"
            description="Lihat rapor dan pencapaian Fulan"
            onPress={handleGoToRaport}
          />
          <MenuCard
            icon={NotebookPen}
            iconClass="bg-brand-cyan/15 text-brand-cyan-dark"
            title="Ibadah Yaumiyah"
            description="Lihat catatan ibadah harian Fulan"
            onPress={handleGoToYaumiyah}
          />
          <MascotTip message={MASCOT_MESSAGE} />
        </div>
      </main>
      <BottomNav activeIndex={0} />
    </div>
  );
}
