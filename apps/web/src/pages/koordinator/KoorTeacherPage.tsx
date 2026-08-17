import { useState } from "react";
import {
  CheckCircle2,
  GraduationCap,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { KoorShell } from "@/components/layout/KoorShell";

interface TeacherRecord {
  id: string;
  name: string;
  email: string;
  assignedClass: string;
  studentCount: number;
  lastActive: string;
  submissionRate: number; // percentage
  status: "aktif" | "cuti";
}

const MOCK_TEACHERS: TeacherRecord[] = [
  {
    id: "t1",
    name: "Ust. Arai Kurnia Ramadhan S.Pd.I",
    email: "teacher@demo.com",
    assignedClass: "Halaqah VII Abu Bakar",
    studentCount: 15,
    lastActive: "Hari ini, 09:30",
    submissionRate: 98,
    status: "aktif",
  },
  {
    id: "t2",
    name: "Ustdh. Maryam S.Ag",
    email: "maryam@alfitrah.sch.id",
    assignedClass: "Halaqah VIII Khadijah",
    studentCount: 16,
    lastActive: "Hari ini, 08:15",
    submissionRate: 94,
    status: "aktif",
  },
  {
    id: "t3",
    name: "Ust. Zulkifli Al-Hafiz",
    email: "zulkifli@alfitrah.sch.id",
    assignedClass: "Halaqah VII Umar",
    studentCount: 15,
    lastActive: "Kemarin, 16:45",
    submissionRate: 90,
    status: "aktif",
  },
  {
    id: "t4",
    name: "Ust. Hamzah S.Pd",
    email: "hamzah@alfitrah.sch.id",
    assignedClass: "Halaqah IX Ali",
    studentCount: 16,
    lastActive: "Hari ini, 10:00",
    submissionRate: 100,
    status: "aktif",
  },
  {
    id: "t5",
    name: "Ust. Bilal bin Rabah",
    email: "bilal@alfitrah.sch.id",
    assignedClass: "Halaqah VIII Utsman",
    studentCount: 15,
    lastActive: "2 hari lalu",
    submissionRate: 85,
    status: "aktif",
  },
];

export function KoorTeacherPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_TEACHERS.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedClass.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <KoorShell
      activePath="teachers"
      title="Data Guru & Mapping Bimbingan"
      subtitle="Kelola Penugasan Guru Pembimbing TTQ & Monitoring Input Setoran"
    >
      <div className="space-y-6">
        {/* Header & Action Bar */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-brand-line/60 bg-white p-5 shadow-sm md:flex-row md:items-center">
          <div>
            <h1 className="text-lg font-black text-brand-navy">
              Direktori Guru Pembimbing TTQ
            </h1>
            <p className="text-xs text-brand-text-muted">
              8 Guru Pembimbing aktif membimbing 124 siswa di 8 halaqah
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                alert("Fitur modal Tambah Guru / Plotting Halaqah")
              }
              className="flex items-center gap-1.5 rounded-xl bg-brand-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-navy/90"
            >
              <Plus className="h-4 w-4" />
              <span>Plotting Guru Baru</span>
            </button>
          </div>
        </div>

        {/* 3 Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand-line/60 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xl font-black text-brand-navy">8 Guru</span>
                <p className="text-xs font-bold text-brand-navy">Pembimbing Aktif</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-line/60 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-brand-cyan-dark">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xl font-black text-brand-navy">93.4%</span>
                <p className="text-xs font-bold text-brand-navy">Keaktifan Input</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-line/60 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xl font-black text-brand-navy">15.5</span>
                <p className="text-xs font-bold text-brand-navy">Siswa / Halaqah</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Main Content Grid */}
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama guru atau halaqah..."
              className="h-10 w-full rounded-xl border border-brand-line/60 bg-white pl-9 pr-3 text-xs font-medium text-brand-navy outline-none shadow-sm placeholder:text-gray-400 focus:border-brand-cyan"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Teacher Cards Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="flex flex-col justify-between rounded-2xl border border-brand-line/60 bg-white p-4 shadow-sm transition-all hover:border-brand-cyan"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-navy text-sm font-black text-white">
                      {t.name.charAt(4)}
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                      Rutin Setor
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-brand-navy">
                    {t.name}
                  </h3>
                  <p className="text-[11px] text-brand-cyan-dark font-semibold">
                    {t.assignedClass}
                  </p>
                  <p className="text-[10px] text-brand-text-muted">{t.email}</p>

                  {/* Metrics */}
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-brand-page p-2.5 text-center">
                    <div>
                      <span className="text-xs font-black text-brand-navy">
                        {t.studentCount}
                      </span>
                      <p className="text-[9px] text-brand-text-muted">
                        Siswa Bimbingan
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-black text-brand-navy">
                        {t.submissionRate}%
                      </span>
                      <p className="text-[9px] text-brand-text-muted">
                        Kepatuhan Input
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-brand-line/40 pt-3 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">
                    Aktif: {t.lastActive}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      alert(`Edit Plotting Bimbingan untuk ${t.name}`)
                    }
                    className="rounded-lg bg-brand-navy/10 px-2.5 py-1 text-[11px] font-bold text-brand-navy hover:bg-brand-navy hover:text-white transition-all"
                  >
                    Edit Plotting
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </KoorShell>
  );
}

export default function KoorTeacherPageWrapper() {
  return <KoorTeacherPage />;
}
