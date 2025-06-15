// Service Worker for Story Explorer App

const CACHE_NAME = "story-explorer-v1"
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/src/main.js",
  "/src/styles/main.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap",
]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache")
      return cache.addAll(STATIC_ASSETS)
    }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (
    !event.request.url.startsWith(self.location.origin) &&
    !event.request.url.includes("unpkg.com") &&
    !event.request.url.includes("cdnjs.cloudflare.com") &&
    !event.request.url.includes("fonts.googleapis.com")
  ) {
    return
  }

  // API calls - network first, then cache
  if (event.request.url.includes("story-api.dicoding.dev")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const responseToCache = response.clone()

          // Cache the successful response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request)
        }),
    )
  } else {
    // Static assets - cache first, then network
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response
        }

        // Clone the request
        const fetchRequest = event.request.clone()

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          // Cache the successful response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
      }),
    )
  }
})

// Push event - handle push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()

    const options = {
      body: data.options.body || "Notifikasi baru dari Story Explorer",
      icon: "/icon-192x192.png",
      badge: "/badge-96x96.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/",
      },
    }

    event.waitUntil(self.registration.showNotification(data.title || "Story Explorer", options))
  } catch (error) {
    console.error("Error showing notification:", error)

    // Fallback notification
    event.waitUntil(
      self.registration.showNotification("Story Explorer", {
        body: "Ada pembaruan baru untuk Anda",
        icon: "/icon-192x192.png",
        badge: "/badge-96x96.png",
        vibrate: [100, 50, 100],
      }),
    )
  }
})

// Notification click event - open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || "/"

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if a window is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus()
        }
      }

      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    }),
  )
})
