import { useState, useEffect } from "react";
import { BellRing } from "lucide-react";
import { toast } from "@/store/toastStore";
import { api } from "@/lib/api";
import {
  isPushSupported,
  getPushPermission,
  getExistingSubscription,
  subscribePush,
  unsubscribePush,
  subscriptionToPayload,
  isIOSDevice,
  isStandalone,
} from "@/lib/push";

type PushState = "unsupported" | "denied" | "off" | "on" | "loading";

export function PushToggleProfileItem() {
  const [state, setState] = useState<PushState>("loading");
  const [hint, setHint] = useState("");

  useEffect(() => {
    async function init() {
      if (!isPushSupported()) {
        setState("unsupported");
        setHint("Browser tidak mendukung push");
        return;
      }
      if (isIOSDevice() && !isStandalone()) {
        setState("unsupported");
        setHint("iPhone: pasang via Add to Home Screen dulu (iOS 16.4+)");
        return;
      }
      if (getPushPermission() === "denied") {
        setState("denied");
        setHint("Izin diblokir — buka kunci via pengaturan browser");
        return;
      }
      const existing = await getExistingSubscription();
      setState(existing ? "on" : "off");
    }
    void init();
  }, []);

  async function handleToggle() {
    if (state === "on") {
      setState("loading");
      try {
        const existing = await unsubscribePush();
        if (existing) {
          try {
            await api.removePushSubscription(existing.endpoint);
          } catch {
            // abaikan
          }
        }
        setState("off");
        toast.success("Notifikasi push dimatikan");
      } catch {
        setState("on");
        toast.warning("Gagal mematikan push");
      }
      return;
    }
    if (state !== "off") return;
    setState("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        setHint(permission === "denied" ? "Izin diblokir — buka kunci via pengaturan browser" : "");
        toast.warning("Izin notifikasi tidak diberikan");
        return;
      }
      const { publicKey } = await api.getPushPublicKey();
      const sub = await subscribePush(publicKey);
      const payload = subscriptionToPayload(sub);
      if (!payload.endpoint || !payload.p256dh || !payload.auth) {
        throw new Error("Subscription tidak valid");
      }
      await api.savePushSubscription(payload);
      setState("on");
      toast.success("Notifikasi push aktif di device ini");
    } catch (err: any) {
      setState("off");
      toast.warning(err.message || "Gagal mengaktifkan push");
    }
  }

  const enabled = state === "on";

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={state === "loading" || state === "unsupported" || state === "denied"}
      className="flex w-full items-center justify-between py-3 text-left transition-opacity hover:opacity-75 disabled:opacity-60"
    >
      <div className="flex items-center gap-3">
        <BellRing className="h-5 w-5 text-brand-navy" />
        <div>
          <span className="block text-xs font-bold text-brand-navy">Notifikasi Push</span>
          <span className="text-[10px] text-brand-text-muted">
            {state === "loading"
              ? "Memuat..."
              : state === "on"
                ? "Aktif di device ini"
                : state === "off"
                  ? "Dapatkan pengingat walau aplikasi ditutup"
                  : hint}
          </span>
        </div>
      </div>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${enabled ? "bg-brand-cyan" : "bg-gray-200"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`}
        />
      </span>
    </button>
  );
}
