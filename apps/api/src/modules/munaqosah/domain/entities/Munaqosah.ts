export interface MunaqosahRequestItem {
  id: string;
  assignmentId?: string | null;
  studentId: string;
  studentName: string;
  className: string;
  teacherId: string;
  teacherName: string;
  juzKe: number;
  status: "diajukan" | "disetujui" | "dijadwalkan" | "lulus" | "tidak_lulus" | "ditolak";
  submissionDate: string;
  assignedExaminerName?: string | null;
  examinerTeacherId?: string | null;
  examDate?: string | null;
  examTime?: string | null;
  hasil?: string | null;
  scores?: Record<string, number> | null;
  catatanPenguji?: string | null;
}
