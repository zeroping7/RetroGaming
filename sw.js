// Primero red (siempre lo último si hay conexión) y, si no hay, lo guardado.
// Sube CACHE al cambiar la lista FILES.
const CACHE = 'rg-v10';
const FILES = [
  './', 'index.html', 'css/lanzador.css', 'src/lanzador.js', 'src/version.js', 'src/input/entradas.js', 'src/net/sala.js', 'src/net/ice.js', 'src/pantalla/orientacion.js', 'src/pantalla/pausa.js', 'juegos/registro.js',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'juegos/revienta-burbujas/', 'juegos/revienta-burbujas/index.html',
  'juegos/revienta-burbujas/sim.js', 'juegos/revienta-burbujas/render.js', 'juegos/revienta-burbujas/fases.js', 'juegos/revienta-burbujas/records.js', 'juegos/revienta-burbujas/sonidos.js', 'src/audio/sintetizador.js',
  'juegos/revienta-burbujas/portada.svg', 'juegos/revienta-burbujas/icono.png',
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // no-cache: pregunta siempre al servidor si hay versión nueva (si no la hay, responde rápido sin
  // descargar nada). Sin esto, el navegador podía dar hasta 10 min la copia vieja tras publicar.
  const peticion = e.request.mode === 'navigate' ? fetch(e.request.url, { cache: 'no-cache' }) : fetch(e.request, { cache: 'no-cache' });
  e.respondWith(
    peticion
      .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)).catch(() => {}); return r; })
      .catch(() => caches.match(e.request))
  );
});
