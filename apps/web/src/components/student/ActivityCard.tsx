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
      className={`rounded-2xl border border-brand-line border-l-4 ${BORDER_COLORS[statusType]} bg-white p-4 shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-brand-text-muted">
          <Calendar className="h-3.5 w-3.5" />
          <span>{date}</span>
        </div>
        <StatusBadge label={statusLabel} type={statusType} />
      </div>
      <h3 className="mt-2 text-sm font-bold text-brand-navy">{title}</h3>
      {metrics && metrics.length > 0 ? (
        <>
          <div className="my-2 h-px bg-brand-line/60" />
          <div className="flex justify-around text-center">
            {metrics.map((m) => (
              <div key={m.label}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-navy">
                  {m.label}
                </p>
                <p className="mt-0.5 text-xl font-bold text-brand-navy">
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
