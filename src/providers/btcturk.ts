/**
 * BtcTurk provider for cryptocurrency data.
 */
import { BaseProvider, ProviderOptions } from './base.js';
import { TTL } from '../cache.js';
import { APIError, DataNotAvailableError } from '../exceptions.js';

export interface TickerData {
    symbol: string; last: number; open: number; high: number; low: number;
    bid: number; ask: number; volume: number; change: number; changePercent: number; timestamp?: number;
}

export interface OHLCVData { date: Date; open: number; high: number; low: number; close: number; volume: number; }
export interface HistoryOptions { period?: string; interval?: string; start?: Date; end?: Date; }

interface BtcTurkTickerResponse { success: boolean; message?: string; data: Array<{ pair: string; last: string | number; open: string | number; high: string | number; low: string | number; bid: string | number; ask: string | number; volume: string | number; daily: string | number; dailyPercent: string | number; timestamp: number; }>; }
interface GraphAPIResponse { s: string; t: number[]; o: number[]; h: number[]; l: number[]; c: number[]; v: number[]; }

export class BtcTurkProvider extends BaseProvider {
    private static readonly BASE_URL = 'https://api.btcturk.com/api/v2';
    private static readonly GRAPH_API_URL = 'https://graph-api.btcturk.com';
    private static readonly RESOLUTION_MAP: Record<string, number> = { '1m': 1, '5m': 5, '15m': 15, '30m': 30, '1h': 60, '4h': 240, '1d': 1440, '1wk': 10080 };
    private static readonly PERIOD_DAYS: Record<string, number> = { '1d': 1, '5d': 5, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365 };

    constructor(options?: ProviderOptions) { super(options); }

    async getTicker(pair: string): Promise<TickerData> {
        pair = pair.toUpperCase();
        const cacheKey = `btcturk:ticker:${pair}`;
        const cached = this.cacheGet<TickerData>(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.get<BtcTurkTickerResponse>(`${BtcTurkProvider.BASE_URL}/ticker`, { params: { pairSymbol: pair } });
            const data = response.data;
            if (!data.success) throw new APIError(data.message ?? 'Unknown error');
            if (!data.data || data.data.length === 0) throw new DataNotAvailableError(`No data for pair: ${pair}`);

            const ticker = data.data[0];
            const result: TickerData = {
                symbol: ticker.pair, last: Number(ticker.last) || 0, open: Number(ticker.open) || 0,
                high: Number(ticker.high) || 0, low: Number(ticker.low) || 0, bid: Number(ticker.bid) || 0,
                ask: Number(ticker.ask) || 0, volume: Number(ticker.volume) || 0, change: Number(ticker.daily) || 0,
                changePercent: Number(ticker.dailyPercent) || 0, timestamp: ticker.timestamp,
            };
            this.cacheSet(cacheKey, result, TTL.REALTIME_PRICE);
            return result;
        } catch (error) {
            if (error instanceof APIError || error instanceof DataNotAvailableError) throw error;
            throw new APIError(`Failed to fetch ticker for ${pair}: ${error}`);
        }
    }

    async getHistory(pair: string, options: HistoryOptions = {}): Promise<OHLCVData[]> {
        pair = pair.toUpperCase();
        const { period = '1mo', interval = '1d', start, end } = options;
        const endDt = end ?? new Date();
        const startDt = start ?? new Date(endDt.getTime() - (BtcTurkProvider.PERIOD_DAYS[period] ?? 30) * 24 * 60 * 60 * 1000);
        const fromTs = Math.floor(startDt.getTime() / 1000);
        const toTs = Math.floor(endDt.getTime() / 1000);

        const cacheKey = `btcturk:history:${pair}:${interval}:${fromTs}:${toTs}`;
        const cached = this.cacheGet<OHLCVData[]>(cacheKey);
        if (cached) return cached;

        try {
            const resolution = BtcTurkProvider.RESOLUTION_MAP[interval] ?? 1440;
            const response = await this.get<GraphAPIResponse>(`${BtcTurkProvider.GRAPH_API_URL}/v1/klines/history`, { params: { symbol: pair, resolution, from: fromTs, to: toTs } });
            const data = response.data;
            if (data.s !== 'ok') throw new DataNotAvailableError(`No data available for ${pair}`);

            const records: OHLCVData[] = data.t.map((ts, i) => ({
                date: new Date(ts * 1000), open: Number(data.o[i]) || 0, high: Number(data.h[i]) || 0,
                low: Number(data.l[i]) || 0, close: Number(data.c[i]) || 0, volume: Number(data.v[i]) || 0,
            }));
            records.sort((a, b) => a.date.getTime() - b.date.getTime());
            this.cacheSet(cacheKey, records, TTL.OHLCV_HISTORY);
            return records;
        } catch (error) {
            if (error instanceof DataNotAvailableError) throw error;
            throw new APIError(`Failed to fetch history for ${pair}: ${error}`);
        }
    }

    async getPairs(quote: string = 'TRY'): Promise<string[]> {
        const cacheKey = `btcturk:pairs:${quote}`;
        const cached = this.cacheGet<string[]>(cacheKey);
        if (cached) return cached;
        try {
            const response = await this.get<BtcTurkTickerResponse>(`${BtcTurkProvider.BASE_URL}/ticker`);
            if (!response.data.success) return [];
            const pairs = response.data.data.map(t => t.pair).filter(p => p.endsWith(quote.toUpperCase()));
            this.cacheSet(cacheKey, pairs, TTL.COMPANY_LIST);
            return pairs;
        } catch { return []; }
    }
}

let provider: BtcTurkProvider | null = null;
export function getBtcTurkProvider(): BtcTurkProvider { if (!provider) provider = new BtcTurkProvider(); return provider; }
