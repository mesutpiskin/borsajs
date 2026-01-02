/**
 * FX class for forex and commodity data - yfinance-like API.
 */

import { getDovizcomProvider, FXCurrentData, FXHistoryData, HistoryOptions } from './providers/dovizcom.js';

/**
 * A yfinance-like interface for forex and commodity data.
 *
 * Supported assets:
 * - Currencies: USD, EUR, GBP, JPY, CHF, CAD, AUD
 * - Precious Metals: gram-altin, gumus, ons, ceyrek-altin, yarim-altin, tam-altin
 * - Energy: BRENT, WTI
 *
 * @example
 * ```typescript
 * import { FX } from 'borsajs';
 *
 * const usd = new FX('USD');
 * const current = await usd.getCurrent();
 * console.log(current.last); // Current USD/TRY rate
 *
 * const gold = new FX('gram-altin');
 * const history = await gold.getHistory({ period: '1mo' });
 * ```
 */
export class FX {
    private readonly _asset: string;
    private _currentCache: FXCurrentData | null = null;

    /**
     * Initialize an FX object.
     *
     * @param asset - Asset code (USD, EUR, gram-altin, BRENT, etc.)
     */
    constructor(asset: string) {
        this._asset = asset;
    }

    /**
     * Return the asset code.
     */
    get asset(): string {
        return this._asset;
    }

    /**
     * Return the asset code (alias for asset).
     */
    get symbol(): string {
        return this._asset;
    }

    /**
     * Get current price information.
     *
     * @returns Dictionary with current market data:
     *   - symbol: Asset code
     *   - last: Last price
     *   - open: Opening price
     *   - high: Day high
     *   - low: Day low
     *   - updateTime: Last update timestamp
     */
    async getCurrent(): Promise<FXCurrentData> {
        if (!this._currentCache) {
            const provider = getDovizcomProvider();
            this._currentCache = await provider.getCurrent(this._asset);
        }
        return this._currentCache;
    }

    /**
     * Alias for getCurrent (yfinance compatibility).
     */
    async getInfo(): Promise<FXCurrentData> {
        return this.getCurrent();
    }

    /**
     * Get historical OHLC data.
     *
     * @param options - History options
     * @param options.period - How much data to fetch. Valid periods: 1d, 5d, 1mo, 3mo, 6mo, 1y.
     * @param options.start - Start date
     * @param options.end - End date (defaults to today)
     *
     * @returns Array of OHLC data with date, open, high, low, close.
     *
     * @example
     * ```typescript
     * const fx = new FX('USD');
     * const history = await fx.getHistory({ period: '1mo' });
     * const customRange = await fx.getHistory({ start: new Date('2024-01-01'), end: new Date('2024-06-30') });
     * ```
     */
    async getHistory(options: HistoryOptions = {}): Promise<FXHistoryData[]> {
        const provider = getDovizcomProvider();
        return provider.getHistory(this._asset, options);
    }

    toString(): string {
        return `FX('${this._asset}')`;
    }
}
