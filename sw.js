/* Cache offline del shell estático. Firestore, Auth y datos de usuarios no se cachean. */
const CACHE_NAME = 'gestion-escolar-flat-v4-perfil-diagnostico';
const STATIC_ASSETS = [
  './index.html',
  './aportes.html',
  './notas.html',
  './horarios.html',
  './fichas.html',
  './base.css',
  './layout.css',
  './componentes.css',
  './nav.js',
  './login.js',
  './guard.js',
  './auth.js',
  './firebase-config.js',
  './logs.js',
  './offline.js',
  './sheets.js',
  './aportes.js',
  './notas.js',
  './horarios.js',
  './fichas.js',
  './manifest.json',
  './logo.svg',
  './icono-aportes.svg',
  './icono-notas.svg',
  './icono-horarios.svg',
  './icono-fichas.svg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const requests = STATIC_ASSETS.map((path) => new URL(path, self.registration.scope).href);
    await cache.addAll(requests);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith('gestion-escolar-') && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const requestUrl = new URL(request.url);
  const scopePath = new URL(self.registration.scope).pathname;
  if (requestUrl.origin !== self.location.origin || !requestUrl.pathname.startsWith(scopePath)) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cachedPage = await caches.match(request, { ignoreSearch: true });
        if (cachedPage) return cachedPage;
        return caches.match(new URL('./index.html', self.registration.scope).href);
      }
    })());
    return;
  }

  // Solo recursos estáticos del mismo origen. No interceptar SDKs, APIs ni documentos privados.
  if (!['style', 'script', 'image', 'manifest', 'font'].includes(request.destination)) return;
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    } catch {
      return new Response('Recurso no disponible sin conexión.', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
