/**
 * Ticker class for stock data.
 */
import { getParaticProvider, QuoteData, OHLCVData, HistoryOptions } from './providers/paratic.js';

export interface TickerInfo extends QuoteData { type: 'stock'; }

export class Ticker {
    private readonly _symbol: string;
    private _infoCache: TickerInfo | null = null;

    constructor(symbol: string) { this._symbol = symbol.toUpperCase().replace('.IS', '').replace('.E', ''); }
    get symbol(): string { return this._symbol; }

    async getInfo(): Promise<TickerInfo> {
        if (!this._infoCache) {
            const quote = await getParaticProvider().getQuote(this._symbol);
            this._infoCache = { ...quote, type: 'stock' };
        }
        return this._infoCache;
    }

    async getFastInfo(): Promise<TickerInfo> { return this.getInfo(); }

    async getHistory(options: HistoryOptions = {}): Promise<OHLCVData[]> {
        return getParaticProvider().getHistory(this._symbol, options);
    }

    toString(): string { return `Ticker('${this._symbol}')`; }
}
