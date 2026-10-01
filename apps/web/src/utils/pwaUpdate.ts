export async function forceUpdateApp(): Promise<void> {
  try {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    if (typeof window !== "undefined" && "caches" in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
    }
  } catch (err) {
    console.error("Gagal membersihkan cache aplikasi:", err);
  } finally {
    const timestamp = Date.now();
    const cleanUrl = window.location.href.split("?")[0] + `?v=${timestamp}` + window.location.hash;
    window.location.replace(cleanUrl);
  }
}
