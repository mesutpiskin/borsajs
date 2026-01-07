/**
 * borsajs - Turkish Financial Markets Data Library
 */

export { Ticker } from './ticker.js';
export type { TickerInfo } from './ticker.js';

export { Tickers, download } from './multi.js';
export type { DownloadOptions, MultiTickerData } from './multi.js';

export { FX } from './fx.js';

export { Crypto, cryptoPairs } from './crypto.js';

export { Fund, searchFunds } from './fund.js';
export type { FundPerformance } from './fund.js';

export { Index, indices, index, INDICES } from './index-class.js';
export type { IndexInfo } from './index-class.js';

export { Inflation } from './inflation.js';

export { VIOP } from './viop.js';

export { EconomicCalendar, economicCalendar } from './calendar.js';
export type { EconomicEvent } from './calendar.js';

export { Bond, bonds, riskFreeRate } from './bond.js';
export type { BondData } from './bond.js';

export { Screener, screenStocks, sectors, stockIndices } from './screener.js';
export type { ScreenerResult, SectorInfo, StockIndexInfo } from './screener.js';

export { symbols, searchSymbols, cryptoSymbols, fxSymbols, indexSymbols } from './market.js';
export type { FXSymbol, IndexSymbol, StockSymbol, Company } from './market.js';

export { BorsajsError, TickerNotFoundError, DataNotAvailableError, APIError, AuthenticationError, RateLimitError, InvalidPeriodError, InvalidIntervalError } from './exceptions.js';

export { Cache, TTL, getCache } from './cache.js';

export type { OHLCVData, HistoryOptions } from './providers/paratic.js';
export type { TickerData } from './providers/btcturk.js';
export type { FXCurrentData, FXHistoryData } from './providers/dovizcom.js';
export type { FundInfo, FundHistoryData, SearchResult } from './providers/tefas.js';
export type { InflationLatest, InflationData, InflationCalculation } from './providers/tcmb.js';
export type { ContractData, Disclosure, CalendarEvent, CompanyDetails } from './providers/kap.js';
export { getKapProvider, getViopProvider, KapProvider, ViopProvider } from './providers/kap.js';

export const VERSION = '0.2.1';
