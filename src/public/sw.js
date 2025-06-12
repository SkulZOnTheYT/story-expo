const CACHE_NAME = "story-explorer-v1"
const urlsToCache = [
  "/",
  "/src/styles/main.css",
  "/src/main.js",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
]

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
})

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request)
    }),
  )
})

// Push event
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "Story baru telah ditambahkan!",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Lihat Stories",
        icon: "/icon-192x192.png",
      },
      {
        action: "close",
        title: "Tutup",
        icon: "/icon-192x192.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Story Explorer", options))
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/#/stories"))
  }
})
