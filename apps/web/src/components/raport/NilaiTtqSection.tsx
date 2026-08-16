import { BookOpen, Sparkles } from "lucide-react";

export interface TtqGradeItem {
  grade: string;
  score: string;
  arabicPredicate: string;
  capaian: string;
}

export interface NilaiTtqSectionProps {
  tahfidz?: TtqGradeItem;
  tahsin?: TtqGradeItem;
}

const DEFAULT_TAHFIDZ: TtqGradeItem = {
  grade: "B",
  score: "86.2/100",
  arabicPredicate: "جيد جدا",
  capaian: "Al Baqarah:12 - Al Imran:2",
};

const DEFAULT_TAHSIN: TtqGradeItem = {
  grade: "B",
  score: "85.2/100",
  arabicPredicate: "جيد جدا",
  capaian: "Sabiq Jilid 3:162",
};

export function NilaiTtqSection({
  tahfidz = DEFAULT_TAHFIDZ,
  tahsin = DEFAULT_TAHSIN,
}: NilaiTtqSectionProps) {
  return (
    <section>
      <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-brand-navy">
        NILAI TTQ
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {/* Card Tahfidz */}
        <div className="flex flex-col items-center rounded-2xl border border-brand-line bg-white p-3.5 shadow-sm text-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-navy">
            <BookOpen className="h-3.5 w-3.5 text-brand-cyan" />
            <span>TAHFIDZ</span>
          </div>
          <div className="my-2 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan/10 text-2xl font-extrabold text-brand-cyan">
            {tahfidz.grade}
          </div>
          <p className="text-xs font-bold text-brand-navy">{tahfidz.score}</p>
          <span className="mt-1 rounded-full bg-brand-cyan/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-cyan">
            {tahfidz.arabicPredicate}
          </span>
          <p className="mt-1.5 text-[9px] text-brand-text-muted">
            {tahfidz.capaian}
          </p>
        </div>

        {/* Card Tahsin */}
        <div className="flex flex-col items-center rounded-2xl border border-brand-line bg-white p-3.5 shadow-sm text-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-navy">
            <Sparkles className="h-3.5 w-3.5 text-brand-cyan" />
            <span>TAHSIN</span>
          </div>
          <div className="my-2 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan/10 text-2xl font-extrabold text-brand-cyan">
            {tahsin.grade}
          </div>
          <p className="text-xs font-bold text-brand-navy">{tahsin.score}</p>
          <span className="mt-1 rounded-full bg-brand-cyan/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-cyan">
            {tahsin.arabicPredicate}
          </span>
          <p className="mt-1.5 text-[9px] text-brand-text-muted">
            {tahsin.capaian}
          </p>
        </div>
      </div>
    </section>
  );
}
