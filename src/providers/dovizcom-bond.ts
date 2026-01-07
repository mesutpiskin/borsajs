/**
 * doviz.com Bond/Tahvil provider for borsajs.
 */
import * as cheerio from 'cheerio';
import { BaseProvider, ProviderOptions } from './base.js';
import { TTL } from '../cache.js';
import { APIError, DataNotAvailableError } from '../exceptions.js';

export interface BondData {
    name: string;
    maturity: '2Y' | '5Y' | '10Y';
    yield: number;
    yieldDecimal: number;
    change: number | null;
    changePct: number | null;
    url?: string;
}

export class DovizcomBondProvider extends BaseProvider {
    private static readonly BASE_URL = 'https://www.doviz.com/tahvil';

    // Maturity mapping
    private static readonly MATURITY_MAP: Record<string, string[]> = {
        '2Y': ['2 Yıllık', '2 yıllık', '2-yillik'],
        '5Y': ['5 Yıllık', '5 yıllık', '5-yillik'],
        '10Y': ['10 Yıllık', '10 yıllık', '10-yillik'],
    };

    constructor(options?: ProviderOptions) {
        super(options);
    }

    private parseFloat(text: string): number | null {
        try {
            const cleaned = text.trim().replace(',', '.').replace('%', '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? null : parsed;
        } catch {
            return null;
        }
    }

    private getMaturity(name: string): '2Y' | '5Y' | '10Y' | null {
        for (const [maturity, patterns] of Object.entries(DovizcomBondProvider.MATURITY_MAP)) {
            if (patterns.some(p => name.includes(p))) {
                return maturity as '2Y' | '5Y' | '10Y';
            }
        }
        return null;
    }

    async getBondYields(): Promise<BondData[]> {
        const cacheKey = 'dovizcom:tahvil:all';
        const cached = this.cacheGet<BondData[]>(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.get<string>(DovizcomBondProvider.BASE_URL, {
                responseType: 'text',
            });

            const $ = cheerio.load(response.data);
            const bonds: BondData[] = [];

            // Find the commodities table
            const table = $('#commodities');
            if (table.length === 0) {
                throw new DataNotAvailableError('Bond table not found on page');
            }

            const tbody = table.find('tbody');
            if (tbody.length === 0) {
                throw new DataNotAvailableError('Bond data not found');
            }

            tbody.find('tr').each((_, row) => {
                try {
                    const cells = $(row).find('td');
                    if (cells.length < 3) return;

                    // Parse bond name and URL
                    const nameLink = $(cells[0]).find('a.name');
                    if (nameLink.length === 0) return;

                    const name = nameLink.text().trim();
                    const url = nameLink.attr('href') || '';

                    // Parse current yield
                    const yieldText = $(cells[1]).text().trim();
                    const yieldRate = this.parseFloat(yieldText);

                    // Parse change percentage
                    const changeText = $(cells[2]).text().trim();
                    const changePct = this.parseFloat(changeText);

                    // Get maturity
                    const maturity = this.getMaturity(name);

                    if (maturity && yieldRate !== null) {
                        const change = (yieldRate && changePct)
                            ? yieldRate * (changePct / 100)
                            : null;

                        bonds.push({
                            name,
                            maturity,
                            yield: yieldRate,
                            yieldDecimal: yieldRate / 100,
                            change,
                            changePct,
                            url,
                        });
                    }
                } catch {
                    // Skip malformed rows
                }
            });

            if (bonds.length === 0) {
                throw new DataNotAvailableError('No bond data found');
            }

            this.cacheSet(cacheKey, bonds, TTL.FX_RATES);
            return bonds;
        } catch (error) {
            if (error instanceof DataNotAvailableError || error instanceof APIError) {
                throw error;
            }
            throw new APIError(`Failed to fetch bond yields: ${error}`);
        }
    }

    async getBond(maturity: '2Y' | '5Y' | '10Y'): Promise<BondData> {
        const bonds = await this.getBondYields();
        const bond = bonds.find(b => b.maturity === maturity);

        if (!bond) {
            throw new DataNotAvailableError(`Bond with maturity ${maturity} not found`);
        }

        return bond;
    }

    async get10YYield(): Promise<number | null> {
        try {
            const bond = await this.getBond('10Y');
            return bond.yieldDecimal;
        } catch {
            return null;
        }
    }
}

let provider: DovizcomBondProvider | null = null;
export function getBondProvider(): DovizcomBondProvider {
    if (!provider) provider = new DovizcomBondProvider();
    return provider;
}
