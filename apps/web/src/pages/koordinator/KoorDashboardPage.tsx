import { useState, useEffect } from "react";
import {
  Award,
  BookOpen,
  GraduationCap,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { KoorShell } from "@/components/layout/KoorShell";
import { api } from "@/lib/api";

export function KoorDashboardPage() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api.getDashboardSummary()
      .then(setSummary)
      .catch(() => {
        // Fallback
      });
  }, []);

  const totalStudents = summary?.totalStudents ?? 1248;
  const totalTeachers = summary?.totalTeachers ?? 15;
  const totalClasses = summary?.totalClasses ?? 8;
  const chartData = summary?.chartData ?? [
    { day: "Sen", Ziyadah: 42, Murojaah: 38, Tahsin: 25 },
    { day: "Sel", Ziyadah: 45, Murojaah: 40, Tahsin: 28 },
    { day: "Rab", Ziyadah: 39, Murojaah: 42, Tahsin: 30 },
    { day: "Kam", Ziyadah: 48, Murojaah: 44, Tahsin: 22 },
    { day: "Jum", Ziyadah: 50, Murojaah: 46, Tahsin: 35 },
  ];

  const stats = [
    {
      label: "TOTAL SISWA",
      value: String(totalStudents),
      subtext: "Terdaftar Aktif",
      subtextColor: "text-brand-cyan-dark font-bold",
      icon: GraduationCap,
      iconBg: "bg-cyan-100 text-brand-cyan-dark",
    },
    {
      label: "GURU PEMBIMBING",
      value: String(totalTeachers),
      subtext: `${totalClasses} Kelas Binaan`,
      subtextColor: "text-emerald-600 font-bold",
      icon: Users,
      iconBg: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "TOTAL KELAS",
      value: String(totalClasses),
      subtext: "Jenjang SMP IT",
      subtextColor: "text-brand-text-muted",
      icon: BookOpen,
      iconBg: "bg-slate-100 text-brand-navy",
    },
    {
      label: "SETORAN PEKAN INI",
      value: "142",
      subtext: "Aktivitas Terverifikasi",
      subtextColor: "text-orange-600 font-bold",
      icon: Award,
      iconBg: "bg-orange-100 text-orange-600",
      badge: "Aktif",
    },
  ];

  return (
    <KoorShell
      title="Dashboard Koordinator TTQ"
      subtitle="Monitoring program TTQ &amp; Ibadah Siswa"
      activePath="dashboard"
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="relative rounded-2xl border border-brand-line bg-white p-4 shadow-sm"
              >
                {item.badge && (
                  <span className="absolute right-3 top-3 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                    {item.badge}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-brand-navy/60">
                      {item.label}
                    </p>
                    <p className="text-xl font-extrabold text-brand-navy">
                      {item.value}
                    </p>
                  </div>
                </div>
                <p className={`mt-2 text-xs ${item.subtextColor}`}>
                  {item.subtext}
                </p>
              </div>
            );
          })}
        </div>

        {/* Chart Setoran */}
        <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-brand-navy">
                Aktivitas Setoran Pekan Ini
              </h2>
              <p className="text-xs text-brand-text-muted">
                Jumlah setoran per kategori TTQ
              </p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-brand-cyan">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-cyan" />
                Ziyadah
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Muroja&apos;ah
              </span>
              <span className="flex items-center gap-1.5 text-purple-600">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                Tahsin
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Ziyadah" fill="#22bad0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Murojaah" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Tahsin" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </KoorShell>
  );
}
