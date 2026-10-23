/*
 * Service worker de Poké Prairie : rend le site jouable hors ligne (appli de bureau comprise).
 * - Pages : réseau d'abord, la dernière version en cache si on est hors ligne.
 * - Fichiers du site (/static, images) : cache, mis à jour en arrière-plan.
 * - Sprites Pokémon (PokéAPI sur GitHub) : cache d'abord, ils ne changent jamais.
 * Les appels /api et /auth ne passent jamais par le cache.
 */
const SITE = 'bl-site-v1';
const SPRITES = 'bl-sprites-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SITE).then((c) => c.addAll(['/', '/index.html']).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => ![SITE, SPRITES].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const put = (name, req, res) => { if (res && (res.ok || res.type === 'opaque')) caches.open(name).then((c) => c.put(req, res)).catch(() => {}); };

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin && /^\/(api|auth|socket\.io)\//.test(url.pathname)) return;

  if (url.hostname === 'raw.githubusercontent.com' && url.pathname.startsWith('/PokeAPI/sprites/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { put(SPRITES, req, res.clone()); return res; })));
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => { put(SITE, '/index.html', res.clone()); return res; })
      .catch(() => caches.match('/index.html').then((hit) => hit || caches.match('/'))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((res) => { put(SITE, req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
