
/* BARATIE V36 - service worker compatibile con Chrome Android 8 */
const CACHE_NAME = 'baratie-v36-shell-20261024';
const SHELL = ['./index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(event) {
  event.waitUntil((async function() {
    const cache = await caches.open(CACHE_NAME);
    // L'HTML principale e' obbligatorio: non dichiarare installata una cache vuota.
    await cache.add(new Request('./index.html', {cache: 'reload'}));
    // Le risorse accessorie non devono bloccare l'installazione.
    await Promise.all(SHELL.slice(1).map(async function(path) {
      try { await cache.add(path); } catch (err) { console.warn('Risorsa non salvata:', path, err); }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', function(event) {
  event.waitUntil((async function() {
    const names = await caches.keys();
    await Promise.all(names.filter(function(name) {
      return (name.indexOf('baratie-') === 0) && name !== CACHE_NAME;
    }).map(function(name) { return caches.delete(name); }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', function(event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;

  if (req.mode === 'navigate') {
    event.respondWith((async function() {
      try {
        const response = await fetch(req);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put('./index.html', response.clone());
        }
        return response;
      } catch (err) {
        const cached = await caches.match('./index.html');
        if (cached) return cached;
        return Response.error();
      }
    })());
    return;
  }

  // Le icone e il manifest sono disponibili offline; le altre risorse seguono la rete.
  if (SHELL.slice(1).some(function(path) { return url.pathname === new URL(path, self.registration.scope).pathname; })) {
    event.respondWith(fetch(req).then(function(response) {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(function(cache) { return cache.put(req, copy); }));
      }
      return response;
    }).catch(function() { return caches.match(req); }));
  }
});
