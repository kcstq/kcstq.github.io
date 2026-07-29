/* Service Worker: läuft im Hintergrund und speichert die App-Dateien
   im Cache des Geräts, damit LockedIn auch ohne Internet startet. */

const CACHE_NAME = "lockedin-cache-v1";
const FILES_TO_CACHE = [
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

// Beim Installieren: alle Dateien in den Cache legen
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Alte Caches aufräumen, wenn eine neue Version installiert wird
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Anfragen zuerst aus dem Cache beantworten, sonst aus dem Netz laden
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
