// Offline support: the app works at the pitch with no signal. Pages are cached on install;
// fresh copies are fetched when online (network first, cache fallback).
const CACHE='gb-v7';
const SHELL=['index.html','live.html','me.html','badge.png','favicon.png','apple-touch-icon.png','icon-192.png','icon-512.png','app.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
// Offline fallback for a page: the same page if cached (clean URLs /live and /me map to their .html), else the coach app.
const pageFor=u=>{const p=u.pathname.replace(/\/$/,'/index').split('/').pop()||'index';return(p.endsWith('.html')?p:p+'.html')};
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||(e.request.mode==='navigate'?caches.match(pageFor(u)).then(p=>p||caches.match('index.html')):undefined))));
});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.openWindow('live.html'))});
