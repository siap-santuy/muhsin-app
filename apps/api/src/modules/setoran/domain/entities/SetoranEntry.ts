export interface SetoranEntryEntity {
  id: string;
  schoolId: string;
  subcategoryId: string;
  studentId: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  referenceStart?: Record<string, any> | null;
  referenceEnd?: Record<string, any> | null;
  scores: Record<string, number>; // { tajwid: 90, kelancaran: 85 }
  keterangan?: string | null;
  status?: "setoran" | "sakit" | "izin" | "alpa";
  subcategoryCode?: string;
  subcategoryName?: string;
  categoryCode?: string;
  categoryName?: string;
  substitutedForTeacherId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
