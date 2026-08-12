interface DailyQuoteProps {
  text: string;
  source: string;
}

export function DailyQuote({ text, source }: DailyQuoteProps) {
  return (
    <blockquote className="rounded-lg border-l-4 border-brand-cyan bg-brand-cyan/5 px-4 py-4">
      <p className="text-sm font-medium leading-snug text-brand-cyan-dark">
        {text}
      </p>
      <footer className="mt-1 text-xs text-brand-cyan-dark/80">{source}</footer>
    </blockquote>
  );
}
