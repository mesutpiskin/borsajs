/**
 * Index class for market index data.
 */
import { getParaticProvider, QuoteData, OHLCVData, HistoryOptions } from './providers/paratic.js';

export const INDICES: Record<string, string> = {
    'XU100': 'BIST 100', 'XU050': 'BIST 50', 'XU030': 'BIST 30', 'XBANK': 'BIST Banka',
    'XUSIN': 'BIST Sınai', 'XHOLD': 'BIST Holding', 'XUTEK': 'BIST Teknoloji', 'XGIDA': 'BIST Gıda',
    'XTRZM': 'BIST Turizm', 'XULAS': 'BIST Ulaştırma', 'XSGRT': 'BIST Sigorta', 'XMANA': 'BIST Metal Ana',
    'XKMYA': 'BIST Kimya', 'XMADN': 'BIST Maden', 'XELKT': 'BIST Elektrik', 'XTEKS': 'BIST Tekstil',
    'XILTM': 'BIST İletişim', 'XUMAL': 'BIST Mali', 'XUTUM': 'BIST Tüm',
};

export interface IndexInfo extends QuoteData { name: string; type: 'index'; }

export class Index {
    private readonly _symbol: string;
    private _infoCache: IndexInfo | null = null;

    constructor(symbol: string) { this._symbol = symbol.toUpperCase(); }
    get symbol(): string { return this._symbol; }

    async getInfo(): Promise<IndexInfo> {
        if (!this._infoCache) {
            const quote = await getParaticProvider().getQuote(this._symbol);
            this._infoCache = { ...quote, name: INDICES[this._symbol] ?? this._symbol, type: 'index' };
        }
        return this._infoCache;
    }

    async getHistory(options: HistoryOptions = {}): Promise<OHLCVData[]> {
        return getParaticProvider().getHistory(this._symbol, options);
    }

    toString(): string { return `Index('${this._symbol}')`; }
}

export function indices(): string[] { return Object.keys(INDICES); }
export function index(symbol: string): Index { return new Index(symbol); }
