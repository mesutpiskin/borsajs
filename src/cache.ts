/**
 * TTL-based in-memory cache for borsajs.
 */

interface CacheEntry<T> { value: T; expiresAt: number; }

export class Cache {
    private store: Map<string, CacheEntry<unknown>> = new Map();

    get<T>(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) { this.store.delete(key); return null; }
        return entry.value as T;
    }

    set<T>(key: string, value: T, ttlSeconds: number): void {
        this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    }

    delete(key: string): boolean { return this.store.delete(key); }
    clear(): void { this.store.clear(); }
    get size(): number { return this.store.size; }
}

export const TTL = {
    REALTIME_PRICE: 60,
    OHLCV_HISTORY: 3600,
    COMPANY_INFO: 3600,
    FINANCIAL_STATEMENTS: 86400,
    FX_RATES: 300,
    COMPANY_LIST: 86400,
    FUND_DATA: 3600,
    INFLATION_DATA: 86400,
    VIOP: 300,
} as const;

let globalCache: Cache | null = null;
export function getCache(): Cache {
    if (!globalCache) globalCache = new Cache();
    return globalCache;
}
