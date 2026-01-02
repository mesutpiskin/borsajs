/**
 * Paratic provider for historical OHLCV data.
 */
import { BaseProvider, ProviderOptions } from './base.js';
import { TTL } from '../cache.js';
import { APIError, DataNotAvailableError, TickerNotFoundError } from '../exceptions.js';

export interface QuoteData {
    symbol: string; last: number; open: number; high: number; low: number; close: number;
    volume: number; change: number; changePercent: number; updateTime: Date;
}

export interface OHLCVData { date: Date; open: number; high: number; low: number; close: number; volume: number; }
export interface HistoryOptions { period?: string; interval?: string; start?: Date; end?: Date; }
interface ParaticDataItem { d: number; o: number; h: number; l: number; c: number; v: number; }

export class ParaticProvider extends BaseProvider {
    private static readonly BASE_URL = 'https://piyasa.paratic.com/API/g.php';
    private static readonly PERIOD_MAP: Record<string, number> = { '1d': 1, '5d': 5, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365, '2y': 730, '5y': 1825, '10y': 3650, 'max': 3650 };
    private static readonly INTERVAL_MAP: Record<string, number> = { '1m': 1, '3m': 3, '5m': 5, '15m': 15, '30m': 30, '45m': 45, '1h': 60, '1d': 1440, '1wk': 10080, '1mo': 43200 };

    constructor(options?: ProviderOptions) { super(options); }

    private formatDate(date: Date): string {
        const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, '0'), d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0'), mi = String(date.getMinutes()).padStart(2, '0'), s = String(date.getSeconds()).padStart(2, '0');
        return `${y}${m}${d}${h}${mi}${s}`;
    }

    async getQuote(symbol: string): Promise<QuoteData> {
        symbol = symbol.toUpperCase().replace('.IS', '').replace('.E', '');
        const cacheKey = `paratic:quote:${symbol}`;
        const cached = this.cacheGet<QuoteData>(cacheKey);
        if (cached) return cached;

        const params = { a: 'd', c: symbol, p: 1440, from: '', at: this.formatDate(new Date()), group: 'f' };
        try {
            const response = await this.get<ParaticDataItem[]>(ParaticProvider.BASE_URL, { params });
            const data = response.data;
            if (!data || data.length === 0) throw new TickerNotFoundError(symbol);

            const latest = data[data.length - 1];
            const prev = data.length > 1 ? data[data.length - 2] : null;
            const prevClose = prev ? Number(prev.c) || 0 : 0;
            const last = Number(latest.c) || 0;
            const change = prevClose ? last - prevClose : 0;
            const changePct = prevClose ? (change / prevClose) * 100 : 0;

            const result: QuoteData = {
                symbol, last, open: Number(latest.o) || 0, high: Number(latest.h) || 0, low: Number(latest.l) || 0,
                close: prevClose, volume: Number(latest.v) || 0, change: Math.round(change * 100) / 100,
                changePercent: Math.round(changePct * 100) / 100, updateTime: new Date(latest.d),
            };
            this.cacheSet(cacheKey, result, TTL.REALTIME_PRICE);
            return result;
        } catch (error) {
            if (error instanceof TickerNotFoundError) throw error;
            throw new APIError(`Failed to fetch quote for ${symbol}: ${error}`);
        }
    }

    async getHistory(symbol: string, options: HistoryOptions = {}): Promise<OHLCVData[]> {
        symbol = symbol.toUpperCase().replace('.IS', '').replace('.E', '');
        const { period = '1mo', interval = '1d', start, end } = options;
        const endDt = end ?? new Date();
        const startDt = start ?? new Date(endDt.getTime() - (ParaticProvider.PERIOD_MAP[period] ?? 30) * 24 * 60 * 60 * 1000);

        let cacheKey = `paratic:history:${symbol}:${period}:${interval}`;
        if (start) cacheKey += `:${start.toISOString()}`;
        if (end) cacheKey += `:${end.toISOString()}`;
        const cached = this.cacheGet<OHLCVData[]>(cacheKey);
        if (cached) return cached;

        const intervalMinutes = ParaticProvider.INTERVAL_MAP[interval] ?? 1440;
        const params = { a: 'd', c: symbol, p: intervalMinutes, from: '', at: this.formatDate(endDt), group: 'f' };

        try {
            const response = await this.get<ParaticDataItem[]>(ParaticProvider.BASE_URL, { params });
            const data = response.data;
            if (!data || data.length === 0) throw new DataNotAvailableError(`No data available for ${symbol}`);

            const records: OHLCVData[] = data.filter(item => item.d && new Date(item.d) >= startDt && new Date(item.d) <= endDt)
                .map(item => ({ date: new Date(item.d), open: Number(item.o) || 0, high: Number(item.h) || 0, low: Number(item.l) || 0, close: Number(item.c) || 0, volume: Number(item.v) || 0 }));
            records.sort((a, b) => a.date.getTime() - b.date.getTime());
            this.cacheSet(cacheKey, records, TTL.OHLCV_HISTORY);
            return records;
        } catch (error) {
            if (error instanceof DataNotAvailableError) throw error;
            throw new APIError(`Failed to fetch data for ${symbol}: ${error}`);
        }
    }
}

let provider: ParaticProvider | null = null;
export function getParaticProvider(): ParaticProvider { if (!provider) provider = new ParaticProvider(); return provider; }
