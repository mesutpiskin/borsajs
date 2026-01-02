/**
 * Inflation class for TCMB inflation data.
 */
import { getTcmbProvider, InflationLatest, InflationData, InflationCalculation, InflationDataOptions } from './providers/tcmb.js';

export class Inflation {
    async getLatest(inflationType: string = 'tufe'): Promise<InflationLatest> {
        return getTcmbProvider().getLatest(inflationType);
    }

    async getTufe(options: InflationDataOptions = {}): Promise<InflationData[]> {
        return getTcmbProvider().getData('tufe', options);
    }

    async getUfe(options: InflationDataOptions = {}): Promise<InflationData[]> {
        return getTcmbProvider().getData('ufe', options);
    }

    async calculate(amount: number, start: string, end: string): Promise<InflationCalculation> {
        const parseYM = (s: string): [number, number] => {
            const [y, m] = s.split('-').map(Number);
            if (!y || !m || m < 1 || m > 12) throw new Error(`Invalid date format: ${s}. Use YYYY-MM`);
            return [y, m];
        };
        const [sy, sm] = parseYM(start);
        const [ey, em] = parseYM(end);
        return getTcmbProvider().calculateInflation({ startYear: sy, startMonth: sm, endYear: ey, endMonth: em, basketValue: amount });
    }

    toString(): string { return 'Inflation()'; }
}
