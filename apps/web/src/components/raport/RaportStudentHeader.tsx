import { BookOpen, Check } from "lucide-react";

export interface RaportStudentHeaderProps {
  title: string;
  subtitle?: string;
  studentName?: string;
  studentNis?: string;
  className?: string;
  pembimbingName?: string;
  isVerified?: boolean;
}

export function RaportStudentHeader({
  title,
  subtitle,
  studentName = "Fulan bin Fulan",
  studentNis = "9991239201",
  className = "VII Abu Bakar Ash-Shiddiq",
  pembimbingName = "Arai Kurnia Ramadhan",
  isVerified = true,
}: RaportStudentHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-cyan/10">
        <BookOpen className="h-10 w-10 text-brand-cyan" />
      </div>
      <h2 className="mt-3 text-xl font-bold text-brand-navy">{title}</h2>
      {subtitle ? (
        <h3 className="text-lg font-bold text-brand-navy">{subtitle}</h3>
      ) : null}
      <p className="mt-1 text-xs font-semibold text-brand-navy">
        {studentName} ({studentNis})
      </p>
      <p className="text-xs text-brand-text-muted">{className}</p>
      <p className="mt-1 text-[11px] text-brand-text-muted">Pembimbing:</p>
      <p className="text-xs font-semibold text-brand-navy">{pembimbingName}</p>

      {isVerified ? (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600 border border-emerald-200">
          <Check className="h-3 w-3" />
          Terverifikasi
        </span>
      ) : null}
    </div>
  );
}
