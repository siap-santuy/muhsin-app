interface ReminderBannerProps {
  text: string;
  action: string;
  onAction?: () => void;
}

export function ReminderBanner({ text, action, onAction }: ReminderBannerProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border-l-4 border-brand-amber bg-brand-amber/10 px-3 py-1">
      <p className="text-sm font-medium text-[#f5a800]">{text}</p>
      <button
        type="button"
        onClick={onAction}
        className="text-sm font-semibold text-brand-amber"
      >
        {action}
      </button>
    </div>
  );
}
