/* Bader Account Management — service worker (installable + works offline).
 * The build id placeholder below is replaced at build time, so every release gets a new cache and old ones are deleted.
 * Only same-origin GET requests are handled. The sync server (another origin, POST) is never touched. */
const BUILD = "__BUILD__";
const CACHE = "bader-" + BUILD;
const LANG = new URL(self.location.href).searchParams.get("lang") || "ar";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch("/precache.json", { cache: "no-store" });
        const list = await res.json();
        const urls = [...list.core, ...(list.locales[LANG] || list.locales.ar || [])];
        // in small batches so a flaky mobile connection does not fail everything
        for (let i = 0; i < urls.length; i += 25) {
          await Promise.allSettled(urls.slice(i, i + 25).map((u) => cache.add(new Request(u, { cache: "reload" }))));
        }
      } catch (e) {
        /* offline install: runtime caching will fill the cache as pages are visited */
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("bader-") && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

const isStatic = (url) => url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/brand/");

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/sw.js" || url.pathname === "/precache.json") return;

  // hashed build files never change: cache first
  if (isStatic(url)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
            return res;
          })
      )
    );
    return;
  }

  // pages and Next.js data (.txt): network first so updates show, cached copy when offline
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch (e) {
        const hit =
          (await cache.match(req, { ignoreSearch: true })) ||
          (await cache.match(url.pathname.endsWith("/") ? url.pathname : url.pathname + "/", { ignoreSearch: true })) ||
          (req.mode === "navigate" ? await cache.match("/" + LANG + "/") : undefined);
        if (hit) return hit;
        return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
      }
    })()
  );
});
