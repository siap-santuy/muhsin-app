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
  mutabaah: Array<{
    label: string;
    ratio: string;
    grade: string;
    color: string;
  }>;
  evaluasi: string;
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
  evaluasi: string;
}
