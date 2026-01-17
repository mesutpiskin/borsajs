/**
 * Ticker class for stock data.
 */
import { getTradingViewProvider, TradingViewQuote, TradingViewBar } from './providers/tradingview.js';

export interface TickerInfo extends TradingViewQuote { type: 'stock'; }
export type HistoryOptions = {
    period?: string;
    interval?: string;
    start?: Date;
    end?: Date;
};

export class Ticker {
    private readonly _symbol: string;
    private _infoCache: TickerInfo | null = null;

    constructor(symbol: string) { this._symbol = symbol.toUpperCase().replace('.IS', '').replace('.E', ''); }
    get symbol(): string { return this._symbol; }

    async getInfo(): Promise<TickerInfo> {
        // Tradingview data is real-time, maybe we don't want to cache it too aggressively or at all?
        // But for consistency with previous implementation let's keep cache mechanism if suitable, 
        // OR simply fetch fresh data every time as it is "real-time". 
        // Previous implementation cached it. Let's keep it but maybe we should allow refreshing.
        // For now, let's just fetch it.
        const quote = await getTradingViewProvider().getQuote(this._symbol);
        this._infoCache = { ...quote, type: 'stock' };
        return this._infoCache;
    }

    async getFastInfo(): Promise<TickerInfo> { return this.getInfo(); }

    async getHistory(options: HistoryOptions = {}): Promise<TradingViewBar[]> {
        const { period = '1mo', interval = '1d', start, end } = options;
        return getTradingViewProvider().getHistory(this._symbol, period, interval, start, end);
    }

    toString(): string { return `Ticker('${this._symbol}')`; }
}
