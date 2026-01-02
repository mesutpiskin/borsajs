/**
 * doviz.com provider for forex and commodity data.
 */
import { BaseProvider, ProviderOptions } from './base.js';
import { TTL } from '../cache.js';
import { APIError, DataNotAvailableError } from '../exceptions.js';

export interface FXCurrentData { symbol: string; last: number; open: number; high: number; low: number; updateTime?: Date; }
export interface FXHistoryData { date: Date; open: number; high: number; low: number; close: number; }
export interface HistoryOptions { period?: string; start?: Date; end?: Date; }
interface ArchiveItem { update_date?: number; open?: number; highest?: number; lowest?: number; close?: number; }
interface DovizApiResponse { data?: { archive?: ArchiveItem[]; }; }

export class DovizcomProvider extends BaseProvider {
    private static readonly BASE_URL = 'https://api.doviz.com/api/v12';
    private static readonly FALLBACK_TOKEN = '3e75d7fabf1c50c8b962626dd0e5ea22d8000815e1b0920d0a26afd77fcd6609';
    private static readonly PERIOD_DAYS: Record<string, number> = { '1d': 1, '5d': 5, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365 };
    private static readonly SUPPORTED_ASSETS = new Set(['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'gram-altin', 'gumus', 'ons', 'XAG-USD', 'XPT-USD', 'XPD-USD', 'BRENT', 'WTI', 'diesel', 'gasoline', 'lpg']);
    private static readonly FUEL_ASSETS = new Set(['gasoline', 'diesel', 'lpg']);
    private token: string | null = null; private tokenExpiry: number = 0;

    constructor(options?: ProviderOptions) { super(options); }

    private async getToken(): Promise<string> {
        if (this.token && Date.now() < this.tokenExpiry) return this.token;
        try {
            const response = await this.get<string>('https://www.doviz.com/', { responseType: 'text' as const });
            const match = response.data.match(/token["']?\s*:\s*["']([a-f0-9]{64})["']/i) || response.data.match(/Bearer\s+([a-f0-9]{64})/i);
            if (match) { this.token = match[1]; this.tokenExpiry = Date.now() + 3600000; return this.token; }
        } catch { /* fallback */ }
        return DovizcomProvider.FALLBACK_TOKEN;
    }

    private getOrigin(asset: string): string { return ['gram-altin', 'gumus', 'ons'].includes(asset) ? 'https://altin.doviz.com' : 'https://www.doviz.com'; }

    async getCurrent(asset: string): Promise<FXCurrentData> {
        const normalizedAsset = DovizcomProvider.SUPPORTED_ASSETS.has(asset.toUpperCase()) ? asset.toUpperCase() : asset;
        if (!DovizcomProvider.SUPPORTED_ASSETS.has(normalizedAsset)) throw new DataNotAvailableError(`Unsupported asset: ${asset}`);

        const cacheKey = `dovizcom:current:${normalizedAsset}`;
        const cached = this.cacheGet<FXCurrentData>(cacheKey);
        if (cached) return cached;

        try {
            const data = DovizcomProvider.FUEL_ASSETS.has(normalizedAsset) ? await this.getFromArchive(normalizedAsset, 7) : await this.getFromDaily(normalizedAsset);
            if (!data) throw new DataNotAvailableError(`No data for ${asset}`);
            const result: FXCurrentData = { symbol: normalizedAsset, last: Number(data.close) || 0, open: Number(data.open) || 0, high: Number(data.highest) || 0, low: Number(data.lowest) || 0, updateTime: data.update_date ? new Date(data.update_date * 1000) : undefined };
            this.cacheSet(cacheKey, result, TTL.FX_RATES);
            return result;
        } catch (error) {
            if (error instanceof DataNotAvailableError) throw error;
            throw new APIError(`Failed to fetch current for ${asset}: ${error}`);
        }
    }

    async getHistory(asset: string, options: HistoryOptions = {}): Promise<FXHistoryData[]> {
        const { period = '1mo', start, end } = options;
        const normalizedAsset = DovizcomProvider.SUPPORTED_ASSETS.has(asset.toUpperCase()) ? asset.toUpperCase() : asset;
        if (!DovizcomProvider.SUPPORTED_ASSETS.has(normalizedAsset)) throw new DataNotAvailableError(`Unsupported asset: ${asset}`);

        const endDt = end ?? new Date();
        const startDt = start ?? new Date(endDt.getTime() - (DovizcomProvider.PERIOD_DAYS[period] ?? 30) * 24 * 60 * 60 * 1000);
        const cacheKey = `dovizcom:history:${normalizedAsset}:${startDt.toISOString()}:${endDt.toISOString()}`;
        const cached = this.cacheGet<FXHistoryData[]>(cacheKey);
        if (cached) return cached;

        try {
            const token = await this.getToken();
            const origin = this.getOrigin(normalizedAsset);
            const response = await this.get<DovizApiResponse>(`${DovizcomProvider.BASE_URL}/assets/${normalizedAsset}/archive`, {
                params: { start: Math.floor(startDt.getTime() / 1000), end: Math.floor(endDt.getTime() / 1000) },
                headers: { 'Authorization': `Bearer ${token}`, 'Origin': origin, 'Referer': `${origin}/` },
            });
            const records: FXHistoryData[] = (response.data?.data?.archive ?? []).map(item => ({
                date: new Date((item.update_date ?? 0) * 1000), open: Number(item.open) || 0, high: Number(item.highest) || 0, low: Number(item.lowest) || 0, close: Number(item.close) || 0,
            }));
            records.sort((a, b) => a.date.getTime() - b.date.getTime());
            this.cacheSet(cacheKey, records, TTL.OHLCV_HISTORY);
            return records;
        } catch (error) { if (error instanceof DataNotAvailableError) throw error; throw new APIError(`Failed to fetch history for ${asset}: ${error}`); }
    }

    private async getFromDaily(asset: string): Promise<ArchiveItem | null> {
        const token = await this.getToken(); const origin = this.getOrigin(asset);
        const response = await this.get<DovizApiResponse>(`${DovizcomProvider.BASE_URL}/assets/${asset}/daily`, { params: { limit: 1 }, headers: { 'Authorization': `Bearer ${token}`, 'Origin': origin, 'Referer': `${origin}/` } });
        const archive = response.data?.data?.archive ?? []; return archive.length > 0 ? archive[0] : null;
    }

    private async getFromArchive(asset: string, days: number): Promise<ArchiveItem | null> {
        const token = await this.getToken(); const origin = this.getOrigin(asset);
        const endTime = Math.floor(Date.now() / 1000); const startTime = endTime - (days * 86400);
        const response = await this.get<DovizApiResponse>(`${DovizcomProvider.BASE_URL}/assets/${asset}/archive`, { params: { start: startTime, end: endTime }, headers: { 'Authorization': `Bearer ${token}`, 'Origin': origin, 'Referer': `${origin}/` } });
        const archive = response.data?.data?.archive ?? []; return archive.length > 0 ? archive[archive.length - 1] : null;
    }
}

let provider: DovizcomProvider | null = null;
export function getDovizcomProvider(): DovizcomProvider { if (!provider) provider = new DovizcomProvider(); return provider; }
