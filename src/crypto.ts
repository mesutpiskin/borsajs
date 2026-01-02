/**
 * Crypto class for cryptocurrency data - yfinance-like API.
 */

import { getBtcTurkProvider, TickerData, OHLCVData, HistoryOptions } from './providers/btcturk.js';

/**
 * A yfinance-like interface for cryptocurrency data from BtcTurk.
 *
 * @example
 * ```typescript
 * import { Crypto } from 'borsajs';
 *
 * const btc = new Crypto('BTCTRY');
 * const current = await btc.getCurrent();
 * console.log(current.last); // Last price
 *
 * const history = await btc.getHistory({ period: '1mo' });
 * console.log(history);
 * ```
 */
export class Crypto {
    private readonly _pair: string;
    private _currentCache: TickerData | null = null;

    /**
     * Initialize a Crypto object.
     *
     * @param pair - Trading pair (e.g., "BTCTRY", "ETHTRY", "BTCUSDT").
     *               Common pairs: BTCTRY, ETHTRY, XRPTRY, DOGETRY, SOLTRY
     */
    constructor(pair: string) {
        this._pair = pair.toUpperCase();
    }

    /**
     * Return the trading pair.
     */
    get pair(): string {
        return this._pair;
    }

    /**
     * Return the trading pair (alias).
     */
    get symbol(): string {
        return this._pair;
    }

    /**
     * Get current ticker information.
     *
     * @returns Dictionary with current market data:
     *   - symbol: Trading pair
     *   - last: Last traded price
     *   - open: Opening price
     *   - high: 24h high
     *   - low: 24h low
     *   - bid: Best bid price
     *   - ask: Best ask price
     *   - volume: 24h volume
     *   - change: Price change
     *   - changePercent: Percent change
     */
    async getCurrent(): Promise<TickerData> {
        if (!this._currentCache) {
            const provider = getBtcTurkProvider();
            this._currentCache = await provider.getTicker(this._pair);
        }
        return this._currentCache;
    }

    /**
     * Alias for getCurrent (yfinance compatibility).
     */
    async getInfo(): Promise<TickerData> {
        return this.getCurrent();
    }

    /**
     * Get historical OHLCV data.
     *
     * @param options - History options
     * @param options.period - How much data to fetch. Valid periods: 1d, 5d, 1mo, 3mo, 6mo, 1y.
     * @param options.interval - Data granularity. Valid intervals: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1wk.
     * @param options.start - Start date
     * @param options.end - End date (defaults to now)
     *
     * @returns Array of OHLCV data with date, open, high, low, close, volume.
     *
     * @example
     * ```typescript
     * const crypto = new Crypto('BTCTRY');
     * const history = await crypto.getHistory({ period: '1mo' });
     * const weeklyHistory = await crypto.getHistory({ period: '1y', interval: '1wk' });
     * ```
     */
    async getHistory(options: HistoryOptions = {}): Promise<OHLCVData[]> {
        const provider = getBtcTurkProvider();
        return provider.getHistory(this._pair, options);
    }

    toString(): string {
        return `Crypto('${this._pair}')`;
    }
}

/**
 * Get list of available cryptocurrency trading pairs.
 *
 * @param quote - Quote currency filter (TRY, USDT, BTC)
 * @returns List of available trading pair symbols.
 *
 * @example
 * ```typescript
 * import { cryptoPairs } from 'borsajs';
 *
 * const pairs = await cryptoPairs();
 * console.log(pairs); // ['BTCTRY', 'ETHTRY', 'XRPTRY', ...]
 *
 * const usdtPairs = await cryptoPairs('USDT');
 * console.log(usdtPairs); // ['BTCUSDT', 'ETHUSDT', ...]
 * ```
 */
export async function cryptoPairs(quote: string = 'TRY'): Promise<string[]> {
    const provider = getBtcTurkProvider();
    return provider.getPairs(quote);
}
