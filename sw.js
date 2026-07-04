// Service Worker de GanaderApp
// Objetivo: (1) permitir que el navegador ofrezca "Instalar app",
// (2) dejar la app abrir aunque no haya conexión (los datos siguen
// sincronizándose con Firestore normalmente cuando sí hay señal).

const CACHE_NAME = 'ganaderapp-shell-v1';
const CORE_ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Para la navegación principal (abrir la app): intenta la red primero
  // (para que siempre cargues la versión más reciente si hay señal),
  // y si no hay conexión, sirve la copia guardada localmente.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Para el resto de archivos propios de la app (manifest, íconos):
  // usa la copia local si existe, si no, ve a la red.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
