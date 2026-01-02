/**
 * VIOP class for Turkish derivatives market data.
 */
import { getViopProvider, ContractData } from './providers/kap.js';

export class VIOP {
    private _futuresCache: ContractData[] | null = null;
    private _optionsCache: ContractData[] | null = null;

    async getFutures(): Promise<ContractData[]> {
        if (!this._futuresCache) this._futuresCache = await getViopProvider().getFutures('all');
        return this._futuresCache;
    }

    async getStockFutures(): Promise<ContractData[]> { return getViopProvider().getFutures('stock'); }
    async getIndexFutures(): Promise<ContractData[]> { return getViopProvider().getFutures('index'); }
    async getCurrencyFutures(): Promise<ContractData[]> { return getViopProvider().getFutures('currency'); }
    async getCommodityFutures(): Promise<ContractData[]> { return getViopProvider().getFutures('commodity'); }

    async getOptions(): Promise<ContractData[]> {
        if (!this._optionsCache) this._optionsCache = await getViopProvider().getOptions('all');
        return this._optionsCache;
    }

    async getStockOptions(): Promise<ContractData[]> { return getViopProvider().getOptions('stock'); }
    async getIndexOptions(): Promise<ContractData[]> { return getViopProvider().getOptions('index'); }

    async getBySymbol(symbol: string): Promise<ContractData[]> {
        symbol = symbol.toUpperCase();
        const [futures, options] = await Promise.all([this.getFutures(), this.getOptions()]);
        return [...futures, ...options].filter(i => i.contract.toUpperCase().includes(symbol) || i.code.toUpperCase().includes(symbol));
    }

    toString(): string { return 'VIOP()'; }
}
