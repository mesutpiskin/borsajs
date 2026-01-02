/**
 * VİOP provider for Turkish derivatives market data.
 */

import * as cheerio from 'cheerio';
import { BaseProvider, ProviderOptions } from './base.js';
import { TTL } from '../cache.js';
import { APIError } from '../exceptions.js';

export interface ContractData {
    code: string;
    contract: string;
    price: number;
    change: number;
    volumeTl: number;
    volumeQty: number;
    category: string;
}

export type ContractCategory = 'all' | 'stock' | 'index' | 'currency' | 'commodity';

/**
 * Provider for VİOP (derivatives market) data from İş Yatırım.
 */
export class ViopProvider extends BaseProvider {
    private static readonly BASE_URL = 'https://www.isyatirim.com.tr/tr-tr/analiz/Sayfalar/viop-akis.aspx';

    constructor(options?: ProviderOptions) {
        super(options);
    }

    /**
     * Get futures contracts.
     */
    async getFutures(category: ContractCategory = 'all'): Promise<ContractData[]> {
        const cacheKey = `viop:futures:${category}`;
        const cached = this.cacheGet<ContractData[]>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const response = await this.get<string>(ViopProvider.BASE_URL, {
                responseType: 'text' as const,
            });

            const html = response.data;
            const $ = cheerio.load(html);

            const contracts: ContractData[] = [];

            // Parse futures table
            $('table.dataTable tbody tr').each((_, row) => {
                const cells = $(row).find('td');
                if (cells.length < 6) return;

                const code = $(cells[0]).text().trim();
                const contract = $(cells[1]).text().trim();

                // Determine category from code
                let contractCategory = 'stock';
                if (code.includes('XU') || code.includes('XLBNK')) {
                    contractCategory = 'index';
                } else if (code.includes('USD') || code.includes('EUR')) {
                    contractCategory = 'currency';
                } else if (code.includes('GAU') || code.includes('XAU')) {
                    contractCategory = 'commodity';
                }

                // Filter by category
                if (category !== 'all' && contractCategory !== category) {
                    return;
                }

                contracts.push({
                    code,
                    contract,
                    price: this.parseNumber($(cells[2]).text()),
                    change: this.parseNumber($(cells[3]).text()),
                    volumeTl: this.parseNumber($(cells[4]).text()),
                    volumeQty: this.parseNumber($(cells[5]).text()),
                    category: contractCategory,
                });
            });

            this.cacheSet(cacheKey, contracts, TTL.VIOP);
            return contracts;
        } catch (error) {
            throw new APIError(`Failed to fetch futures: ${error}`);
        }
    }

    /**
     * Get options contracts.
     */
    async getOptions(category: 'all' | 'stock' | 'index' = 'all'): Promise<ContractData[]> {
        const cacheKey = `viop:options:${category}`;
        const cached = this.cacheGet<ContractData[]>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const response = await this.get<string>(ViopProvider.BASE_URL, {
                responseType: 'text' as const,
            });

            const html = response.data;
            const $ = cheerio.load(html);

            const contracts: ContractData[] = [];

            // Parse options table (similar structure)
            $('table.optionsTable tbody tr').each((_, row) => {
                const cells = $(row).find('td');
                if (cells.length < 6) return;

                const code = $(cells[0]).text().trim();
                const contract = $(cells[1]).text().trim();

                // Determine category from code
                let contractCategory = 'stock';
                if (code.includes('XU') || code.includes('XLBNK')) {
                    contractCategory = 'index';
                }

                // Filter by category
                if (category !== 'all' && contractCategory !== category) {
                    return;
                }

                contracts.push({
                    code,
                    contract,
                    price: this.parseNumber($(cells[2]).text()),
                    change: this.parseNumber($(cells[3]).text()),
                    volumeTl: this.parseNumber($(cells[4]).text()),
                    volumeQty: this.parseNumber($(cells[5]).text()),
                    category: contractCategory,
                });
            });

            this.cacheSet(cacheKey, contracts, TTL.VIOP);
            return contracts;
        } catch (error) {
            throw new APIError(`Failed to fetch options: ${error}`);
        }
    }

    private parseNumber(text: string): number {
        // Remove thousands separator and convert decimal separator
        const cleaned = text
            .replace(/\./g, '')
            .replace(',', '.')
            .replace(/[^\d.-]/g, '');
        return parseFloat(cleaned) || 0;
    }
}

// Singleton instance
let provider: ViopProvider | null = null;

/**
 * Get singleton provider instance.
 */
export function getViopProvider(): ViopProvider {
    if (!provider) {
        provider = new ViopProvider();
    }
    return provider;
}
