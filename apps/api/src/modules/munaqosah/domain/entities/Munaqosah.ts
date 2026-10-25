export interface MunaqosahRequestItem {
  id: string;
  assignmentId?: string | null;
  periodId?: string | null;
  periodName?: string | null;
  studentId: string;
  studentName: string;
  className: string;
  teacherId: string;
  teacherName: string;
  juzKe: number;
  juzList?: number[] | null;
  status: "diajukan" | "disetujui" | "dijadwalkan" | "lulus" | "tidak_lulus" | "ditolak";
  submissionDate: string;
  assignedExaminerName?: string | null;
  examinerTeacherId?: string | null;
  examDate?: string | null;
  examTime?: string | null;
  hasil?: string | null;
  scores?: Record<string, number> | null;
  nilaiAkhir?: number | null;
  grade?: string | null;
  catatanPenguji?: string | null;
  isResultPublished?: boolean;
}

export interface MunaqosahExaminerItem {
  id: string;
  periodId: string;
  teacherId: string;
  teacherName: string;
  kapasitasSiswa: number;
  terpakai: number;
}

export interface MunaqosahPeriodItem {
  id: string;
  schoolId: string;
  academicPeriodId: string;
  academicPeriodName?: string | null;
  nama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: "draft" | "buka" | "tutup";
  isResultPublished: boolean;
  createdAt: string;
}
