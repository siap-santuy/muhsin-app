interface Tab {
  id: string;
  label: string;
}

interface SegmentedTabsProps {
  tabs: Tab[];
  activeId: string;
  onChange?: (id: string) => void;
}

export function SegmentedTabs({ tabs, activeId, onChange }: SegmentedTabsProps) {
  return (
    <div className="flex w-full rounded-2xl border border-brand-line bg-white p-1 shadow-sm">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange?.(tab.id)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              active
                ? "bg-brand-cyan text-white shadow-sm"
                : "text-brand-navy hover:bg-black/5"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
