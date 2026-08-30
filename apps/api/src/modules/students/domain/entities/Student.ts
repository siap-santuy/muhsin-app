export interface StudentListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  className: string | null;
  classId: string | null;
  teacherName: string | null;
  teacherId: string | null;
  level: number;
  totalExp: number;
  currentStreak: number;
}
