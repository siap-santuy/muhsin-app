export interface EvaluasiSectionProps {
  evaluationText?: string;
  pembimbingName?: string;
  showSignatureLine?: boolean;
}

export function EvaluasiSection({
  evaluationText = "Ananda Fulan menunjukkan progress yang baik, harap orang tua membantu mengingatkan untuk mengulangi pelajaran dan murojaah di rumah.",
  pembimbingName = "Arai Kurnia Ramadhan",
  showSignatureLine = false,
}: EvaluasiSectionProps) {
  return (
    <section>
      <h3 className="mb-2 text-left text-xs font-bold text-brand-navy">
        Evaluasi Guru Pembimbing
      </h3>
      <div
        className={`rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm ${
          showSignatureLine ? "flex flex-col justify-between min-h-[140px]" : ""
        }`}
      >
        <p className="text-xs font-medium italic leading-relaxed text-brand-navy">
          &ldquo;{evaluationText}&rdquo;
        </p>

        {showSignatureLine ? (
          <div className="mt-6 text-right">
            <p className="text-xs font-bold text-amber-600">Pembimbing</p>
            <div className="my-2 border-b border-amber-300 w-36 ml-auto" />
            <p className="text-xs font-bold text-amber-600">
              {pembimbingName}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-xs font-bold text-brand-navy">
            - Ustadz {pembimbingName}
          </p>
        )}
      </div>
    </section>
  );
}
