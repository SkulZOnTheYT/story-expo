// Fallback Service Worker untuk development
const CACHE_NAME = "story-explorer-v1"
const urlsToCache = ["/", "/index.html", "/src/styles/main.css", "/src/main.js", "/manifest.json"]

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...")
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching files")
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.error("Service Worker: Cache failed", error)
      }),
  )
})

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...")
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Service Worker: Deleting old cache", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  return self.clients.claim()
})

// Fetch event
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return (
        response ||
        fetch(event.request)
          .then((fetchResponse) => {
            // Don't cache non-successful responses
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== "basic") {
              return fetchResponse
            }

            // Clone the response
            const responseToCache = fetchResponse.clone()

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })

            return fetchResponse
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === "navigate") {
              return caches.match("/index.html")
            }
          })
      )
    }),
  )
})

// Push notification handling
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push notification received")

  let notificationData = {
    title: "Story Explorer",
    body: "Ada cerita baru untuk Anda!",
    tag: "story-notification",
    data: { url: "/" },
  }

  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = { ...notificationData, ...data }
    } catch (error) {
      console.error("Error parsing push notification data:", error)
    }
  }

  const options = {
    body: notificationData.body,
    tag: notificationData.tag,
    vibrate: [100, 50, 100],
    data: notificationData.data,
    actions: [
      {
        action: "open",
        title: "Buka Aplikasi",
      },
      {
        action: "close",
        title: "Tutup",
      },
    ],
    requireInteraction: false,
    silent: false,
  }

  event.waitUntil(self.registration.showNotification(notificationData.title, options))
})

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked")

  event.notification.close()

  const action = event.action
  const notificationData = event.notification.data || {}
  const urlToOpen = notificationData.url || "/"

  if (action === "close") {
    return
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus()
          if (urlToOpen !== "/") {
            client.navigate(urlToOpen)
          }
          return
        }
      }

      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    }),
  )
})

// Background sync (basic implementation)
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync triggered", event.tag)

  if (event.tag === "sync-stories") {
    event.waitUntil(
      // Notify main thread about sync
      self.clients
        .matchAll()
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "SYNC_OFFLINE_STORIES",
              message: "Background sync triggered",
            })
          })
        }),
    )
  }
})

// Handle messages from main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

console.log("Service Worker loaded successfully")
