import { useState, useEffect } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { api } from "@/lib/api";
import { getOfflineQueue } from "@/lib/offlineQueue";
import { toast } from "@/store/toastStore";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isOnline) {
      const queue = getOfflineQueue();
      if (queue.length > 0) {
        setSyncing(true);
        api
          .processOfflineQueue()
          .then((count) => {
            if (count > 0) {
              toast.success(`${count} data offline berhasil disinkronkan ke server!`);
            }
          })
          .catch(() => {})
          .finally(() => setSyncing(false));
      }
    }
  }, [isOnline]);

  if (syncing) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-[#1CB8CE] px-3 py-1.5 text-xs font-semibold text-white shadow-md animate-in slide-in-from-top duration-300"
      >
        <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin" />
        <span>Menyinkronkan data offline ke server...</span>
      </div>
    );
  }

  if (isOnline) return null;

  const queueCount = getOfflineQueue().length;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md animate-in slide-in-from-top duration-300"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>
        Mode Offline — Menampilkan data lokal
        {queueCount > 0 ? ` (${queueCount} antrean simpan)` : ""}
      </span>
    </div>
  );
}
