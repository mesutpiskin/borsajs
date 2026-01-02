/**
 * TTL-based in-memory cache for borsajs.
 */

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

/**
 * Thread-safe TTL-based in-memory cache.
 */
export class Cache {
    private store: Map<string, CacheEntry<unknown>> = new Map();

    /**
     * Get a value from cache if it exists and hasn't expired.
     */
    get<T>(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) {
            return null;
        }
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.value as T;
    }

    /**
     * Set a value in cache with TTL in seconds.
     */
    set<T>(key: string, value: T, ttlSeconds: number): void {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }

    /**
     * Delete a key from cache. Returns true if key existed.
     */
    delete(key: string): boolean {
        return this.store.delete(key);
    }

    /**
     * Clear all entries from cache.
     */
    clear(): void {
        this.store.clear();
    }

    /**
     * Remove expired entries. Returns number of entries removed.
     */
    cleanup(): number {
        const now = Date.now();
        let removed = 0;
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiresAt) {
                this.store.delete(key);
                removed++;
            }
        }
        return removed;
    }

    /**
     * Get the number of entries in the cache.
     */
    get size(): number {
        return this.store.size;
    }
}

/**
 * Standard TTL values for different data types (in seconds).
 */
export const TTL = {
    /** 1 minute - Real-time price data */
    REALTIME_PRICE: 60,
    /** 1 hour - Historical OHLCV data */
    OHLCV_HISTORY: 3600,
    /** 1 hour - Company information */
    COMPANY_INFO: 3600,
    /** 24 hours - Financial statements */
    FINANCIAL_STATEMENTS: 86400,
    /** 5 minutes - FX rates */
    FX_RATES: 300,
    /** 24 hours - Company list */
    COMPANY_LIST: 86400,
    /** 1 hour - Fund data */
    FUND_DATA: 3600,
    /** 24 hours - Inflation data */
    INFLATION_DATA: 86400,
    /** 5 minutes - VIOP data (delayed) */
    VIOP: 300,
} as const;

// Global cache instance
let globalCache: Cache | null = null;

/**
 * Get the global cache instance.
 */
export function getCache(): Cache {
    if (!globalCache) {
        globalCache = new Cache();
    }
    return globalCache;
}
