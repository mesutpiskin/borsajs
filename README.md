# borsajs

**[Türkçe](README.md) | [English](README.en.md)**

> **TypeScript/JavaScript port of [borsapy](https://github.com/saidsurucu/borsapy)** - Python versiyonundan ilham alınarak geliştirilmiştir.

Türk finansal piyasaları için TypeScript/JavaScript veri kütüphanesi. BIST hisseleri, döviz, kripto, yatırım fonları ve ekonomik veriler için yfinance benzeri API.

## Kurulum

```bash
npm install borsajs
```

## Hızlı Başlangıç

```typescript
import { Ticker, FX, Crypto, Fund, Inflation, download } from 'borsajs';

// Hisse senedi verisi
const stock = new Ticker('THYAO');
const info = await stock.getInfo();
const history = await stock.getHistory({ period: '1mo' });

// Döviz
const usd = new FX('USD');
const rate = await usd.getCurrent();

// Kripto
const btc = new Crypto('BTCTRY');
const price = await btc.getCurrent();

// Yatırım fonu
const fund = new Fund('AAK');
const fundInfo = await fund.getInfo();

// Enflasyon
const inflation = new Inflation();
const latest = await inflation.getLatest();
const calculation = await inflation.calculate(100000, '2020-01', '2024-01');
```

## Veri Kaynakları

| Modül | Kaynak | Açıklama |
|-------|--------|----------|
| Ticker | Paratic | Hisse verileri |
| Index | Paratic | BIST endeksleri |
| FX | doviz.com | Döviz kurları, altın, emtia |
| Crypto | BtcTurk | Kripto para verileri |
| Fund | TEFAS | Yatırım fonu verileri |
| Inflation | TCMB | Enflasyon verileri |
| VIOP | İş Yatırım | Vadeli işlem ve opsiyon |

## Lisans

Apache 2.0
