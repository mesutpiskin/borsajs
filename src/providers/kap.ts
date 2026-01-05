/**
 * KAP provider for company data and VIOP provider.
 */
import * as cheerio from 'cheerio';
import { BaseProvider, ProviderOptions } from './base.js';
import { TTL } from '../cache.js';
import { APIError } from '../exceptions.js';

export interface Company { ticker: string; name: string; city: string; }
export interface Disclosure { date: string; title: string; disclosureIndex: number; url: string; }
export interface CalendarEvent { startDate: string; endDate: string; subject: string; period: string; year: string; }
export interface CompanyDetails { sector?: string; market?: string; website?: string; }

export class KapProvider extends BaseProvider {
    private static readonly BASE_URL = 'https://www.kap.org.tr';
    private static readonly DISCLOSURE_URL = 'https://www.kap.org.tr/tr/bildirim-sorgu-sonuc';
    private static readonly CALENDAR_API_URL = 'https://kap.org.tr/tr/api/expected-disclosure-inquiry/company';
    private static readonly COMPANY_INFO_URL = 'https://kap.org.tr/tr/sirket-bilgileri/ozet';
    private oidMap: Map<string, string> | null = null;
    private oidCacheTime: number = 0;
    private readonly CACHE_DURATION = 86400000; // 24 hours in ms

    constructor(options?: ProviderOptions) { super(options); }

    async getCompanies(): Promise<Company[]> {
        const cacheKey = 'kap:companies';
        const cached = this.cacheGet<Company[]>(cacheKey);
        if (cached) return cached;
        try {
            const response = await this.get<string>(`${KapProvider.BASE_URL}/tr/bist-sirketler`, { responseType: 'text' as const });

            // Parse from Next.js embedded JSON data
            // Pattern: \\"mkkMemberOid\\":\\"xxx\\",\\"kapMemberTitle\\":\\"...\\",\\"relatedMemberTitle\\":\\"...\\",\\"stockCode\\":\\"TICKER\\"
            const pattern = /\\"mkkMemberOid\\":\\"([^\\]+)\\",\\"kapMemberTitle\\":\\"([^\\]+)\\",\\"relatedMemberTitle\\":\\"[^\\]*\\",\\"stockCode\\":\\"([^\\]+)\\"/g;

            const companies: Company[] = [];
            const matches = response.data.matchAll(pattern);

            for (const match of matches) {
                const name = match[2];
                const stockCodes = match[3];

                // Handle multiple tickers (e.g., "GARAN, TGB")
                if (stockCodes.includes(',')) {
                    const tickers = stockCodes.split(',').map(t => t.trim());
                    for (const ticker of tickers) {
                        if (ticker) {
                            companies.push({ ticker, name, city: '' });
                        }
                    }
                } else {
                    companies.push({ ticker: stockCodes, name, city: '' });
                }
            }

            this.cacheSet(cacheKey, companies, TTL.COMPANY_LIST);
            return companies;
        } catch (error) { throw new APIError(`Failed to fetch companies: ${error}`); }
    }

    async search(query: string): Promise<Company[]> {
        const companies = await this.getCompanies();
        const q = query.toLowerCase();
        return companies.filter(c => c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
    }

    async getMemberOid(symbol: string): Promise<string | null> {
        symbol = symbol.toUpperCase().replace('.IS', '').replace('.E', '');
        const currentTime = Date.now();

        // Check cache
        if (this.oidMap && (currentTime - this.oidCacheTime) < this.CACHE_DURATION) {
            return this.oidMap.get(symbol) || null;
        }

        // Fetch BIST companies list from KAP
        try {
            const response = await this.get<string>(`${KapProvider.BASE_URL}/tr/bist-sirketler`, { responseType: 'text' as const });

            // Parse mkkMemberOid and stockCode pairs from Next.js data
            const pattern = /\\"mkkMemberOid\\":\\"([^\\]+)\\",[^}]*\\"stockCode\\":\\"([^\\]+)\\"/g;
            const matches = response.data.matchAll(pattern);

            // Build mapping: stockCode -> mkkMemberOid
            this.oidMap = new Map();
            for (const match of matches) {
                const oid = match[1];
                const codesStr = match[2];

                // Handle multiple codes per company (e.g., "GARAN, TGB")
                for (const code of codesStr.split(',')) {
                    const trimmedCode = code.trim();
                    if (trimmedCode) {
                        this.oidMap.set(trimmedCode, oid);
                    }
                }
            }

            this.oidCacheTime = currentTime;
            return this.oidMap.get(symbol) || null;
        } catch (error) {
            return null;
        }
    }

    async getDisclosures(symbol: string, limit: number = 20): Promise<Disclosure[]> {
        symbol = symbol.toUpperCase().replace('.IS', '').replace('.E', '');

        // Get KAP member OID for the symbol
        const memberOid = await this.getMemberOid(symbol);
        if (!memberOid) {
            return [];
        }

        // Fetch disclosures from KAP
        const discUrl = `${KapProvider.DISCLOSURE_URL}?member=${memberOid}`;

        try {
            const response = await this.get<string>(discUrl, { responseType: 'text' as const });

            // Parse disclosures from Next.js embedded data
            // Pattern: publishDate\":\"29.12.2025 19:21:18\",\"disclosureIndex\":1530826...title\":\"...\"
            const pattern = /publishDate\\":\\"([^\\]+)\\".*?disclosureIndex\\":(\d+).*?title\\":\\"([^\\]+)\\"/gs;
            const matches = Array.from(response.data.matchAll(pattern));

            const disclosures: Disclosure[] = [];
            for (let i = 0; i < Math.min(matches.length, limit); i++) {
                const match = matches[i];
                const date = match[1];
                const idx = parseInt(match[2]);
                const title = match[3];

                disclosures.push({
                    date,
                    title,
                    disclosureIndex: idx,
                    url: `https://www.kap.org.tr/tr/Bildirim/${idx}`
                });
            }

            return disclosures;
        } catch (error) {
            throw new APIError(`Failed to fetch disclosures for ${symbol}: ${error}`);
        }
    }

    async getCalendar(symbol: string): Promise<CalendarEvent[]> {
        symbol = symbol.toUpperCase().replace('.IS', '').replace('.E', '');

        // Get KAP member OID for the symbol
        const memberOid = await this.getMemberOid(symbol);
        if (!memberOid) {
            return [];
        }

        // Calculate date range: today to 6 months from now
        const now = new Date();
        const startDate = now.toISOString().split('T')[0];
        const endDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Fetch expected disclosures from KAP API
        const headers = {
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Origin': 'https://kap.org.tr',
            'Referer': 'https://kap.org.tr/tr/beklenen-bildirim-sorgu'
        };

        const payload = {
            startDate,
            endDate,
            memberTypes: ['IGS'],
            mkkMemberOidList: [memberOid],
            disclosureClass: '',
            subjects: [],
            mainSector: '',
            sector: '',
            subSector: '',
            market: '',
            index: '',
            year: '',
            term: '',
            ruleType: ''
        };

        try {
            const response = await this.post<any[]>(KapProvider.CALENDAR_API_URL, payload, { headers });

            const events: CalendarEvent[] = [];
            for (const item of response.data) {
                events.push({
                    startDate: item.startDate || '',
                    endDate: item.endDate || '',
                    subject: item.subject || '',
                    period: item.ruleTypeTerm || '',
                    year: item.year || ''
                });
            }

            return events;
        } catch (error) {
            throw new APIError(`Failed to fetch calendar for ${symbol}: ${error}`);
        }
    }

    async getCompanyDetails(symbol: string): Promise<CompanyDetails> {
        symbol = symbol.toUpperCase().replace('.IS', '').replace('.E', '');

        // Get KAP member OID for the symbol
        const memberOid = await this.getMemberOid(symbol);
        if (!memberOid) {
            return {};
        }

        // Fetch company info page
        const url = `${KapProvider.COMPANY_INFO_URL}/${memberOid}`;

        try {
            const response = await this.get<string>(url, { responseType: 'text' as const });
            const html = response.data;

            const result: CompanyDetails = {};

            // Extract sector: href="/tr/Sektorler?sector=...">SECTOR_NAME</a>
            const sectorMatch = html.match(/href="\/tr\/Sektorler\?sector=[^"]*">([^<]+)<\/a>/);
            if (sectorMatch) {
                result.sector = sectorMatch[1].trim();
            }

            // Extract market: href="/tr/Pazarlar?market=...">MARKET_NAME</a>
            const marketMatch = html.match(/href="\/tr\/Pazarlar\?market=[^"]*">([^<]+)<\/a>/);
            if (marketMatch) {
                result.market = marketMatch[1].trim();
            }

            // Extract website: after "İnternet Adresi" label
            const websiteMatch = html.match(/İnternet Adresi<\/h3><p[^>]*>([^<]+)<\/p>/);
            if (websiteMatch) {
                result.website = websiteMatch[1].trim();
            }

            return result;
        } catch (error) {
            return {};
        }
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
