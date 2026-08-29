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
import { useAuthStore } from "@/store/authStore";

const STATS = [
  {
    label: "TOTAL SISWA",
    value: "1,248",
    subtext: "+12% MoM",
    subtextColor: "text-brand-cyan-dark font-bold",
    icon: GraduationCap,
    iconBg: "bg-cyan-100 text-brand-cyan-dark",
  },
  {
    label: "RATA-RATA PROGRES",
    value: "82.4%",
    subtext: "Target: 85%",
    subtextColor: "text-emerald-600 font-bold",
    icon: BookOpen,
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    label: "KEHADIRAN HARI INI",
    value: "96.8%",
    subtext: "1,208 Siswa hadir",
    subtextColor: "text-brand-text-muted",
    icon: Users,
    iconBg: "bg-slate-100 text-brand-navy",
  },
  {
    label: "SETORAN TERTUNDA",
    value: "42",
    subtext: "Butuh verifikasi segera",
    subtextColor: "text-orange-600 font-bold",
    icon: Award,
    iconBg: "bg-orange-100 text-orange-600",
    badge: "Pending",
  },
];

const CHART_DATA = [
  { day: "Sen", Ziyadah: 42, Murojaah: 38, Tahsin: 25 },
  { day: "Sel", Ziyadah: 45, Murojaah: 40, Tahsin: 28 },
  { day: "Rab", Ziyadah: 39, Murojaah: 42, Tahsin: 30 },
  { day: "Kam", Ziyadah: 48, Murojaah: 44, Tahsin: 22 },
  { day: "Jum", Ziyadah: 50, Murojaah: 46, Tahsin: 35 },
  { day: "Sab", Ziyadah: 30, Murojaah: 32, Tahsin: 18 },
];

const PENDING_MUNAQOSAH = [
  {
    id: "m1",
    studentName: "Ahmad Abdullah",
    class: "VII Abu Bakar",
    juz: "Juz 30",
    teacher: "Ust. Arai Kurnia",
    date: "16 Aug 2026",
  },
  {
    id: "m2",
    studentName: "Fathimah Az-Zahra",
    class: "VIII Khadijah",
    juz: "Juz 29",
    teacher: "Ustdh. Maryam",
    date: "17 Aug 2026",
  },
];

const RECENT_SUBMISSIONS = [
  {
    id: "s1",
    student: "Muhammad Ali",
    category: "Ziyadah (Tahfidz)",
    detail: "Al-Baqarah: 1-15 (Mumtaz / A)",
    teacher: "Ust. Arai Kurnia",
    time: "10 menit lalu",
  },
  {
    id: "s2",
    student: "Umar Al-Faruq",
    category: "Sabiq (Tahsin)",
    detail: "Hal 45 (Jayyid Jiddan / B)",
    teacher: "Ust. Zulkifli",
    time: "25 menit lalu",
  },
  {
    id: "s3",
    student: "Usman bin Affan",
    category: "Muroja'ah (Tahfidz)",
    detail: "An-Naba: 1-40 (Mumtaz / A)",
    teacher: "Ust. Arai Kurnia",
    time: "1 jam lalu",
  },
];

export function KoorDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const name = user?.name ?? "Ust. Abdullah S.Pd.I";

  return (
    <KoorShell
      activePath="dashboard"
      title="Dashboard Ringkasan Koordinator"
      subtitle="Pantauan Program TTQ & Munaqosah Sekolah"
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-brand-line/60 bg-white p-5 shadow-sm md:flex-row md:items-center">
          <div>
            <span className="rounded-full bg-brand-cyan/10 px-3 py-1 text-xs font-bold text-brand-cyan-dark">
              Tahun Ajaran 2026/2027 &bull; Semester Ganjil
            </span>
            <h1 className="mt-2 text-xl font-black text-brand-navy">
              Assalamu&apos;alaikum, {name}
            </h1>
            <p className="text-xs text-brand-text-muted">
              Selamat bertugas. Berikut ringkasan aktivitas setoran hafalan &amp; kelancaran TTQ minggu ini.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (window.location.hash = "#/kurikulum")}
              className="rounded-xl border border-brand-line bg-white px-4 py-2.5 text-xs font-bold text-brand-navy hover:border-brand-cyan shadow-sm transition-all"
            >
              Atur Kurikulum &amp; Bobot
            </button>
            <button
              type="button"
              onClick={() => (window.location.hash = "#/munaqosah")}
              className="rounded-xl bg-brand-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-navy/90 transition-all flex items-center gap-1.5"
            >
              <Award className="h-4 w-4 text-brand-amber" />
              <span>Approval Munaqosah (2)</span>
            </button>
          </div>
        </section>

        {/* 4 Stat Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.label}
                className="relative flex flex-col justify-between rounded-2xl border border-brand-line/60 bg-white p-5 shadow-sm transition-all hover:border-brand-cyan hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-cyan-dark">
                      {st.label}
                    </p>
                    <span className="mt-1 block text-2xl font-black text-brand-navy">
                      {st.value}
                    </span>
                  </div>
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${st.iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className={`text-[10px] ${st.subtextColor}`}>
                    {st.subtext}
                  </p>
                  {st.badge ? (
                    <span className="rounded-full bg-brand-amber px-2 py-0.5 text-[9px] font-extrabold text-brand-navy shadow-xs">
                      {st.badge}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </section>

        {/* Main Grid: Left (Chart + Actions) vs Right (Pending Munaqosah + Recent) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left 2 Cols */}
          <div className="space-y-6 lg:col-span-2">
            {/* Chart Section */}
            <div className="rounded-2xl border border-brand-line/60 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-4">
                <div>
                  <h3 className="text-sm font-bold text-brand-navy">
                    Grafik Kehadiran &amp; Setoran Harian
                  </h3>
                  <p className="text-[11px] text-brand-text-muted">
                    Jumlah entri setoran per kategori minggu berjalan
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold">
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-cyan" />
                    Ziyadah
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Muroja&apos;ah
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Tahsin
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CHART_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#0C2B50' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#3D4A41' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #C1C6D5', fontSize: '11px' }} />
                    <Bar dataKey="Ziyadah" fill="#22bad0" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Murojaah" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Tahsin" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                onClick={() => (window.location.hash = "#/kurikulum")}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-brand-line/60 bg-white p-4 shadow-sm hover:border-brand-cyan transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-navy">
                      Konfigurasi Penilaian
                    </h4>
                    <p className="text-[10px] text-brand-text-muted">
                      Atur sub-kategori &amp; grading scale
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => (window.location.hash = "#/teachers")}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-brand-line/60 bg-white p-4 shadow-sm hover:border-brand-cyan transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-navy">
                      Mapping Bimbingan Guru
                    </h4>
                    <p className="text-[10px] text-brand-text-muted">
                      Plotting guru halaqah &amp; siswa
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1 Col) */}
          <div className="space-y-6">
            {/* Pending Munaqosah Approval Widget */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-600" />
                  <h3 className="text-xs font-extrabold text-brand-navy">
                    Pengajuan Ujian Munaqosah
                  </h3>
                </div>
                <a
                  href="#/munaqosah"
                  className="text-[11px] font-bold text-brand-cyan-dark hover:underline"
                >
                  Lihat Semua
                </a>
              </div>

              <div className="mt-3 space-y-3">
                {PENDING_MUNAQOSAH.map((pm) => (
                  <div
                    key={pm.id}
                    className="rounded-xl border border-amber-200/80 bg-white p-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-brand-navy">
                        {pm.studentName}
                      </h4>
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-800">
                        {pm.juz}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-brand-text-muted">
                      {pm.class} &bull; Pembimbing: {pm.teacher}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => (window.location.hash = "#/munaqosah")}
                        className="flex-1 rounded-lg bg-brand-navy py-1.5 text-[10px] font-bold text-white hover:bg-brand-navy/90"
                      >
                        Review Approval
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Submissions Feed */}
            <div className="rounded-2xl border border-brand-line/60 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-brand-line/40 pb-3">
                <h3 className="text-xs font-bold text-brand-navy">
                  Setoran Terbaru Guru
                </h3>
                <span className="text-[10px] font-bold text-brand-text-muted">
                  Live Feed
                </span>
              </div>

              <div className="mt-3 space-y-3">
                {RECENT_SUBMISSIONS.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-start justify-between border-b border-gray-100 pb-2.5 last:border-none last:pb-0"
                  >
                    <div>
                      <p className="text-xs font-bold text-brand-navy">
                        {sub.student}
                      </p>
                      <p className="text-[10px] text-brand-cyan-dark font-semibold">
                        {sub.category}
                      </p>
                      <p className="text-[10px] text-brand-text-muted">
                        {sub.detail}
                      </p>
                    </div>
                    <span className="text-[9px] text-gray-400">
                      {sub.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </KoorShell>
  );
}

// Wrapper export using layout
export default function KoorDashboardPageWrapper() {
  return <KoorDashboardPage />;
}
