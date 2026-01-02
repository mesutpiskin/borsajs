/**
 * VİOP (Vadeli İşlem ve Opsiyon Piyasası) module for Turkish derivatives market.
 */

import { getViopProvider, ContractData } from './providers/viop.js';

/**
 * VİOP (Vadeli İşlem ve Opsiyon Piyasası) data access.
 *
 * Provides access to Turkish derivatives market data including
 * futures and options contracts.
 *
 * Data source: İş Yatırım (HTML scraping)
 * Note: Data is delayed by ~15 minutes
 *
 * @example
 * ```typescript
 * import { VIOP } from 'borsajs';
 *
 * const viop = new VIOP();
 *
 * const futures = await viop.getFutures();
 * const stockFutures = await viop.getStockFutures();
 * const options = await viop.getOptions();
 *
 * const thyaoDerivatives = await viop.getBySymbol('THYAO');
 * ```
 */
export class VIOP {
    private _futuresCache: ContractData[] | null = null;
    private _optionsCache: ContractData[] | null = null;

    /**
     * Get all futures contracts.
     *
     * @returns Array of futures contracts with code, contract name, price, change, volume.
     */
    async getFutures(): Promise<ContractData[]> {
        if (!this._futuresCache) {
            const provider = getViopProvider();
            this._futuresCache = await provider.getFutures('all');
        }
        return this._futuresCache;
    }

    /**
     * Get stock futures contracts (Pay Vadeli İşlem).
     */
    async getStockFutures(): Promise<ContractData[]> {
        const provider = getViopProvider();
        return provider.getFutures('stock');
    }

    /**
     * Get index futures contracts (Endeks Vadeli İşlem).
     * Includes XU030, XLBNK, etc.
     */
    async getIndexFutures(): Promise<ContractData[]> {
        const provider = getViopProvider();
        return provider.getFutures('index');
    }

    /**
     * Get currency futures contracts (Döviz Vadeli İşlem).
     * Includes USD/TRY, EUR/TRY, etc.
     */
    async getCurrencyFutures(): Promise<ContractData[]> {
        const provider = getViopProvider();
        return provider.getFutures('currency');
    }

    /**
     * Get commodity futures contracts (Kıymetli Madenler).
     * Includes gold, silver, platinum, palladium.
     */
    async getCommodityFutures(): Promise<ContractData[]> {
        const provider = getViopProvider();
        return provider.getFutures('commodity');
    }

    /**
     * Get all options contracts.
     *
     * @returns Array of options contracts with code, contract name, price, change, volume.
     */
    async getOptions(): Promise<ContractData[]> {
        if (!this._optionsCache) {
            const provider = getViopProvider();
            this._optionsCache = await provider.getOptions('all');
        }
        return this._optionsCache;
    }

    /**
     * Get stock options contracts (Pay Opsiyon).
     */
    async getStockOptions(): Promise<ContractData[]> {
        const provider = getViopProvider();
        return provider.getOptions('stock');
    }

    /**
     * Get index options contracts (Endeks Opsiyon).
     */
    async getIndexOptions(): Promise<ContractData[]> {
        const provider = getViopProvider();
        return provider.getOptions('index');
    }

    /**
     * Get all derivatives for a specific underlying symbol.
     *
     * @param symbol - Underlying symbol (e.g., "AKBNK", "THYAO", "XU030")
     * @returns Array of all futures and options for the symbol.
     */
    async getBySymbol(symbol: string): Promise<ContractData[]> {
        symbol = symbol.toUpperCase();

        const [futures, options] = await Promise.all([
            this.getFutures(),
            this.getOptions(),
        ]);

        const allData = [...futures, ...options];

        return allData.filter(
            (item) =>
                item.contract.toUpperCase().includes(symbol) ||
                item.code.toUpperCase().includes(symbol)
        );
    }

    toString(): string {
        return 'VIOP()';
    }
}
