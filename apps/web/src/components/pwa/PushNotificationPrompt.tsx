import { useState, useEffect } from "react";
import { BellOff, BellRing, Settings, X } from "lucide-react";
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

export function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [isIOSWeb, setIsIOSWeb] = useState(false);

  useEffect(() => {
    async function checkPermission() {
      // 1. Cek apakah browser mendukung Web Push
      if (!isPushSupported()) return;

      // 2. Jika di iOS tapi belum di-add to home screen (bukan standalone PWA)
      if (isIOSDevice() && !isStandalone()) {
        setIsIOSWeb(true);
        return;
      }

      // 3. Jika permission sudah denied (diblokir secara lokal di browser/HP)
      const permission = getPushPermission();
      if (permission === "denied") {
        setIsDenied(true);
        setVisible(true);
        return;
      }

      // 4. Jika permission sudah granted, cek apakah sudah terdaftar di pushManager
      if (permission === "granted") {
        const existing = await getExistingSubscription();
        if (existing) {
          // Sudah aktif dan tersimpan, tidak perlu munculkan apa-apa
          setVisible(false);
          return;
        }
      }

      // 5. Belum aktif (permission 'default' atau belum ada subscription aktif)
      // Selalu tampilkan dialog di awal saat app dibuka
      setIsDenied(false);
      setVisible(true);
    }

    void checkPermission();
  }, []);

  async function handleAccept() {
    setLoading(true);
    try {
      // Request permission dari browser (harus berasal dari gesture klik pengguna)
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        if (permission === "denied") {
          setIsDenied(true);
          toast.warning("Izin notifikasi diblokir di pengaturan browser");
        } else {
          setVisible(false);
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
      toast.success("Notifikasi berhasil diaktifkan!");
    } catch (err: any) {
      toast.warning(err.message || "Gagal mengaktifkan notifikasi");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecheck() {
    setLoading(true);
    try {
      const permission = getPushPermission();
      if (permission === "granted") {
        const { publicKey } = await api.getPushPublicKey();
        if (publicKey) {
          const sub = await subscribePush(publicKey);
          const payload = subscriptionToPayload(sub);
          if (payload.endpoint && payload.p256dh && payload.auth) {
            await api.savePushSubscription(payload);
            setVisible(false);
            toast.success("Notifikasi berhasil diaktifkan!");
            return;
          }
        }
      } else if (permission === "denied") {
        toast.warning("Izin masih diblokir di pengaturan browser/HP");
      } else {
        setIsDenied(false);
      }
    } catch (err: any) {
      toast.warning(err.message || "Belum dapat mengaktifkan notifikasi");
    } finally {
      setLoading(false);
    }
  }

  function handleDismiss() {
    setVisible(false);
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

        {/* Kondisi 1: Izin Diblokir (Denied) — Tampilkan Edukasi Cara Buka Kunci */}
        {isDenied ? (
          <>
            <div className="mx-auto -mt-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 shadow-xs">
              <BellOff className="h-8 w-8" />
            </div>

            <h3 className="mt-4 text-base font-extrabold text-brand-navy">
              Izin Notifikasi Sedang Diblokir
            </h3>
            <p className="mt-1.5 text-xs text-brand-text-muted leading-relaxed">
              Browser atau perangkat Anda sebelumnya memblokir izin notifikasi. Agar pengingat sholat &amp; info setoran dapat masuk:
            </p>

            <div className="mt-3.5 rounded-2xl bg-gray-50 p-3 text-left border border-brand-line/60 space-y-1.5 text-[11px] text-brand-navy">
              <div className="flex items-start gap-2">
                <span className="font-bold text-brand-cyan shrink-0">1.</span>
                <span><strong>HP Android:</strong> Tekan lama ikon aplikasi di layar HP &rarr; Info Aplikasi (i) &rarr; Notifikasi &rarr; <strong>Izinkan</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-brand-cyan shrink-0">2.</span>
                <span><strong>Browser:</strong> Ketuk ikon gembok / izin di bilah alamat atas &rarr; Notifikasi &rarr; <strong>Izinkan</strong>.</span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleRecheck}
                disabled={loading}
                className="w-full rounded-xl bg-brand-cyan py-3 text-xs font-bold text-white shadow-sm hover:bg-brand-cyan-dark active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Settings className="h-4 w-4" />
                <span>{loading ? "Memeriksa..." : "Saya Sudah Mengaktifkan"}</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                disabled={loading}
                className="w-full py-2 text-xs font-semibold text-brand-text-muted hover:text-brand-navy transition-colors"
              >
                Tutup
              </button>
            </div>
          </>
        ) : (
          /* Kondisi 2: Status Default — Minta Izin 1-Ketukan */
          <>
            <div className="mx-auto -mt-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-cyan/15 text-brand-cyan shadow-xs">
              <BellRing className="h-8 w-8" />
            </div>

            <h3 className="mt-4 text-base font-extrabold text-brand-navy">
              Aktifkan Notifikasi Harian?
            </h3>
            <p className="mt-1.5 text-xs text-brand-text-muted leading-relaxed">
              Dapatkan pengingat ibadah yaumiyah tepat waktu dan pemberitahuan langsung saat ananda menyetor hafalan di sekolah.
            </p>

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
          </>
        )}
      </div>
    </div>
  );
}
