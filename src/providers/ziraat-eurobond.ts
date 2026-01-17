
import * as cheerio from 'cheerio';
import { BaseProvider } from './base.js';
import { TTL } from '../cache.js';

export interface EurobondData {
    isin: string;
    maturity: string | null;
    daysToMaturity: number;
    currency: string;
    bidPrice: number | null;
    bidYield: number | null;
    askPrice: number | null;
    askYield: number | null;
}

export class ZiraatEurobondProvider extends BaseProvider {
    private static readonly ZIRAAT_URL = "https://www.ziraatbank.com.tr/tr/_layouts/15/Ziraat/FaizOranlari/Ajax.aspx/GetZBBonoTahvilOran";

    constructor() {
        super();
    }

    private _parseTurkishNumber(text: string): number | null {
        text = text.trim();
        if (!text || text === "-" || text === "") return null;
        try {
            return parseFloat(text.replace(",", "."));
        } catch {
            return null;
        }
    }

    private _parseDate(text: string): string | null {
        text = text.trim();
        if (!text) return null;
        // Ziraat uses DD.MM.YYYY
        const parts = text.split('.');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return null; // Return null if format doesn't match
    }

    public async getEurobonds(currency?: string): Promise<EurobondData[]> {
        const cacheKey = "ziraat_eurobonds";
        let bonds: EurobondData[] | null = this.cacheGet<EurobondData[]>(cacheKey);

        if (!bonds) {
            const headers = {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Origin": "https://www.ziraatbank.com.tr",
                "Referer": "https://www.ziraatbank.com.tr/tr/bireysel/yatirim/eurobond",
            };

            const payload = {
                "kiymetTipi": "EURO",
                "date": new Date().toISOString().split('T')[0], // YYYY-MM-DD
                "hideIfStartWith": "",
            };

            const response = await this.post<any>(ZiraatEurobondProvider.ZIRAAT_URL, payload, { headers });
            const data = response.data;
            const html = data?.d?.Data || "";

            if (!html) return [];

            const $ = cheerio.load(html);
            const table = $('table').first();
            if (!table.length) return [];

            const rows = table.find('tr');
            bonds = [];

            rows.each((i, row) => {
                if (i === 0) return; // Skip header

                const cols = $(row).find('td');
                if (cols.length < 8) return;

                const bond: EurobondData = {
                    isin: $(cols[0]).text().trim(),
                    maturity: this._parseDate($(cols[1]).text()),
                    daysToMaturity: parseInt($(cols[2]).text().trim()) || 0,
                    currency: $(cols[3]).text().trim(),
                    bidPrice: this._parseTurkishNumber($(cols[4]).text()),
                    bidYield: this._parseTurkishNumber($(cols[5]).text()),
                    askPrice: this._parseTurkishNumber($(cols[6]).text()),
                    askYield: this._parseTurkishNumber($(cols[7]).text()),
                };
                bonds!.push(bond);
            });

            this.cacheSet(cacheKey, bonds, TTL.FX_RATES);
        }

        if (currency) {
            const upCurrency = currency.toUpperCase();
            return bonds.filter(b => b.currency === upCurrency);
        }

        return bonds;
    }

    public async getEurobond(isin: string): Promise<EurobondData | undefined> {
        const bonds = await this.getEurobonds();
        return bonds.find(b => b.isin === isin.toUpperCase());
    }
}

let _provider: ZiraatEurobondProvider | null = null;
export function getEurobondProvider(): ZiraatEurobondProvider {
    if (!_provider) {
        _provider = new ZiraatEurobondProvider();
    }
    return _provider;
}
