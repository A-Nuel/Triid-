// Triid Service Worker — Offline-First PWA Shell
const CACHE_NAME = 'triid-shell-v3';
const API_CACHE = 'triid-api-v3';


// App shell assets to pre-cache
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

// ─── Install: Pre-cache shell ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate: Clean old caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch Strategy ───────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 0. CRITICAL: Never intercept non-GET requests to Supabase (uploads, auth).
  //    Intercepting these strips CORS headers and breaks storage uploads from Vercel.
  if (url.hostname.includes('supabase.co') && event.request.method !== 'GET') {
    return; // Let browser handle directly — no SW involvement
  }

  // 1. API calls: network-first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    if (event.request.method !== 'GET') {
      return; // Do not intercept POST/PUT/DELETE requests, let them pass through
    }
    event.respondWith(networkFirstWithCache(event.request, API_CACHE));
    return;
  }

  // 2. Supabase storage GET (portfolio images): cache-first, 7 day TTL
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/')) {
    event.respondWith(cacheFirstWithRefresh(event.request, API_CACHE));
    return;
  }

  // 3. App shell (HTML, JS, CSS): stale-while-revalidate
  if (
    event.request.mode === 'navigate' ||
    url.pathname.match(/\.(js|css|woff2?|svg|png|ico)$/)
  ) {
    event.respondWith(staleWhileRevalidate(event.request, CACHE_NAME));
    return;
  }

  // 4. Everything else: network only
  event.respondWith(fetch(event.request));
});


// ─── Strategy Helpers ─────────────────────────────────────────────────────

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request.clone(), { signal: AbortSignal.timeout(8000) });
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: { message: 'You are offline' }, offline: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503,
    });
  }
}

async function cacheFirstWithRefresh(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    // Refresh in background
    fetch(request.clone()).then(async res => {
      if (res.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, res);
      }
    }).catch(() => {});
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const refresh = fetch(request).then(res => {
    if (res.ok) cache.put(request, res.clone());
    return res;
  }).catch(() => cached);

  return cached || refresh;
}
