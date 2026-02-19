// Service Worker per PWA - Quiz Taxi/NCC
const CACHE_NAME = 'quiz-taxi-ncc-v2'
const urlsToCache = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icon-192x192.svg',
  '/icon-512x512.svg',
  '/favicon.ico'
]

// Installa il service worker e caching delle risorse base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aperta')
        return cache.addAll(urlsToCache)
      })
  )
  self.skipWaiting()
})

// Attiva e pulisci vecchie cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Rimozione cache vecchia:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Strategia: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clona la risposta prima di metterla in cache (solo GET)
        if (event.request.method === 'GET') {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })
        }
        return response
      })
      .catch(() => {
        // Se network fail, prova dalla cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response
            }
            // Se non è in cache, mostra fallback per navigazione
            if (event.request.mode === 'navigate') {
              return caches.match('/')
            }
          })
      })
  )
})
