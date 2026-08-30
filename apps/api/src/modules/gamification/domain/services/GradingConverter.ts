export interface GradeScaleItem {
  min: number;
  max: number;
  letter: string;
  labelLatin?: string;
  labelArab?: string;
}

export class GradingConverter {
  /**
   * Converts numeric score (0-100) to letter and qualitative label
   */
  static convertScoreToGrade(
    score: number,
    gradingScale: GradeScaleItem[]
  ): { letter: string; labelLatin?: string; labelArab?: string } {
    for (const item of gradingScale) {
      if (score >= item.min && score <= item.max) {
        return {
          letter: item.letter,
          labelLatin: item.labelLatin,
          labelArab: item.labelArab,
        };
      }
    }
    // Fallback: lowest grade
    const last = gradingScale[gradingScale.length - 1];
    return {
      letter: last?.letter ?? "F",
      labelLatin: last?.labelLatin ?? "Dhaif Jiddan",
      labelArab: last?.labelArab ?? "ضعيف جدا",
    };
  }

  /**
   * Calculates monthly accumulation score: average of averages
   * Formula: average( average(score_fields) ) across all entries in the month
   */
  static calculateAkumulasi(entries: Array<Record<string, number>>): number {
    if (!entries.length) return 0;

    const entryAverages = entries.map((entry) => {
      const values = Object.values(entry).filter((v) => typeof v === "number");
      if (!values.length) return 0;
      return values.reduce((sum, v) => sum + v, 0) / values.length;
    });

    const totalAverage =
      entryAverages.reduce((sum, v) => sum + v, 0) / entryAverages.length;

    return Math.round(totalAverage * 100) / 100;
  }
}
