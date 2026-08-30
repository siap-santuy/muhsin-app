import type { SholatFardhuStatus, TilawahRef } from "../entities/DailyIbadah";

export class IbadahValidator {
  /**
   * Poin EXP default per indikator sholat fardhu (PRD #4.6)
   */
  static readonly SHOLAT_EXP: Record<string, number> = {
    BA: 5,
    MA: 4,
    BT: 3,
    MT: 2,
    H: 5,
    T: 0,
  };

  /**
   * Poin EXP sholat sunnah rawatib (per waktu sholat)
   */
  static readonly RAWATIB_EXP = 2;

  /**
   * Poin EXP tahajud & dhuha
   */
  static readonly TAHAJUD_EXP = 10;
  static readonly DHUHA_EXP = 5;

  /**
   * Poin EXP puasa sunnah
   */
  static readonly PUASA_EXP = 15;

  /**
   * Menghitung total EXP yang didapat dari satu hari ibadah yang di-submit
   */
  static calculateDayExp(params: {
    sholatFardhu?: SholatFardhuStatus | null;
    sholatRawatib?: string[] | null;
    tahajud: boolean;
    dhuha: boolean;
    puasaSunnah?: string | null;
    tilawah?: TilawahRef | null;
  }): number {
    let exp = 0;

    if (params.sholatFardhu) {
      for (const time of ["subuh", "dzuhur", "ashar", "maghrib", "isya"] as const) {
        const val = params.sholatFardhu[time];
        if (val && IbadahValidator.SHOLAT_EXP[val] !== undefined) {
          exp += IbadahValidator.SHOLAT_EXP[val]!;
        }
      }
    }

    if (params.sholatRawatib && params.sholatRawatib.length > 0) {
      exp += params.sholatRawatib.length * IbadahValidator.RAWATIB_EXP;
    }

    if (params.tahajud) exp += IbadahValidator.TAHAJUD_EXP;
    if (params.dhuha) exp += IbadahValidator.DHUHA_EXP;
    if (params.puasaSunnah) exp += IbadahValidator.PUASA_EXP;
    if (params.tilawah) exp += 10; // Base tilawah exp

    return exp;
  }

  /**
   * Validasi apakah input ibadah lengkap untuk streak (semua sholat fardhu terisi)
   */
  static isCompleteForStreak(sholatFardhu?: SholatFardhuStatus | null): boolean {
    if (!sholatFardhu) return false;
    const required = ["subuh", "dzuhur", "ashar", "maghrib", "isya"] as const;
    return required.every((k) => sholatFardhu[k] !== undefined && sholatFardhu[k] !== null);
  }
}
