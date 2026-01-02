/**
 * TCMB provider for Turkish inflation data.
 */

import * as cheerio from 'cheerio';
import { BaseProvider, ProviderOptions } from './base.js';
import { TTL } from '../cache.js';
import { APIError, DataNotAvailableError } from '../exceptions.js';

export interface InflationLatest {
    date: string;
    yearMonth: string;
    yearlyInflation: number;
    monthlyInflation: number;
    type: string;
}

export interface InflationData {
    date: Date;
    yearMonth: string;
    yearlyInflation: number;
    monthlyInflation: number;
}

export interface InflationCalculation {
    startDate: string;
    endDate: string;
    initialValue: number;
    finalValue: number;
    totalYears: number;
    totalMonths: number;
    totalChange: number;
    avgYearlyInflation: number;
    startCpi: number;
    endCpi: number;
}

export interface InflationDataOptions {
    start?: string;
    end?: string;
    limit?: number;
}

interface CalcApiResponse {
    yeniSepetDeger?: string;
    toplamYil?: number;
    toplamAy?: number;
    toplamDegisim?: string;
    ortalamaYillikEnflasyon?: string;
    ilkYilTufe?: string;
    sonYilTufe?: string;
}

/**
 * Provider for Turkish inflation data from TCMB.
 */
export class TcmbProvider extends BaseProvider {
    private static readonly BASE_URL = 'https://www.tcmb.gov.tr';
    private static readonly CALC_API_URL = 'https://appg.tcmb.gov.tr/KIMENFH/enflasyon/hesapla';

    private static readonly INFLATION_PATHS: Record<string, string> = {
        tufe: '/wps/wcm/connect/tr/tcmb+tr/main+menu/istatistikler/enflasyon+verileri',
        ufe: '/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Istatistikler/Enflasyon+Verileri/Uretici+Fiyatlari',
    };

    constructor(options?: ProviderOptions) {
        super(options);
    }

    /**
     * Get the latest inflation data.
     */
    async getLatest(inflationType: string = 'tufe'): Promise<InflationLatest> {
        const data = await this.getData(inflationType, { limit: 1 });

        if (data.length === 0) {
            throw new DataNotAvailableError('No inflation data available');
        }

        const latest = data[0];
        return {
            date: latest.date.toISOString().split('T')[0],
            yearMonth: latest.yearMonth,
            yearlyInflation: latest.yearlyInflation,
            monthlyInflation: latest.monthlyInflation,
            type: inflationType.toUpperCase(),
        };
    }

    /**
     * Get inflation data (TUFE or UFE).
     */
    async getData(
        inflationType: string,
        options: InflationDataOptions = {}
    ): Promise<InflationData[]> {
        const { start, end, limit } = options;
        const type = inflationType.toLowerCase();

        if (!TcmbProvider.INFLATION_PATHS[type]) {
            throw new Error(`Invalid type: ${type}. Use 'tufe' or 'ufe'`);
        }

        const cacheKey = `tcmb:data:${type}`;
        let cached = this.cacheGet<InflationData[]>(cacheKey);

        if (!cached) {
            try {
                const url = TcmbProvider.BASE_URL + TcmbProvider.INFLATION_PATHS[type];
                const response = await this.get<string>(url, {
                    responseType: 'text' as const,
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml',
                        'Accept-Language': 'tr-TR,tr;q=0.9',
                    },
                });

                cached = this.parseInflationTable(response.data);
                this.cacheSet(cacheKey, cached, TTL.FX_RATES);
            } catch (error) {
                throw new APIError(`Failed to fetch inflation data: ${error}`);
            }
        }

        if (!cached || cached.length === 0) {
            throw new DataNotAvailableError(`No data available for ${type}`);
        }

        let result = [...cached];

        // Apply filters
        if (start) {
            const startDt = new Date(start);
            result = result.filter(d => d.date >= startDt);
        }

        if (end) {
            const endDt = new Date(end);
            result = result.filter(d => d.date <= endDt);
        }

        if (limit && limit > 0) {
            result = result.slice(0, limit);
        }

        return result;
    }

    /**
     * Calculate inflation-adjusted value between two dates.
     */
    async calculateInflation(options: {
        startYear: number;
        startMonth: number;
        endYear: number;
        endMonth: number;
        basketValue: number;
    }): Promise<InflationCalculation> {
        const { startYear, startMonth, endYear, endMonth, basketValue } = options;

        const cacheKey = `tcmb:calc:${startYear}-${startMonth}:${endYear}-${endMonth}:${basketValue}`;
        const cached = this.cacheGet<InflationCalculation>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const response = await this.post<CalcApiResponse>(TcmbProvider.CALC_API_URL, {
                baslangicYil: String(startYear),
                baslangicAy: String(startMonth),
                bitisYil: String(endYear),
                bitisAy: String(endMonth),
                malSepeti: String(basketValue),
            }, {
                headers: {
                    'Accept': '*/*',
                    'Content-Type': 'application/json',
                    'Origin': 'https://herkesicin.tcmb.gov.tr',
                    'Referer': 'https://herkesicin.tcmb.gov.tr/',
                },
            });

            const data = response.data;

            const result: InflationCalculation = {
                startDate: `${startYear}-${String(startMonth).padStart(2, '0')}`,
                endDate: `${endYear}-${String(endMonth).padStart(2, '0')}`,
                initialValue: basketValue,
                finalValue: this.parseFloat(data?.yeniSepetDeger ?? '') ?? 0,
                totalYears: data?.toplamYil ?? 0,
                totalMonths: data?.toplamAy ?? 0,
                totalChange: this.parseFloat(data?.toplamDegisim ?? '') ?? 0,
                avgYearlyInflation: this.parseFloat(data?.ortalamaYillikEnflasyon ?? '') ?? 0,
                startCpi: this.parseFloat(data?.ilkYilTufe ?? '') ?? 0,
                endCpi: this.parseFloat(data?.sonYilTufe ?? '') ?? 0,
            };

            this.cacheSet(cacheKey, result, TTL.INFLATION_DATA);
            return result;
        } catch (error) {
            throw new APIError(`Failed to calculate inflation: ${error}`);
        }
    }

    private parseInflationTable(html: string): InflationData[] {
        const $ = cheerio.load(html);
        const inflationData: InflationData[] = [];

        const tables = $('table').toArray();
        for (const table of tables) {
            const headerRow = $(table).find('tr').first();
            const headerText = headerRow.text().toLowerCase();

            // Check if this is an inflation table
            if (!headerText.includes('tüfe') && !headerText.includes('üfe') &&
                !headerText.includes('enflasyon') && !headerText.includes('yıllık')) {
                continue;
            }

            $(table).find('tr').slice(1).each((_, row) => {
                const cells = $(row).find('td, th');
                const cellTexts = cells.map((_, cell) => $(cell).text().trim()).get();

                if (cellTexts.length < 3 || !cellTexts[0]) return;

                try {
                    let dateStr: string, yearlyStr: string, monthlyStr: string;

                    if (cellTexts.length >= 5) {
                        // ÜFE format
                        dateStr = cellTexts[0];
                        yearlyStr = cellTexts[2];
                        monthlyStr = cellTexts[4] || '';
                    } else {
                        // TÜFE format
                        dateStr = cellTexts[0];
                        yearlyStr = cellTexts[1];
                        monthlyStr = cellTexts[2];
                    }

                    const date = this.parseDate(dateStr);
                    const yearly = this.parsePercentage(yearlyStr);
                    const monthly = this.parsePercentage(monthlyStr);

                    if (date && yearly !== null) {
                        inflationData.push({
                            date,
                            yearMonth: dateStr,
                            yearlyInflation: yearly,
                            monthlyInflation: monthly ?? 0,
                        });
                    }
                } catch {
                    // Skip invalid rows
                }
            });

            if (inflationData.length > 0) break; // Break after first valid table
        }

        // Sort by date (newest first)
        inflationData.sort((a, b) => b.date.getTime() - a.date.getTime());
        return inflationData;
    }

    private parseDate(dateStr: string): Date | null {
        if (!dateStr) return null;

        const cleaned = dateStr.replace(/[.,]/g, '');
        const match = cleaned.match(/(\d{1,2})-(\d{4})/);

        if (match) {
            const [, month, year] = match;
            return new Date(parseInt(year), parseInt(month) - 1, 1);
        }

        return null;
    }

    private parsePercentage(pctStr: string): number | null {
        if (!pctStr) return null;

        const cleaned = pctStr.replace('%', '').replace(',', '.').replace(/[^\d.-]/g, '');
        const value = parseFloat(cleaned);
        return isNaN(value) ? null : value;
    }

    private parseFloat(value: string): number | null {
        if (!value) return null;

        // TCMB API format: 444,399.15 (comma=thousands, dot=decimal)
        const cleaned = String(value).replace(/,/g, '');
        const result = parseFloat(cleaned);
        return isNaN(result) ? null : result;
    }
}

// Singleton instance
let provider: TcmbProvider | null = null;

/**
 * Get singleton provider instance.
 */
export function getTcmbProvider(): TcmbProvider {
    if (!provider) {
        provider = new TcmbProvider();
    }
    return provider;
}
