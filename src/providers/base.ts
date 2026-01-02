/**
 * Base provider class for all data providers.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Cache, getCache } from '../cache.js';

export interface ProviderOptions {
    timeout?: number;
    cache?: Cache;
}

/**
 * Base class for all data providers.
 */
export abstract class BaseProvider {
    protected readonly client: AxiosInstance;
    protected readonly cache: Cache;

    protected static readonly DEFAULT_HEADERS = {
        'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    };

    constructor(options: ProviderOptions = {}) {
        const { timeout = 30000, cache } = options;

        this.client = axios.create({
            timeout,
            headers: BaseProvider.DEFAULT_HEADERS,
        });

        this.cache = cache ?? getCache();
    }

    /**
     * Make a GET request.
     */
    protected async get<T = unknown>(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<AxiosResponse<T>> {
        const response = await this.client.get<T>(url, config);
        return response;
    }

    /**
     * Make a POST request.
     */
    protected async post<T = unknown>(
        url: string,
        data?: unknown,
        config?: AxiosRequestConfig
    ): Promise<AxiosResponse<T>> {
        const response = await this.client.post<T>(url, data, config);
        return response;
    }

    /**
     * Get a value from cache.
     */
    protected cacheGet<T>(key: string): T | null {
        return this.cache.get<T>(key);
    }

    /**
     * Set a value in cache.
     */
    protected cacheSet<T>(key: string, value: T, ttl: number): void {
        this.cache.set(key, value, ttl);
    }
}
