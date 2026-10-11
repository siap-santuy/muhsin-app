import { Calendar } from "lucide-react";
import { StatusBadge, type StatusType } from "@/components/ui/StatusBadge";

export interface MetricItem {
  label: string;
  value: number;
}

export interface ActivityCardProps {
  date: string;
  statusLabel: string;
  statusType: StatusType;
  title: string;
  metrics?: MetricItem[];
}

const BORDER_COLORS: Record<StatusType, string> = {
  setoran: "border-l-emerald-500",
  sakit: "border-l-amber-400",
  izin: "border-l-amber-400",
  alpa: "border-l-red-500",
};

export function ActivityCard({
  date,
  statusLabel,
  statusType,
  title,
  metrics,
}: ActivityCardProps) {
  return (
    <article
      className={`rounded-2xl border border-brand-line border-l-4 ${BORDER_COLORS[statusType]} bg-white p-4 shadow-sm overflow-hidden`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-brand-text-muted shrink-0">
          <Calendar className="h-3.5 w-3.5" />
          <span>{date}</span>
        </div>
        <div className="shrink-0">
          <StatusBadge label={statusLabel} type={statusType} />
        </div>
      </div>
      <h3 className="mt-2 text-sm font-bold text-brand-navy break-words leading-snug">
        {title}
      </h3>
      {metrics && metrics.length > 0 ? (
        <>
          <div className="my-2.5 h-px bg-brand-line/60" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {metrics.map((m) => (
              <div key={m.label} className="bg-gray-50/80 rounded-xl py-1.5 px-2 border border-brand-line/40">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-navy truncate" title={m.label}>
                  {m.label}
                </p>
                <p className="mt-0.5 text-base font-extrabold text-brand-cyan-dark">
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </article>
  );
}
