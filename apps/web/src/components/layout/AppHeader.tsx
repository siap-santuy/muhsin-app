import { Bell } from "lucide-react";
import { TopAppBar } from "./TopAppBar";

export function AppHeader() {
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
          className="flex h-10 w-10 items-center justify-center rounded-full transition-opacity hover:opacity-80"
        >
          <Bell className="h-5 w-5 text-brand-amber" />
        </button>
      }
    />
  );
}
