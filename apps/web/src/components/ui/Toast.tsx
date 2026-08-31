import { useEffect } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore, type ToastVariant, type ToastItem } from "@/store/toastStore";

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: () => void;
}

const VARIANT_CONFIG: Record<ToastVariant, { icon: LucideIcon; bg: string; text: string }> = {
  success: { icon: CheckCircle2, bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  error: { icon: AlertCircle, bg: "bg-red-50 border-red-200", text: "text-red-700" },
  warning: { icon: AlertTriangle, bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  info: { icon: Info, bg: "bg-brand-cyan/10 border-brand-cyan/30", text: "text-brand-cyan-dark" },
};

export function Toast({ message, variant = "success", duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className={cn("flex items-center gap-2.5 rounded-2xl border px-4 py-3 shadow-lg bg-white/95 backdrop-blur-sm pointer-events-auto min-w-[280px] max-w-[420px]", config.bg)}>
        <Icon className={cn("h-5 w-5 shrink-0", config.text)} />
        <span className={cn("text-xs font-semibold flex-1 leading-snug", config.text)}>{message}</span>
        <button type="button" onClick={onClose} className="ml-1 rounded-full p-1 hover:bg-black/5 transition-colors">
          <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
        </button>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 items-end pointer-events-none px-4 max-w-md w-full">
      {toasts.map((t: ToastItem) => (
        <Toast
          key={t.id}
          message={t.message}
          variant={t.variant}
          duration={t.duration}
          onClose={() => removeToast(t.id)}
        />
      ))}
    </div>
  );
}
