interface Tab {
  id: string;
  label: string;
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
            className={`flex-1 pb-2.5 pt-2 text-center text-sm font-semibold transition-colors ${
              active
                ? "border-b-2 border-brand-cyan text-brand-cyan"
                : "text-brand-text-muted hover:text-brand-navy"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
