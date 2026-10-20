// Primero red (siempre lo último si hay conexión) y, si no hay, lo guardado.
// Sube CACHE al cambiar la lista FILES.
const CACHE = 'rg-v1';
const FILES = [
  './', 'index.html', 'css/lanzador.css', 'src/lanzador.js', 'src/version.js', 'juegos/registro.js',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'juegos/revienta-burbujas/', 'juegos/revienta-burbujas/index.html',
  'juegos/revienta-burbujas/portada.svg', 'juegos/revienta-burbujas/icono.png',
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)).catch(() => {}); return r; })
      .catch(() => caches.match(e.request))
  );
});
