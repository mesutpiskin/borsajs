/**
 * Index class for market index data - yfinance-like API.
 */

import { getParaticProvider, QuoteData, OHLCVData, HistoryOptions } from './providers/paratic.js';

/**
 * Known market indices with their names.
 */
export const INDICES: Record<string, string> = {
    'XU100': 'BIST 100',
    'XU050': 'BIST 50',
    'XU030': 'BIST 30',
    'XBANK': 'BIST Banka',
    'XUSIN': 'BIST Sınai',
    'XHOLD': 'BIST Holding ve Yatırım',
    'XUTEK': 'BIST Teknoloji',
    'XGIDA': 'BIST Gıda',
    'XTRZM': 'BIST Turizm',
    'XULAS': 'BIST Ulaştırma',
    'XSGRT': 'BIST Sigorta',
    'XMANA': 'BIST Metal Ana',
    'XKMYA': 'BIST Kimya',
    'XMADN': 'BIST Maden',
    'XELKT': 'BIST Elektrik',
    'XTEKS': 'BIST Tekstil',
    'XILTM': 'BIST İletişim',
    'XUMAL': 'BIST Mali',
    'XUTUM': 'BIST Tüm',
};

/**
 * Index information with name.
 */
export interface IndexInfo extends QuoteData {
    name: string;
    type: 'index';
}

/**
 * A yfinance-like interface for Turkish market indices.
 *
 * @example
 * ```typescript
 * import { Index, indices } from 'borsajs';
 *
 * // List all indices
 * const allIndices = indices();
 * console.log(allIndices); // ['XU100', 'XU050', ...]
 *
 * // Get index data
 * const xu100 = new Index('XU100');
 * const info = await xu100.getInfo();
 * console.log(info.last); // Current value
 *
 * const history = await xu100.getHistory({ period: '1mo' });
 * ```
 */
export class Index {
    private readonly _symbol: string;
    private _infoCache: IndexInfo | null = null;

    /**
     * Initialize an Index object.
     *
     * @param symbol - Index symbol (e.g., "XU100", "XU030", "XBANK").
     */
    constructor(symbol: string) {
        this._symbol = symbol.toUpperCase();
    }

    /**
     * Return the index symbol.
     */
    get symbol(): string {
        return this._symbol;
    }

    /**
     * Get current index information.
     *
     * @returns Dictionary with index data including current value, change, etc.
     */
    async getInfo(): Promise<IndexInfo> {
        if (!this._infoCache) {
            const provider = getParaticProvider();
            const quote = await provider.getQuote(this._symbol);
            this._infoCache = {
                ...quote,
                name: INDICES[this._symbol] ?? this._symbol,
                type: 'index',
            };
        }
        return this._infoCache;
    }

    /**
     * Get historical index data.
     *
     * @param options - History options
     * @param options.period - Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, ytd, max)
     * @param options.interval - Data interval (1m, 5m, 15m, 30m, 1h, 1d, 1wk, 1mo)
     * @param options.start - Start date
     * @param options.end - End date (defaults to today)
     *
     * @returns Array of OHLCV data.
     */
    async getHistory(options: HistoryOptions = {}): Promise<OHLCVData[]> {
        const provider = getParaticProvider();
        return provider.getHistory(this._symbol, options);
    }

    toString(): string {
        return `Index('${this._symbol}')`;
    }
}

/**
 * Get list of available market indices.
 *
 * @returns List of index symbols.
 *
 * @example
 * ```typescript
 * import { indices } from 'borsajs';
 *
 * const allIndices = indices();
 * console.log(allIndices); // ['XU100', 'XU050', 'XU030', ...]
 * ```
 */
export function indices(): string[] {
    return Object.keys(INDICES);
}

/**
 * Get an Index object for the given symbol.
 *
 * This is a convenience function that creates an Index object.
 *
 * @param symbol - Index symbol (e.g., "XU100", "XBANK").
 * @returns Index object.
 */
export function index(symbol: string): Index {
    return new Index(symbol);
}
