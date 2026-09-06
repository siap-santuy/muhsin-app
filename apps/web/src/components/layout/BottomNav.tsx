import { BookOpen, CalendarCheck, FileText, Home, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  icon: LucideIcon;
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Beranda", icon: Home },
  { label: "Yaumiyah", icon: CalendarCheck },
  { label: "Raport", icon: FileText },
  { label: "Profil", icon: User },
];

export const TEACHER_NAV_ITEMS: NavItem[] = [
  { label: "Beranda", icon: Home },
  { label: "TTQ", icon: BookOpen },
  { label: "Raport", icon: FileText },
  { label: "Profil", icon: User },
];

interface BottomNavProps {
  items?: NavItem[];
  activeIndex: number;
  onSelect?: (index: number) => void;
}

const ROUTE_MAP: Record<number, string> = {
  0: "#/dashboard",
  1: "#/yaumiyah",
  2: "#/raport",
  3: "#/profile",
};

export function BottomNav({ items = DEFAULT_NAV_ITEMS, activeIndex, onSelect }: BottomNavProps) {
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
              }
              const targetRoute = ROUTE_MAP[i];
              if (targetRoute) {
                window.location.hash = targetRoute;
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
