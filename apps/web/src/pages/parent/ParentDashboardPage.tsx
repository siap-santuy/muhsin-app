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
import { getDisplayName } from "@/lib/utils";
import { toast } from "@/store/toastStore";

const QUOTE = {
  text: '"Sesungguhnya Allah mencintai orang-orang yang berbuat ihsan."',
  source: "(QS. Al-Baqarah: 195)",
};

export function ParentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api.getDashboardSummary()
      .then((data) => {
        setSummary(data);
        if (data?.childId && typeof window !== "undefined") {
          localStorage.setItem("parent_active_child_id", data.childId);
        }
      })
      .catch(() => {
        // Fallback
      });
  }, []);

  const parentName = getDisplayName(
    user?.name ?? "Orang Tua",
    user?.gender ?? "",
    "parent"
  );
  const childName = summary?.childName ?? "Ananda";
  const childClass = summary?.childClassName ?? "Kelas VII";
  const isFilled = summary?.isYaumiyahTodayFilled ?? true;
  const progres = summary?.progres ?? {};

  const ziyadahCount = progres.ziyadahCount ?? 0;
  const ziyadahPct = Math.min(100, Math.round((ziyadahCount / 20) * 100));

  const tahsinCount = progres.tahsinCount ?? 0;
  const tahsinPct = Math.min(100, Math.round((tahsinCount / 20) * 100));

  const murojaahCount = progres.murojaahCount ?? 0;
  const murojaahPct = Math.min(100, Math.round((murojaahCount / 20) * 100));

  const yaumiyahDays = progres.yaumiyahDays ?? 0;
  const yaumiyahPct = Math.min(100, Math.round((yaumiyahDays / 30) * 100));

  const progressItems: ProgressItem[] = [
    {
      label: "Ziyadah",
      value: `${ziyadahPct}%`,
      caption: "Target 20 halaman",
      percent: ziyadahPct,
      icon: BookOpen,
      iconClass: "bg-brand-cyan/10 text-brand-cyan",
      barClass: "bg-brand-cyan",
      trackClass: "bg-brand-cyan/15",
      onClick: () => (window.location.hash = "#/tahfidz-summary?tab=ziyadah"),
    },
    {
      label: "Tahsin",
      value: `${tahsinPct}%`,
      caption: "Target 20 pertemuan",
      percent: tahsinPct,
      icon: Mic,
      iconClass: "bg-brand-navy/10 text-brand-navy",
      barClass: "bg-brand-navy",
      trackClass: "bg-brand-navy/15",
      onClick: () => (window.location.hash = "#/tahfidz-summary?tab=tahsin"),
    },
    {
      label: "Murojaah",
      value: `${murojaahPct}%`,
      caption: "Target terjaga",
      percent: murojaahPct,
      icon: Repeat,
      iconClass: "bg-emerald-500/10 text-emerald-500",
      barClass: "bg-emerald-500",
      trackClass: "bg-emerald-500/15",
      onClick: () => (window.location.hash = "#/tahfidz-summary?tab=murojaah"),
    },
    {
      label: "Yaumiyah",
      value: `${yaumiyahPct}%`,
      caption: `${yaumiyahDays} dari 30 hari`,
      percent: yaumiyahPct,
      icon: HeartHandshake,
      iconClass: "bg-purple-500/10 text-purple-500",
      barClass: "bg-purple-500",
      trackClass: "bg-purple-500/15",
      onClick: () => (window.location.hash = "#/yaumiyah"),
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
              onAction={async () => {
                try {
                  await api.remindStudent();
                  toast.success("Pengingat terkirim ke ananda");
                } catch (err: any) {
                  toast.warning(err.message || "Gagal mengirim pengingat");
                }
              }}
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
