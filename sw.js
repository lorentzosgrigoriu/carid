const CACHE_NAME = 'carid-v3'; // Schimbat la v3 pentru a forța actualizarea aplicației

const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './logo.png',
  // Librării externe salvate în cache pentru acces offline în garaj
  'https://unpkg.com/html5-qrcode',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Instalare Service Worker și salvare resurse în Cache
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activare și curățare versiuni vechi de cache (șterge v1/v2)
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

// Strategia Network-First: prioritizează internetul, folosește cache doar offline
self.addEventListener('fetch', e => {
  // Ignoră cererile live către baza de date Supabase (să nu le blocheze din cache)
  if (
    e.request.url.includes('supabase.co') || 
    e.request.url.includes('rest/v1')
  ) {
    return;
  }
  
  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        // Dacă cererea de pe rețea a reușit, salvăm o copie proaspătă în cache
        if (networkResponse && networkResponse.status === 200 && e.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Dacă nu există conexiune la internet, deschide resursele din cache
        return caches.match(e.request);
      })
  );
});
