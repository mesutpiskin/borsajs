# borsajs

**[Türkçe](README.md) | [English](README.en.md)**

A TypeScript/JavaScript data library for Turkey financial markets. yfinance-like API for BIST stocks, forex, crypto, investment funds, and economic data.

## Installation

```bash
npm install borsajs
```

## Quick Start

```typescript
import { Ticker, FX, Crypto, Fund, Inflation, symbols, cryptoSymbols } from 'borsajs';

// Stock data
const stock = new Ticker('THYAO');
const info = await stock.getInfo();
// → { symbol: 'THYAO', last: 274.25, change: 5.75, changePercent: 2.14, ... }

// Forex
const usd = new FX('USD');
const rate = await usd.getCurrent();
// → { symbol: 'USD', last: 43.02, updateTime: '2026-01-02T20:59:58.000Z' }

// Crypto
const btc = new Crypto('BTCTRY');
const price = await btc.getCurrent();
// → { symbol: 'BTCTRY', last: 3839080, bid: 3839136, ask: 3840481, ... }

// Symbol lists
const stockList = symbols();              // → ['AKBNK', 'ARCLK', 'ASELS', ...] (80 stocks)
const cryptoList = await cryptoSymbols(); // → ['BTCTRY', 'ETHTRY', ...] (173 pairs)
```

## API Reference

### Ticker (Stocks)

**Get real-time BIST stock prices and volume data in seconds.** The Ticker API provides instant access to current price, daily change, volume, and OHLC (Open-High-Low-Close) values for any stock. Perfect for technical analysis, portfolio tracking, or automated trading strategies.

```typescript
import { Ticker } from 'borsajs';

const stock = new Ticker('THYAO');
const info = await stock.getInfo();
```

**Response:**
```json
{
  "symbol": "THYAO",
  "last": 274.25,
  "open": 271,
  "high": 274.25,
  "low": 269.75,
  "close": 268.5,
  "volume": 7853192164.25,
  "change": 5.75,
  "changePercent": 2.14,
  "updateTime": "2026-01-01T21:00:00.000Z",
  "type": "stock"
}
```

**History:**
```typescript
const history = await stock.getHistory({ period: '5d', interval: '1d' });
```

```json
[
  {
    "date": "2026-01-01T21:00:00.000Z",
    "open": 271,
    "high": 274.25,
    "low": 269.75,
    "close": 274.25,
    "volume": 7853192164.25
  }
]
```

### FX (Forex & Commodities)

**Track live exchange rates and commodity prices effortlessly.** Access real-time data for major currencies (USD, EUR, GBP) and precious metals (gold, silver). Essential for currency arbitrage, gold investment strategies, or exchange rate monitoring.

```typescript
import { FX, fxSymbols } from 'borsajs';

console.log(fxSymbols);
// → ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'gram-altin', 'ceyrek-altin', ...]

const usd = new FX('USD');
const current = await usd.getCurrent();
```

**Response:**
```json
{
  "symbol": "USD",
  "last": 43.0237,
  "open": 0,
  "high": 0,
  "low": 0,
  "updateTime": "2026-01-02T20:59:58.000Z"
}
```

### Crypto

**Live data from Turkey's largest crypto exchange, BtcTurk.** Access price, volume, and change information for 173 cryptocurrency pairs. The fastest way to track Bitcoin, Ethereum, and other cryptos in Turkish Lira.

```typescript
import { Crypto, cryptoSymbols } from 'borsajs';

const pairs = await cryptoSymbols('TRY');
// → ['BTCTRY', 'ETHTRY', 'XRPTRY', ...] (173 pairs)

const btc = new Crypto('BTCTRY');
const current = await btc.getCurrent();
```

**Response:**
```json
{
  "symbol": "BTCTRY",
  "last": 3839080,
  "open": 3822360,
  "high": 3891234,
  "low": 3793804,
  "bid": 3839136,
  "ask": 3840481,
  "volume": 36.22,
  "change": 18121,
  "changePercent": 0.44,
  "timestamp": 1767432414317
}
```

### Index

**Monitor BIST indices in real-time.** Get current values and percentage changes for market and sector indices like XU100, XU030, XBANK. Essential for analyzing market trends and comparing sectoral performance.

```typescript
import { Index, indexSymbols } from 'borsajs';

console.log(indexSymbols);
// → ['XU100', 'XU050', 'XU030', 'XBANK', 'XUSIN', ...]

const xu100 = new Index('XU100');
const info = await xu100.getInfo();
```

**Response:**
```json
{
  "symbol": "XU100",
  "last": 11498.38,
  "open": 11296.52,
  "high": 11498.38,
  "low": 11296.52,
  "change": 236.86,
  "changePercent": 2.1,
  "name": "BIST 100",
  "type": "index"
}
```

### Fund (Investment Funds)

**Search and track Turkish investment funds from TEFAS.** Access fund prices, returns, and performance metrics. Compare funds and make informed investment decisions with official data.

```typescript
import { Fund, searchFunds } from 'borsajs';

const results = await searchFunds('ak', 3);
const fund = new Fund('AOY');
const info = await fund.getInfo();
```

**Response:**
```json
{
  "fundCode": "AOY",
  "name": "AK PORTFÖY ALTERNATİF ENERJİ YABANCI HİSSE SENEDİ FONU",
  "price": 0.30568,
  "fundSize": 785933047.54,
  "investorCount": 34267,
  "dailyReturn": -0.993,
  "return1y": 77.59
}
```

### Inflation

**Access official inflation data directly from TCMB (Central Bank).** Query monthly and annual CPI rates, or calculate inflation between any two dates. Critical for evaluating investments on a real return basis.

```typescript
import { Inflation } from 'borsajs';

const inflation = new Inflation();
const latest = await inflation.getLatest();
const calc = await inflation.calculate(100000, '2020-01', '2024-01');
```

**Response (Latest):**
```json
{
  "date": "2025-10-31",
  "yearMonth": "11-2025",
  "yearlyInflation": 31.07,
  "monthlyInflation": 0.87,
  "type": "TUFE"
}
```

**Response (Calculate):**
```json
{
  "startDate": "2020-01",
  "endDate": "2024-01",
  "initialValue": 100000,
  "finalValue": 444399.15,
  "totalYears": 4,
  "totalChange": 344.4,
  "avgYearlyInflation": 45.19
}
```

### KAP (Public Disclosure Platform)

**One-stop access to official company announcements and disclosures.** Query disclosures, expected report calendars, and corporate information for all 731 BIST companies. Make investment decisions based on official company statements.

**Features:**
- 🏢 **731 BIST Companies** - Complete list with details
- 📢 **Live Disclosures** - All company announcements
- 📅 **Disclosure Calendar** - Financial report dates
- 🏛️ **Corporate Info** - Sector, market, website

```typescript
import { getKapProvider } from 'borsajs';

const kap = getKapProvider();
const companies = await kap.getCompanies();
const search = await kap.search('türk hava');
```

**Response (Companies):**
```json
[
  {
    "ticker": "THYAO",
    "name": "TÜRK HAVA YOLLARI A.O.",
    "city": "İSTANBUL"
  }
]
```

**Response (Search):**
```json
[
  {
    "ticker": "THYAO",
    "name": "TÜRK HAVA YOLLARI A.O.",
    "city": "İSTANBUL"
  }
]
```

**KAP Disclosures:**
```typescript
const disclosures = await kap.getDisclosures('THYAO', 5);
```

**Response (Disclosures):**
```json
[
  {
    "date": "29.12.2025 19:21:18",
    "title": "Haber ve Söylentilere İlişkin Açıklama",
    "disclosureIndex": 1530826,
    "url": "https://www.kap.org.tr/tr/Bildirim/1530826"
  }
]
```

**Expected Disclosure Calendar:**
```typescript
const calendar = await kap.getCalendar('THYAO');
```

**Response (Calendar):**
```json
[
  {
    "startDate": "01.01.2026",
    "endDate": "11.03.2026",
    "subject": "Finansal Rapor",
    "period": "Yıllık",
    "year": "2025"
  }
]
```

**Company Details:**
```typescript
const details = await kap.getCompanyDetails('THYAO');
```

**Response (Company Details):**
```json
{
  "sector": "ULAŞTIRMA VE DEPOLAMA",
  "market": "YILDIZ PAZAR",
  "website": "www.turkishairlines.com / http://investor.turkishairlines.com"
}
```

### Symbols

**Access all market symbols in a single call.** Get comprehensive lists of stocks, cryptocurrencies, currencies, and indices. Perfect starting point for automated data collection or screening algorithms.

```typescript
import { symbols, searchSymbols, cryptoSymbols, fxSymbols, indexSymbols } from 'borsajs';

// Stock symbols
const stocks = symbols();           // → 80 stocks
const banks = searchSymbols('BNK'); // → ['AKBNK', 'YKBNK', 'SKBNK']

// Crypto symbols
const crypto = await cryptoSymbols('TRY'); // → 173 pairs

// FX symbols
console.log(fxSymbols); // → 19 currencies/commodities

// Index symbols
console.log(indexSymbols); // → 19 indices
```

### VIOP (Derivatives)

**Track Turkish derivatives market (futures and options).** Access real-time data for stock futures, index futures, currency futures, and options contracts. Essential for hedging strategies and derivatives trading.

```typescript
import { VIOP } from 'borsajs';

const viop = new VIOP();

// Get all futures
const futures = await viop.getFutures();

// Stock futures
const stockFutures = await viop.getStockFutures();

// Index futures (XU100, XU030, etc.)
const indexFutures = await viop.getIndexFutures();

// Currency futures (USD, EUR)
const currencyFutures = await viop.getCurrencyFutures();

// Commodity futures (Gold)
const commodityFutures = await viop.getCommodityFutures();

// Options
const options = await viop.getOptions();

// Contracts for specific stock
const thyaoContracts = await viop.getBySymbol('THYAO');
```

**Response (Contract Data):**
```json
{
  "code": "THYAO",
  "contract": "THYAO0226",
  "price": 275.5,
  "change": 1.25,
  "volumeTl": 15420000,
  "volumeQty": 56000,
  "category": "stock"
}
```

### Download (Multiple Tickers)

**Batch download historical data for multiple stocks at once.** Efficient way to collect OHLCV data for portfolio analysis or backtesting strategies. Get data for dozens of stocks in a single request.

```typescript
import { download, Tickers } from 'borsajs';

const data = await download(['THYAO', 'GARAN', 'AKBNK'], { period: '1mo' });
console.log(data['THYAO']); // THYAO's OHLCV data
```

## Data Sources

This library accesses publicly available data from the following sources:

| Module | Source | Website | Description |
|--------|--------|---------|-------------|
| Ticker | Paratic | [paratic.com](https://www.paratic.com/) | Stock data |
| Index | Paratic | [paratic.com](https://www.paratic.com/) | BIST indices |
| FX | doviz.com | [doviz.com](https://www.doviz.com/) | Forex, gold, commodities |
| Crypto | BtcTurk | [btcturk.com](https://www.btcturk.com/) | Cryptocurrency data |
| Fund | TEFAS | [tefas.gov.tr](https://www.tefas.gov.tr/) | Investment fund data |
| Inflation | TCMB | [tcmb.gov.tr](https://www.tcmb.gov.tr/) | Inflation data |
| KAP | KAP | [kap.org.tr](https://www.kap.org.tr/) | Company information |
| VIOP | İş Yatırım | [isyatirim.com.tr](https://www.isyatirim.com.tr/) | Futures and options |

## ⚠️ Important Notices

### Commercial Use
**This library is intended for personal and educational use only.**

For commercial use, you must obtain explicit permission from the respective data source providers.

### Reference Project
This project is a TypeScript port of the [borsapy](https://github.com/saidsurucu/borsapy) Python library.

## License

Apache 2.0 - See [LICENSE](LICENSE) file for details.
