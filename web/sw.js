// Service worker mínimo: deja instalar la app y muestra la página de inicio guardada si no hay conexión.
var CACHE = 'guardian-v1';
var SHELL = ['/es/', '/it/', '/estilos.css', '/app.js', '/icono.svg'];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }),
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Primero la red; si falla, lo guardado.
  event.respondWith(
    fetch(req).catch(function () {
      return caches.match(req).then(function (hit) {
        if (hit) return hit;
        var lang = new URL(req.url).pathname.indexOf('/it/') === 0 ? '/it/' : '/es/';
        return caches.match(lang);
      });
    }),
  );
});
