import { Sparkles } from "lucide-react";

interface MascotTipProps {
  message: string;
}

export function MascotTip({ message }: MascotTipProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-4">
      <img
        src="/brand/muhsin_learn.png"
        alt="Maskot Muhsin"
        className="h-20 w-20 shrink-0 object-contain"
      />
      <div className="relative flex-1 rounded-2xl border border-[#e5e8f1] bg-white px-2 py-3 shadow-sm">
        <Sparkles className="absolute -top-2 left-2 h-5 w-5 text-brand-amber" />
        <p className="text-xs font-medium leading-relaxed text-brand-navy">
          {message}
        </p>
      </div>
    </div>
  );
}
