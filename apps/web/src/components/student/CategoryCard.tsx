import type { LucideIcon } from "lucide-react";
import { CircularProgress } from "@/components/ui/CircularProgress";

export interface CategoryCardProps {
  icon: LucideIcon;
  iconClass: string;
  title: string;
  subtitle: string;
  percent: number;
  caption: string;
  ringColor?: string;
  active?: boolean;
}

export function CategoryCard({
  icon: Icon,
  iconClass,
  title,
  subtitle,
  percent,
  caption,
  ringColor = "#22bad0",
  active,
}: CategoryCardProps) {
  return (
    <article
      className={`flex flex-1 flex-col items-center gap-2 rounded-2xl border bg-white p-4 shadow-sm ${
        active
          ? "border-brand-cyan border-b-4"
          : "border-brand-line"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`flex h-6 w-6 items-center justify-center rounded-md ${iconClass}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-sm font-bold text-brand-navy">{title}</span>
      </div>
      <p className="text-[10px] text-brand-text-muted">{subtitle}</p>
      <div className="relative flex items-center justify-center">
        <CircularProgress percent={percent} size={72} strokeWidth={6} color={ringColor} />
        <span className="absolute text-lg font-bold text-brand-navy">
          {percent}%
        </span>
      </div>
      <p className="text-xs font-medium text-brand-text-muted">{caption}</p>
    </article>
  );
}
