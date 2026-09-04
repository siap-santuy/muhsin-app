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
  sumatif?: RaportSumatif;
}

