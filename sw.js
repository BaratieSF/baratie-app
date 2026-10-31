/* Baratie PWA - nuova base, cache separata dalla vecchia V36 */
const CACHE='baratie-clean-pwa-20261031-1';
const APP=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP)));
 self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  for(const key of await caches.keys()) if(key.startsWith('baratie-') && key!==CACHE) await caches.delete(key);
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 if(req.mode==='navigate'){
  event.respondWith((async()=>{
   try{const response=await fetch(req);if(response.ok){const cache=await caches.open(CACHE);await cache.put('./index.html',response.clone());}return response;}
   catch{ return (await caches.match('./index.html')) || Response.error();}
  })());
  return;
 }
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
});
