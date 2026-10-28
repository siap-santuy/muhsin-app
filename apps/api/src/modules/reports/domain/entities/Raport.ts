export interface RaportSumatifTestTahfidz {
  grade: string;
  score: string;
  arabicPredicate: string;
  capaian: string;
  tajwid: string;
  kelancaran: string;
}

export interface RaportSumatifTestTilawah {
  grade: string;
  score: string;
  arabicPredicate: string;
  capaian: string;
  tajwid: string;
  kelancaran: string;
}

export interface RaportSumatifTestTertulis {
  grade: string;
  score: string;
  arabicPredicate: string;
  materi: string;
}

export interface RaportSumatif {
  testTahfidz: RaportSumatifTestTahfidz;
  testTilawah: RaportSumatifTestTilawah;
  testTertulis: RaportSumatifTestTertulis;
}

export interface RaportDetailTtq {
  ziyadah: number;
  murojaah: number;
  makhroj: number;
  mad: number;
  ghunnah: number;
  kelancaran: number;
}

export interface RaportAbsensi {
  kehadiranRatio: string;
  tidakSetoranCount: number;
  sakitCount: number;
  izinCount: number;
  alpaCount: number;
}

export interface MonthlyRaportData {
  student: {
    id: string;
    name: string;
    email: string;
    className: string;
    pembimbingName: string;
  };
  period: {
    month: string;
    year: string;
  };
  nilaiTtq: {
    tahfidz: {
      grade: string;
      score: string;
      arabicPredicate: string;
      capaian: string;
    };
    tahsin: {
      grade: string;
      score: string;
      arabicPredicate: string;
      capaian: string;
    };
  };
  detailTtq: RaportDetailTtq;
  absensi: RaportAbsensi;
  mutabaah: Array<{
    label: string;
    ratio: string;
    grade: string;
    color: string;
  }>;
  evaluasi: string | null;
  munaqosah?: {
    keterangan: string;
    nilai: string;
  };
  sumatif?: RaportSumatif;
}

export interface SemesterRaportData {
  student: {
    id: string;
    name: string;
    email: string;
    className: string;
    pembimbingName: string;
  };
  period: {
    semester: string;
    tahunAjaran: string;
  };
  nilaiAkhir: number;
  gradeAkhir: string;
  arabicPredicate: string;
  nilaiTtq: {
    tahfidz: {
      grade: string;
      score: string;
      arabicPredicate: string;
      capaian: string;
    };
    tahsin: {
      grade: string;
      score: string;
      arabicPredicate: string;
      capaian: string;
    };
  };
  detailTtq: RaportDetailTtq;
  absensi: RaportAbsensi;
  kategoriList: Array<{
    name: string;
    grade: string;
    score: number;
    arabicPredicate: string;
  }>;
  mutabaah: Array<{
    label: string;
    ratio: string;
    grade: string;
    color: string;
  }>;
  evaluasi: string | null;
  munaqosah?: {
    keterangan: string;
    nilai: string;
  };
  sumatif?: RaportSumatif;
}

export interface RaportSummaryItem {
  rank: number;
  studentId: string;
  studentName: string;
  className: string;
  tahfidzScore: number;
  tahfidzGrade: string;
  tahsinScore: number;
  tahsinGrade: string;
  yaumiyahGrade: string;
  nilaiAkhir: number;
  gradeAkhir: string;
  arabicPredicate: string;
  isUnderTarget: boolean; // Nilai kurang (< 75 atau grade C/D)
}

export interface RaportSummaryFilter {
  schoolId: string;
  mode: "monthly" | "semester";
  month?: string; // YYYY-MM
  semester?: string; // Ganjil / Genap
  tahunAjaran?: string; // 2026/2027
  classId?: string;
  className?: string;
  teacherId?: string;
}

