/**
 * TEFAS provider for mutual fund data.
 */

import { BaseProvider, ProviderOptions } from './base.js';
import { TTL } from '../cache.js';
import { APIError, DataNotAvailableError } from '../exceptions.js';
import https from 'https';
import axios, { AxiosInstance } from 'axios';

export interface FundInfo {
    fundCode: string;
    name: string;
    date: string;
    price: number;
    fundSize: number;
    investorCount: number;
    founder?: string;
    manager?: string;
    fundType?: string;
    category?: string;
    riskValue?: number;
    dailyReturn?: number;
    return1m?: number;
    return3m?: number;
    return6m?: number;
    returnYtd?: number;
    return1y?: number;
    return3y?: number;
    return5y?: number;
}

export interface FundHistoryData {
    date: Date;
    price: number;
    fundSize: number;
    investors: number;
}

export interface HistoryOptions {
    period?: string;
    start?: Date;
    end?: Date;
}

export interface SearchResult {
    fundCode: string;
    name: string;
    fundType?: string;
    return1y?: number;
}

interface FundApiResponse {
    fundInfo?: Array<{
        FONUNVAN?: string;
        TARIH?: string;
        SONFIYAT?: number;
        PORTBUYUKLUK?: number;
        YATIRIMCISAYI?: number;
        KURUCU?: string;
        YONETICI?: string;
        FONTUR?: string;
        FONKATEGORI?: string;
        RISKDEGERI?: number;
        GUNLUKGETIRI?: number;
    }>;
    fundReturn?: Array<{
        GETIRI1A?: number;
        GETIRI3A?: number;
        GETIRI6A?: number;
        GETIRIYB?: number;
        GETIRI1Y?: number;
        GETIRI3Y?: number;
        GETIRI5Y?: number;
    }>;
}

interface HistoryApiResponse {
    data?: Array<{
        TARIH?: number;
        FIYAT?: number;
        PORTFOYBUYUKLUK?: number;
        KISISAYISI?: number;
    }>;
}

interface ComparisonApiResponse {
    data?: Array<{
        FONKODU?: string;
        FONUNVAN?: string;
        FONTURACIKLAMA?: string;
        GETIRI1Y?: number;
    }>;
}

/**
 * Provider for mutual fund data from TEFAS.
 */
export class TefasProvider extends BaseProvider {
    private static readonly BASE_URL = 'https://www.tefas.gov.tr/api/DB';

    private static readonly PERIOD_DAYS: Record<string, number> = {
        '1d': 1,
        '5d': 5,
        '1mo': 30,
        '3mo': 90,
        '6mo': 180,
        '1y': 365,
    };

    // Custom axios instance with SSL verify disabled for TEFAS
    private unsafeClient: AxiosInstance;

    constructor(options?: ProviderOptions) {
        super(options);

        // TEFAS requires SSL verification to be disabled
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });
        this.unsafeClient = axios.create({
            timeout: 30000,
            httpsAgent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*',
            },
        });
    }

    /**
     * Get detailed fund information.
     */
    async getFundDetail(fundCode: string): Promise<FundInfo> {
        fundCode = fundCode.toUpperCase();

        const cacheKey = `tefas:detail:${fundCode}`;
        const cached = this.cacheGet<FundInfo>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const url = `${TefasProvider.BASE_URL}/GetAllFundAnalyzeData`;

            const response = await this.unsafeClient.post<FundApiResponse>(url,
                new URLSearchParams({ dil: 'TR', fonkod: fundCode }).toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                    },
                }
            );

            const data = response.data;
            if (!data || !data.fundInfo || data.fundInfo.length === 0) {
                throw new DataNotAvailableError(`No data for fund: ${fundCode}`);
            }

            const fundInfo = data.fundInfo[0];
            const fundReturn = data.fundReturn?.[0] ?? {};

            const result: FundInfo = {
                fundCode,
                name: fundInfo.FONUNVAN ?? '',
                date: fundInfo.TARIH ?? '',
                price: Number(fundInfo.SONFIYAT) || 0,
                fundSize: Number(fundInfo.PORTBUYUKLUK) || 0,
                investorCount: Number(fundInfo.YATIRIMCISAYI) || 0,
                founder: fundInfo.KURUCU,
                manager: fundInfo.YONETICI,
                fundType: fundInfo.FONTUR,
                category: fundInfo.FONKATEGORI,
                riskValue: fundInfo.RISKDEGERI,
                dailyReturn: fundInfo.GUNLUKGETIRI,
                return1m: fundReturn.GETIRI1A,
                return3m: fundReturn.GETIRI3A,
                return6m: fundReturn.GETIRI6A,
                returnYtd: fundReturn.GETIRIYB,
                return1y: fundReturn.GETIRI1Y,
                return3y: fundReturn.GETIRI3Y,
                return5y: fundReturn.GETIRI5Y,
            };

            this.cacheSet(cacheKey, result, TTL.FUND_DATA);
            return result;
        } catch (error) {
            if (error instanceof DataNotAvailableError) {
                throw error;
            }
            throw new APIError(`Failed to fetch fund detail for ${fundCode}: ${error}`);
        }
    }

    /**
     * Get historical price data.
     */
    async getHistory(fundCode: string, options: HistoryOptions = {}): Promise<FundHistoryData[]> {
        fundCode = fundCode.toUpperCase();
        const { period = '1mo', start, end } = options;

        const endDt = end ?? new Date();
        let startDt: Date;

        if (start) {
            startDt = start;
        } else {
            const days = TefasProvider.PERIOD_DAYS[period] ?? 30;
            startDt = new Date(endDt.getTime() - days * 24 * 60 * 60 * 1000);
        }

        const cacheKey = `tefas:history:${fundCode}:${startDt.toISOString()}:${endDt.toISOString()}`;
        const cached = this.cacheGet<FundHistoryData[]>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const url = `${TefasProvider.BASE_URL}/BindHistoryInfo`;

            const formData = new URLSearchParams({
                fontip: 'YAT',
                sfontur: '',
                fonkod: fundCode,
                fongrup: '',
                bastarih: this.formatDate(startDt),
                bittarih: this.formatDate(endDt),
                fonturkod: '',
                fonunvantip: '',
                kurucukod: '',
            });

            const response = await this.unsafeClient.post<HistoryApiResponse>(url, formData.toString(), {
                headers: {
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Origin': 'https://www.tefas.gov.tr',
                    'Referer': 'https://www.tefas.gov.tr/TarihselVeriler.aspx',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const data = response.data?.data;
            if (!data || data.length === 0) {
                throw new DataNotAvailableError(`No history for fund: ${fundCode}`);
            }

            const records: FundHistoryData[] = [];
            for (const item of data) {
                const timestamp = item.TARIH;
                if (timestamp && timestamp > 0) {
                    records.push({
                        date: new Date(timestamp),
                        price: Number(item.FIYAT) || 0,
                        fundSize: Number(item.PORTFOYBUYUKLUK) || 0,
                        investors: Number(item.KISISAYISI) || 0,
                    });
                }
            }

            records.sort((a, b) => a.date.getTime() - b.date.getTime());

            this.cacheSet(cacheKey, records, TTL.FUND_DATA);
            return records;
        } catch (error) {
            if (error instanceof DataNotAvailableError) {
                throw error;
            }
            throw new APIError(`Failed to fetch history for ${fundCode}: ${error}`);
        }
    }

    /**
     * Search for funds by name or code.
     */
    async search(query: string, limit: number = 20): Promise<SearchResult[]> {
        const cacheKey = `tefas:search:${query}:${limit}`;
        const cached = this.cacheGet<SearchResult[]>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const url = `${TefasProvider.BASE_URL}/BindComparisonFundReturns`;

            const formData = new URLSearchParams({
                calismatipi: '2',
                fontip: 'YAT',
                sfontur: 'Tümü',
                kurucukod: '',
                fongrup: '',
                bastarih: 'Başlangıç',
                bittarih: 'Bitiş',
                fonturkod: '',
                fonunvantip: '',
                strperiod: '1,1,1,1,1,1,1',
                islemdurum: '1',
            });

            const response = await this.unsafeClient.post<ComparisonApiResponse>(url, formData.toString(), {
                headers: {
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Origin': 'https://www.tefas.gov.tr',
                    'Referer': 'https://www.tefas.gov.tr/FonKarsilastirma.aspx',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const allFunds = response.data?.data ?? [];
            const queryLower = query.toLowerCase();

            const matching: SearchResult[] = [];
            for (const fund of allFunds) {
                const code = (fund.FONKODU ?? '').toLowerCase();
                const name = (fund.FONUNVAN ?? '').toLowerCase();

                if (code.includes(queryLower) || name.includes(queryLower)) {
                    matching.push({
                        fundCode: fund.FONKODU ?? '',
                        name: fund.FONUNVAN ?? '',
                        fundType: fund.FONTURACIKLAMA,
                        return1y: fund.GETIRI1Y,
                    });
                }

                if (matching.length >= limit) break;
            }

            this.cacheSet(cacheKey, matching, TTL.FUND_DATA);
            return matching;
        } catch {
            return [];
        }
    }

    private formatDate(date: Date): string {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }
}

// Singleton instance
let provider: TefasProvider | null = null;

/**
 * Get singleton provider instance.
 */
export function getTefasProvider(): TefasProvider {
    if (!provider) {
        provider = new TefasProvider();
    }
    return provider;
}
