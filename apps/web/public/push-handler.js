self.addEventListener("push", (event) => {
  let data = { title: "Muhsin App", body: "Ada pengingat baru", url: "#/notifications" };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = {
        title: parsed.title || data.title,
        body: parsed.body || data.body,
        url: parsed.url || data.url,
      };
    }
  } catch {
    // pakai default
  }
  const options = {
    body: data.body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    data: { url: data.url },
    tag: "muhsin-remind",
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "#/notifications";
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of allClients) {
        if ("focus" in client) {
          client.postMessage({ type: "PUSH_OPEN_URL", url });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/" + url);
      }
    })()
  );
});
