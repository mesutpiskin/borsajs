# borsajs

**[Türkçe](README.md) | [English](README.en.md)**

Türkiye finansal piyasaları için TypeScript/JavaScript veri kütüphanesi. BIST hisseleri, döviz, kripto, yatırım fonları ve ekonomik veriler için finansal veri kaynaklarından veri çeken kütüphanedir.

## Kurulum

```bash
npm install borsajs
```

## Hızlı Başlangıç

```typescript
import { Ticker, FX, Crypto, Fund, Inflation, symbols, cryptoSymbols } from 'borsajs';

// Hisse senedi
const stock = new Ticker('THYAO');
const info = await stock.getInfo();
// → { symbol: 'THYAO', last: 274.25, change: 5.75, changePercent: 2.14, ... }

// Döviz
const usd = new FX('USD');
const rate = await usd.getCurrent();
// → { symbol: 'USD', last: 43.02, updateTime: '2026-01-02T20:59:58.000Z' }

// Kripto
const btc = new Crypto('BTCTRY');
const price = await btc.getCurrent();
// → { symbol: 'BTCTRY', last: 3839080, bid: 3839136, ask: 3840481, ... }

// Sembol listeleri
const stockList = symbols();          // → ['AKBNK', 'ARCLK', 'ASELS', ...] (80 hisse)
const cryptoList = await cryptoSymbols(); // → ['BTCTRY', 'ETHTRY', ...] (173 çift)
```

## API Referansı

### Ticker (Hisse Senedi)

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

### FX (Döviz & Emtia)

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

### Crypto (Kripto Para)

```typescript
import { Crypto, cryptoSymbols } from 'borsajs';

const pairs = await cryptoSymbols('TRY');
// → ['BTCTRY', 'ETHTRY', 'XRPTRY', ...] (173 çift)

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

### Index (Endeksler)

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

### Inflation (Enflasyon)

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

### KAP (Kamu Aydınlatma Platformu)

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

**KAP Bildirimleri:**
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

**Beklenen Bildirim Takvimi:**
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

**Şirket Detayları:**
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

### Symbols (Sembol Listeleri)

```typescript
import { symbols, searchSymbols, cryptoSymbols, fxSymbols, indexSymbols } from 'borsajs';

// Hisse sembolleri
const stocks = symbols();           // → 80 hisse
const banks = searchSymbols('BNK'); // → ['AKBNK', 'YKBNK', 'SKBNK']

// Kripto sembolleri
const crypto = await cryptoSymbols('TRY'); // → 173 çift

// FX sembolleri
console.log(fxSymbols); // → 19 döviz/emtia

// Endeks sembolleri
console.log(indexSymbols); // → 19 endeks
```

## Veri Kaynakları

Bu kütüphane aşağıdaki kamuya açık veri kaynaklarından yararlanmaktadır:

| Modül | Kaynak | Web Sitesi | Açıklama |
|-------|--------|------------|----------|
| Ticker | Paratic | [paratic.com](https://www.paratic.com/) | Hisse senedi verileri |
| Index | Paratic | [paratic.com](https://www.paratic.com/) | BIST endeksleri |
| FX | doviz.com | [doviz.com](https://www.doviz.com/) | Döviz kurları, altın, emtia |
| Crypto | BtcTurk | [btcturk.com](https://www.btcturk.com/) | Kripto para verileri |
| Fund | TEFAS | [tefas.gov.tr](https://www.tefas.gov.tr/) | Yatırım fonu verileri |
| Inflation | TCMB | [tcmb.gov.tr](https://www.tcmb.gov.tr/) | Enflasyon verileri |
| KAP | KAP | [kap.org.tr](https://www.kap.org.tr/) | Şirket bilgileri |
| VIOP | İş Yatırım | [isyatirim.com.tr](https://www.isyatirim.com.tr/) | Vadeli işlem ve opsiyon |

## ⚠️ Önemli Uyarılar

### Ticari Kullanım
**Bu kütüphane yalnızca kişisel ve eğitim amaçlı kullanım için tasarlanmıştır.**

Ticari kullanım için ilgili veri kaynağı sağlayıcılarından açık izin almanız gerekmektedir.

### Referans Proje
Bu proje, [borsapy](https://github.com/saidsurucu/borsapy) Python kütüphanesinden ilham alınarak TypeScript'e port edilmiştir.

## Lisans

Apache 2.0 - Detaylar için [LICENSE](LICENSE) dosyasına bakınız.
