import { useState, useEffect, useSyncExternalStore } from "react";
import { Share, X, ChevronRight, Smartphone } from "lucide-react";
import { toast } from "@/store/toastStore";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// Global top-level capture so the browser event is never missed on page load
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    emitChange();
  });

  window.addEventListener("appinstalled", () => {
    globalDeferredPrompt = null;
    emitChange();
  });
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getPromptSnapshot() {
  return globalDeferredPrompt;
}

export function usePWAInstall() {
  const promptEvent = useSyncExternalStore(subscribe, getPromptSnapshot, () => null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);
  }, []);

  async function triggerInstall(): Promise<boolean> {
    const p = globalDeferredPrompt;
    if (!p) return false;

    await p.prompt();
    const choice = await p.userChoice;
    if (choice.outcome === "accepted") {
      globalDeferredPrompt = null;
      emitChange();
      return true;
    }
    return false;
  }

  return {
    isInstallable: !!promptEvent || isIOS,
    isStandalone,
    isIOS,
    canPromptDirectly: !!promptEvent,
    triggerInstall,
  };
}

export function PWAInstallProfileItem() {
  const { isStandalone, isIOS, canPromptDirectly, triggerInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Jika sudah terpasang (standalone), sembunyikan total dari menu profile
  if (isStandalone) {
    return null;
  }

  async function handleClick() {
    if (canPromptDirectly) {
      const installed = await triggerInstall();
      if (installed) {
        toast.success("Aplikasi berhasil dipasang!");
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      toast.info("Gunakan browser Chrome/Edge, atau pilih 'Tambahkan ke Layar Utama' pada menu browser");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center justify-between py-3 text-left transition-opacity hover:opacity-75"
      >
        <div className="flex items-center gap-3">
          <Smartphone className="h-5 w-5 text-brand-navy" />
          <div>
            <span className="text-xs font-bold text-brand-navy block">
              Pasang Aplikasi di HP
            </span>
            <span className="text-[10px] text-brand-text-muted">
              Akses cepat &amp; hemat kuota data
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-brand-cyan/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-cyan">
            Unduh
          </span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </button>

      {/* Modal panduan iOS Safari */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 animate-in fade-in"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-brand-navy">
                Pasang di iPhone / iPad
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ol className="mt-4 space-y-3 text-xs text-brand-navy">
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-cyan/10 font-bold text-brand-cyan">
                  1
                </span>
                <span>
                  Buka browser Safari, lalu klik tombol <strong>Bagikan (Share)</strong> <Share className="inline h-3.5 w-3.5 text-brand-cyan" /> di bagian bawah.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-cyan/10 font-bold text-brand-cyan">
                  2
                </span>
                <span>
                  Gulir ke bawah dan pilih <strong>&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-cyan/10 font-bold text-brand-cyan">
                  3
                </span>
                <span>
                  Klik <strong>Tambah (Add)</strong> di pojok kanan atas. Ikon Muhsin App akan muncul di beranda HP Anda.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full rounded-xl bg-brand-cyan py-3 text-xs font-bold text-white shadow-sm hover:bg-brand-cyan-dark"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function PWAInstallLoginBanner() {
  const { isStandalone, isIOS, canPromptDirectly, triggerInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Jika sudah terpasang (standalone), sembunyikan total dari halaman login
  if (isStandalone) {
    return null;
  }

  async function handleInstall() {
    if (canPromptDirectly) {
      const installed = await triggerInstall();
      if (installed) {
        toast.success("Aplikasi berhasil dipasang!");
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      toast.info("Gunakan browser Chrome/Edge, atau pilih 'Tambahkan ke Layar Utama' pada menu browser Anda");
    }
  }

  return (
    <>
      <div className="w-full max-w-[340px] sm:max-w-[360px] mt-4 rounded-2xl border border-brand-cyan/30 bg-gradient-to-r from-brand-cyan/5 via-white to-brand-cyan/10 p-3.5 shadow-xs transition-all">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-brand-navy leading-tight">
                Pasang Aplikasi di HP
              </p>
              <p className="text-[10px] text-brand-text-muted mt-0.5">
                Lebih cepat &amp; tanpa buka browser
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstall}
            className="shrink-0 rounded-xl bg-brand-cyan px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#18A5BA] active:scale-95 transition-all"
          >
            Pasang
          </button>
        </div>
      </div>

      {/* Modal panduan iOS Safari */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 animate-in fade-in"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-brand-navy">
                Pasang di iPhone / iPad
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ol className="mt-4 space-y-3 text-xs text-brand-navy">
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-cyan/10 font-bold text-brand-cyan">
                  1
                </span>
                <span>
                  Buka browser Safari, lalu klik tombol <strong>Bagikan (Share)</strong> <Share className="inline h-3.5 w-3.5 text-brand-cyan" /> di bagian bawah.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-cyan/10 font-bold text-brand-cyan">
                  2
                </span>
                <span>
                  Gulir ke bawah dan pilih <strong>&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-cyan/10 font-bold text-brand-cyan">
                  3
                </span>
                <span>
                  Klik <strong>Tambah (Add)</strong> di pojok kanan atas. Ikon Muhsin App akan muncul di beranda HP Anda.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full rounded-xl bg-brand-cyan py-3 text-xs font-bold text-white shadow-sm hover:bg-brand-cyan-dark"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
