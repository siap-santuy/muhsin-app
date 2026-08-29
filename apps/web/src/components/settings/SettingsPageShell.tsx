import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { KoorShell } from "@/components/layout/KoorShell";
import { useAuthStore } from "@/store/authStore";

interface SettingsPageShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
}

export function SettingsPageShell({
  title,
  subtitle,
  children,
  onBack,
}: SettingsPageShellProps) {
  const user = useAuthStore((s) => s.user);

  function handleBack() {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.hash = "#/profile";
    }
  }

  if (user?.role === "koordinator_ttq") {
    return (
      <KoorShell activePath="settings" title={title} subtitle={subtitle}>
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-line/60 bg-white text-brand-navy shadow-sm hover:border-brand-cyan"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-base font-bold text-brand-navy">{title}</h2>
              {subtitle ? (
                <p className="text-xs text-brand-text-muted">{subtitle}</p>
              ) : null}
            </div>
          </div>
          {children}
        </div>
      </KoorShell>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-brand-page">
      {/* Header Bar */}
      <div className="shrink-0 flex items-center justify-between border-b border-brand-line/60 bg-white px-4 py-3 shadow-xs">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Kembali"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-cyan/10"
        >
          <ArrowLeft className="h-4 w-4 text-brand-cyan" />
        </button>
        <div className="text-center">
          <h1 className="text-base font-bold text-brand-navy">{title}</h1>
          {subtitle ? (
            <p className="text-[10px] text-brand-text-muted">{subtitle}</p>
          ) : null}
        </div>
        <div className="h-9 w-9" />
      </div>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-3">{children}</main>

      <BottomNav activeIndex={3} />
    </div>
  );
}
