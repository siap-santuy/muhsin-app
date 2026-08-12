export type StatusType = "setoran" | "sakit" | "izin" | "alpa";

interface StatusBadgeProps {
  label: string;
  type: StatusType;
}

const BADGE_STYLES: Record<StatusType, string> = {
  setoran: "bg-[#d1fae5] text-[#065f46]",
  sakit: "bg-[#fef3c7] text-[#92400e]",
  izin: "bg-[#fef3c7] text-[#92400e]",
  alpa: "bg-[#fee2e2] text-[#991b1b]",
};

export function StatusBadge({ label, type }: StatusBadgeProps) {
  return (
    <span
      className={`rounded-full px-3 py-0.5 text-xs font-semibold ${BADGE_STYLES[type]}`}
    >
      {label}
    </span>
  );
}
