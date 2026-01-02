/**
 * Fund class for mutual fund data - yfinance-like API.
 */

import { getTefasProvider, FundInfo, FundHistoryData, HistoryOptions, SearchResult } from './providers/tefas.js';

/**
 * Performance metrics for a fund.
 */
export interface FundPerformance {
    dailyReturn?: number;
    return1m?: number;
    return3m?: number;
    return6m?: number;
    returnYtd?: number;
    return1y?: number;
    return3y?: number;
    return5y?: number;
}

/**
 * A yfinance-like interface for mutual fund data from TEFAS.
 *
 * @example
 * ```typescript
 * import { Fund } from 'borsajs';
 *
 * const fund = new Fund('AAK');
 * const info = await fund.getInfo();
 * console.log(info.name); // Fund name
 * console.log(info.price); // Current price
 *
 * const performance = await fund.getPerformance();
 * console.log(performance.return1y); // 1 year return
 * ```
 */
export class Fund {
    private readonly _fundCode: string;
    private _infoCache: FundInfo | null = null;

    /**
     * Initialize a Fund object.
     *
     * @param fundCode - TEFAS fund code (e.g., "AAK", "TTE", "YAF")
     */
    constructor(fundCode: string) {
        this._fundCode = fundCode.toUpperCase();
    }

    /**
     * Return the fund code.
     */
    get fundCode(): string {
        return this._fundCode;
    }

    /**
     * Return the fund code (alias).
     */
    get symbol(): string {
        return this._fundCode;
    }

    /**
     * Get detailed fund information.
     *
     * @returns Dictionary with fund details including price, size, returns, etc.
     */
    async getInfo(): Promise<FundInfo> {
        if (!this._infoCache) {
            const provider = getTefasProvider();
            this._infoCache = await provider.getFundDetail(this._fundCode);
        }
        return this._infoCache;
    }

    /**
     * Alias for getInfo.
     */
    async getDetail(): Promise<FundInfo> {
        return this.getInfo();
    }

    /**
     * Get fund performance metrics only.
     *
     * @returns Dictionary with performance data (returns for various periods).
     */
    async getPerformance(): Promise<FundPerformance> {
        const info = await this.getInfo();
        return {
            dailyReturn: info.dailyReturn,
            return1m: info.return1m,
            return3m: info.return3m,
            return6m: info.return6m,
            returnYtd: info.returnYtd,
            return1y: info.return1y,
            return3y: info.return3y,
            return5y: info.return5y,
        };
    }

    /**
     * Get historical price data.
     *
     * @param options - History options
     * @param options.period - How much data to fetch. Valid periods: 1d, 5d, 1mo, 3mo, 6mo, 1y.
     * @param options.start - Start date
     * @param options.end - End date (defaults to now)
     *
     * @returns Array of historical data with date, price, fundSize, investors.
     */
    async getHistory(options: HistoryOptions = {}): Promise<FundHistoryData[]> {
        const provider = getTefasProvider();
        return provider.getHistory(this._fundCode, options);
    }

    toString(): string {
        return `Fund('${this._fundCode}')`;
    }
}

/**
 * Search for funds by name or code.
 *
 * @param query - Search query (fund code or name)
 * @param limit - Maximum number of results (default: 20)
 * @returns List of matching funds with fund_code, name, fund_type, return_1y.
 *
 * @example
 * ```typescript
 * import { searchFunds } from 'borsajs';
 *
 * const results = await searchFunds('ak portföy');
 * console.log(results);
 *
 * const byCode = await searchFunds('TTE');
 * console.log(byCode);
 * ```
 */
export async function searchFunds(query: string, limit: number = 20): Promise<SearchResult[]> {
    const provider = getTefasProvider();
    return provider.search(query, limit);
}
