
import { getTCMBRatesProvider, TCMBRatesProvider } from './providers/tcmb-rates.js'; 

// Re-export types if needed, but for now we just wrap the providers
export class TCMB {
    private ratesProvider: TCMBRatesProvider;
    // We can also include the inflation provider here if we want a unified TCMB class,
    // but the task specifically mentioned porting rates. 
    // Existing Inflation class uses TCMBProvider directly.
    // Let's focus on Rates for this new class or check if we should merge.
    // The plan said "Implement src/tcmb.ts ... wrapping the providers".
    // So let's expose the rates methods here.

    constructor() {
        this.ratesProvider = getTCMBRatesProvider();
    }

    /**
     * Get current 1-week repo rate (policy rate).
     */
    public async getPolicyRate() {
        return this.ratesProvider.getPolicyRate();
    }

    /**
     * Get overnight (O/N) corridor rates.
     */
    public async getOvernightRates() {
        return this.ratesProvider.getOvernightRates();
    }

    /**
     * Get late liquidity window (LON) rates.
     */
    public async getLateLiquidityRates() {
        return this.ratesProvider.getLateLiquidityRates();
    }

    /**
     * Get all current TCMB interest rates.
     */
    public async getAllRates() {
        return this.ratesProvider.getAllRates();
    }
}
