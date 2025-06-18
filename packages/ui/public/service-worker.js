const CACHE_NAME = 'flowise-v1'
const ASSETS = ['/', '/index.html', '/manifest.json', '/logo192.png', '/logo512.png']

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
        })
    )
    self.clients.claim()
})

self.addEventListener('fetch', (event) => {
    // Skip API calls
    if (event.request.url.includes('/api/')) {
        return
    }

    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)))
})
