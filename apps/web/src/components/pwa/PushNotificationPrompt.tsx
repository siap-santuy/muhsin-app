import { useState, useEffect } from "react";
import { BellRing, X } from "lucide-react";
import { toast } from "@/store/toastStore";
import { api } from "@/lib/api";
import {
  isPushSupported,
  getPushPermission,
  getExistingSubscription,
  subscribePush,
  subscriptionToPayload,
  isIOSDevice,
  isStandalone,
} from "@/lib/push";

const DISMISSED_KEY = "muhsin_push_prompt_dismissed_until";
const DISMISS_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 hari sebelum muncul lagi jika ditolak halus

export function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isIOSWeb, setIsIOSWeb] = useState(false);

  useEffect(() => {
    async function checkPermission() {
      // 1. Cek apakah browser mendukung Web Push
      if (!isPushSupported()) return;

      // 2. Jika di iOS tapi belum di-add to home screen (bukan standalone PWA)
      if (isIOSDevice() && !isStandalone()) {
        setIsIOSWeb(true);
        // iOS belum bisa request push sebelum di-add to home screen
        return;
      }

      // 3. Jika izin sudah 'granted' atau 'denied', tidak perlu tampilkan banner
      const permission = getPushPermission();
      if (permission === "granted" || permission === "denied") return;

      // 4. Jika user pernah klik "Nanti Saja", cek apakah masa tunda masih berlaku
      const dismissedUntil = localStorage.getItem(DISMISSED_KEY);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        return;
      }

      // 5. Cek apakah subscription sudah ada
      const existing = await getExistingSubscription();
      if (!existing) {
        setVisible(true);
      }
    }

    void checkPermission();
  }, []);

  async function handleAccept() {
    setLoading(true);
    try {
      // Request permission dari browser (harus berasal dari gesture klik pengguna)
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setVisible(false);
        if (permission === "denied") {
          toast.warning("Izin notifikasi diblokir di pengaturan browser");
        }
        return;
      }

      // Ambil public key VAPID dari server
      const { publicKey } = await api.getPushPublicKey();
      if (!publicKey) {
        throw new Error("Kunci notifikasi server tidak tersedia");
      }

      // Subscribe ke push service browser
      const sub = await subscribePush(publicKey);
      const payload = subscriptionToPayload(sub);

      if (!payload.endpoint || !payload.p256dh || !payload.auth) {
        throw new Error("Data subscription tidak valid");
      }

      // Simpan subscription ke backend
      await api.savePushSubscription(payload);
      setVisible(false);
      localStorage.removeItem(DISMISSED_KEY);
      toast.success("Notifikasi berhasil diaktifkan!");
    } catch (err: any) {
      toast.warning(err.message || "Gagal mengaktifkan notifikasi");
    } finally {
      setLoading(false);
    }
  }

  function handleDismiss() {
    setVisible(false);
    // Tunda kemunculan banner selama 3 hari
    localStorage.setItem(DISMISSED_KEY, String(Date.now() + DISMISS_DURATION_MS));
  }

  if (!visible || isIOSWeb) return null;

  return (
    <div className="mx-4 mt-2 mb-1 animate-in slide-in-from-top-2 duration-200">
      <div className="rounded-2xl border border-brand-cyan/40 bg-linear-to-r from-brand-cyan/15 via-white to-brand-cyan/10 p-3.5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-cyan text-white shadow-xs">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-brand-navy leading-snug">
                Aktifkan Notifikasi Harian?
              </h4>
              <p className="mt-0.5 text-[11px] text-brand-text-muted leading-relaxed">
                Dapatkan info setoran hafalan ananda dan pengingat mutaba&apos;ah ibadah tepat waktu.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Tutup saran notifikasi"
            className="rounded-lg p-1 text-gray-400 hover:bg-black/5 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 border-t border-brand-cyan/15 pt-2.5">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={loading}
            className="rounded-xl px-3 py-1.5 text-[11px] font-semibold text-brand-text-muted hover:bg-black/5 transition-colors"
          >
            Nanti Saja
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={loading}
            className="rounded-xl bg-brand-cyan px-3.5 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-brand-cyan-dark active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Mengaktifkan..." : "Aktifkan Sekarang"}
          </button>
        </div>
      </div>
    </div>
  );
}
