import type { LucideIcon } from "lucide-react";

export interface YaumiyahStatProps {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  countText: string;
}

export function YaumiyahStatCard({
  icon: Icon,
  iconClass,
  label,
  countText,
}: YaumiyahStatProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-line bg-white px-3 py-3 shadow-sm">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-4 w-4 ${iconClass}`} />
        <span className="text-xs font-bold text-brand-navy">{label}</span>
      </div>
      <span className="mt-1 text-xs font-semibold text-brand-text-muted">
        {countText}
      </span>
    </div>
  );
}
