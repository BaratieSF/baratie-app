/* Baratie PWA - cache offline v37 */
const CACHE = 'baratie-shell-v37-20261031';
const ROOT = new URL('./', self.registration.scope);
const INDEX = new URL('index.html', ROOT).href;
const ASSETS = ['index.html','manifest.webmanifest','icon-192.png','icon-512.png'].map(p => new URL(p,ROOT).href);
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.add(new Request(INDEX,{cache:'reload'}));
    await Promise.all(ASSETS.slice(1).map(async url => { try { await cache.add(url); } catch(e) { console.warn('Optional asset:',url,e); } }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('baratie-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  if(req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if(res.ok) { const c=await caches.open(CACHE); await c.put(INDEX,res.clone()); }
        return res;
      } catch(e) { return (await caches.match(INDEX)) || Response.error(); }
    })());
    return;
  }
  if(ASSETS.includes(url.href)) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if(cached) return cached;
      try { const res=await fetch(req); if(res.ok) { const c=await caches.open(CACHE); await c.put(req,res.clone()); } return res; }
      catch(e) { return Response.error(); }
    })());
  }
});
