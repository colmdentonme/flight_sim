const CACHE_VERSION = "flight-checklists-v15";

// Precached at install so the app works offline immediately after the first
// visit. A document/aircraft added later gets cached automatically
// (network-first below) the first time it's opened with connectivity.
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/app.js",
  "./data/aircraft/index.json",
  "./data/aircraft/a380x.json",
  "./data/aircraft/a380x-reference.json",
  "./data/aircraft/pmdg738.json",
  "./data/aircraft/pmdg738-reference.json",
  "./data/aircraft/pmdg777f.json",
  "./data/aircraft/pmdg777f-reference.json",
  "./data/aircraft/fenix320.json",
  "./data/aircraft/fenix320-reference.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon.png",
];

// Files that rarely/never change once published: safe to serve straight from
// cache without a network round-trip.
const CACHE_FIRST = new Set([
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon.png",
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const isIcon = [...CACHE_FIRST].some((path) => event.request.url.endsWith(path.slice(1)));

  if (isIcon) {
    // Icons: cache-first, they never change once published.
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // Everything else (HTML/CSS/JS/checklist data): network-first, so an
  // online reload always picks up the latest checklist content and app
  // code. Falls back to the cached copy when offline (in-flight use).
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
