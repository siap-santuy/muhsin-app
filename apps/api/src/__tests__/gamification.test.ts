import { describe, it, expect } from "vitest";
import { ExpCalculator } from "../modules/gamification/domain/services/ExpCalculator";
import { GradingConverter } from "../modules/gamification/domain/services/GradingConverter";

describe("ExpCalculator", () => {
  it("calculates level from total EXP correctly", () => {
    expect(ExpCalculator.calculateLevel(0)).toBe(1);
    expect(ExpCalculator.calculateLevel(50)).toBe(1);
    expect(ExpCalculator.calculateLevel(100)).toBe(2);
    expect(ExpCalculator.calculateLevel(299)).toBe(2);
    expect(ExpCalculator.calculateLevel(300)).toBe(3); // 100 + 200 = 300
    expect(ExpCalculator.calculateLevel(600)).toBe(4); // 100 + 200 + 300 = 600
  });

  it("evaluates streak progression on consecutive days", () => {
    // First activity
    const first = ExpCalculator.evaluateStreak({
      lastActivityDate: null,
      currentStreak: 0,
      longestStreak: 0,
      today: "2026-08-10",
      isComplete: true,
    });
    expect(first.currentStreak).toBe(1);
    expect(first.longestStreak).toBe(1);

    // Consecutive day
    const second = ExpCalculator.evaluateStreak({
      lastActivityDate: "2026-08-10",
      currentStreak: 1,
      longestStreak: 1,
      today: "2026-08-11",
      isComplete: true,
    });
    expect(second.currentStreak).toBe(2);
    expect(second.longestStreak).toBe(2);

    // Idempotent same-day call
    const sameDay = ExpCalculator.evaluateStreak({
      lastActivityDate: "2026-08-11",
      currentStreak: 2,
      longestStreak: 2,
      today: "2026-08-11",
      isComplete: true,
    });
    expect(sameDay.currentStreak).toBe(2);

    // Incomplete submission resets streak
    const incomplete = ExpCalculator.evaluateStreak({
      lastActivityDate: "2026-08-11",
      currentStreak: 2,
      longestStreak: 2,
      today: "2026-08-12",
      isComplete: false,
    });
    expect(incomplete.currentStreak).toBe(0);
    expect(incomplete.longestStreak).toBe(2); // longest preserved

    // Gap > 1 day resets streak to 1
    const gap = ExpCalculator.evaluateStreak({
      lastActivityDate: "2026-08-10",
      currentStreak: 5,
      longestStreak: 5,
      today: "2026-08-15",
      isComplete: true,
    });
    expect(gap.currentStreak).toBe(1);
    expect(gap.longestStreak).toBe(5);
  });
});

describe("GradingConverter", () => {
  const gradingScale = [
    { min: 91, max: 100, letter: "A", labelLatin: "Mumtaz", labelArab: "ممتاز" },
    { min: 80, max: 90, letter: "B", labelLatin: "Jayyid Jiddan", labelArab: "جيد جدا" },
    { min: 70, max: 79, letter: "C", labelLatin: "Jayyid", labelArab: "جيد" },
    { min: 51, max: 69, letter: "D", labelLatin: "Maqbul", labelArab: "مقبول" },
    { min: 31, max: 50, letter: "E", labelLatin: "Dhaif", labelArab: "ضعيف" },
    { min: 0, max: 30, letter: "F", labelLatin: "Dhaif Jiddan", labelArab: "ضعيف جدا" },
  ];

  it("converts numeric score to letter and labels", () => {
    expect(GradingConverter.convertScoreToGrade(95, gradingScale)).toEqual({
      letter: "A",
      labelLatin: "Mumtaz",
      labelArab: "ممتاز",
    });
    expect(GradingConverter.convertScoreToGrade(85, gradingScale).letter).toBe("B");
    expect(GradingConverter.convertScoreToGrade(75, gradingScale).letter).toBe("C");
    expect(GradingConverter.convertScoreToGrade(60, gradingScale).letter).toBe("D");
  });

  it("calculates monthly accumulation (average of averages)", () => {
    const entries = [
      { tajwid: 90, kelancaran: 80 }, // avg: 85
      { tajwid: 100, kelancaran: 90 }, // avg: 95
    ];
    // average of 85 and 95 = 90
    expect(GradingConverter.calculateAkumulasi(entries)).toBe(90);
  });
});
