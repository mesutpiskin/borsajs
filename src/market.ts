/**
 * Market-level functions for BIST data.
 */
import { getBtcTurkProvider } from './providers/btcturk.js';

// Static list of major BIST stocks (commonly traded)
const BIST_STOCKS = [
    'THYAO', 'GARAN', 'AKBNK', 'YKBNK', 'ISCTR', 'HALKB', 'VAKBN', 'SAHOL', 'SISE', 'TUPRS',
    'TCELL', 'EREGL', 'BIMAS', 'KOZAL', 'PETKM', 'ASELS', 'KCHOL', 'TOASO', 'FROTO', 'ARCLK',
    'MGROS', 'TTKOM', 'ENKAI', 'PGSUS', 'TAVHL', 'EKGYO', 'SASA', 'DOHOL', 'VESTL', 'GUBRF',
    'KOZAA', 'KLMSC', 'KRDMD', 'ODAS', 'TSKB', 'AKSEN', 'AEFES', 'KONTR', 'CEMTS', 'LOGO',
    'OYAKC', 'ULKER', 'CIMSA', 'ALARK', 'TURSG', 'ISGYO', 'GESAN', 'SOKM', 'DOAS', 'OTKAR',
    'BTCIM', 'BRISA', 'NETAS', 'IHLGM', 'TKFEN', 'TRGYO', 'AYGAZ', 'CCOLA', 'MAVI', 'HEKTS',
    'ANSGR', 'ZOREN', 'AGHOL', 'ISMEN', 'ANHYT', 'IPEKE', 'KORDS', 'KARTN', 'KLRHO', 'BINHO',
    'AKSA', 'NUHCM', 'ALBRK', 'SKBNK', 'TMSN', 'VERUS', 'SISEB', 'POLHO', 'GLYHO', 'TUREX',
] as const;

export interface Company {
    ticker: string;
    name?: string;
    sector?: string;
}

/**
 * Get common BIST stock symbols.
 * @returns Array of stock symbols
 */
export function symbols(): string[] {
    return [...BIST_STOCKS].sort();
}

/**
 * Search stocks by ticker pattern.
 * @param query - Search query (matches start of ticker)
 * @returns Matching symbols
 */
export function searchSymbols(query: string): string[] {
    const q = query.toUpperCase();
    return BIST_STOCKS.filter(s => s.includes(q));
}

/**
 * Get available cryptocurrency pairs.
 * @param quote - Quote currency (default: 'TRY')
 * @returns Array of trading pairs (e.g., ['BTCTRY', 'ETHTRY', ...])
 */
export async function cryptoSymbols(quote: string = 'TRY'): Promise<string[]> {
    return getBtcTurkProvider().getPairs(quote);
}

/**
 * Available FX symbols.
 */
export const fxSymbols = [
    // Currencies
    'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD',
    // Precious Metals
    'gram-altin', 'ceyrek-altin', 'yarim-altin', 'tam-altin', 'cumhuriyet-altini',
    'gumus', 'ons',
    // Energy
    'BRENT', 'WTI',
    // Fuel
    'diesel', 'gasoline', 'lpg',
] as const;

/**
 * Available BIST indices.
 */
export const indexSymbols = [
    'XU100', 'XU050', 'XU030', 'XBANK', 'XUSIN', 'XHOLD', 'XUTEK', 'XGIDA',
    'XTRZM', 'XULAS', 'XSGRT', 'XMANA', 'XKMYA', 'XMADN', 'XELKT', 'XTEKS',
    'XILTM', 'XUMAL', 'XUTUM',
] as const;

export type FXSymbol = typeof fxSymbols[number];
export type IndexSymbol = typeof indexSymbols[number];
export type StockSymbol = typeof BIST_STOCKS[number];
