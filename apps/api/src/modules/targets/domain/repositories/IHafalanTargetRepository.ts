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

  setTargets(input: SetHafalanTargetInput): Promise<HafalanTargetEntity[]>;
}
