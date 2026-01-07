/**
 * İş Yatırım Stock Screener provider for borsajs.
 */
import * as cheerio from 'cheerio';
import { BaseProvider, ProviderOptions } from './base.js';
import { TTL } from '../cache.js';
import { APIError } from '../exceptions.js';

export interface ScreenerResult {
    symbol: string;
    name: string;
    [key: string]: string | number;
}

export interface SectorInfo {
    id: string;
    name: string;
}

export interface StockIndexInfo {
    id: string;
    name: string;
}

export interface CriteriaInfo {
    id: string;
    name: string;
    min: string;
    max: string;
}

type CriteriaTuple = [string, string, string, string]; // [id, min, max, required]

export class IsyatirimScreenerProvider extends BaseProvider {
    private static readonly BASE_URL = 'https://www.isyatirim.com.tr';
    private static readonly PAGE_URL = `${IsyatirimScreenerProvider.BASE_URL}/tr-tr/analiz/hisse/Sayfalar/gelismis-hisse-arama.aspx`;
    private static readonly SCREENER_URL = `${IsyatirimScreenerProvider.BASE_URL}/tr-tr/analiz/_Layouts/15/IsYatirim.Website/StockInfo/CompanyInfoAjax.aspx/getScreenerDataNEW`;

    // Criteria ID mapping (from Python implementation)
    static readonly CRITERIA_MAP: Record<string, string> = {
        // Price & Market Cap
        'price': '7',
        'market_cap': '8',
        'market_cap_usd': '9',
        'float_ratio': '11',
        'float_market_cap': '12',
        // Valuation
        'pe': '28',
        'pb': '30',
        'ev_ebitda': '29',
        'ev_sales': '31',
        'pe_2025': '135',
        'pb_2025': '138',
        'ev_ebitda_2025': '141',
        // Dividends
        'dividend_yield': '33',
        'dividend_yield_2025': '36',
        'dividend_yield_5y_avg': '38',
        // Profitability
        'roe': '422',
        'roa': '423',
        'net_margin': '119',
        'ebitda_margin': '120',
        'roe_2025': '225',
        'roa_2025': '247',
        // Returns - Relative
        'return_1d': '21',
        'return_1w': '22',
        'return_1m': '23',
        'return_1y': '24',
        'return_ytd': '25',
        // Returns - TL
        'return_1d_tl': '16',
        'return_1w_tl': '17',
        'return_1m_tl': '18',
        'return_1y_tl': '19',
        'return_ytd_tl': '20',
        // Volume
        'volume_3m': '26',
        'volume_12m': '27',
        // Foreign & Target
        'foreign_ratio': '40',
        'upside_potential': '61',
        // Index Weights
        'bist100_weight': '375',
        'bist50_weight': '376',
        'bist30_weight': '377',
    };

    // Pre-defined templates
    static readonly TEMPLATES: Record<string, { criteria: CriteriaTuple[]; oneri?: string }> = {
        'small_cap': { criteria: [['8', '0', '43000', 'False']] },
        'mid_cap': { criteria: [['8', '43000', '215000', 'False']] },
        'large_cap': { criteria: [['8', '215000', '5000000', 'False']] },
        'high_dividend': { criteria: [['33', '2', '100', 'False']] },
        'high_upside': { criteria: [['61', '0', '200', 'False']] },
        'low_upside': { criteria: [['61', '-100', '0', 'False']] },
        'high_volume': { criteria: [['26', '1', '1000', 'False']] },
        'low_volume': { criteria: [['26', '0', '0.5', 'False']] },
        'buy_recommendation': { criteria: [['7', '1', '50000', 'False']], oneri: 'AL' },
        'sell_recommendation': { criteria: [['7', '1', '50000', 'False']], oneri: 'SAT' },
        'high_net_margin': { criteria: [['119', '10', '200', 'False']] },
        'high_return': { criteria: [['22', '0', '100', 'False']] },
        'low_pe': { criteria: [['28', '0', '10', 'False']] },
        'high_roe': { criteria: [['422', '15', '200', 'False']] },
        'high_foreign_ownership': { criteria: [['40', '30', '100', 'False']] },
    };

    private sessionInitialized = false;
    private requestDigest: string | null = null;

    constructor(options?: ProviderOptions) {
        super(options);
    }

    private async initSession(): Promise<void> {
        if (this.sessionInitialized) return;

        try {
            const response = await this.get<string>(IsyatirimScreenerProvider.PAGE_URL, {
                responseType: 'text',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
            });

            // Extract request digest from page if present
            const digestMatch = response.data.match(/id="__REQUESTDIGEST"[^>]*value="([^"]+)"/);
            if (digestMatch) {
                this.requestDigest = digestMatch[1];
            }

            this.sessionInitialized = true;
        } catch {
            // Session initialization failed, but we can still try without it
            this.sessionInitialized = true;
        }
    }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Origin': IsyatirimScreenerProvider.BASE_URL,
            'Referer': IsyatirimScreenerProvider.PAGE_URL,
        };

        if (this.requestDigest) {
            headers['X-RequestDigest'] = this.requestDigest;
        }

        return headers;
    }

    async screen(
        criterias?: CriteriaTuple[],
        sector?: string,
        index?: string,
        recommendation?: string,
        template?: string
    ): Promise<ScreenerResult[]> {
        // Build request payload
        const payload: {
            sektor: string;
            endeks: string;
            takip: string;
            oneri: string;
            criterias: string[][];
            lang: string;
        } = {
            sektor: sector || '',
            endeks: index || '',
            takip: '',
            oneri: recommendation || '',
            criterias: [],
            lang: '1055', // Turkish
        };

        // Apply template if specified
        if (template && IsyatirimScreenerProvider.TEMPLATES[template]) {
            const tmpl = IsyatirimScreenerProvider.TEMPLATES[template];
            if (tmpl.criteria) {
                payload.criterias = tmpl.criteria.map(c => [...c]);
            }
            if (tmpl.oneri) {
                payload.oneri = tmpl.oneri;
            }
        }

        // Add custom criterias
        if (criterias) {
            for (const c of criterias) {
                payload.criterias.push([...c]);
            }
        }

        // If no criterias specified, add default price criteria
        if (payload.criterias.length === 0) {
            payload.criterias = [['7', '1', '50000', 'False']];
        }

        // Initialize session to get cookies
        await this.initSession();

        // Build cache key
        const cacheKey = `isyatirim:screener:${JSON.stringify(payload)}`;
        const cached = this.cacheGet<ScreenerResult[]>(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.post<{ d: string }>(
                IsyatirimScreenerProvider.SCREENER_URL,
                payload,
                { headers: this.getHeaders() }
            );

            // Parse response - it's a JSON string inside "d" field
            const resultStr = response.data.d || '[]';
            const results = JSON.parse(resultStr) as Array<{ Hisse: string;[key: string]: unknown }>;

            // Parse results
            const stocks: ScreenerResult[] = [];
            for (const item of results) {
                // Parse "Hisse" field: "THYAO - Türk Hava Yolları"
                const hisse = item.Hisse || '';
                let symbol = hisse;
                let name = '';

                if (hisse.includes(' - ')) {
                    const parts = hisse.split(' - ', 2);
                    symbol = parts[0].trim();
                    name = parts[1].trim();
                }

                const stock: ScreenerResult = { symbol, name };

                // Add criteria values
                for (const [key, value] of Object.entries(item)) {
                    if (key !== 'Hisse') {
                        try {
                            stock[`criteria_${key}`] = typeof value === 'string' ? parseFloat(value) : value as number;
                        } catch {
                            stock[`criteria_${key}`] = value as string | number;
                        }
                    }
                }

                stocks.push(stock);
            }

            this.cacheSet(cacheKey, stocks, TTL.REALTIME_PRICE * 15); // 15 minutes
            return stocks;
        } catch (error) {
            throw new APIError(`Failed to screen stocks: ${error}`);
        }
    }

    async getSectors(): Promise<SectorInfo[]> {
        const cacheKey = 'isyatirim:screener:sectors';
        const cached = this.cacheGet<SectorInfo[]>(cacheKey);
        if (cached) return cached;

        try {
            await this.initSession();
            const response = await this.get<string>(IsyatirimScreenerProvider.PAGE_URL, {
                responseType: 'text',
            });

            const $ = cheerio.load(response.data);
            const sectors: SectorInfo[] = [];

            // Find sector dropdown
            const sectorSelect = $('#ctl00_ctl58_g_877a6dc3_ec50_46c8_9ce3_f240bf1fe822_ctl00_ddlStockSector');
            sectorSelect.find('option').each((_, opt) => {
                const value = $(opt).attr('value') || '';
                const name = $(opt).text().trim();
                if (value && name && name !== 'Sektör Seçiniz') {
                    sectors.push({ id: value, name });
                }
            });

            this.cacheSet(cacheKey, sectors, TTL.COMPANY_LIST);
            return sectors;
        } catch {
            return [];
        }
    }

    async getIndices(): Promise<StockIndexInfo[]> {
        // Return static list of common indices
        return [
            { id: 'BIST 30', name: 'BIST 30' },
            { id: 'BIST 50', name: 'BIST 50' },
            { id: 'BIST 100', name: 'BIST 100' },
            { id: 'BIST BANKA', name: 'BIST BANKA' },
            { id: 'BIST SINAİ', name: 'BIST SINAİ' },
            { id: 'BIST HİZMETLER', name: 'BIST HİZMETLER' },
            { id: 'BIST TEKNOLOJİ', name: 'BIST TEKNOLOJİ' },
        ];
    }
}

let provider: IsyatirimScreenerProvider | null = null;
export function getScreenerProvider(): IsyatirimScreenerProvider {
    if (!provider) provider = new IsyatirimScreenerProvider();
    return provider;
}
