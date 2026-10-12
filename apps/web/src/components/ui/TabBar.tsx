interface Tab {
  id: string;
  label: string;
  badge?: number | string;
}

interface TabBarProps {
  tabs: Tab[];
  activeId: string;
  onChange?: (id: string) => void;
}

export function TabBar({ tabs, activeId, onChange }: TabBarProps) {
  return (
    <div className="flex border-b border-brand-line">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange?.(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 pb-2.5 pt-2 text-center text-sm font-semibold transition-colors ${
              active
                ? "border-b-2 border-brand-cyan text-brand-cyan"
                : "text-brand-text-muted hover:text-brand-navy"
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== null ? (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-none ${
                  active
                    ? "bg-brand-cyan/20 text-brand-cyan-dark"
                    : "bg-gray-100 text-brand-text-muted"
                }`}
              >
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
