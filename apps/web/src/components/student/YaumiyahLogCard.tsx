interface YaumiyahLogCardProps {
  date: string;
  message: string;
  onView?: () => void;
}

export function YaumiyahLogCard({
  date,
  message,
  onView,
}: YaumiyahLogCardProps) {
  return (
    <article className="flex items-center justify-between rounded-2xl border border-brand-line bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col">
        <span className="text-[10px] text-brand-text-muted">{date}</span>
        <span className="mt-0.5 text-xs font-bold text-brand-navy">
          {message}
        </span>
      </div>
      <button
        type="button"
        onClick={onView}
        className="text-xs font-semibold text-brand-cyan hover:underline"
      >
        Lihat
      </button>
    </article>
  );
}
