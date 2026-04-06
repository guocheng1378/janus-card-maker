const CACHE_NAME = 'jcm-v4';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/store.js',
  './js/devices.js',
  './js/maml.js',
  './js/templates.js',
  './js/preview.js',
  './js/editor.js',
  './js/export.js',
  './js/transcode.js',
  './js/ui.js',
  './js/app.js',
  './lib/jszip.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network first for navigation, cache first for assets
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./index.html'))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});
