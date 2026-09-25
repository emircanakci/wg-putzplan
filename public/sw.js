self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Putz-WG";
  const options = {
    body: data.body || "Yeni bir bildiriminiz var!",
    icon: "/icon.png", 
    badge: "/icon.png",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data.url || "/", self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// public/sw.js
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Bekleme yapmadan anında aktif duruma geç
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); // Mevcut açık sekmeleri anında kontrolü altına al
});