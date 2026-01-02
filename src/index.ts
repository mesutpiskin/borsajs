/**
 * borsajs - Turkish Financial Markets Data Library
 *
 * A yfinance-like API for BIST stocks, forex, crypto, funds, and economic data.
 *
 * @example
 * ```typescript
 * import * as bj from 'borsajs';
 *
 * // Get stock data
 * const stock = new bj.Ticker('THYAO');
 * const info = await stock.getInfo();
 * const history = await stock.getHistory({ period: '1mo' });
 *
 * // Get forex/commodity data
 * const usd = new bj.FX('USD');
 * const current = await usd.getCurrent();
 * const gold = new bj.FX('gram-altin');
 *
 * // List all BIST companies
 * const allCompanies = await bj.companies();
 * const banks = await bj.searchCompanies('banka');
 *
 * // Get crypto data
 * const btc = new bj.Crypto('BTCTRY');
 * const price = await btc.getCurrent();
 * const pairs = await bj.cryptoPairs();
 *
 * // Get fund data
 * const fund = new bj.Fund('AAK');
 * const fundInfo = await fund.getInfo();
 *
 * // Get inflation data
 * const inf = new bj.Inflation();
 * const latest = await inf.getLatest();
 * const result = await inf.calculate(100000, '2020-01', '2024-01');
 * ```
 */

// Main classes
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

// Market functions
export { companies, searchCompanies } from './market.js';

// Exceptions
export {
    BorsajsError,
    TickerNotFoundError,
    DataNotAvailableError,
    APIError,
    AuthenticationError,
    RateLimitError,
    InvalidPeriodError,
    InvalidIntervalError,
} from './exceptions.js';

// Cache
export { Cache, TTL, getCache } from './cache.js';

// Provider types (for advanced usage)
export type { OHLCVData, HistoryOptions } from './providers/paratic.js';
export type { TickerData } from './providers/btcturk.js';
export type { FXCurrentData, FXHistoryData } from './providers/dovizcom.js';
export type { FundInfo, FundHistoryData, SearchResult } from './providers/tefas.js';
export type { InflationLatest, InflationData, InflationCalculation } from './providers/tcmb.js';
export type { ContractData } from './providers/viop.js';
export type { Company, Disclosure } from './providers/kap.js';

// Version
export const VERSION = '0.1.0';
