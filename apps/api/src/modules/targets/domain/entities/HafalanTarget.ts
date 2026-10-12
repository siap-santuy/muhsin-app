export interface HafalanTargetEntity {
  id: string;
  schoolId: string;
  studentId: string;
  teacherId: string;
  bulan: string; // YYYY-MM
  targetSurahStart: string | null;
  targetAyatStart: string | null;
  targetSurahEnd: string | null;
  targetAyatEnd: string | null;
  catatan: string | null;
  createdAt: Date;
  updatedAt: Date;
}
