/**
 * BtcTurk provider for cryptocurrency data.
 */

import { BaseProvider, ProviderOptions } from './base.js';
import { TTL } from '../cache.js';
import { APIError, DataNotAvailableError } from '../exceptions.js';

export interface TickerData {
    symbol: string;
    last: number;
    open: number;
    high: number;
    low: number;
    bid: number;
    ask: number;
    volume: number;
    change: number;
    changePercent: number;
    timestamp?: number;
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

interface BtcTurkTickerResponse {
    success: boolean;
    message?: string;
    data: Array<{
        pair: string;
        last: string | number;
        open: string | number;
        high: string | number;
        low: string | number;
        bid: string | number;
        ask: string | number;
        volume: string | number;
        daily: string | number;
        dailyPercent: string | number;
        timestamp: number;
    }>;
}

interface GraphAPIResponse {
    s: string;
    t: number[];
    o: number[];
    h: number[];
    l: number[];
    c: number[];
    v: number[];
}

/**
 * Provider for cryptocurrency data from BtcTurk.
 */
export class BtcTurkProvider extends BaseProvider {
    private static readonly BASE_URL = 'https://api.btcturk.com/api/v2';
    private static readonly GRAPH_API_URL = 'https://graph-api.btcturk.com';

    private static readonly RESOLUTION_MAP: Record<string, number> = {
        '1m': 1,
        '5m': 5,
        '15m': 15,
        '30m': 30,
        '1h': 60,
        '4h': 240,
        '1d': 1440,
        '1wk': 10080,
    };

    private static readonly PERIOD_DAYS: Record<string, number> = {
        '1d': 1,
        '5d': 5,
        '1mo': 30,
        '3mo': 90,
        '6mo': 180,
        '1y': 365,
    };

    constructor(options?: ProviderOptions) {
        super(options);
    }

    /**
     * Get current ticker data for a crypto pair.
     */
    async getTicker(pair: string): Promise<TickerData> {
        pair = pair.toUpperCase();

        const cacheKey = `btcturk:ticker:${pair}`;
        const cached = this.cacheGet<TickerData>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const url = `${BtcTurkProvider.BASE_URL}/ticker`;
            const response = await this.get<BtcTurkTickerResponse>(url, {
                params: { pairSymbol: pair },
            });

            const data = response.data;
            if (!data.success) {
                throw new APIError(data.message ?? 'Unknown error');
            }

            const tickerData = data.data;
            if (!tickerData || tickerData.length === 0) {
                throw new DataNotAvailableError(`No data for pair: ${pair}`);
            }

            const ticker = tickerData[0];
            const result: TickerData = {
                symbol: ticker.pair,
                last: Number(ticker.last) || 0,
                open: Number(ticker.open) || 0,
                high: Number(ticker.high) || 0,
                low: Number(ticker.low) || 0,
                bid: Number(ticker.bid) || 0,
                ask: Number(ticker.ask) || 0,
                volume: Number(ticker.volume) || 0,
                change: Number(ticker.daily) || 0,
                changePercent: Number(ticker.dailyPercent) || 0,
                timestamp: ticker.timestamp,
            };

            this.cacheSet(cacheKey, result, TTL.REALTIME_PRICE);
            return result;
        } catch (error) {
            if (error instanceof APIError || error instanceof DataNotAvailableError) {
                throw error;
            }
            throw new APIError(`Failed to fetch ticker for ${pair}: ${error}`);
        }
    }

    /**
     * Get historical OHLC data for a crypto pair.
     */
    async getHistory(pair: string, options: HistoryOptions = {}): Promise<OHLCVData[]> {
        pair = pair.toUpperCase();

        const { period = '1mo', interval = '1d', start, end } = options;

        // Calculate time range
        const endDt = end ?? new Date();
        let startDt: Date;

        if (start) {
            startDt = start;
        } else {
            const days = BtcTurkProvider.PERIOD_DAYS[period] ?? 30;
            startDt = new Date(endDt.getTime() - days * 24 * 60 * 60 * 1000);
        }

        const fromTs = Math.floor(startDt.getTime() / 1000);
        const toTs = Math.floor(endDt.getTime() / 1000);

        const cacheKey = `btcturk:history:${pair}:${interval}:${fromTs}:${toTs}`;
        const cached = this.cacheGet<OHLCVData[]>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const resolution = BtcTurkProvider.RESOLUTION_MAP[interval] ?? 1440;

            const url = `${BtcTurkProvider.GRAPH_API_URL}/v1/klines/history`;
            const response = await this.get<GraphAPIResponse>(url, {
                params: {
                    symbol: pair,
                    resolution,
                    from: fromTs,
                    to: toTs,
                },
            });

            const data = response.data;
            if (data.s !== 'ok') {
                throw new DataNotAvailableError(`No data available for ${pair}`);
            }

            const { t: timestamps, o: opens, h: highs, l: lows, c: closes, v: volumes } = data;

            const records: OHLCVData[] = [];
            for (let i = 0; i < timestamps.length; i++) {
                records.push({
                    date: new Date(timestamps[i] * 1000),
                    open: Number(opens[i]) || 0,
                    high: Number(highs[i]) || 0,
                    low: Number(lows[i]) || 0,
                    close: Number(closes[i]) || 0,
                    volume: Number(volumes[i]) || 0,
                });
            }

            // Sort by date
            records.sort((a, b) => a.date.getTime() - b.date.getTime());

            this.cacheSet(cacheKey, records, TTL.OHLCV_HISTORY);
            return records;
        } catch (error) {
            if (error instanceof DataNotAvailableError) {
                throw error;
            }
            throw new APIError(`Failed to fetch history for ${pair}: ${error}`);
        }
    }

    /**
     * Get list of available trading pairs.
     */
    async getPairs(quote: string = 'TRY'): Promise<string[]> {
        const cacheKey = `btcturk:pairs:${quote}`;
        const cached = this.cacheGet<string[]>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const url = `${BtcTurkProvider.BASE_URL}/ticker`;
            const response = await this.get<BtcTurkTickerResponse>(url);

            const data = response.data;
            if (!data.success) {
                return [];
            }

            const quoteUpper = quote.toUpperCase();
            const pairs = data.data
                .map((ticker) => ticker.pair)
                .filter((pair) => pair.endsWith(quoteUpper));

            this.cacheSet(cacheKey, pairs, TTL.COMPANY_LIST);
            return pairs;
        } catch {
            return [];
        }
    }
}

// Singleton instance
let provider: BtcTurkProvider | null = null;

/**
 * Get singleton provider instance.
 */
export function getBtcTurkProvider(): BtcTurkProvider {
    if (!provider) {
        provider = new BtcTurkProvider();
    }
    return provider;
}
