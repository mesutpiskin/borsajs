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

### Symbols

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

```typescript
import { VIOP } from 'borsajs';

const viop = new VIOP();
const futures = await viop.getFutures();
const options = await viop.getOptions();
const thyao = await viop.getBySymbol('THYAO');
```

### Download (Multiple Tickers)

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
| VIOP | İş Yatırım | [isyatirim.com.tr](https://www.isyatirim.com.tr/) | Futures and options |

## ⚠️ Important Notices

### Commercial Use
**This library is intended for personal and educational use only.**

For commercial use, you must obtain explicit permission from the respective data source providers.

### Reference Project
This project is a TypeScript port of the [borsapy](https://github.com/saidsurucu/borsapy) Python library.

## License

Apache 2.0 - See [LICENSE](LICENSE) file for details.
