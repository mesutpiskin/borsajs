/**
 * doviz.com Economic Calendar provider for borsajs.
 */
import * as cheerio from 'cheerio';
import { BaseProvider, ProviderOptions } from './base.js';
import { TTL } from '../cache.js';
import { APIError } from '../exceptions.js';

export interface EconomicEvent {
    date: Date;
    time: string | null;
    country: string;
    countryCode: string;
    event: string;
    importance: 'low' | 'mid' | 'high';
    period: string;
    actual: string | null;
    forecast: string | null;
    previous: string | null;
}

export class DovizcomCalendarProvider extends BaseProvider {
    private static readonly BASE_URL = 'https://www.doviz.com/calendar/getCalendarEvents';
    private static readonly BEARER_TOKEN = 'd00c1214cbca6a7a1b4728a8cc78cd69ba99e0d2ddb6d0687d2ed34f6a547b48';

    // Country code mapping
    private static readonly COUNTRY_MAP: Record<string, string> = {
        'TR': 'Türkiye',
        'US': 'ABD',
        'EU': 'Euro Bölgesi',
        'DE': 'Almanya',
        'GB': 'Birleşik Krallık',
        'JP': 'Japonya',
        'CN': 'Çin',
        'FR': 'Fransa',
        'IT': 'İtalya',
        'CA': 'Kanada',
        'AU': 'Avustralya',
        'CH': 'İsviçre',
    };

    // Turkish month names
    private static readonly TURKISH_MONTHS: Record<string, number> = {
        'Ocak': 1, 'Şubat': 2, 'Mart': 3, 'Nisan': 4,
        'Mayıs': 5, 'Haziran': 6, 'Temmuz': 7, 'Ağustos': 8,
        'Eylül': 9, 'Ekim': 10, 'Kasım': 11, 'Aralık': 12,
    };

    constructor(options?: ProviderOptions) {
        super(options);
    }

    private parseTurkishDate(dateStr: string): Date | null {
        try {
            const parts = dateStr.trim().split(' ');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = DovizcomCalendarProvider.TURKISH_MONTHS[parts[1]];
                const year = parseInt(parts[2], 10);
                if (month) {
                    return new Date(year, month - 1, day);
                }
            }
        } catch {
            // Invalid date
        }
        return null;
    }

    private parseTime(timeStr: string): string | null {
        if (!timeStr) return null;
        const cleaned = timeStr.trim();
        if (/^\d{1,2}:\d{2}$/.test(cleaned)) {
            return cleaned;
        }
        return null;
    }

    private extractPeriod(eventName: string): string {
        const match = eventName.match(/\(([^)]+)\)$/);
        return match ? match[1] : '';
    }

    private parseHtml(htmlContent: string, countryCode: string): EconomicEvent[] {
        const $ = cheerio.load(htmlContent);
        const events: EconomicEvent[] = [];
        let currentDate: Date | null = null;

        // Find content containers
        $('div[id^="calendar-content-"]').each((_, contentDiv) => {
            // Find date header
            const dateHeader = $(contentDiv).find('div.text-center.mt-8.mb-8.text-bold');
            if (dateHeader.length > 0) {
                const dateText = dateHeader.text().trim();
                currentDate = this.parseTurkishDate(dateText);
            }

            // Find event rows
            $(contentDiv).find('tr').each((_, row) => {
                const cells = $(row).find('td');
                if (cells.length >= 7) {
                    try {
                        const timeCell = $(cells[0]);
                        const importanceCell = $(cells[2]);
                        const eventCell = $(cells[3]);
                        const actualCell = $(cells[4]);
                        const expectedCell = $(cells[5]);
                        const previousCell = $(cells[6]);

                        const eventTime = this.parseTime(timeCell.text().trim());
                        const eventName = eventCell.text().trim();

                        // Parse importance
                        let importance: 'low' | 'mid' | 'high' = 'low';
                        const importanceSpan = importanceCell.find('span[class*="importance"]');
                        if (importanceSpan.length > 0) {
                            const classes = importanceSpan.attr('class') || '';
                            if (classes.includes('high')) importance = 'high';
                            else if (classes.includes('mid')) importance = 'mid';
                        }

                        const actual = actualCell.text().trim() || null;
                        const expected = expectedCell.text().trim() || null;
                        const previous = previousCell.text().trim() || null;

                        if (eventName && currentDate) {
                            events.push({
                                date: currentDate,
                                time: eventTime,
                                countryCode,
                                country: DovizcomCalendarProvider.COUNTRY_MAP[countryCode] || countryCode,
                                event: eventName,
                                importance,
                                period: this.extractPeriod(eventName),
                                actual,
                                forecast: expected,
                                previous,
                            });
                        }
                    } catch {
                        // Skip malformed rows
                    }
                }
            });
        });

        return events;
    }

    async getEconomicCalendar(
        start: Date,
        end: Date,
        countries: string[] = ['TR', 'US'],
        importance?: 'low' | 'mid' | 'high'
    ): Promise<EconomicEvent[]> {
        const cacheKey = `dovizcom:calendar:${start.toISOString()}:${end.toISOString()}:${countries.join(',')}:${importance || 'all'}`;
        const cached = this.cacheGet<EconomicEvent[]>(cacheKey);
        if (cached) return cached;

        const allEvents: EconomicEvent[] = [];

        for (const countryCode of countries) {
            try {
                // Build importance parameter
                let importanceParam = '3,2,1'; // 3=high, 2=mid, 1=low
                if (importance === 'high') importanceParam = '3';
                else if (importance === 'mid') importanceParam = '3,2';

                const response = await this.get<{ calendarHTML?: string }>(
                    DovizcomCalendarProvider.BASE_URL,
                    {
                        params: {
                            country: countryCode,
                            importance: importanceParam,
                        },
                        headers: {
                            'Authorization': `Bearer ${DovizcomCalendarProvider.BEARER_TOKEN}`,
                            'Accept': 'application/json',
                        },
                    }
                );

                if (!response.data?.calendarHTML) continue;

                // Parse HTML
                const events = this.parseHtml(response.data.calendarHTML, countryCode);

                // Filter by date range
                for (const event of events) {
                    const eventDate = event.date;
                    if (eventDate >= start && eventDate <= end) {
                        // Filter by importance if specified
                        if (importance && event.importance !== importance) continue;
                        allEvents.push(event);
                    }
                }
            } catch (error) {
                throw new APIError(`Failed to fetch calendar for ${countryCode}: ${error}`);
            }
        }

        // Sort by date and time
        allEvents.sort((a, b) => {
            const dateCompare = a.date.getTime() - b.date.getTime();
            if (dateCompare !== 0) return dateCompare;
            const timeA = a.time || '99:99';
            const timeB = b.time || '99:99';
            return timeA.localeCompare(timeB);
        });

        this.cacheSet(cacheKey, allEvents, TTL.OHLCV_HISTORY);
        return allEvents;
    }
}

let provider: DovizcomCalendarProvider | null = null;
export function getCalendarProvider(): DovizcomCalendarProvider {
    if (!provider) provider = new DovizcomCalendarProvider();
    return provider;
}
