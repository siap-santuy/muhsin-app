export class ExpCalculator {
  /**
   * Formula: level N requires 100 * N cumulative EXP.
   * Total required for level L = 100 * (1 + 2 + ... + L-1) = 50 * L * (L-1)
   * Inverse: L ≈ floor((1 + sqrt(1 + 8 * exp / 100)) / 2)
   * Minimum level is 1. Level never drops.
   */
  static calculateLevel(totalExp: number): number {
    if (totalExp <= 0) return 1;
    // Cumulative threshold: Level 1 = 0, Level 2 = 100, Level 3 = 300, Level 4 = 600, etc.
    let level = 1;
    let threshold = 0;
    while (threshold + 100 * level <= totalExp) {
      threshold += 100 * level;
      level += 1;
    }
    return level;
  }

  /**
   * Evaluates streak based on last activity date and completeness.
   * - Streak increments only if isComplete is true AND activity is on the consecutive day.
   * - Same day activity is idempotent (no change in streak count).
   * - Incomplete activity or gap > 1 day resets current streak to 0 (or 1 if complete today).
   */
  static evaluateStreak(params: {
    lastActivityDate: string | null;
    currentStreak: number;
    longestStreak: number;
    today: string;
    isComplete: boolean;
  }): { currentStreak: number; longestStreak: number } {
    const { lastActivityDate, currentStreak, longestStreak, today, isComplete } =
      params;

    if (!isComplete) {
      return { currentStreak: 0, longestStreak };
    }

    if (!lastActivityDate) {
      return {
        currentStreak: 1,
        longestStreak: Math.max(longestStreak, 1),
      };
    }

    const last = new Date(lastActivityDate);
    const curr = new Date(today);
    const diffDays = Math.round(
      (curr.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      // Same day: idempotent, keep current streak
      return { currentStreak, longestStreak };
    } else if (diffDays === 1) {
      // Consecutive day: increment
      const newStreak = currentStreak + 1;
      return {
        currentStreak: newStreak,
        longestStreak: Math.max(longestStreak, newStreak),
      };
    } else {
      // Gap > 1 day: reset and start at 1 for today
      return {
        currentStreak: 1,
        longestStreak: Math.max(longestStreak, 1),
      };
    }
  }
}
