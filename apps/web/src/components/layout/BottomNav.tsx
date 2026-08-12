import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  icon: LucideIcon;
}

interface BottomNavProps {
  items: NavItem[];
  activeIndex: number;
  onSelect?: (index: number) => void;
}

export function BottomNav({ items, activeIndex, onSelect }: BottomNavProps) {
  return (
    <nav className="shrink-0 flex items-center justify-between border-t border-brand-line bg-white px-5 pt-2 pb-2 shadow-sm rounded-t-xl">
      {items.map((item, i) => {
        const active = i === activeIndex;
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              if (onSelect) {
                onSelect(i);
              } else {
                if (item.label === "Beranda") window.location.hash = "#/student";
                if (item.label === "Yaumiyah") window.location.hash = "#/student-yaumiyah";
              }
            }}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl px-2 py-2",
              active ? "text-brand-cyan" : "text-brand-navy"
            )}
          >
            <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} />
            <span className="text-xs font-semibold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
