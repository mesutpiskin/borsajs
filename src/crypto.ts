/**
 * Crypto class for cryptocurrency data.
 */
import { getBtcTurkProvider, TickerData, OHLCVData, HistoryOptions } from './providers/btcturk.js';

export class Crypto {
    private readonly _pair: string;
    private _currentCache: TickerData | null = null;

    constructor(pair: string) { this._pair = pair.toUpperCase(); }
    get pair(): string { return this._pair; }
    get symbol(): string { return this._pair; }

    async getCurrent(): Promise<TickerData> {
        if (!this._currentCache) this._currentCache = await getBtcTurkProvider().getTicker(this._pair);
        return this._currentCache;
    }

    async getInfo(): Promise<TickerData> { return this.getCurrent(); }

    async getHistory(options: HistoryOptions = {}): Promise<OHLCVData[]> {
        return getBtcTurkProvider().getHistory(this._pair, options);
    }

    toString(): string { return `Crypto('${this._pair}')`; }
}

export async function cryptoPairs(quote: string = 'TRY'): Promise<string[]> {
    return getBtcTurkProvider().getPairs(quote);
}
