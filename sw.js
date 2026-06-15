// sw.js — App-Shell-Cache, stale-while-revalidate
const VERSION = 'v1.4';
const SHELL = 'kt-shell-' + VERSION;
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles.css',
  './js/store.js',
  './js/foods_de.js',
  './js/off.js',
  './js/usda.js',
  './js/app.js',
  './vendor/zxing.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './fonts/fonts.css',
  './fonts/hanken-400-latin-ext.woff2',
  './fonts/hanken-400-latin.woff2',
  './fonts/hanken-500-latin-ext.woff2',
  './fonts/hanken-500-latin.woff2',
  './fonts/hanken-600-latin-ext.woff2',
  './fonts/hanken-600-latin.woff2',
  './fonts/hanken-700-latin-ext.woff2',
  './fonts/hanken-700-latin.woff2',
  './fonts/material-symbols.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // OpenFoodFacts: nur Netz (Daten ändern sich), nicht im Shell-Cache halten
  if (url.hostname.includes('openfoodfacts.org')) return;

  // App-Shell + statische Assets: stale-while-revalidate
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(request).then((cached) => {
        const net = fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(SHELL).then((c) => c.put(request, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || net;
      })
    );
  }
});
