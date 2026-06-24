import withPWA from "next-pwa"

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
}

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  // Serve /offline when a page can't be fetched (fully offline + not cached)
  fallbacks: { document: "/offline" },
  // Don't cache these — they must always be live
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    // Supabase API — network-first, fall back to cache
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "supabase-api",
        expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 },
        networkTimeoutSeconds: 10,
      },
    },
    // Next.js server actions / API routes — always network
    {
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "next-data",
        expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 },
        networkTimeoutSeconds: 10,
      },
    },
    // Static Next.js assets (_next/static) — cache-first (fingerprinted)
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static",
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    // Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    // All other pages — network-first so content stays fresh
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "others",
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 },
        networkTimeoutSeconds: 10,
      },
    },
  ],
})(nextConfig)
