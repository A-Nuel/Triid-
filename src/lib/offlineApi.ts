/**
 * offlineApi.ts — Offline-First API Layer
 * 
 * Strategy:
 *  - GET requests: serve cache immediately, refresh in background (stale-while-revalidate)
 *  - POST/PUT requests: try network, queue on failure for background retry
 *  - All responses are cached in localStorage with TTL
 */

const DB_PREFIX = 'triid_cache_';
const PENDING_KEY = 'triid_pending_saves';
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  ts: number;
  ttl: number;
}

interface PendingWrite {
  endpoint: string;
  method: string;
  body: Record<string, unknown>;
  token: string;
  ts: number;
  retries: number;
}

// ─── Cache Helpers ──────────────────────────────────────────────────────────

function cacheKey(url: string): string {
  return DB_PREFIX + btoa(url).replace(/[^a-zA-Z0-9]/g, '_');
}

function readCache<T>(url: string): T | null {
  try {
    const raw = localStorage.getItem(cacheKey(url));
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    // Return even stale cache (we'll refresh in background)
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache<T>(url: string, data: T, ttl = DEFAULT_TTL_MS): void {
  try {
    const entry: CacheEntry<T> = { data, ts: Date.now(), ttl };
    localStorage.setItem(cacheKey(url), JSON.stringify(entry));
  } catch (e) {
    // localStorage full — clear old entries
    clearStaleCaches();
  }
}

function isFresh(url: string): boolean {
  try {
    const raw = localStorage.getItem(cacheKey(url));
    if (!raw) return false;
    const entry: CacheEntry<unknown> = JSON.parse(raw);
    return Date.now() - entry.ts < entry.ttl;
  } catch {
    return false;
  }
}

function clearStaleCaches(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(DB_PREFIX));
  for (const key of keys) {
    try {
      const entry: CacheEntry<unknown> = JSON.parse(localStorage.getItem(key) || '');
      if (Date.now() - entry.ts > entry.ttl) localStorage.removeItem(key);
    } catch {
      localStorage.removeItem(key);
    }
  }
}

// ─── GET with stale-while-revalidate ────────────────────────────────────────

export async function offlineGet<T>(
  url: string,
  token: string,
  ttl = DEFAULT_TTL_MS
): Promise<T | null> {
  const cached = readCache<T>(url);

  // Fire background refresh (don't await)
  const refresh = async () => {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json();
        writeCache(url, data, ttl);
        return data;
      }
    } catch {
      // Network error — silently fail, cache served
    }
    return null;
  };

  if (cached && isFresh(url)) {
    // Fresh cache: serve immediately, refresh quietly
    refresh();
    return cached;
  }

  if (cached) {
    // Stale cache: serve immediately, refresh quietly
    refresh();
    return cached;
  }

  // No cache: wait for network
  return await refresh();
}

// ─── POST/PUT with offline queue ─────────────────────────────────────────────

export async function offlinePost<T>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH',
  body: Record<string, unknown>,
  token: string
): Promise<{ data: T | null; offline: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      return { data, offline: false };
    }

    let error = 'Request failed';
    try { error = (await res.json()).error?.message || error; } catch {}
    return { data: null, offline: false, error };
  } catch {
    // Queue for retry when back online
    enqueuePendingWrite({ endpoint: url, method, body, token, ts: Date.now(), retries: 0 });
    return { data: null, offline: true };
  }
}

// ─── Pending Write Queue ─────────────────────────────────────────────────────

function enqueuePendingWrite(write: PendingWrite): void {
  try {
    const queue: PendingWrite[] = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
    queue.push(write);
    localStorage.setItem(PENDING_KEY, JSON.stringify(queue));
  } catch {}
}

export function getPendingCount(): number {
  try {
    const queue: PendingWrite[] = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
    return queue.length;
  } catch {
    return 0;
  }
}

/**
 * Call this when the app comes back online to flush queued writes.
 */
export async function flushPendingWrites(): Promise<void> {
  let queue: PendingWrite[] = [];
  try {
    queue = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
  } catch {
    return;
  }

  if (queue.length === 0) return;

  const remaining: PendingWrite[] = [];

  for (const write of queue) {
    try {
      const res = await fetch(write.endpoint, {
        method: write.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${write.token}`,
        },
        body: JSON.stringify(write.body),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        if (write.retries < 3) remaining.push({ ...write, retries: write.retries + 1 });
      }
    } catch {
      if (write.retries < 3) remaining.push({ ...write, retries: write.retries + 1 });
    }
  }

  localStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
}

// ─── Network Status Monitor ───────────────────────────────────────────────────

export function initOfflineMonitor(onFlush?: () => void): () => void {
  const handleOnline = async () => {
    console.log('[Triid] Back online — flushing pending writes...');
    await flushPendingWrites();
    onFlush?.();
  };

  window.addEventListener('online', handleOnline);

  // Also flush on startup if online
  if (navigator.onLine) {
    flushPendingWrites().then(onFlush);
  }

  return () => window.removeEventListener('online', handleOnline);
}
