/* BARATIE V36 - shell offline, scope GitHub Pages */
const CACHE = 'baratie-v36-shell-20261025';
const ROOT = new URL('./', self.registration.scope);
const INDEX = new URL('index.html', ROOT).href;
const FILES = ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Do not activate an offline worker if the app shell is unavailable.
    await cache.add(new Request(INDEX, {cache: 'reload'}));
    await Promise.all(FILES.slice(1).map(async name => {
      try { await cache.add(new URL(name, ROOT).href); }
      catch (error) { console.warn('BARATIE optional offline asset:', name, error); }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('baratie-') && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok && response.type === 'basic') {
          const cache = await caches.open(CACHE);
          await cache.put(INDEX, response.clone());
        }
        return response;
      } catch (error) {
        return (await caches.match(INDEX)) || Response.error();
      }
    })());
    return;
  }

  if (FILES.slice(1).some(name => url.href === new URL(name, ROOT).href)) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        return (await caches.match(request)) || Response.error();
      }
    })());
  }
});
