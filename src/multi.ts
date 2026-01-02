/**
 * Multi-ticker functions and classes.
 */
import { Ticker } from './ticker.js';
import { getParaticProvider, OHLCVData, HistoryOptions } from './providers/paratic.js';

export interface DownloadOptions extends HistoryOptions { groupBy?: 'column' | 'ticker'; progress?: boolean; }
export interface MultiTickerData { [ticker: string]: OHLCVData[]; }

export class Tickers {
    private readonly _symbols: string[];
    private readonly _tickers: Map<string, Ticker>;

    constructor(symbols: string | string[]) {
        this._symbols = (typeof symbols === 'string' ? symbols.split(/\s+/) : symbols).filter(s => s.trim()).map(s => s.trim().toUpperCase());
        this._tickers = new Map();
        for (const symbol of this._symbols) this._tickers.set(symbol, new Ticker(symbol));
    }

    get symbols(): string[] { return [...this._symbols]; }
    get tickers(): Map<string, Ticker> { return this._tickers; }
    get length(): number { return this._tickers.size; }

    getTicker(symbol: string): Ticker {
        const ticker = this._tickers.get(symbol.toUpperCase());
        if (!ticker) throw new Error(`Symbol not found: ${symbol}`);
        return ticker;
    }

    async getHistory(options: DownloadOptions = {}): Promise<MultiTickerData> { return download(this._symbols, options); }

    *[Symbol.iterator](): Iterator<[string, Ticker]> { for (const entry of this._tickers) yield entry; }
    toString(): string { return `Tickers(${JSON.stringify(this._symbols)})`; }
}

export async function download(tickers: string | string[], options: DownloadOptions = {}): Promise<MultiTickerData> {
    const symbols = (typeof tickers === 'string' ? tickers.split(/\s+/) : tickers).filter(s => s.trim()).map(s => s.trim().toUpperCase());
    if (symbols.length === 0) throw new Error('No symbols provided');
    const { period, interval, start, end } = options;
    const provider = getParaticProvider();
    const result: MultiTickerData = {};
    for (const symbol of symbols) {
        try { const data = await provider.getHistory(symbol, { period, interval, start, end }); if (data.length > 0) result[symbol] = data; } catch { /* skip */ }
    }
    return result;
}
