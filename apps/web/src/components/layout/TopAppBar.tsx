import type { ReactNode } from "react";

interface TopAppBarProps {
  left: ReactNode;
  right?: ReactNode;
}

export function TopAppBar({ left, right }: TopAppBarProps) {
  return (
    <header className="flex items-center justify-between bg-white px-4 py-3">
      <div className="flex items-center gap-2">{left}</div>
      {right ? <div>{right}</div> : null}
    </header>
  );
}
