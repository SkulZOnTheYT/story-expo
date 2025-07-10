module.exports = {
  globDirectory: "dist/",
  globPatterns: [
    "**/*.{html,js,css,png,jpg,jpeg,svg,ico,json,woff,woff2,ttf,eot}"
  ],
  globIgnores: [
    "workbox-config.js",
    "sw.js"
  ],
  swDest: "dist/sw.js",
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/story-api\.dicoding\.dev\/v1\//,
      handler: "NetworkFirst",
      options: {
        cacheName: "story-api-cache",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\//,
      handler: "CacheFirst",
      options: {
        cacheName: "map-tiles-cache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/server\.arcgisonline\.com\//,
      handler: "CacheFirst",
      options: {
        cacheName: "satellite-tiles-cache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.tile\.opentopomap\.org\//,
      handler: "CacheFirst",
      options: {
        cacheName: "topo-tiles-cache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.basemaps\.cartocdn\.com\//,
      handler: "CacheFirst",
      options: {
        cacheName: "dark-tiles-cache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "google-fonts-stylesheets",
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-webfonts",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\//,
      handler: "CacheFirst",
      options: {
        cacheName: "cdn-cache",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
};