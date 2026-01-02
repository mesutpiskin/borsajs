/**
 * TEFAS provider for mutual fund data.
 */
import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { BaseProvider, ProviderOptions } from './base.js';
import { TTL } from '../cache.js';
import { APIError, DataNotAvailableError } from '../exceptions.js';

export interface FundInfo { fundCode: string; name: string; date: string; price: number; fundSize: number; investorCount: number; founder?: string; manager?: string; fundType?: string; category?: string; riskValue?: number; dailyReturn?: number; return1m?: number; return3m?: number; return6m?: number; returnYtd?: number; return1y?: number; return3y?: number; return5y?: number; }
export interface FundHistoryData { date: Date; price: number; fundSize: number; investors: number; }
export interface HistoryOptions { period?: string; start?: Date; end?: Date; }
export interface SearchResult { fundCode: string; name: string; fundType?: string; return1y?: number; }

interface FundApiResponse { fundInfo?: Array<{ FONUNVAN?: string; TARIH?: string; SONFIYAT?: number; PORTBUYUKLUK?: number; YATIRIMCISAYI?: number; KURUCU?: string; YONETICI?: string; FONTUR?: string; FONKATEGORI?: string; RISKDEGERI?: number; GUNLUKGETIRI?: number; }>; fundReturn?: Array<{ GETIRI1A?: number; GETIRI3A?: number; GETIRI6A?: number; GETIRIYB?: number; GETIRI1Y?: number; GETIRI3Y?: number; GETIRI5Y?: number; }>; }
interface HistoryApiResponse { data?: Array<{ TARIH?: number; FIYAT?: number; PORTFOYBUYUKLUK?: number; KISISAYISI?: number; }>; }
interface ComparisonApiResponse { data?: Array<{ FONKODU?: string; FONUNVAN?: string; FONTURACIKLAMA?: string; GETIRI1Y?: number; }>; }

export class TefasProvider extends BaseProvider {
    private static readonly BASE_URL = 'https://www.tefas.gov.tr/api/DB';
    private static readonly PERIOD_DAYS: Record<string, number> = { '1d': 1, '5d': 5, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365 };
    private unsafeClient: AxiosInstance;

    constructor(options?: ProviderOptions) {
        super(options);
        this.unsafeClient = axios.create({ timeout: 30000, httpsAgent: new https.Agent({ rejectUnauthorized: false }), headers: { 'User-Agent': 'Mozilla/5.0' } });
    }

    private formatDate(date: Date): string { return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`; }

    async getFundDetail(fundCode: string): Promise<FundInfo> {
        fundCode = fundCode.toUpperCase();
        const cacheKey = `tefas:detail:${fundCode}`;
        const cached = this.cacheGet<FundInfo>(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.unsafeClient.post<FundApiResponse>(`${TefasProvider.BASE_URL}/GetAllFundAnalyzeData`, new URLSearchParams({ dil: 'TR', fonkod: fundCode }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' } });
            const data = response.data;
            if (!data?.fundInfo?.length) throw new DataNotAvailableError(`No data for fund: ${fundCode}`);
            const fi = data.fundInfo[0]; const fr = data.fundReturn?.[0] ?? {};
            const result: FundInfo = { fundCode, name: fi.FONUNVAN ?? '', date: fi.TARIH ?? '', price: Number(fi.SONFIYAT) || 0, fundSize: Number(fi.PORTBUYUKLUK) || 0, investorCount: Number(fi.YATIRIMCISAYI) || 0, founder: fi.KURUCU, manager: fi.YONETICI, fundType: fi.FONTUR, category: fi.FONKATEGORI, riskValue: fi.RISKDEGERI, dailyReturn: fi.GUNLUKGETIRI, return1m: fr.GETIRI1A, return3m: fr.GETIRI3A, return6m: fr.GETIRI6A, returnYtd: fr.GETIRIYB, return1y: fr.GETIRI1Y, return3y: fr.GETIRI3Y, return5y: fr.GETIRI5Y };
            this.cacheSet(cacheKey, result, TTL.FUND_DATA);
            return result;
        } catch (error) { if (error instanceof DataNotAvailableError) throw error; throw new APIError(`Failed to fetch fund detail for ${fundCode}: ${error}`); }
    }

    async getHistory(fundCode: string, options: HistoryOptions = {}): Promise<FundHistoryData[]> {
        fundCode = fundCode.toUpperCase();
        const { period = '1mo', start, end } = options;
        const endDt = end ?? new Date();
        const startDt = start ?? new Date(endDt.getTime() - (TefasProvider.PERIOD_DAYS[period] ?? 30) * 24 * 60 * 60 * 1000);
        const cacheKey = `tefas:history:${fundCode}:${startDt.toISOString()}:${endDt.toISOString()}`;
        const cached = this.cacheGet<FundHistoryData[]>(cacheKey);
        if (cached) return cached;

        try {
            const formData = new URLSearchParams({ fontip: 'YAT', sfontur: '', fonkod: fundCode, fongrup: '', bastarih: this.formatDate(startDt), bittarih: this.formatDate(endDt), fonturkod: '', fonunvantip: '', kurucukod: '' });
            const response = await this.unsafeClient.post<HistoryApiResponse>(`${TefasProvider.BASE_URL}/BindHistoryInfo`, formData.toString(), { headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'Origin': 'https://www.tefas.gov.tr', 'X-Requested-With': 'XMLHttpRequest' } });
            const data = response.data?.data;
            if (!data?.length) throw new DataNotAvailableError(`No history for fund: ${fundCode}`);
            const records: FundHistoryData[] = data.filter(i => i.TARIH && i.TARIH > 0).map(i => ({ date: new Date(i.TARIH!), price: Number(i.FIYAT) || 0, fundSize: Number(i.PORTFOYBUYUKLUK) || 0, investors: Number(i.KISISAYISI) || 0 }));
            records.sort((a, b) => a.date.getTime() - b.date.getTime());
            this.cacheSet(cacheKey, records, TTL.FUND_DATA);
            return records;
        } catch (error) { if (error instanceof DataNotAvailableError) throw error; throw new APIError(`Failed to fetch history for ${fundCode}: ${error}`); }
    }

    async search(query: string, limit: number = 20): Promise<SearchResult[]> {
        const cacheKey = `tefas:search:${query}:${limit}`;
        const cached = this.cacheGet<SearchResult[]>(cacheKey);
        if (cached) return cached;
        try {
            const formData = new URLSearchParams({ calismatipi: '2', fontip: 'YAT', sfontur: 'Tümü', kurucukod: '', fongrup: '', bastarih: 'Başlangıç', bittarih: 'Bitiş', fonturkod: '', fonunvantip: '', strperiod: '1,1,1,1,1,1,1', islemdurum: '1' });
            const response = await this.unsafeClient.post<ComparisonApiResponse>(`${TefasProvider.BASE_URL}/BindComparisonFundReturns`, formData.toString(), { headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' } });
            const allFunds = response.data?.data ?? []; const queryLower = query.toLowerCase();
            const matching: SearchResult[] = allFunds.filter(f => (f.FONKODU ?? '').toLowerCase().includes(queryLower) || (f.FONUNVAN ?? '').toLowerCase().includes(queryLower)).slice(0, limit).map(f => ({ fundCode: f.FONKODU ?? '', name: f.FONUNVAN ?? '', fundType: f.FONTURACIKLAMA, return1y: f.GETIRI1Y }));
            this.cacheSet(cacheKey, matching, TTL.FUND_DATA);
            return matching;
        } catch { return []; }
    }
}

let provider: TefasProvider | null = null;
export function getTefasProvider(): TefasProvider { if (!provider) provider = new TefasProvider(); return provider; }
