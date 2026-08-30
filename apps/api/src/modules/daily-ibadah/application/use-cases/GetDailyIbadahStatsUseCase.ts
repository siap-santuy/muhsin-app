import type { IDailyIbadahRepository } from "../../domain/repositories/IDailyIbadahRepository";

export interface MonthlyIbadahStats {
  month: string; // YYYY-MM
  totalDaysRecorded: number;
  totalDaysSubmitted: number;
  fardhuOnTimeCount: number; // BA or MA
  rawatibTotalCount: number;
  tahajudDaysCount: number;
  dhuhaDaysCount: number;
  puasaDaysCount: number;
  tilawahDaysCount: number;
}

export class GetDailyIbadahStatsUseCase {
  constructor(private readonly repo: IDailyIbadahRepository) {}

  async execute(params: {
    studentId: string;
    month: string; // YYYY-MM
    schoolId: string;
  }): Promise<MonthlyIbadahStats> {
    const list = await this.repo.findByMonth(
      params.studentId,
      params.month,
      params.schoolId
    );

    let totalDaysSubmitted = 0;
    let fardhuOnTimeCount = 0;
    let rawatibTotalCount = 0;
    let tahajudDaysCount = 0;
    let dhuhaDaysCount = 0;
    let puasaDaysCount = 0;
    let tilawahDaysCount = 0;

    for (const item of list) {
      if (item.status === "submitted") {
        totalDaysSubmitted++;
      }

      if (item.sholatFardhu) {
        const times = Object.values(item.sholatFardhu);
        for (const t of times) {
          if (t === "BA" || t === "MA" || t === "H") {
            fardhuOnTimeCount++;
          }
        }
      }

      if (Array.isArray(item.sholatRawatib)) {
        rawatibTotalCount += item.sholatRawatib.length;
      }

      if (item.tahajud) tahajudDaysCount++;
      if (item.dhuha) dhuhaDaysCount++;
      if (item.puasaSunnah) puasaDaysCount++;
      if (item.tilawah && item.tilawah.surahStart > 0) tilawahDaysCount++;
    }

    return {
      month: params.month,
      totalDaysRecorded: list.length,
      totalDaysSubmitted,
      fardhuOnTimeCount,
      rawatibTotalCount,
      tahajudDaysCount,
      dhuhaDaysCount,
      puasaDaysCount,
      tilawahDaysCount,
    };
  }
}
