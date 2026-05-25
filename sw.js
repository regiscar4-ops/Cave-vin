const CACHE = 'cave-vin-v3';
const STATIC = ['/index.html','/style.css','/app.js','/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('supabase.co') || url.hostname.includes('anthropic.com') ||
      url.pathname.startsWith('/api/') || url.hostname.includes('esm.sh') ||
      url.hostname.includes('jsdelivr.net')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{"error":"offline"}',{headers:{'Content-Type':'application/json'}})));
    return;
  }
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => { caches.open(CACHE).then(c => c.put(e.request,r.clone())); return r; }).catch(() => caches.match('/index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request).then(r => { caches.open(CACHE).then(ca => ca.put(e.request,r.clone())); return r; })).catch(() => caches.match('/index.html')));
});
