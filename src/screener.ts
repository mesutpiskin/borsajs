/**
 * Stock Screener for BIST - yfinance-like API.
 */
import { getScreenerProvider, type ScreenerResult, type SectorInfo, type StockIndexInfo, IsyatirimScreenerProvider } from './providers/isyatirim.js';

export type { ScreenerResult, SectorInfo, StockIndexInfo };

type CriteriaTuple = [string, string, string, string];

// Default min/max values for criteria when only one bound is specified
const CRITERIA_DEFAULTS: Record<string, { min: number; max: number }> = {
    'price': { min: 0, max: 100000 },
    'market_cap': { min: 0, max: 5000000 },
    'market_cap_usd': { min: 0, max: 100000 },
    'pe': { min: -1000, max: 10000 },
    'pb': { min: -100, max: 1000 },
    'ev_ebitda': { min: -100, max: 1000 },
    'ev_sales': { min: -100, max: 1000 },
    'dividend_yield': { min: 0, max: 100 },
    'dividend_yield_2025': { min: 0, max: 100 },
    'roe': { min: -200, max: 500 },
    'roa': { min: -200, max: 500 },
    'net_margin': { min: -200, max: 500 },
    'ebitda_margin': { min: -200, max: 500 },
    'upside_potential': { min: -100, max: 500 },
    'foreign_ratio': { min: 0, max: 100 },
    'float_ratio': { min: 0, max: 100 },
    'return_1w': { min: -100, max: 100 },
    'return_1m': { min: -100, max: 200 },
    'return_1y': { min: -100, max: 1000 },
    'return_ytd': { min: -100, max: 1000 },
    'volume_3m': { min: 0, max: 1000 },
};

export class Screener {
    /**
     * Available templates for quick screening.
     */
    static readonly TEMPLATES = [
        'small_cap', 'mid_cap', 'large_cap',
        'high_dividend', 'high_upside', 'low_upside',
        'high_volume', 'low_volume',
        'buy_recommendation', 'sell_recommendation',
        'high_net_margin', 'high_return', 'low_pe', 'high_roe',
        'high_foreign_ownership',
    ];

    private provider = getScreenerProvider();
    private filters: CriteriaTuple[] = [];
    private sectorFilter: string | null = null;
    private indexFilter: string | null = null;
    private recommendationFilter: string | null = null;

    /**
     * Add a filter criterion.
     * 
     * @param criteria - Criteria name (market_cap, pe, dividend_yield, etc.)
     * @param options - Filter options
     * @returns This screener instance for method chaining
     * 
     * @example
     * ```typescript
     * const screener = new Screener();
     * screener.addFilter('market_cap', { min: 1000 });
     * screener.addFilter('pe', { max: 15 });
     * ```
     */
    addFilter(criteria: string, options: {
        min?: number;
        max?: number;
        required?: boolean;
    } = {}): this {
        const { min, max, required = false } = options;

        // Map criteria name to ID
        const criteriaId = IsyatirimScreenerProvider.CRITERIA_MAP[criteria.toLowerCase()] || criteria;

        // Get default bounds for this criteria
        const defaults = CRITERIA_DEFAULTS[criteria.toLowerCase()] || { min: -999999, max: 999999 };

        // API requires both min and max - use defaults when only one is provided
        let minVal = min;
        let maxVal = max;

        if (minVal === undefined && maxVal !== undefined) {
            minVal = defaults.min;
        } else if (maxVal === undefined && minVal !== undefined) {
            maxVal = defaults.max;
        }

        const minStr = minVal !== undefined ? String(minVal) : '';
        const maxStr = maxVal !== undefined ? String(maxVal) : '';
        const requiredStr = required ? 'True' : 'False';

        this.filters.push([criteriaId, minStr, maxStr, requiredStr]);
        return this;
    }

    /**
     * Set sector filter.
     * 
     * @param sector - Sector name (e.g., "Bankacılık") or ID
     * @returns This screener instance for method chaining
     */
    setSector(sector: string): this {
        this.sectorFilter = sector;
        return this;
    }

    /**
     * Set index filter.
     * 
     * @param index - Index name (e.g., "BIST 30", "BIST 100")
     * @returns This screener instance for method chaining
     */
    setIndex(index: string): this {
        this.indexFilter = index;
        return this;
    }

    /**
     * Set recommendation filter.
     * 
     * @param recommendation - Recommendation type ("AL", "SAT", "TUT")
     * @returns This screener instance for method chaining
     */
    setRecommendation(recommendation: string): this {
        this.recommendationFilter = recommendation.toUpperCase();
        return this;
    }

    /**
     * Clear all filters.
     * 
     * @returns This screener instance for method chaining
     */
    clear(): this {
        this.filters = [];
        this.sectorFilter = null;
        this.indexFilter = null;
        this.recommendationFilter = null;
        return this;
    }

    /**
     * Run the screener and return results.
     * 
     * @param template - Optional pre-defined template to use
     * @returns Array of matching stocks
     */
    async run(template?: string): Promise<ScreenerResult[]> {
        return this.provider.screen(
            this.filters.length > 0 ? this.filters : undefined,
            this.sectorFilter || undefined,
            this.indexFilter || undefined,
            this.recommendationFilter || undefined,
            template
        );
    }
}

/**
 * Screen BIST stocks based on criteria (convenience function).
 * 
 * @param options - Screening options
 * @returns Array of matching stocks
 * 
 * @example
 * ```typescript
 * import { screenStocks } from 'borsajs';
 * 
 * // Using template
 * const highDivStocks = await screenStocks({ template: 'high_dividend' });
 * 
 * // Custom filters
 * const stocks = await screenStocks({ 
 *   marketCapMin: 1000, 
 *   peMax: 15 
 * });
 * ```
 */
export async function screenStocks(options: {
    template?: string;
    sector?: string;
    index?: string;
    recommendation?: string;
    marketCapMin?: number;
    marketCapMax?: number;
    peMin?: number;
    peMax?: number;
    pbMin?: number;
    pbMax?: number;
    dividendYieldMin?: number;
    dividendYieldMax?: number;
    upsidePotentialMin?: number;
    upsidePotentialMax?: number;
    netMarginMin?: number;
    netMarginMax?: number;
    roeMin?: number;
    roeMax?: number;
} = {}): Promise<ScreenerResult[]> {
    const {
        template, sector, index, recommendation,
        marketCapMin, marketCapMax,
        peMin, peMax,
        pbMin, pbMax,
        dividendYieldMin, dividendYieldMax,
        upsidePotentialMin, upsidePotentialMax,
        netMarginMin, netMarginMax,
        roeMin, roeMax,
    } = options;

    const screener = new Screener();

    // Set sector/index/recommendation
    if (sector) screener.setSector(sector);
    if (index) screener.setIndex(index);
    if (recommendation) screener.setRecommendation(recommendation);

    // Add filters
    if (marketCapMin !== undefined || marketCapMax !== undefined) {
        screener.addFilter('market_cap', { min: marketCapMin, max: marketCapMax });
    }

    if (peMin !== undefined || peMax !== undefined) {
        screener.addFilter('pe', { min: peMin, max: peMax });
    }

    if (pbMin !== undefined || pbMax !== undefined) {
        screener.addFilter('pb', { min: pbMin, max: pbMax });
    }

    if (dividendYieldMin !== undefined || dividendYieldMax !== undefined) {
        screener.addFilter('dividend_yield', { min: dividendYieldMin, max: dividendYieldMax });
    }

    if (upsidePotentialMin !== undefined || upsidePotentialMax !== undefined) {
        screener.addFilter('upside_potential', { min: upsidePotentialMin, max: upsidePotentialMax });
    }

    if (netMarginMin !== undefined || netMarginMax !== undefined) {
        screener.addFilter('net_margin', { min: netMarginMin, max: netMarginMax });
    }

    if (roeMin !== undefined || roeMax !== undefined) {
        screener.addFilter('roe', { min: roeMin, max: roeMax });
    }

    return screener.run(template);
}

/**
 * Get list of available sectors for screening.
 * 
 * @returns Array of sector names
 * 
 * @example
 * ```typescript
 * import { sectors } from 'borsajs';
 * const sectorList = await sectors();
 * ```
 */
export async function sectors(): Promise<string[]> {
    const provider = getScreenerProvider();
    const data = await provider.getSectors();
    return data.map(s => s.name);
}

/**
 * Get list of available indices for screening.
 * 
 * @returns Array of index names
 * 
 * @example
 * ```typescript
 * import { stockIndices } from 'borsajs';
 * const indices = await stockIndices();
 * ```
 */
export async function stockIndices(): Promise<string[]> {
    const provider = getScreenerProvider();
    const data = await provider.getIndices();
    return data.map(i => i.name);
}
