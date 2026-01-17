
import { getEurobondProvider, ZiraatEurobondProvider, EurobondData } from './providers/ziraat-eurobond.js';

export class Eurobond {
    private provider: ZiraatEurobondProvider;

    constructor() {
        this.provider = getEurobondProvider();
    }

    /**
     * Get all Turkish Eurobonds.
     * @param currency 'USD' or 'EUR'
     */
    public async getList(currency?: string): Promise<EurobondData[]> {
        return this.provider.getEurobonds(currency);
    }

    /**
     * Get specific Eurobond by ISIN.
     */
    public async getByISIN(isin: string): Promise<EurobondData | undefined> {
        return this.provider.getEurobond(isin);
    }
}
