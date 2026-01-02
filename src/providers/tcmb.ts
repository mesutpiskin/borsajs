/**
 * TCMB provider for Turkish inflation data.
 */
import * as cheerio from 'cheerio';
import { BaseProvider, ProviderOptions } from './base.js';
import { TTL } from '../cache.js';
import { APIError, DataNotAvailableError } from '../exceptions.js';

export interface InflationLatest { date: string; yearMonth: string; yearlyInflation: number; monthlyInflation: number; type: string; }
export interface InflationData { date: Date; yearMonth: string; yearlyInflation: number; monthlyInflation: number; }
export interface InflationCalculation { startDate: string; endDate: string; initialValue: number; finalValue: number; totalYears: number; totalMonths: number; totalChange: number; avgYearlyInflation: number; startCpi: number; endCpi: number; }
export interface InflationDataOptions { start?: string; end?: string; limit?: number; }

interface CalcApiResponse { yeniSepetDeger?: string; toplamYil?: number; toplamAy?: number; toplamDegisim?: string; ortalamaYillikEnflasyon?: string; ilkYilTufe?: string; sonYilTufe?: string; }

export class TcmbProvider extends BaseProvider {
    private static readonly BASE_URL = 'https://www.tcmb.gov.tr';
    private static readonly CALC_API_URL = 'https://appg.tcmb.gov.tr/KIMENFH/enflasyon/hesapla';
    private static readonly INFLATION_PATHS: Record<string, string> = { tufe: '/wps/wcm/connect/tr/tcmb+tr/main+menu/istatistikler/enflasyon+verileri', ufe: '/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Istatistikler/Enflasyon+Verileri/Uretici+Fiyatlari' };

    constructor(options?: ProviderOptions) { super(options); }

    async getLatest(inflationType: string = 'tufe'): Promise<InflationLatest> {
        const data = await this.getData(inflationType, { limit: 1 });
        if (data.length === 0) throw new DataNotAvailableError('No inflation data available');
        const latest = data[0];
        return { date: latest.date.toISOString().split('T')[0], yearMonth: latest.yearMonth, yearlyInflation: latest.yearlyInflation, monthlyInflation: latest.monthlyInflation, type: inflationType.toUpperCase() };
    }

    async getData(inflationType: string, options: InflationDataOptions = {}): Promise<InflationData[]> {
        const { start, end, limit } = options;
        const type = inflationType.toLowerCase();
        if (!TcmbProvider.INFLATION_PATHS[type]) throw new Error(`Invalid type: ${type}. Use 'tufe' or 'ufe'`);

        const cacheKey = `tcmb:data:${type}`;
        let cached = this.cacheGet<InflationData[]>(cacheKey);

        if (!cached) {
            try {
                const response = await this.get<string>(TcmbProvider.BASE_URL + TcmbProvider.INFLATION_PATHS[type], { responseType: 'text' as const, headers: { 'Accept': 'text/html', 'Accept-Language': 'tr-TR,tr;q=0.9' } });
                cached = this.parseInflationTable(response.data);
                this.cacheSet(cacheKey, cached, TTL.FX_RATES);
            } catch (error) { throw new APIError(`Failed to fetch inflation data: ${error}`); }
        }
        if (!cached?.length) throw new DataNotAvailableError(`No data available for ${type}`);
        let result = [...cached];
        if (start) result = result.filter(d => d.date >= new Date(start));
        if (end) result = result.filter(d => d.date <= new Date(end));
        if (limit && limit > 0) result = result.slice(0, limit);
        return result;
    }

    async calculateInflation(options: { startYear: number; startMonth: number; endYear: number; endMonth: number; basketValue: number; }): Promise<InflationCalculation> {
        const { startYear, startMonth, endYear, endMonth, basketValue } = options;
        const cacheKey = `tcmb:calc:${startYear}-${startMonth}:${endYear}-${endMonth}:${basketValue}`;
        const cached = this.cacheGet<InflationCalculation>(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.post<CalcApiResponse>(TcmbProvider.CALC_API_URL, { baslangicYil: String(startYear), baslangicAy: String(startMonth), bitisYil: String(endYear), bitisAy: String(endMonth), malSepeti: String(basketValue) }, { headers: { 'Accept': '*/*', 'Content-Type': 'application/json', 'Origin': 'https://herkesicin.tcmb.gov.tr', 'Referer': 'https://herkesicin.tcmb.gov.tr/' } });
            const data = response.data;
            const parseFloat = (v: string) => { const c = String(v || '').replace(/,/g, ''); const n = Number.parseFloat(c); return isNaN(n) ? 0 : n; };
            const result: InflationCalculation = { startDate: `${startYear}-${String(startMonth).padStart(2, '0')}`, endDate: `${endYear}-${String(endMonth).padStart(2, '0')}`, initialValue: basketValue, finalValue: parseFloat(data?.yeniSepetDeger ?? ''), totalYears: data?.toplamYil ?? 0, totalMonths: data?.toplamAy ?? 0, totalChange: parseFloat(data?.toplamDegisim ?? ''), avgYearlyInflation: parseFloat(data?.ortalamaYillikEnflasyon ?? ''), startCpi: parseFloat(data?.ilkYilTufe ?? ''), endCpi: parseFloat(data?.sonYilTufe ?? '') };
            this.cacheSet(cacheKey, result, TTL.INFLATION_DATA);
            return result;
        } catch (error) { throw new APIError(`Failed to calculate inflation: ${error}`); }
    }

    private parseInflationTable(html: string): InflationData[] {
        const $ = cheerio.load(html);
        const inflationData: InflationData[] = [];
        const tables = $('table').toArray();
        for (const table of tables) {
            const headerText = $(table).find('tr').first().text().toLowerCase();
            if (!headerText.includes('tüfe') && !headerText.includes('üfe') && !headerText.includes('enflasyon') && !headerText.includes('yıllık')) continue;
            $(table).find('tr').slice(1).each((_, row) => {
                const cells = $(row).find('td, th').map((_, c) => $(c).text().trim()).get();
                if (cells.length < 3 || !cells[0]) return;
                const [dateStr, yearlyStr, monthlyStr] = cells.length >= 5 ? [cells[0], cells[2], cells[4] || ''] : [cells[0], cells[1], cells[2]];
                const match = dateStr.replace(/[.,]/g, '').match(/(\d{1,2})-(\d{4})/);
                if (!match) return;
                const [, month, year] = match;
                const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                const yearly = parseFloat(yearlyStr.replace('%', '').replace(',', '.').replace(/[^\d.-]/g, ''));
                const monthly = parseFloat(monthlyStr.replace('%', '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
                if (!isNaN(yearly)) inflationData.push({ date, yearMonth: dateStr, yearlyInflation: yearly, monthlyInflation: monthly });
            });
            if (inflationData.length > 0) break;
        }
        inflationData.sort((a, b) => b.date.getTime() - a.date.getTime());
        return inflationData;
    }
}

let provider: TcmbProvider | null = null;
export function getTcmbProvider(): TcmbProvider { if (!provider) provider = new TcmbProvider(); return provider; }
