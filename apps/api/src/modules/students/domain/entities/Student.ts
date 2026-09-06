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
  hasSetoranOnDate?: boolean;
  categorySetoranStatus?: {
    ziyadah: boolean;
    murojaah: boolean;
    sabiq: boolean;
    talaqi: boolean;
  };
  lastActivity?: {
    label: string;
    date: string;
    grade: string;
    subcategoryCode?: string;
    setoranId?: string;
  } | null;
}
