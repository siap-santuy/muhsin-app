import {
  BookOpen,
  CalendarCheck,
  Moon,
  Sun,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export interface MutabaahRow {
  icon?: LucideIcon;
  label: string;
  ratio: string;
  grade: string;
  color?: string;
}

export interface MutabaahSectionProps {
  rows?: MutabaahRow[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  tilawah: BookOpen,
  "shalat fardhu": CalendarCheck,
  "sholat fardhu": CalendarCheck,
  "shalat sunnah": Sun,
  "sholat sunnah": Sun,
  "sunnah rawatib": Sun,
  tahajud: Moon,
  dhuha: Sun,
  shaum: UtensilsCrossed,
  puasa: UtensilsCrossed,
};

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
          const Icon = row.icon ?? ICON_MAP[row.label.toLowerCase()] ?? BookOpen;
          return (
            <div
              key={row.label}
              className="flex items-center justify-between py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`h-4 w-4 ${row.color ?? "text-brand-cyan"}`} />
                <span className="text-xs font-bold text-brand-navy">
                  {row.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-navy">
                  {row.ratio}
                </span>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-xs font-extrabold ${
                    row.grade === "A"
                      ? "text-emerald-600 bg-emerald-50"
                      : row.grade === "B"
                      ? "text-brand-cyan bg-brand-cyan/10"
                      : row.grade === "C"
                      ? "text-amber-600 bg-amber-50"
                      : "text-red-600 bg-red-50"
                  }`}
                >
                  {row.grade}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
