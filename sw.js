const CACHE_NAME = 'carid-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './logo.png' // asigură-te că numele coincide cu cel din folder
];

// Instalare Service Worker și salvare fișiere în Cache (pentru viteză și offline)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activare și curățare cache-uri vechi
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Rețeaua (baza de date Firebase) are prioritate. Dacă nu e net, încarcă resursele din cache.
self.addEventListener('fetch', e => {
  // Ignoră cererile către Firebase sau baze de date externe pentru a nu bloca datele live
  if (e.request.url.includes('firebase') || e.request.url.includes('firestore')) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      return cachedResponse || fetch(e.request).catch(() => {
        // Opțional: poți întoarce o pagină de offline aici dacă vrei
      });
    })
  );
});
