export interface TeacherListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  classes: Array<{ id: string; name: string }>;
  studentCount: number;
}
