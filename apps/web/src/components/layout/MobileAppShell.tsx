import type { ReactNode } from "react";

interface MobileAppShellProps {
  children: ReactNode;
}

export function MobileAppShell({ children }: MobileAppShellProps) {
  return (
    <div className="flex min-h-screen w-full justify-center bg-slate-100/70 antialiased selection:bg-brand-cyan/20">
      <div className="relative flex h-screen w-full max-w-[430px] flex-col overflow-hidden bg-brand-page shadow-[0_0_50px_rgba(0,0,0,0.06)] md:border-x md:border-slate-200/80">
        {children}
      </div>
    </div>
  );
}
