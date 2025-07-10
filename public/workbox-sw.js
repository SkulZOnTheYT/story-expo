import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching"
import { registerRoute } from "workbox-routing"
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from "workbox-strategies"
import { ExpirationPlugin } from "workbox-expiration"
import { CacheableResponsePlugin } from "workbox-cacheable-response"
import { BackgroundSyncPlugin } from "workbox-background-sync"
import { Queue } from "workbox-background-sync"

// Precache and route static assets (Application Shell)
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Background sync queue for offline story creation
const storyQueue = new Queue("story-queue", {
  onSync: async ({ queue }) => {
    let entry
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request)
        console.log("Workbox: Story uploaded successfully via background sync")

        // Notify main thread about successful sync
        const clients = await self.clients.matchAll()
        clients.forEach((client) => {
          client.postMessage({
            type: "SYNC_OFFLINE_STORIES",
            message: "Stories synced successfully",
          })
        })
      } catch (error) {
        console.error("Workbox: Failed to upload story via background sync", error)
        await queue.unshiftRequest(entry)
        throw error
      }
    }
  },
})

// API Routes - Network First with Background Sync for offline capability
registerRoute(
  ({ url }) => url.origin === "https://story-api.dicoding.dev",
  new NetworkFirst({
    cacheName: "story-api-cache",
    networkTimeoutSeconds: 10,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes for fresh data
      }),
      new BackgroundSyncPlugin("story-api-sync", {
        maxRetentionTime: 24 * 60, // 24 hours
      }),
    ],
  }),
)

// Map Tiles - Cache First for optimal performance
registerRoute(
  ({ url }) =>
    url.origin.includes("tile.openstreetmap.org") ||
    url.origin.includes("server.arcgisonline.com") ||
    url.origin.includes("tile.opentopomap.org") ||
    url.origin.includes("basemaps.cartocdn.com"),
  new CacheFirst({
    cacheName: "map-tiles-cache",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 1000, // Increased for better map performance
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  }),
)

// Google Fonts - Optimized caching
registerRoute(
  ({ url }) => url.origin === "https://fonts.googleapis.com",
  new StaleWhileRevalidate({
    cacheName: "google-fonts-stylesheets",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
)

registerRoute(
  ({ url }) => url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "google-fonts-webfonts",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  }),
)

// CDN Resources - Cache First for performance
registerRoute(
  ({ url }) => url.origin === "https://cdnjs.cloudflare.com" || url.origin === "https://unpkg.com",
  new CacheFirst({
    cacheName: "cdn-cache",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  }),
)

// Handle offline story creation with background sync
self.addEventListener("fetch", (event) => {
  // Handle story creation requests
  if (event.request.url.includes("/stories") && event.request.method === "POST") {
    // If offline, add to background sync queue
    if (!navigator.onLine) {
      event.respondWith(
        storyQueue.pushRequest({ request: event.request }).then(() => {
          return new Response(
            JSON.stringify({
              error: false,
              message: "Story queued for upload when online",
              offline: true,
            }),
            {
              status: 202,
              statusText: "Accepted",
              headers: { "Content-Type": "application/json" },
            },
          )
        }),
      )
      return
    }
  }

  // Handle navigation requests - serve cached app shell
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/index.html")
      }),
    )
    return
  }
})

// Enhanced push notification handling
self.addEventListener("push", (event) => {
  console.log("Workbox: Push notification received")

  let notificationData = {
    title: "Story Explorer",
    body: "Ada cerita baru untuk Anda!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
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
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    vibrate: [100, 50, 100],
    data: notificationData.data,
    actions: [
      {
        action: "open",
        title: "Buka Aplikasi",
        icon: "/icons/icon-96x96.png",
      },
      {
        action: "close",
        title: "Tutup",
        icon: "/icons/icon-96x96.png",
      },
    ],
    requireInteraction: false,
    silent: false,
  }

  event.waitUntil(self.registration.showNotification(notificationData.title, options))
})

// Enhanced notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("Workbox: Notification clicked")

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

// Handle service worker lifecycle
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

// Activate event - take control immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

console.log("Workbox Service Worker loaded successfully")