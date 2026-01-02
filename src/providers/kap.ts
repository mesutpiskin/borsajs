/**
 * KAP (Public Disclosure Platform) provider for company data.
 */

import * as cheerio from 'cheerio';
import { BaseProvider, ProviderOptions } from './base.js';
import { TTL } from '../cache.js';
import { APIError } from '../exceptions.js';

export interface Company {
    ticker: string;
    name: string;
    city: string;
}

export interface Disclosure {
    id: string;
    date: Date;
    title: string;
    type: string;
    url: string;
}

/**
 * Provider for KAP data (companies, disclosures).
 */
export class KapProvider extends BaseProvider {
    private static readonly BASE_URL = 'https://www.kap.org.tr';

    constructor(options?: ProviderOptions) {
        super(options);
    }

    /**
     * Get list of all BIST companies.
     */
    async getCompanies(): Promise<Company[]> {
        const cacheKey = 'kap:companies';
        const cached = this.cacheGet<Company[]>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const url = `${KapProvider.BASE_URL}/tr/bist-sirketleri`;
            const response = await this.get<string>(url, {
                responseType: 'text' as const,
            });

            const html = response.data;
            const $ = cheerio.load(html);

            const companies: Company[] = [];

            $('table.dataTable tbody tr').each((_, row) => {
                const cells = $(row).find('td');
                if (cells.length < 3) return;

                companies.push({
                    ticker: $(cells[0]).text().trim(),
                    name: $(cells[1]).text().trim(),
                    city: $(cells[2]).text().trim(),
                });
            });

            this.cacheSet(cacheKey, companies, TTL.COMPANY_LIST);
            return companies;
        } catch (error) {
            throw new APIError(`Failed to fetch companies: ${error}`);
        }
    }

    /**
     * Search companies by name or ticker.
     */
    async search(query: string): Promise<Company[]> {
        const companies = await this.getCompanies();
        const queryLower = query.toLowerCase();

        return companies.filter(
            (c) =>
                c.ticker.toLowerCase().includes(queryLower) ||
                c.name.toLowerCase().includes(queryLower)
        );
    }

    /**
     * Get recent disclosures for a company.
     */
    async getDisclosures(symbol: string, limit: number = 20): Promise<Disclosure[]> {
        symbol = symbol.toUpperCase();
        const cacheKey = `kap:disclosures:${symbol}:${limit}`;
        const cached = this.cacheGet<Disclosure[]>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const url = `${KapProvider.BASE_URL}/tr/Bildirim/Index`;
            const response = await this.get<string>(url, {
                params: { sirketKodu: symbol },
                responseType: 'text' as const,
            });

            const html = response.data;
            const $ = cheerio.load(html);

            const disclosures: Disclosure[] = [];

            $('table.dataTable tbody tr').slice(0, limit).each((_, row) => {
                const cells = $(row).find('td');
                if (cells.length < 4) return;

                const dateStr = $(cells[0]).text().trim();
                const link = $(cells[2]).find('a');

                disclosures.push({
                    id: link.attr('data-id') ?? '',
                    date: this.parseDate(dateStr),
                    title: link.text().trim(),
                    type: $(cells[1]).text().trim(),
                    url: KapProvider.BASE_URL + (link.attr('href') ?? ''),
                });
            });

            this.cacheSet(cacheKey, disclosures, TTL.REALTIME_PRICE);
            return disclosures;
        } catch (error) {
            throw new APIError(`Failed to fetch disclosures for ${symbol}: ${error}`);
        }
    }

    private parseDate(dateStr: string): Date {
        // Format: DD.MM.YYYY HH:mm
        const match = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
        if (!match) return new Date();

        const [, day, month, year, hour = '0', minute = '0'] = match;
        return new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(minute)
        );
    }
}

// Singleton instance
let provider: KapProvider | null = null;

/**
 * Get singleton provider instance.
 */
export function getKapProvider(): KapProvider {
    if (!provider) {
        provider = new KapProvider();
    }
    return provider;
}
