/*
 * Service worker for the Stonegate golf app.
 *
 * Scoped to /golf/ — it is registered with { scope: "/golf/" } and every route
 * below bails out on requests outside that prefix, so the JNS marketing site is
 * never intercepted or cached by it.
 *
 * Strategy by request type:
 *   navigations        network-first, cache fallback  (fresh when online, works in a dead spot)
 *   static assets      stale-while-revalidate         (fast, self-healing after a deploy)
 *   map tiles          cache-first, separate bucket   (immutable; survives a shell update)
 *   Firebase / API     network-only, never cached     (a stale score is worse than no score)
 */

// Bumped when the shell changes shape. v2 is the single-screen app: every
// former route (/golf/score/, /golf/leaderboard/, …) is now a view inside
// /golf/, so the old per-route shell entries would 404 on install.
const VERSION = "v2";
const SHELL_CACHE = `golf-shell-${VERSION}`;
const ASSET_CACHE = `golf-assets-${VERSION}`;
const TILE_CACHE = "golf-tiles"; // deliberately unversioned — tiles don't change

const SHELL_URLS = [
  "/golf/",
  "/golf/manifest.webmanifest",
  "/golf/icons/icon-192.png",
  "/golf/icons/icon-512.png",
  // The course aerial is the whole map. Precached rather than left to
  // stale-while-revalidate, because the screen someone opens in a dead spot on
  // the ninth is exactly this one, and it may never have been fetched before.
  "/golf/trophy-club-course-aerial.webp",
  "/golf/jns-logo.png",
];

/** Hosts that must always hit the network — auth and live data. */
const NETWORK_ONLY_HOSTS = [
  "firestore.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "www.googleapis.com",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Individually, so one 404 during a partial deploy can't fail the install.
      await Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("golf-") &&
              key !== SHELL_CACHE &&
              key !== ASSET_CACHE &&
              key !== TILE_CACHE
          )
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (NETWORK_ONLY_HOSTS.includes(url.hostname)) return;

  const sameOrigin = url.origin === self.location.origin;

  // Map tiles: immutable, cache-first, kept in their own bucket so a shell
  // update doesn't evict a course someone downloaded before heading out.
  if (sameOrigin && url.pathname.startsWith("/golf/tiles/")) {
    event.respondWith(cacheFirst(request, TILE_CACHE));
    return;
  }

  // Navigations to any /golf/ route.
  if (request.mode === "navigate") {
    if (!sameOrigin || !url.pathname.startsWith("/golf")) return;
    event.respondWith(networkFirst(request, SHELL_CACHE));
    return;
  }

  // Build output (/_next/static/**) and everything else under /golf/.
  const isBuildAsset = sameOrigin && url.pathname.startsWith("/_next/");
  const isGolfAsset = sameOrigin && url.pathname.startsWith("/golf/");
  if (isBuildAsset || isGolfAsset) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
  }
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // An unvisited route while offline — fall back to the app's home screen.
    const home = await cache.match("/golf/");
    if (home) return home;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await network) || new Response("Offline", { status: 503 });
}
