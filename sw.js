// SpringMoonGallery Service Worker
// Verziószámot növelni minden új deployment előtt, hogy a cache frissüljön
const CACHE = "springmoon-v41";
const SHELL = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .catch(() => {})
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (e.request.mode === "navigate" ||
      url.pathname === "/" ||
      url.pathname === "/index.html" ||
      url.pathname === "/manifest.json") {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          if (r.ok) {
            const clone = r.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
          }
          return r;
        })
        .catch(() => caches.match(e.request).then(c => c || caches.match("/")))
    );
    return;
  }
  if (url.hostname.includes("fonts.googleapis") ||
      url.hostname.includes("fonts.gstatic") ||
      url.hostname.includes("cloudinary.com")) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const network = fetch(e.request).then(r => {
          if (r.ok) {
            const clone = r.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
          }
          return r;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }
});
