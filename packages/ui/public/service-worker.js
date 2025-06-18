const CACHE_NAME = 'flowise-app-shell-v1'
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/logo192.png',
    '/logo512.png'
    // Add more static assets here if needed
]

// Install: cache essential UI assets
self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)))
    self.skipWaiting()
})

// Activate: clean up old caches if needed
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
    )
    self.clients.claim()
})

// Fetch: serve UI assets from cache, always use network for API calls
self.addEventListener('fetch', (event) => {
    const { request } = event
    // Ignore API calls
    if (request.url.includes('/api/')) return

    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)))
})
