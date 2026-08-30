export interface SholatFardhuStatus {
  subuh: "BA" | "MA" | "BT" | "MT" | "H" | "T";
  dzuhur: "BA" | "MA" | "BT" | "MT" | "H" | "T";
  ashar: "BA" | "MA" | "BT" | "MT" | "H" | "T";
  maghrib: "BA" | "MA" | "BT" | "MT" | "H" | "T";
  isya: "BA" | "MA" | "BT" | "MT" | "H" | "T";
}

export interface TilawahRef {
  surahStart: number;
  ayatStart: number;
  surahEnd: number;
  ayatEnd: number;
}

export interface DailyIbadahEntity {
  id: string;
  schoolId: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: "draft" | "submitted";
  submittedAt: Date | null;
  tilawah?: TilawahRef | null;
  sholatFardhu?: SholatFardhuStatus | null;
  sholatRawatib?: string[] | null;
  tahajud: boolean;
  dhuha: boolean;
  puasaSunnah?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
