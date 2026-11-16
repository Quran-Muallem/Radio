/*
 * Service Worker der Web-Version (PWA).
 * - App-Gerüst wird gespeichert → die App öffnet sich auch ohne Netz (mit gespeicherter Senderliste).
 * - Seitenaufrufe: zuerst Netz, sonst gespeicherte App, sonst offline.html.
 * - Eigene Dateien (JS/CSS/Icons): aus dem Speicher, im Hintergrund aktualisiert.
 * - Fremde Server (APIs, Audio-Streams) werden NICHT angefasst oder gespeichert.
 */
const CACHE = 'quran-radio-v3';
const SHELL = ['./', './index.html', './offline.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

// Beim Installieren das App-Gerüst UND die in index.html verlinkten Build-Dateien (JS/CSS mit Hash) speichern,
// damit die App schon nach dem ersten Besuch offline startet.
async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  try {
    const html = await (await fetch('./index.html', { cache: 'no-store' })).text();
    const assets = [...html.matchAll(/(?:src|href)="(\.?\/?assets\/[^"]+)"/g)].map((m) => m[1]);
    if (assets.length) await cache.addAll(assets);
  } catch {
    /* Netz weg während der Installation – Laufzeit-Caching holt es später nach */
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // APIs & Streams direkt durchlassen

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('./index.html', copy));
          }
          return res;
        })
        .catch(async () => (await caches.match('./index.html')) || (await caches.match('./offline.html')) || Response.error())
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    })
  );
});
