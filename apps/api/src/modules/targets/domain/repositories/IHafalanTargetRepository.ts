import type { HafalanTargetEntity } from "../entities/HafalanTarget";

export interface SetHafalanTargetInput {
  schoolId: string;
  teacherId: string;
  bulan: string; // YYYY-MM
  studentIds: string[];
  targetSurahStart: string;
  targetAyatStart: string;
  targetSurahEnd: string;
  targetAyatEnd: string;
  catatan?: string | null;
}

export interface StudentHafalanPosition {
  lastSurah: string | null;
  lastSurahNumber: number | null;
  lastAyat: number | null;
  lastSetoranDate: string | null;
  suggestedStartSurah: string;
  suggestedStartSurahNumber: number;
  suggestedStartAyat: number;
}

export interface IHafalanTargetRepository {
  findByStudentAndMonth(
    studentId: string,
    bulan: string,
    schoolId: string
  ): Promise<HafalanTargetEntity | null>;

  findByClassAndMonth(
    classId: string,
    bulan: string,
    schoolId: string
  ): Promise<HafalanTargetEntity[]>;

  findStudentLastZiyadahPosition(
    studentId: string,
    schoolId: string
  ): Promise<StudentHafalanPosition>;

  setTargets(input: SetHafalanTargetInput): Promise<HafalanTargetEntity[]>;
}
