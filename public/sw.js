// Offline support: the app works at the pitch with no signal. Pages are cached on first visit;
// fresh copies are fetched when online (network first, cache fallback).
const CACHE='og-demo-v5';
const SHELL=['index.html','live.html','me.html','badge.png','favicon.png','apple-touch-icon.png','icon-192.png','icon-512.png','manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.openWindow('live.html'))});
