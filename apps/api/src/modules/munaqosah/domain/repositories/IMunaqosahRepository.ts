import type { MunaqosahRequestItem, MunaqosahExaminerItem } from "../entities/Munaqosah";

export interface IMunaqosahRepository {
  findRequests(schoolId: string, status?: string): Promise<MunaqosahRequestItem[]>;
  createRequest(params: {
    schoolId: string;
    studentId: string;
    teacherId: string;
    juzKe: number;
  }): Promise<string>;
  updateRequestStatus(
    id: string,
    schoolId: string,
    status: "diajukan" | "disetujui" | "dijadwalkan" | "lulus" | "tidak_lulus" | "ditolak"
  ): Promise<void>;
  createAssignment(params: {
    requestId: string;
    periodId: string;
    examinerTeacherId: string;
    jadwalTanggal: string;
    jadwalWaktu?: string;
    assignedBy: string;
  }): Promise<string>;
  getRequestDetail(
    requestId: string,
    schoolId: string
  ): Promise<{ studentId: string; studentName: string; juzKe: number; schoolId: string } | null>;
  findParentIdsByStudent(studentId: string, schoolId: string): Promise<string[]>;
  findMyExams(examinerTeacherId: string, schoolId: string): Promise<MunaqosahRequestItem[]>;
  getAssignmentOwner(
    assignmentId: string,
    schoolId: string
  ): Promise<{ examinerTeacherId: string } | null>;
  findExaminers(periodId: string, schoolId: string): Promise<MunaqosahExaminerItem[]>;
  upsertExaminer(params: {
    periodId: string;
    teacherId: string;
    kapasitasSiswa: number;
    assignedBy: string;
    schoolId: string;
  }): Promise<string>;
  removeExaminer(periodId: string, teacherId: string, schoolId: string): Promise<void>;
  checkExaminerCapacity(
    periodId: string,
    examinerTeacherId: string,
    schoolId: string
  ): Promise<{ kapasitas: number; terpakai: number; penuh: boolean } | null>;
  submitResult(params: {
    assignmentId: string;
    scores: Record<string, number>;
    hasil: "lulus" | "tidak_lulus";
    catatanPenguji?: string;
  }): Promise<{ studentId: string; juzKe: number; schoolId: string }>;
  grantAchievement(params: {
    schoolId: string;
    studentId: string;
    juzKe: number;
    sourceId: string;
  }): Promise<void>;
}
