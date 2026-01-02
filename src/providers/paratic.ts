/**
 * Paratic provider for historical OHLCV data.
 */

import { BaseProvider, ProviderOptions } from './base.js';
import { TTL } from '../cache.js';
import { APIError, DataNotAvailableError, TickerNotFoundError } from '../exceptions.js';

export interface QuoteData {
    symbol: string;
    last: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    change: number;
    changePercent: number;
    updateTime: Date;
}

export interface OHLCVData {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface HistoryOptions {
    period?: string;
    interval?: string;
    start?: Date;
    end?: Date;
}

interface ParaticDataItem {
    d: number;
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
}

/**
 * Provider for historical OHLCV data from Paratic.
 */
export class ParaticProvider extends BaseProvider {
    private static readonly BASE_URL = 'https://piyasa.paratic.com/API/g.php';

    private static readonly PERIOD_MAP: Record<string, number> = {
        '1d': 1,
        '5d': 5,
        '1mo': 30,
        '3mo': 90,
        '6mo': 180,
        '1y': 365,
        '2y': 730,
        '5y': 1825,
        '10y': 3650,
        'max': 3650,
    };

    private static readonly INTERVAL_MAP: Record<string, number> = {
        '1m': 1,
        '3m': 3,
        '5m': 5,
        '15m': 15,
        '30m': 30,
        '45m': 45,
        '1h': 60,
        '1d': 1440,
        '1wk': 10080,
        '1mo': 43200,
    };

    constructor(options?: ProviderOptions) {
        super(options);
    }

    /**
     * Get current quote for a symbol.
     */
    async getQuote(symbol: string): Promise<QuoteData> {
        symbol = symbol.toUpperCase().replace('.IS', '').replace('.E', '');

        const cacheKey = `paratic:quote:${symbol}`;
        const cached = this.cacheGet<QuoteData>(cacheKey);
        if (cached) {
            return cached;
        }

        const endDt = new Date();
        const params = {
            a: 'd',
            c: symbol,
            p: 1440, // Daily
            from: '',
            at: this.formatDate(endDt),
            group: 'f',
        };

        try {
            const response = await this.get<ParaticDataItem[]>(ParaticProvider.BASE_URL, { params });
            const data = response.data;

            if (!data || data.length === 0) {
                throw new TickerNotFoundError(symbol);
            }

            const latest = data[data.length - 1];
            const prev = data.length > 1 ? data[data.length - 2] : null;
            const prevClose = prev ? Number(prev.c) || 0 : 0;

            const last = Number(latest.c) || 0;
            const change = prevClose ? last - prevClose : 0;
            const changePct = prevClose ? (change / prevClose) * 100 : 0;

            const result: QuoteData = {
                symbol,
                last,
                open: Number(latest.o) || 0,
                high: Number(latest.h) || 0,
                low: Number(latest.l) || 0,
                close: prevClose,
                volume: Number(latest.v) || 0,
                change: Math.round(change * 100) / 100,
                changePercent: Math.round(changePct * 100) / 100,
                updateTime: new Date(latest.d),
            };

            this.cacheSet(cacheKey, result, TTL.REALTIME_PRICE);
            return result;
        } catch (error) {
            if (error instanceof TickerNotFoundError) {
                throw error;
            }
            throw new APIError(`Failed to fetch quote for ${symbol}: ${error}`);
        }
    }

    /**
     * Get historical OHLCV data for a symbol.
     */
    async getHistory(symbol: string, options: HistoryOptions = {}): Promise<OHLCVData[]> {
        symbol = symbol.toUpperCase().replace('.IS', '').replace('.E', '');

        const { period = '1mo', interval = '1d', start, end } = options;

        // Cache key
        let cacheKey = `paratic:history:${symbol}:${period}:${interval}`;
        if (start) cacheKey += `:${start.toISOString()}`;
        if (end) cacheKey += `:${end.toISOString()}`;

        const cached = this.cacheGet<OHLCVData[]>(cacheKey);
        if (cached) {
            return cached;
        }

        // Calculate date range
        const endDt = end ?? new Date();
        let startDt: Date;

        if (start) {
            startDt = start;
        } else {
            const days = this.getPeriodDays(period);
            startDt = new Date(endDt.getTime() - days * 24 * 60 * 60 * 1000);
        }

        // Get interval in minutes
        const intervalMinutes = ParaticProvider.INTERVAL_MAP[interval] ?? 1440;

        const params = {
            a: 'd',
            c: symbol,
            p: intervalMinutes,
            from: '',
            at: this.formatDate(endDt),
            group: 'f',
        };

        try {
            const response = await this.get<ParaticDataItem[]>(ParaticProvider.BASE_URL, { params });
            const data = response.data;

            if (!data || data.length === 0) {
                throw new DataNotAvailableError(`No data available for ${symbol}`);
            }

            const records = this.parseResponse(data, startDt, endDt);

            this.cacheSet(cacheKey, records, TTL.OHLCV_HISTORY);
            return records;
        } catch (error) {
            if (error instanceof DataNotAvailableError) {
                throw error;
            }
            throw new APIError(`Failed to fetch data for ${symbol}: ${error}`);
        }
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    private getPeriodDays(period: string): number {
        if (period === 'ytd') {
            const today = new Date();
            const yearStart = new Date(today.getFullYear(), 0, 1);
            return Math.ceil((today.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000));
        }
        return ParaticProvider.PERIOD_MAP[period] ?? 30;
    }

    private parseResponse(data: ParaticDataItem[], startDt: Date, endDt: Date): OHLCVData[] {
        const records: OHLCVData[] = [];

        for (const item of data) {
            try {
                const timestamp = item.d;
                if (!timestamp) continue;

                const dt = new Date(timestamp);

                // Filter by date range
                if (dt < startDt || dt > endDt) continue;

                records.push({
                    date: dt,
                    open: Number(item.o) || 0,
                    high: Number(item.h) || 0,
                    low: Number(item.l) || 0,
                    close: Number(item.c) || 0,
                    volume: Number(item.v) || 0,
                });
            } catch {
                continue;
            }
        }

        // Sort by date
        records.sort((a, b) => a.date.getTime() - b.date.getTime());
        return records;
    }
}

// Singleton instance
let provider: ParaticProvider | null = null;

/**
 * Get the singleton Paratic provider instance.
 */
export function getParaticProvider(): ParaticProvider {
    if (!provider) {
        provider = new ParaticProvider();
    }
    return provider;
}
