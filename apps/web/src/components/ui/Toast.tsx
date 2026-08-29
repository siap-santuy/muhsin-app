import { useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "warning" | "info";

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: () => void;
}

const VARIANT_CONFIG: Record<ToastVariant, { icon: LucideIcon; bg: string; text: string }> = {
  success: { icon: CheckCircle2, bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  warning: { icon: AlertTriangle, bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  info: { icon: Info, bg: "bg-brand-cyan/10 border-brand-cyan/30", text: "text-brand-cyan-dark" },
};

export function Toast({ message, variant = "success", duration = 2500, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <div className="fixed top-4 left-1/2 z-[100] -translate-x-1/2 animate-in fade-in slide-in-from-top">
      <div className={cn("flex items-center gap-2.5 rounded-2xl border px-4 py-3 shadow-lg", config.bg)}>
        <Icon className={cn("h-5 w-5 shrink-0", config.text)} />
        <span className={cn("text-xs font-bold", config.text)}>{message}</span>
        <button type="button" onClick={onClose} className="ml-1 rounded-full p-0.5 hover:bg-black/5">
          <X className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
