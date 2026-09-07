export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export function formatNotificationTime(timeStr?: string | null): string {
  if (!timeStr) return "";

  const date = new Date(timeStr);
  if (isNaN(date.getTime())) return timeStr;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const timeFormatted = `${hours}:${minutes}`;

  // Kurang dari 1 menit
  if (diffSec >= 0 && diffSec < 60) {
    return "Baru saja";
  }

  // Kurang dari 60 menit
  if (diffMin > 0 && diffMin < 60) {
    return `${diffMin} menit yang lalu`;
  }

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    if (diffHours < 5) {
      return `${diffHours} jam yang lalu`;
    }
    return `Hari ini, ${timeFormatted}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `Kemarin, ${timeFormatted}`;
  }

  const d = String(date.getDate()).padStart(2, "0");
  const mName = MONTH_NAMES_SHORT[date.getMonth()] || "";
  const y = date.getFullYear();

  if (y === now.getFullYear()) {
    return `${d} ${mName}, ${timeFormatted}`;
  }

  return `${d} ${mName} ${y}, ${timeFormatted}`;
}
