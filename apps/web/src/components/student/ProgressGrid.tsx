import type { LucideIcon } from "lucide-react";

export interface ProgressItem {
  label: string;
  value: string;
  caption: string;
  percent: number;
  barClass: string;
  trackClass: string;
  icon?: LucideIcon;
  iconClass?: string;
}

interface ProgressGridProps {
  title: string;
  items: ProgressItem[];
}

export function ProgressGrid({ title, items }: ProgressGridProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-brand-navy">{title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.label}
              className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-2">
                {Icon && (
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-md ${item.iconClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                )}
                <p className="text-xs font-medium text-brand-navy">{item.label}</p>
              </div>
              <p className="mt-1 text-3xl font-bold text-brand-navy">{item.value}</p>
              <div
                className={`mt-2 h-1.5 w-full overflow-hidden rounded-full ${item.trackClass}`}
              >
                <div
                  className={`h-full rounded-full ${item.barClass}`}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-brand-text-muted">{item.caption}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
