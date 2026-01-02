/**
 * Ticker class for stock data - yfinance-like API.
 */

import { getParaticProvider, QuoteData, OHLCVData, HistoryOptions } from './providers/paratic.js';

/**
 * Stock information with additional metadata.
 */
export interface TickerInfo extends QuoteData {
    type: 'stock';
}

/**
 * A yfinance-like interface for Turkish stock data.
 *
 * @example
 * ```typescript
 * import { Ticker } from 'borsajs';
 *
 * const stock = new Ticker('THYAO');
 *
 * // Get current info
 * const info = await stock.getInfo();
 * console.log(info.last); // Last price
 * console.log(info.change); // Daily change
 *
 * // Get history
 * const history = await stock.getHistory({ period: '1mo' });
 *
 * // Different intervals
 * const hourly = await stock.getHistory({ period: '5d', interval: '1h' });
 * const weekly = await stock.getHistory({ period: '1y', interval: '1wk' });
 * ```
 */
export class Ticker {
    private readonly _symbol: string;
    private _infoCache: TickerInfo | null = null;

    /**
     * Initialize a Ticker object.
     *
     * @param symbol - Stock symbol (e.g., "THYAO", "GARAN", "ASELS").
     *                 The ".IS" or ".E" suffix is optional and will be removed.
     */
    constructor(symbol: string) {
        this._symbol = symbol.toUpperCase().replace('.IS', '').replace('.E', '');
    }

    /**
     * Return the stock symbol.
     */
    get symbol(): string {
        return this._symbol;
    }

    /**
     * Get current stock information.
     *
     * @returns Dictionary with current market data:
     *   - symbol: Stock symbol
     *   - last: Last price
     *   - open: Opening price
     *   - high: Day high
     *   - low: Day low
     *   - close: Previous close
     *   - volume: Daily volume
     *   - change: Price change
     *   - changePercent: Percent change
     *   - updateTime: Last update timestamp
     */
    async getInfo(): Promise<TickerInfo> {
        if (!this._infoCache) {
            const provider = getParaticProvider();
            const quote = await provider.getQuote(this._symbol);
            this._infoCache = {
                ...quote,
                type: 'stock',
            };
        }
        return this._infoCache;
    }

    /**
     * Get fast info (cached data, no API call if already loaded).
     */
    async getFastInfo(): Promise<TickerInfo> {
        return this.getInfo();
    }

    /**
     * Get historical OHLCV data.
     *
     * @param options - History options
     * @param options.period - Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
     * @param options.interval - Data interval (1m, 5m, 15m, 30m, 1h, 1d, 1wk, 1mo)
     * @param options.start - Start date
     * @param options.end - End date (defaults to today)
     *
     * @returns Array of OHLCV data with date, open, high, low, close, volume.
     *
     * @example
     * ```typescript
     * const stock = new Ticker('THYAO');
     * 
     * // Period-based
     * const monthly = await stock.getHistory({ period: '1mo' });
     * const yearly = await stock.getHistory({ period: '1y' });
     * 
     * // Date range
     * const custom = await stock.getHistory({
     *   start: new Date('2024-01-01'),
     *   end: new Date('2024-06-30')
     * });
     * 
     * // Intraday data
     * const intraday = await stock.getHistory({ period: '1d', interval: '5m' });
     * ```
     */
    async getHistory(options: HistoryOptions = {}): Promise<OHLCVData[]> {
        const provider = getParaticProvider();
        return provider.getHistory(this._symbol, options);
    }

    toString(): string {
        return `Ticker('${this._symbol}')`;
    }
}
