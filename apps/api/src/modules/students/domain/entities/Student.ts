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
  categoryLastActivity?: {
    ziyadah?: {
      label: string;
      date: string;
      grade: string;
      subcategoryCode?: string;
      setoranId?: string;
      attendanceStatus?: "Hadir" | "Izin" | "Sakit" | "Alpa" | string;
    } | null;
    murojaah?: {
      label: string;
      date: string;
      grade: string;
      subcategoryCode?: string;
      setoranId?: string;
      attendanceStatus?: "Hadir" | "Izin" | "Sakit" | "Alpa" | string;
    } | null;
    sabiq?: {
      label: string;
      date: string;
      grade: string;
      subcategoryCode?: string;
      setoranId?: string;
      attendanceStatus?: "Hadir" | "Izin" | "Sakit" | "Alpa" | string;
    } | null;
    talaqi?: {
      label: string;
      date: string;
      grade: string;
      subcategoryCode?: string;
      setoranId?: string;
      attendanceStatus?: "Hadir" | "Izin" | "Sakit" | "Alpa" | string;
    } | null;
  };
  lastActivity?: {
    label: string;
    date: string;
    grade: string;
    subcategoryCode?: string;
    setoranId?: string;
    attendanceStatus?: "Hadir" | "Izin" | "Sakit" | "Alpa" | string;
  } | null;
}
