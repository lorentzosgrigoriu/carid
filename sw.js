const CACHE_NAME = 'carid-v2'; // Schimbat la v2 pentru a forța actualizarea
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './logo.png'
];

// Instalare Service Worker și salvare inițială în Cache
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activare și curățare cache-uri vechi (șterge automat carid-v1)
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

// Strategia Network-First: prioritizează internetul, folosește cache-ul doar offline
self.addEventListener('fetch', e => {
  // Ignoră cererile către serverele live Firebase (Auth, Firestore, Realtime Database)
  if (
    e.request.url.includes('firebase') || 
    e.request.url.includes('firestore') || 
    e.request.url.includes('firebasedatabase') ||
    e.request.url.includes('gstatic.com')
  ) {
    return;
  }
  
  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        // Dacă cererea de pe net a reușit, salvăm copia proaspătă în cache pentru când nu va fi semnal
        if (networkResponse && networkResponse.status === 200 && e.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Dacă netul pică (ești în garaj/sub mașină), încarcă instant din cache ce s-a salvat anterior
        return caches.match(e.request);
      })
  );
});
