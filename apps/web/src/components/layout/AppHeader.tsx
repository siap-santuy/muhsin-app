import { useEffect } from "react";
import { Bell } from "lucide-react";
import { TopAppBar } from "./TopAppBar";
import { useNotificationStore } from "@/store/notificationStore";

export function AppHeader() {
  const unreadCount = useNotificationStore(
    (s) => s.notifications.filter((n) => !n.read).length
  );
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <TopAppBar
      left={
        <>
          <img
            src="/brand/logo_combo.svg"
            alt="Logo SMP Islam Terpadu Al Fitrah"
            className="w-26 rounded-lg object-contain"
          />
          <div className="">
            <p className="text-lg font-bold text-brand-navy">
              SMP Islam Terpadu
            </p>
            <p className="text-lg font-bold text-brand-navy">AL FITRAH</p>
          </div>
        </>
      }
      right={
        <button
          type="button"
          aria-label="Notifikasi"
          onClick={() => (window.location.hash = "#/notifications")}
          className="relative flex h-10 w-10 items-center justify-center rounded-full transition-opacity hover:opacity-80"
        >
          <Bell className="h-5 w-5 text-brand-amber" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white shadow-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      }
    />
  );
}
