const CACHE_NAME = 'file-share-v17';
const urlsToCache = [
  '/',
  '/index.html',
  '/js/app.js',
  '/manifest.json'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        // Ajouter les fichiers avec gestion d'erreur pour éviter l'abort
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.warn(`Impossible de mettre en cache ${url}:`, err.message);
            });
          })
        );
      })
      .catch(err => {
        console.error('Erreur cache install:', err);
      })
  );
  // Forcer le service worker à devenir actif immédiatement
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Prendre le contrôle des clients immédiatement
  self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourner la réponse en cache si disponible
        if (response) {
          return response;
        }

        // Sinon, faire la requête réseau
        return fetch(event.request).then((response) => {
          // Ne pas mettre en cache les requêtes non-GET ou les API
          if (event.request.method !== 'GET' || 
              event.request.url.includes('/api/')) {
            return response;
          }

          // Cloner la réponse
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Gestion des notifications push (optionnel)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Nouveau fichier';
  const options = {
    body: data.body || 'Un nouveau fichier a été partagé',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
