
import * as cheerio from 'cheerio';
import { BaseProvider } from './base.js';
import { TTL } from '../cache.js';

/**
 * TCMB Interest Rates Provider
 * Fetches policy rate, overnight rates, and late liquidity window rates from tcmb.gov.tr
 */
export class TCMBRatesProvider extends BaseProvider {
    private static readonly URLS = {
        policy: "https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Temel+Faaliyetler/Para+Politikasi/Merkez+Bankasi+Faiz+Oranlari/1+Hafta+Repo",
        overnight: "https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Temel+Faaliyetler/Para+Politikasi/Merkez+Bankasi+Faiz+Oranlari/faiz-oranlari",
        late_liquidity: "https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Temel+Faaliyetler/Para+Politikasi/Merkez+Bankasi+Faiz+Oranlari/Gec+Likidite+Penceresi+%28LON%29",
    };

    constructor() {
        super();
    }

    private _parseTurkishNumber(text: string): number | null {
        text = text.trim();
        if (!text || text === "-") return null;
        try {
            return parseFloat(text.replace(",", "."));
        } catch {
            return null;
        }
    }

    private _parseDate(text: string): string | null {
        text = text.trim();
        if (!text) return null;
        // Keep as string "DD.MM.YYYY" or convert to standard YYYY-MM-DD
        // borsajs usually returns date strings or Date objects? 
        // Let's return standard YYYY-MM-DD string for consistency with other parts if possible,
        // or just keep original if parsing is needed properly.
        // The python code returns datetime objects. Here let's return ISO string or Date object?
        // Let's stick to string YYYY-MM-DD for JSON friendly APIs, or Date object.
        // Let's use string YYYY-MM-DD.
        const parts = text.split('.');
        if (parts.length === 3) {
            let year = parts[2];
            if (year.length === 2) year = '20' + year;
            return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return null;
    }

    private async _fetchAndParseTable(url: string): Promise<any[]> {
        const cacheKey = `tcmb_rates:${url}`;
        const cached = this.cacheGet<any[]>(cacheKey);
        if (cached) return cached;

        const response = await this.get<string>(url);
        const $ = cheerio.load(response.data);

        const table = $('table').first();
        if (!table.length) return [];

        const rows = table.find('tr');
        if (!rows.length) return [];

        const results: any[] = [];
        rows.each((i, row) => {
            if (i === 0) return; // Skip header

            const cols = $(row).find('td');
            if (cols.length < 3) return;

            const dateStr = $(cols[0]).text();
            const borrowingStr = $(cols[1]).text();
            const lendingStr = $(cols[2]).text();

            const date = this._parseDate(dateStr);
            const borrowing = this._parseTurkishNumber(borrowingStr);
            const lending = this._parseTurkishNumber(lendingStr);

            if (date) {
                results.push({
                    date,
                    borrowing,
                    lending
                });
            }
        });

        // Cache for longer duration as these don't change often (1 day maybe? using FX_RATES TTL for now)
        this.cacheSet(cacheKey, results, TTL.FX_RATES);
        return results;
    }

    public async getPolicyRate(): Promise<{ date: string | null, lending: number | null }> {
        const data = await this._fetchAndParseTable(TCMBRatesProvider.URLS.policy);
        if (!data || data.length === 0) return { date: null, lending: null };
        const latest = data[0];
        return {
            date: latest.date,
            lending: latest.lending
        };
    }

    public async getOvernightRates(): Promise<{ date: string | null, borrowing: number | null, lending: number | null }> {
        const data = await this._fetchAndParseTable(TCMBRatesProvider.URLS.overnight);
        if (!data || data.length === 0) return { date: null, borrowing: null, lending: null };
        const latest = data[0];
        return {
            date: latest.date,
            borrowing: latest.borrowing,
            lending: latest.lending
        };
    }

    public async getLateLiquidityRates(): Promise<{ date: string | null, borrowing: number | null, lending: number | null }> {
        const data = await this._fetchAndParseTable(TCMBRatesProvider.URLS.late_liquidity);
        if (!data || data.length === 0) return { date: null, borrowing: null, lending: null };
        const latest = data[0];
        return {
            date: latest.date,
            borrowing: latest.borrowing,
            lending: latest.lending
        };
    }

    public async getAllRates(): Promise<any[]> {
        const [policy, overnight, lateLiquidity] = await Promise.all([
            this.getPolicyRate(),
            this.getOvernightRates(),
            this.getLateLiquidityRates()
        ]);

        return [
            {
                rateType: "policy",
                ...policy,
                borrowing: null // Policy rate is usually 1 week repo auction rate (lending)
            },
            {
                rateType: "overnight",
                ...overnight
            },
            {
                rateType: "late_liquidity",
                ...lateLiquidity
            }
        ];
    }
}

let _provider: TCMBRatesProvider | null = null;
export function getTCMBRatesProvider(): TCMBRatesProvider {
    if (!_provider) {
        _provider = new TCMBRatesProvider();
    }
    return _provider;
}
