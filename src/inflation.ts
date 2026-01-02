/**
 * Inflation class for TCMB inflation data - yfinance-like API.
 */

import { getTcmbProvider, InflationLatest, InflationData, InflationCalculation, InflationDataOptions } from './providers/tcmb.js';

/**
 * A yfinance-like interface for Turkish inflation data from TCMB.
 *
 * @example
 * ```typescript
 * import { Inflation } from 'borsajs';
 *
 * const inf = new Inflation();
 *
 * // Get latest inflation
 * const latest = await inf.getLatest();
 * console.log(latest.yearlyInflation); // e.g., 47.09
 *
 * // Get TÜFE history
 * const tufe = await inf.getTufe({ limit: 12 });
 * console.log(tufe);
 *
 * // Calculate inflation
 * const result = await inf.calculate(100000, '2020-01', '2024-01');
 * console.log(result.finalValue); // Inflation-adjusted value
 * ```
 */
export class Inflation {
    /**
     * Get the latest inflation data.
     *
     * @param inflationType - 'tufe' (CPI) or 'ufe' (PPI)
     * @returns Dictionary with latest inflation data.
     */
    async getLatest(inflationType: string = 'tufe'): Promise<InflationLatest> {
        const provider = getTcmbProvider();
        return provider.getLatest(inflationType);
    }

    /**
     * Get TÜFE (Consumer Price Index) data.
     *
     * @param options - Data options
     * @param options.start - Start date in YYYY-MM-DD format
     * @param options.end - End date in YYYY-MM-DD format
     * @param options.limit - Maximum number of records
     *
     * @returns Array of inflation data with date, yearMonth, yearlyInflation, monthlyInflation.
     */
    async getTufe(options: InflationDataOptions = {}): Promise<InflationData[]> {
        const provider = getTcmbProvider();
        return provider.getData('tufe', options);
    }

    /**
     * Get ÜFE (Producer Price Index) data.
     *
     * @param options - Data options
     * @param options.start - Start date in YYYY-MM-DD format
     * @param options.end - End date in YYYY-MM-DD format
     * @param options.limit - Maximum number of records
     *
     * @returns Array of inflation data.
     */
    async getUfe(options: InflationDataOptions = {}): Promise<InflationData[]> {
        const provider = getTcmbProvider();
        return provider.getData('ufe', options);
    }

    /**
     * Calculate inflation-adjusted value between two dates.
     *
     * Uses TCMB's official inflation calculator API.
     *
     * @param amount - Initial amount in TRY
     * @param start - Start date in YYYY-MM format (e.g., "2020-01")
     * @param end - End date in YYYY-MM format (e.g., "2024-01")
     *
     * @returns Dictionary with calculation results including finalValue, totalChange, etc.
     *
     * @example
     * ```typescript
     * const inf = new Inflation();
     * const result = await inf.calculate(100000, '2020-01', '2024-01');
     * console.log(`100,000 TL in 2020 = ${result.finalValue.toLocaleString()} TL in 2024`);
     * ```
     */
    async calculate(amount: number, start: string, end: string): Promise<InflationCalculation> {
        const [startYear, startMonth] = this.parseYearMonth(start);
        const [endYear, endMonth] = this.parseYearMonth(end);

        const provider = getTcmbProvider();
        return provider.calculateInflation({
            startYear,
            startMonth,
            endYear,
            endMonth,
            basketValue: amount,
        });
    }

    private parseYearMonth(dateStr: string): [number, number] {
        const parts = dateStr.split('-');
        if (parts.length !== 2) {
            throw new Error(`Invalid date format: ${dateStr}. Use YYYY-MM`);
        }
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            throw new Error(`Invalid date: ${dateStr}`);
        }
        return [year, month];
    }

    toString(): string {
        return 'Inflation()';
    }
}
