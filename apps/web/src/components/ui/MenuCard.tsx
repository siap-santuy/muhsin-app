import { ChevronRight, type LucideIcon } from "lucide-react";

interface MenuCardProps {
  icon: LucideIcon;
  iconClass: string;
  title: string;
  description: string;
  onPress?: () => void;
}

export function MenuCard({
  icon: Icon,
  iconClass,
  title,
  description,
  onPress,
}: MenuCardProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex w-full items-center justify-between gap-6 rounded-2xl border border-brand-line bg-white px-6 py-6 text-left shadow-sm"
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-brand-navy">{title}</h3>
          <p className="text-xs text-brand-text-muted">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-brand-navy" />
    </button>
  );
}
