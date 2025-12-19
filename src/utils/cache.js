/**
 * Simple cache utility with TTL (Time To Live)
 */

const cache = new Map();

export function cacheSet(key, value, ttlMs = 30000) {
    cache.set(key, {
        value,
        expires: Date.now() + ttlMs
    });
}

export function cacheGet(key) {
    const item = cache.get(key);

    if (!item) return null;

    if (Date.now() > item.expires) {
        cache.delete(key);
        return null;
    }

    return item.value;
}

export function cacheHas(key) {
    const item = cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expires) {
        cache.delete(key);
        return false;
    }

    return true;
}

export function cacheClear(keyPrefix) {
    if (keyPrefix) {
        // Clear keys with prefix
        for (const key of cache.keys()) {
            if (key.startsWith(keyPrefix)) {
                cache.delete(key);
            }
        }
    } else {
        // Clear all
        cache.clear();
    }
}

// Stale-while-revalidate pattern
export async function cacheGetOrFetch(key, fetchFn, ttlMs = 30000) {
    const cached = cacheGet(key);

    if (cached) {
        // Return cached data immediately
        // Optionally fetch fresh data in background
        return cached;
    }

    // No cache, fetch fresh
    const fresh = await fetchFn();
    cacheSet(key, fresh, ttlMs);
    return fresh;
}

export default {
    set: cacheSet,
    get: cacheGet,
    has: cacheHas,
    clear: cacheClear,
    getOrFetch: cacheGetOrFetch
};
