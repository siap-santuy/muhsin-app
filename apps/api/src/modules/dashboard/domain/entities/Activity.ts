export type YaumiyahStatus = "missing" | "draft" | "submitted";
export type ParentViewSource = "dashboard" | "raport";

export interface StudentActivityRow {
  studentId: string;
  studentName: string;
  className: string | null;
  yaumiyahStatus: YaumiyahStatus;
  parentLastViewAt: Date | null;
  parentLastSource: ParentViewSource | null;
  parentName: string | null;
}

export interface TeacherActivityRow {
  teacherId: string;
  teacherName: string;
  classes: Array<{ id: string; name: string }>;
  lastAssessmentAt: Date | null;
  assessedToday: boolean;
  countToday: number;
}
