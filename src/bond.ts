/**
 * Bond class for Turkish government bond yields - yfinance-like API.
 */
import { getBondProvider, type BondData } from './providers/dovizcom-bond.js';
export type { BondData };

export class Bond {
    private maturity: '2Y' | '5Y' | '10Y';
    private provider = getBondProvider();
    private dataCache: BondData | null = null;

    /**
     * Create a Bond instance for a specific maturity.
     * 
     * @param maturity - Bond maturity (2Y, 5Y, or 10Y)
     * 
     * @example
     * ```typescript
     * const bond = new Bond('10Y');
     * const yieldRate = await bond.getYieldRate();
     * ```
     */
    constructor(maturity: '2Y' | '5Y' | '10Y') {
        this.maturity = maturity.toUpperCase() as '2Y' | '5Y' | '10Y';
    }

    private async getData(): Promise<BondData> {
        if (!this.dataCache) {
            this.dataCache = await this.provider.getBond(this.maturity);
        }
        return this.dataCache;
    }

    /**
     * Get the bond maturity.
     */
    getMaturity(): string {
        return this.maturity;
    }

    /**
     * Get the bond name.
     */
    async getName(): Promise<string> {
        const data = await this.getData();
        return data.name;
    }

    /**
     * Get the current yield as percentage.
     * @returns Yield rate as percentage (e.g., 28.03 for 28.03%)
     */
    async getYieldRate(): Promise<number> {
        const data = await this.getData();
        return data.yield;
    }

    /**
     * Get the current yield as decimal.
     * @returns Yield rate as decimal (e.g., 0.2803 for 28.03%)
     */
    async getYieldDecimal(): Promise<number> {
        const data = await this.getData();
        return data.yieldDecimal;
    }

    /**
     * Get the absolute change in yield.
     */
    async getChange(): Promise<number | null> {
        const data = await this.getData();
        return data.change;
    }

    /**
     * Get the percentage change in yield.
     */
    async getChangePct(): Promise<number | null> {
        const data = await this.getData();
        return data.changePct;
    }

    /**
     * Get all bond information.
     */
    async getInfo(): Promise<BondData> {
        return this.getData();
    }
}

/**
 * Get all Turkish government bond yields.
 * 
 * @returns Array of bond data
 * 
 * @example
 * ```typescript
 * import { bonds } from 'borsajs';
 * const allBonds = await bonds();
 * ```
 */
export async function bonds(): Promise<BondData[]> {
    const provider = getBondProvider();
    return provider.getBondYields();
}

/**
 * Get the risk-free rate for Turkish market (10Y bond yield).
 * 
 * @returns 10-year government bond yield as decimal
 * 
 * @example
 * ```typescript
 * import { riskFreeRate } from 'borsajs';
 * const rfr = await riskFreeRate();
 * console.log(`Risk-free rate: ${(rfr * 100).toFixed(2)}%`);
 * ```
 */
export async function riskFreeRate(): Promise<number | null> {
    const provider = getBondProvider();
    return provider.get10YYield();
}
