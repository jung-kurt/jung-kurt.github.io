// version gets updated for every release
const version = '2023-06-06:13:32:05';

// array of assets that will be cached on client
const cacheAssets = [ '/pwa/pwa.png', '/pwa/favicon.ico', '/pwa/index.css', '/pwa/', '/pwa/index.js', '/pwa/utility.js' ];

// prefix to distinguish cache from other PWAs served from this location
const cachePrefix = 'pwa-';

// name of cache for this particular version of PWA
const staticCacheName = `${cachePrefix}static-${version}`;

// the current cache is the only one that will be kept
const expectedCaches = [staticCacheName];

addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(staticCacheName);
    await cache.addAll(cacheAssets);
    self.skipWaiting();
  })());
});

addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const cacheName of await caches.keys()) {
      if (!cacheName.startsWith(cachePrefix)) continue;
      if (!expectedCaches.includes(cacheName)) await caches.delete(cacheName);
    }
  })());
});

addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  event.respondWith(
    caches.match(event.request).then(r => r || fetch(event.request))
  );
});
