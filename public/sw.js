const CACHE_NAME = 'nebula-v2026-02-25'; // Version avec date pour forcer le rafraîchissement
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Fichiers qui ne doivent PAS être mis en cache (always fetch fresh)
const noCachePatterns = [
  '/js/',
  '/css/',
  '/api/',
  '.js',
  '.css'
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
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .catch((err) => {
        console.error('Erreur activation:', err);
      })
  );
  // Prendre le contrôle des clients immédiatement
  self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // NETWORK FIRST pour les JS et CSS (toujours chercher la version fraîche)
  const isScript = url.includes('/js/') || url.includes('/css/') || url.endsWith('.js') || url.endsWith('.css');
  
  if (isScript) {
    // Network first pour les assets
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          }
          return response;
        })
        .catch(() => {
          // Si pas de réseau, utiliser le cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // CACHE FIRST pour HTML et autres fichiers
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourner la réponse en cache si disponible
        if (response) {
          return response;
        }

        // Sinon, faire la requête réseau
        return fetch(event.request)
          .then((response) => {
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
              })
              .catch((err) => {
                console.warn('Erreur cache:', err);
              });

            return response;
          })
          .catch((err) => {
            console.error('Erreur requête réseau:', err);
            // Retourner une réponse d'erreur
            return new Response('Erreur réseau', { status: 500 });
          });
      })
      .catch((err) => {
        console.error('Erreur cache match:', err);
        return new Response('Erreur cache', { status: 500 });
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
