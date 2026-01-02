/**
 * Fund class for mutual fund data.
 */
import { getTefasProvider, FundInfo, FundHistoryData, HistoryOptions, SearchResult } from './providers/tefas.js';

export interface FundPerformance { dailyReturn?: number; return1m?: number; return3m?: number; return6m?: number; returnYtd?: number; return1y?: number; return3y?: number; return5y?: number; }

export class Fund {
    private readonly _fundCode: string;
    private _infoCache: FundInfo | null = null;

    constructor(fundCode: string) { this._fundCode = fundCode.toUpperCase(); }
    get fundCode(): string { return this._fundCode; }
    get symbol(): string { return this._fundCode; }

    async getInfo(): Promise<FundInfo> {
        if (!this._infoCache) this._infoCache = await getTefasProvider().getFundDetail(this._fundCode);
        return this._infoCache;
    }

    async getDetail(): Promise<FundInfo> { return this.getInfo(); }

    async getPerformance(): Promise<FundPerformance> {
        const info = await this.getInfo();
        return { dailyReturn: info.dailyReturn, return1m: info.return1m, return3m: info.return3m, return6m: info.return6m, returnYtd: info.returnYtd, return1y: info.return1y, return3y: info.return3y, return5y: info.return5y };
    }

    async getHistory(options: HistoryOptions = {}): Promise<FundHistoryData[]> {
        return getTefasProvider().getHistory(this._fundCode, options);
    }

    toString(): string { return `Fund('${this._fundCode}')`; }
}

export async function searchFunds(query: string, limit: number = 20): Promise<SearchResult[]> {
    return getTefasProvider().search(query, limit);
}
