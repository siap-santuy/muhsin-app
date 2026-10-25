export function getDaysDiffFromToday(dateStr: string, todayStr?: string): number {
  const [y1, m1, d1] = dateStr.split("-").map(Number);
  const target = new Date(Date.UTC(y1, m1 - 1, d1));

  let today: Date;
  if (todayStr) {
    const [y2, m2, d2] = todayStr.split("-").map(Number);
    today = new Date(Date.UTC(y2, m2 - 1, d2));
  } else {
    const now = new Date();
    today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  const diffMs = today.getTime() - target.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function isWithinDirectWindow(dateStr: string, todayStr?: string): boolean {
  const diffDays = getDaysDiffFromToday(dateStr, todayStr);
  // diffDays === 0 (hari ini), diffDays === 1 (kemarin)
  return diffDays <= 1 && diffDays >= 0;
}
