/**
 * EconomicCalendar class for economic events - yfinance-like API.
 */
import { getCalendarProvider, type EconomicEvent } from './providers/dovizcom-calendar.js';
export type { EconomicEvent };

export class EconomicCalendar {
    private static readonly COUNTRIES = ['TR', 'US', 'EU', 'DE', 'GB', 'JP', 'CN', 'FR', 'IT', 'CA', 'AU', 'CH'];

    private provider = getCalendarProvider();

    /**
     * Get economic calendar events.
     * 
     * @param options - Options for filtering events
     * @returns Array of economic events
     * 
     * @example
     * ```typescript
     * const cal = new EconomicCalendar();
     * const events = await cal.events({ period: '1w' });
     * ```
     */
    async events(options: {
        period?: '1d' | '1w' | '2w' | '1mo';
        start?: Date | string;
        end?: Date | string;
        country?: string | string[];
        importance?: 'low' | 'mid' | 'high';
    } = {}): Promise<EconomicEvent[]> {
        const { period = '1w', start, end, country, importance } = options;

        // Parse dates
        const startDt = start ? this.parseDate(start) : null;
        const endDt = end ? this.parseDate(end) : null;

        // If no start, use today
        const startDate = startDt || new Date();
        startDate.setHours(0, 0, 0, 0);

        // If no end, calculate from period
        let endDate: Date;
        if (endDt) {
            endDate = endDt;
        } else {
            const days: Record<string, number> = { '1d': 1, '1w': 7, '2w': 14, '1mo': 30 };
            const daysToAdd = days[period] || 7;
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + daysToAdd);
        }

        // Parse country parameter
        const countries = this.parseCountries(country);

        // Fetch events
        return this.provider.getEconomicCalendar(startDate, endDate, countries, importance);
    }

    /**
     * Get today's economic events.
     */
    async today(options: {
        country?: string | string[];
        importance?: 'low' | 'mid' | 'high';
    } = {}): Promise<EconomicEvent[]> {
        return this.events({ period: '1d', ...options });
    }

    /**
     * Get this week's economic events.
     */
    async thisWeek(options: {
        country?: string | string[];
        importance?: 'low' | 'mid' | 'high';
    } = {}): Promise<EconomicEvent[]> {
        return this.events({ period: '1w', ...options });
    }

    /**
     * Get this month's economic events.
     */
    async thisMonth(options: {
        country?: string | string[];
        importance?: 'low' | 'mid' | 'high';
    } = {}): Promise<EconomicEvent[]> {
        return this.events({ period: '1mo', ...options });
    }

    /**
     * Get high importance events only.
     */
    async highImportance(options: {
        period?: '1d' | '1w' | '2w' | '1mo';
        country?: string | string[];
    } = {}): Promise<EconomicEvent[]> {
        return this.events({ importance: 'high', ...options });
    }

    /**
     * Get list of supported country codes.
     */
    static countries(): string[] {
        return [...EconomicCalendar.COUNTRIES];
    }

    private parseDate(date: string | Date): Date {
        if (date instanceof Date) return date;

        const formats = [
            /^(\d{4})-(\d{2})-(\d{2})$/,  // YYYY-MM-DD
            /^(\d{4})\/(\d{2})\/(\d{2})$/,  // YYYY/MM/DD
            /^(\d{2})-(\d{2})-(\d{4})$/,  // DD-MM-YYYY
            /^(\d{2})\/(\d{2})\/(\d{4})$/,  // DD/MM/YYYY
        ];

        for (const format of formats) {
            const match = date.match(format);
            if (match) {
                if (format.source.startsWith('^(\\d{4})')) {
                    // YYYY-MM-DD or YYYY/MM/DD
                    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
                } else {
                    // DD-MM-YYYY or DD/MM/YYYY
                    return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
                }
            }
        }

        throw new Error(`Could not parse date: ${date}`);
    }

    private parseCountries(country?: string | string[]): string[] {
        if (!country) return ['TR', 'US'];
        if (typeof country === 'string') return [country.toUpperCase()];
        return country.map(c => c.toUpperCase());
    }
}

/**
 * Get economic calendar events (convenience function).
 * 
 * @example
 * ```typescript
 * import { economicCalendar } from 'borsajs';
 * const events = await economicCalendar({ period: '1w' });
 * ```
 */
export async function economicCalendar(options: {
    period?: '1d' | '1w' | '2w' | '1mo';
    country?: string | string[];
    importance?: 'low' | 'mid' | 'high';
} = {}): Promise<EconomicEvent[]> {
    const cal = new EconomicCalendar();
    return cal.events(options);
}
