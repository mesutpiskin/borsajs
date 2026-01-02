/**
 * Market-level functions for BIST data.
 */

import { getKapProvider, Company } from './providers/kap.js';

/**
 * Get list of all BIST companies.
 *
 * @returns Array of companies with ticker, name, and city.
 *
 * @example
 * ```typescript
 * import { companies } from 'borsajs';
 *
 * const allCompanies = await companies();
 * console.log(allCompanies);
 * // [
 * //   { ticker: 'ACSEL', name: 'ACIPAYAM SELULOZ SANAYI A.S.', city: 'DENIZLI' },
 * //   { ticker: 'ADEL', name: 'ADEL KALEMCILIK A.S.', city: 'ISTANBUL' },
 * //   ...
 * // ]
 * ```
 */
export async function companies(): Promise<Company[]> {
    const provider = getKapProvider();
    return provider.getCompanies();
}

/**
 * Search BIST companies by name or ticker.
 *
 * @param query - Search query (ticker code or company name)
 * @returns Array of matching companies, sorted by relevance.
 *
 * @example
 * ```typescript
 * import { searchCompanies } from 'borsajs';
 *
 * const result = await searchCompanies('THYAO');
 * console.log(result);
 * // [{ ticker: 'THYAO', name: 'TURK HAVA YOLLARI A.O.', city: 'ISTANBUL' }]
 *
 * const banks = await searchCompanies('banka');
 * console.log(banks);
 * // [
 * //   { ticker: 'GARAN', name: 'TURKIYE GARANTI BANKASI A.S.', city: 'ISTANBUL' },
 * //   { ticker: 'AKBNK', name: 'AKBANK T.A.S.', city: 'ISTANBUL' },
 * //   ...
 * // ]
 * ```
 */
export async function searchCompanies(query: string): Promise<Company[]> {
    const provider = getKapProvider();
    return provider.search(query);
}
