# borsajs

**[Türkçe](README.md) | [English](README.en.md)**

> **TypeScript/JavaScript port of [borsapy](https://github.com/saidsurucu/borsapy)** - Inspired by the Python version.

A TypeScript/JavaScript data library for Turkish financial markets. yfinance-like API for BIST stocks, forex, crypto, investment funds, and economic data.

## Installation

```bash
npm install borsajs
```

## Quick Start

```typescript
import { Ticker, FX, Crypto, Fund, Inflation, download } from 'borsajs';

// Stock data
const stock = new Ticker('THYAO');
const info = await stock.getInfo();
const history = await stock.getHistory({ period: '1mo' });

// Forex
const usd = new FX('USD');
const rate = await usd.getCurrent();

// Crypto
const btc = new Crypto('BTCTRY');
const price = await btc.getCurrent();

// Investment fund
const fund = new Fund('AAK');
const fundInfo = await fund.getInfo();

// Inflation
const inflation = new Inflation();
const latest = await inflation.getLatest();
const calculation = await inflation.calculate(100000, '2020-01', '2024-01');
```

## Modules

### Ticker (Stocks)

```typescript
import { Ticker } from 'borsajs';

const stock = new Ticker('THYAO');

// Current info
const info = await stock.getInfo();
console.log(info.last);           // Last price
console.log(info.change);         // Change
console.log(info.changePercent);  // Change %

// Price history
const daily = await stock.getHistory({ period: '1mo' });
const hourly = await stock.getHistory({ period: '5d', interval: '1h' });
const weekly = await stock.getHistory({ period: '1y', interval: '1wk' });
```

### Index

```typescript
import { Index, indices } from 'borsajs';

// Available indices
console.log(indices());  // ['XU100', 'XU050', ...]

// Index data
const xu100 = new Index('XU100');
const info = await xu100.getInfo();
const history = await xu100.getHistory({ period: '1mo' });
```

### FX (Forex & Commodities)

```typescript
import { FX } from 'borsajs';

// Exchange rates
const usd = new FX('USD');
const current = await usd.getCurrent();
const history = await usd.getHistory({ period: '1mo' });

// Gold
const gold = new FX('gram-altin');
const quarter = new FX('ceyrek-altin');

// Other: EUR, GBP, CHF, gumus (silver), BRENT, WTI
```

### Crypto

```typescript
import { Crypto, cryptoPairs } from 'borsajs';

// Available pairs
const pairs = await cryptoPairs();  // ['BTCTRY', 'ETHTRY', ...]

// Bitcoin/TRY
const btc = new Crypto('BTCTRY');
const current = await btc.getCurrent();
const history = await btc.getHistory({ period: '1mo' });
```

### Fund (Investment Funds)

```typescript
import { Fund, searchFunds } from 'borsajs';

// Search funds
const results = await searchFunds('bank');

// Fund data
const fund = new Fund('AAK');
const info = await fund.getInfo();
const history = await fund.getHistory({ period: '1mo' });
const performance = await fund.getPerformance();
```

### Inflation

```typescript
import { Inflation } from 'borsajs';

const inflation = new Inflation();

// Latest CPI data
const latest = await inflation.getLatest();
const cpi = await inflation.getTufe({ limit: 12 });

// PPI data
const ppi = await inflation.getUfe({ limit: 12 });

// Inflation calculator
const result = await inflation.calculate(100000, '2020-01', '2024-01');
console.log(`100,000 TL -> ${result.finalValue.toLocaleString()} TL`);
```

### VIOP (Derivatives)

```typescript
import { VIOP } from 'borsajs';

const viop = new VIOP();

// Futures
const futures = await viop.getFutures();
const stockFutures = await viop.getStockFutures();
const indexFutures = await viop.getIndexFutures();

// Options
const options = await viop.getOptions();

// By symbol
const thyaoDerivatives = await viop.getBySymbol('THYAO');
```

### Companies

```typescript
import { companies, searchCompanies } from 'borsajs';

// All companies
const all = await companies();

// Search companies
const banks = await searchCompanies('bank');
```

### Download (Multiple Tickers)

```typescript
import { download, Tickers } from 'borsajs';

// Download multiple tickers
const data = await download(['THYAO', 'GARAN', 'AKBNK'], { period: '1mo' });
console.log(data['THYAO']);  // THYAO's OHLCV data

// Tickers class
const tickers = new Tickers('THYAO GARAN AKBNK');
for (const [symbol, ticker] of tickers) {
  const info = await ticker.getInfo();
  console.log(`${symbol}: ${info.last}`);
}
```

## Data Sources

| Module | Source | Description |
|--------|--------|-------------|
| Ticker | Paratic | Stock data |
| Index | Paratic | BIST indices |
| FX | doviz.com | Forex, gold, commodities |
| Crypto | BtcTurk | Cryptocurrency data |
| Fund | TEFAS | Investment fund data |
| Inflation | TCMB | Inflation data |
| VIOP | İş Yatırım | Futures and options |

## Disclaimer

Data accessed through this library belongs to their respective sources. This library is intended for personal use only and data should not be used for commercial purposes.

## License

Apache 2.0
