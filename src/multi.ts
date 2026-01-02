/**
 * Multi-ticker functions and classes - yfinance-like API.
 */

import { Ticker } from './ticker.js';
import { getParaticProvider, OHLCVData, HistoryOptions } from './providers/paratic.js';

export interface DownloadOptions extends HistoryOptions {
    groupBy?: 'column' | 'ticker';
    progress?: boolean;
}

export interface MultiTickerData {
    [ticker: string]: OHLCVData[];
}

/**
 * Container for multiple Ticker objects.
 *
 * @example
 * ```typescript
 * import { Tickers } from 'borsajs';
 *
 * const tickers = new Tickers('THYAO GARAN AKBNK');
 * // or
 * const tickers2 = new Tickers(['THYAO', 'GARAN', 'AKBNK']);
 *
 * // Access individual tickers
 * const thyao = tickers.getTicker('THYAO');
 * const info = await thyao.getInfo();
 *
 * // Get history for all
 * const history = await tickers.getHistory({ period: '1mo' });
 * ```
 */
export class Tickers {
    private readonly _symbols: string[];
    private readonly _tickers: Map<string, Ticker>;

    /**
     * Initialize Tickers with multiple symbols.
     *
     * @param symbols - Space-separated string or list of symbols.
     *                  Example: "THYAO GARAN AKBNK" or ["THYAO", "GARAN", "AKBNK"]
     */
    constructor(symbols: string | string[]) {
        if (typeof symbols === 'string') {
            this._symbols = symbols
                .split(/\s+/)
                .filter((s) => s.trim())
                .map((s) => s.trim().toUpperCase());
        } else {
            this._symbols = symbols
                .filter((s) => s.trim())
                .map((s) => s.trim().toUpperCase());
        }

        this._tickers = new Map();
        for (const symbol of this._symbols) {
            this._tickers.set(symbol, new Ticker(symbol));
        }
    }

    /**
     * Return list of symbols.
     */
    get symbols(): string[] {
        return [...this._symbols];
    }

    /**
     * Return all Ticker objects as a Map.
     */
    get tickers(): Map<string, Ticker> {
        return this._tickers;
    }

    /**
     * Get a specific ticker by symbol.
     */
    getTicker(symbol: string): Ticker {
        symbol = symbol.toUpperCase();
        const ticker = this._tickers.get(symbol);
        if (!ticker) {
            throw new Error(`Symbol not found: ${symbol}`);
        }
        return ticker;
    }

    /**
     * Get historical data for all tickers.
     *
     * @param options - History options
     * @returns Object with ticker symbols as keys and OHLCV arrays as values.
     */
    async getHistory(options: DownloadOptions = {}): Promise<MultiTickerData> {
        return download(this._symbols, options);
    }

    /**
     * Iterate over (symbol, ticker) pairs.
     */
    *[Symbol.iterator](): Iterator<[string, Ticker]> {
        for (const [symbol, ticker] of this._tickers) {
            yield [symbol, ticker];
        }
    }

    /**
     * Return number of tickers.
     */
    get length(): number {
        return this._tickers.size;
    }

    toString(): string {
        return `Tickers(${JSON.stringify(this._symbols)})`;
    }
}

/**
 * Download historical data for multiple tickers.
 *
 * Similar to yfinance.download(), this function fetches OHLCV data
 * for multiple stocks and returns an object with data organized by ticker.
 *
 * @param tickers - Space-separated string or list of symbols.
 * @param options - Download options
 * @param options.period - Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, etc.)
 * @param options.interval - Data interval (1m, 5m, 15m, 30m, 1h, 1d, 1wk, 1mo)
 * @param options.start - Start date
 * @param options.end - End date (defaults to today)
 * @param options.groupBy - How to group the output ('column' or 'ticker')
 * @param options.progress - Show progress (not implemented, for yfinance compatibility)
 *
 * @returns Object with ticker symbols as keys and OHLCV arrays as values.
 *
 * @example
 * ```typescript
 * import { download } from 'borsajs';
 *
 * // Download single ticker
 * const data = await download('THYAO', { period: '1mo' });
 *
 * // Download multiple tickers
 * const multiData = await download(['THYAO', 'GARAN', 'AKBNK'], { period: '1mo' });
 * console.log(multiData['THYAO']); // THYAO's OHLCV data
 * console.log(multiData['GARAN']); // GARAN's OHLCV data
 *
 * // With date range
 * const rangeData = await download('THYAO GARAN', {
 *   start: new Date('2024-01-01'),
 *   end: new Date('2024-06-30')
 * });
 * ```
 */
export async function download(
    tickers: string | string[],
    options: DownloadOptions = {}
): Promise<MultiTickerData> {
    // Parse symbols
    let symbols: string[];
    if (typeof tickers === 'string') {
        symbols = tickers
            .split(/\s+/)
            .filter((s) => s.trim())
            .map((s) => s.trim().toUpperCase());
    } else {
        symbols = tickers
            .filter((s) => s.trim())
            .map((s) => s.trim().toUpperCase());
    }

    if (symbols.length === 0) {
        throw new Error('No symbols provided');
    }

    const { period, interval, start, end } = options;
    const provider = getParaticProvider();

    const result: MultiTickerData = {};

    // Fetch data for each symbol
    for (const symbol of symbols) {
        try {
            const data = await provider.getHistory(symbol, { period, interval, start, end });
            if (data.length > 0) {
                result[symbol] = data;
            }
        } catch {
            // Skip failed symbols silently (yfinance behavior)
            continue;
        }
    }

    return result;
}
