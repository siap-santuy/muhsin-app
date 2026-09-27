import type { StudentActivityRow, TeacherActivityRow, ParentViewSource } from "../entities/Activity";

export interface RecordParentViewInput {
  schoolId: string;
  parentId: string;
  studentId: string;
  source: ParentViewSource;
}

export interface IActivityRepository {
  getStudentActivity(schoolId: string, date: string, classId?: string): Promise<StudentActivityRow[]>;
  getTeacherActivity(schoolId: string, date: string): Promise<TeacherActivityRow[]>;
  recordParentView(input: RecordParentViewInput): Promise<void>;
  findChildIdsByParent(parentId: string, schoolId: string): Promise<string[]>;
  findParentIdsByStudent(studentId: string, schoolId: string): Promise<string[]>;
  findRecentReminder(targetUserId: string, schoolId: string, title: string, since: Date): Promise<boolean>;
  purgeOldParentViews(olderThan: Date, schoolId?: string): Promise<number>;
}
