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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={handleDismiss}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-brand-line text-center animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Close Pojok Kanan Atas */}
        <div className="flex justify-end -mt-2 -mr-2">
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Tutup"
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-navy transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Ikon Lonceng di Tengah */}
        <div className="mx-auto -mt-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-cyan/15 text-brand-cyan shadow-xs">
          <BellRing className="h-8 w-8" />
        </div>

        {/* Teks Informasi */}
        <h3 className="mt-4 text-base font-extrabold text-brand-navy">
          Aktifkan Notifikasi Harian?
        </h3>
        <p className="mt-1.5 text-xs text-brand-text-muted leading-relaxed">
          Dapatkan pengingat ibadah yaumiyah tepat waktu dan pemberitahuan langsung saat ananda menyetor hafalan di sekolah.
        </p>

        {/* Tombol Aksi */}
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleAccept}
            disabled={loading}
            className="w-full rounded-xl bg-brand-cyan py-3 text-xs font-bold text-white shadow-sm hover:bg-brand-cyan-dark active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Mengaktifkan..." : "Aktifkan Sekarang"}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            disabled={loading}
            className="w-full py-2 text-xs font-semibold text-brand-text-muted hover:text-brand-navy transition-colors"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
}
