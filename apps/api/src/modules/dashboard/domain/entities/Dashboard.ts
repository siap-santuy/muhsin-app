export interface MonthlyProgressCategory {
  count: number;
  target: number;
  percentage: number;
  caption: string;
}

export interface StudentDashboardSummary {
  studentName: string;
  level: number;
  totalExp: number;
  currentStreak: number;
  longestStreak: number;
  targetHafalan: {
    surahStart: string;
    ayatStart: number;
    surahEnd: string;
    ayatEnd: number;
    progressAyat: string;
  } | null;
  progresBulanIni: {
    ziyadahCount: number;
    murojaahCount: number;
    tahsinCount: number;
    yaumiyahDays: number;
    ziyadah?: MonthlyProgressCategory;
    murojaah?: MonthlyProgressCategory;
    tahsin?: MonthlyProgressCategory;
    yaumiyah?: MonthlyProgressCategory;
  };
}

export interface TeacherDashboardSummary {
  teacherName: string;
  gender?: string | null;
  totalStudents: number;
  totalClassesToday?: number;
  completedClassesToday?: number;
  pendingClassesToday?: number;
  setorHariIniCount: number;
  belumSetorCount: number;
  className: string;
  konsistensiIbadahPercent?: number;
  classProgress?: Array<{
    badge: string;
    badgeBg: string;
    badgeText: string;
    name: string;
    percentage: number;
    progressColor: string;
    targetLabel: string;
  }>;
  attentionStudents?: Array<{
    name: string;
    className: string;
    grade: string;
  }>;
  todayBreakdown?: {
    ziyadahCount: number;
    murojaahCount: number;
    tahsinCount: number;
    totalTarget: number;
  };
}

export interface ParentDashboardSummary {
  parentName: string;
  childId?: string;
  childName: string;
  childClassName: string;
  childLevel: number;
  childStreak: number;
  lastSetoran?: {
    tab: "ziyadah" | "murojaah" | "tahsin";
    categoryName: string;
    reference: string;
    date: string;
    scoreAvg: number;
    keterangan?: string;
  } | null;
  progres: {
    ziyadahCount: number;
    murojaahCount: number;
    tahsinCount: number;
    yaumiyahDays: number;
    ziyadah?: MonthlyProgressCategory;
    murojaah?: MonthlyProgressCategory;
    tahsin?: MonthlyProgressCategory;
    yaumiyah?: MonthlyProgressCategory;
  };
  isYaumiyahTodayFilled: boolean;
}

export interface KoordinatorDashboardSummary {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  setoranMingguIniCount: number;
  chartData: Array<{ day: string; Ziyadah: number; Murojaah: number; Tahsin: number }>;
}
