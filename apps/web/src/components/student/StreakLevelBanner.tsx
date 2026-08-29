import { ChevronRight, Flame, Star } from "lucide-react";

interface StreakLevelBannerProps {
  streak: number;
  level: number;
  onStreakPress?: () => void;
  onLevelPress?: () => void;
}

export function StreakLevelBanner({
  streak,
  level,
  onStreakPress,
  onLevelPress,
}: StreakLevelBannerProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={onStreakPress}
        className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm transition-opacity hover:opacity-80"
      >
        <Flame className="h-8 w-8 text-[#ff5722]" />
        <div className="flex flex-col text-left">
          <span className="text-base font-bold leading-none text-brand-navy">
            {streak}
          </span>
          <span className="mt-1 text-xs text-brand-text-muted">Hari Streak</span>
        </div>
      </button>
      <div className="h-10 w-px bg-black/5" />
      <button
        type="button"
        onClick={onLevelPress}
        className="flex flex-1 items-center justify-between gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm transition-opacity hover:opacity-80"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-amber/15">
            <Star className="h-5 w-5 text-brand-amber" />
          </span>
          <span className="text-sm font-bold text-brand-navy">Level {level}</span>
        </div>
        <ChevronRight className="h-4 w-4 text-brand-navy" />
      </button>
    </div>
  );
}
