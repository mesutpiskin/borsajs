/**
 * KAP provider for company data and VIOP provider.
 */
import * as cheerio from 'cheerio';
import { BaseProvider, ProviderOptions } from './base.js';
import { TTL } from '../cache.js';
import { APIError } from '../exceptions.js';

export interface Company { ticker: string; name: string; city: string; }
export interface Disclosure { id: string; date: Date; title: string; type: string; url: string; }

export class KapProvider extends BaseProvider {
    private static readonly BASE_URL = 'https://www.kap.org.tr';
    constructor(options?: ProviderOptions) { super(options); }

    async getCompanies(): Promise<Company[]> {
        const cacheKey = 'kap:companies';
        const cached = this.cacheGet<Company[]>(cacheKey);
        if (cached) return cached;
        try {
            const response = await this.get<string>(`${KapProvider.BASE_URL}/tr/bist-sirketleri`, { responseType: 'text' as const });
            const $ = cheerio.load(response.data);
            const companies: Company[] = [];
            $('table.dataTable tbody tr').each((_, row) => {
                const cells = $(row).find('td');
                if (cells.length >= 3) companies.push({ ticker: $(cells[0]).text().trim(), name: $(cells[1]).text().trim(), city: $(cells[2]).text().trim() });
            });
            this.cacheSet(cacheKey, companies, TTL.COMPANY_LIST);
            return companies;
        } catch (error) { throw new APIError(`Failed to fetch companies: ${error}`); }
    }

    async search(query: string): Promise<Company[]> {
        const companies = await this.getCompanies();
        const q = query.toLowerCase();
        return companies.filter(c => c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
    }
}

export interface ContractData { code: string; contract: string; price: number; change: number; volumeTl: number; volumeQty: number; category: string; }

export class ViopProvider extends BaseProvider {
    private static readonly BASE_URL = 'https://www.isyatirim.com.tr/tr-tr/analiz/Sayfalar/viop-akis.aspx';
    constructor(options?: ProviderOptions) { super(options); }

    async getFutures(category: 'all' | 'stock' | 'index' | 'currency' | 'commodity' = 'all'): Promise<ContractData[]> {
        const cacheKey = `viop:futures:${category}`;
        const cached = this.cacheGet<ContractData[]>(cacheKey);
        if (cached) return cached;
        try {
            const response = await this.get<string>(ViopProvider.BASE_URL, { responseType: 'text' as const });
            const $ = cheerio.load(response.data);
            const contracts: ContractData[] = [];
            $('table.dataTable tbody tr').each((_, row) => {
                const cells = $(row).find('td');
                if (cells.length < 6) return;
                const code = $(cells[0]).text().trim();
                let cat = 'stock';
                if (code.includes('XU') || code.includes('XLBNK')) cat = 'index';
                else if (code.includes('USD') || code.includes('EUR')) cat = 'currency';
                else if (code.includes('GAU') || code.includes('XAU')) cat = 'commodity';
                if (category !== 'all' && cat !== category) return;
                const parseNum = (t: string) => parseFloat(t.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
                contracts.push({ code, contract: $(cells[1]).text().trim(), price: parseNum($(cells[2]).text()), change: parseNum($(cells[3]).text()), volumeTl: parseNum($(cells[4]).text()), volumeQty: parseNum($(cells[5]).text()), category: cat });
            });
            this.cacheSet(cacheKey, contracts, TTL.VIOP);
            return contracts;
        } catch (error) { throw new APIError(`Failed to fetch futures: ${error}`); }
    }

    async getOptions(category: 'all' | 'stock' | 'index' = 'all'): Promise<ContractData[]> {
        const cacheKey = `viop:options:${category}`;
        const cached = this.cacheGet<ContractData[]>(cacheKey);
        if (cached) return cached;
        try {
            const response = await this.get<string>(ViopProvider.BASE_URL, { responseType: 'text' as const });
            const $ = cheerio.load(response.data);
            const contracts: ContractData[] = [];
            $('table.optionsTable tbody tr').each((_, row) => {
                const cells = $(row).find('td');
                if (cells.length < 6) return;
                const code = $(cells[0]).text().trim();
                let cat = 'stock';
                if (code.includes('XU') || code.includes('XLBNK')) cat = 'index';
                if (category !== 'all' && cat !== category) return;
                const parseNum = (t: string) => parseFloat(t.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
                contracts.push({ code, contract: $(cells[1]).text().trim(), price: parseNum($(cells[2]).text()), change: parseNum($(cells[3]).text()), volumeTl: parseNum($(cells[4]).text()), volumeQty: parseNum($(cells[5]).text()), category: cat });
            });
            this.cacheSet(cacheKey, contracts, TTL.VIOP);
            return contracts;
        } catch (error) { throw new APIError(`Failed to fetch options: ${error}`); }
    }
}

let kapProvider: KapProvider | null = null;
export function getKapProvider(): KapProvider { if (!kapProvider) kapProvider = new KapProvider(); return kapProvider; }
let viopProvider: ViopProvider | null = null;
export function getViopProvider(): ViopProvider { if (!viopProvider) viopProvider = new ViopProvider(); return viopProvider; }
