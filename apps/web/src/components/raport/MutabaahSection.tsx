import {
  BookOpen,
  CalendarCheck,
  Moon,
  Sun,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export interface MutabaahRow {
  icon: LucideIcon;
  label: string;
  ratio: string;
  grade: string;
  color: string;
}

export interface MutabaahSectionProps {
  rows?: MutabaahRow[];
}

const DEFAULT_ROWS: MutabaahRow[] = [
  { icon: BookOpen, label: "Tilawah", ratio: "30/30", grade: "A", color: "text-emerald-500" },
  { icon: CalendarCheck, label: "Shalat Fardhu", ratio: "150/150", grade: "B", color: "text-brand-cyan" },
  { icon: Sun, label: "Shalat Sunnah", ratio: "240/240", grade: "C", color: "text-amber-500" },
  { icon: Moon, label: "Tahajud", ratio: "30/30", grade: "C", color: "text-amber-500" },
  { icon: Sun, label: "Dhuha", ratio: "30/30", grade: "C", color: "text-amber-500" },
  { icon: UtensilsCrossed, label: "Shaum", ratio: "8/8", grade: "D", color: "text-red-500" },
];

export function MutabaahSection({ rows = DEFAULT_ROWS }: MutabaahSectionProps) {
  return (
    <section>
      <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-brand-navy">
        MUTABA&apos;AH YAUMIYYAH
      </h3>
      <div className="rounded-2xl border border-brand-line bg-white px-4 py-2 shadow-sm divide-y divide-brand-line/40">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-brand-cyan" />
                <span className="text-xs font-bold text-brand-navy">{row.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-brand-text-muted">{row.ratio}</span>
                <span className={`text-sm font-extrabold ${row.color}`}>{row.grade}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
