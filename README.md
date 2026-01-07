# borsajs

**[Türkçe](README.md) | [English](README.en.md)**

Türkiye finansal piyasaları için TypeScript/JavaScript veri kütüphanesi. BIST hisseleri, döviz, kripto, yatırım fonları ve ekonomik veriler için finansal veri kaynaklarından veri çeken kütüphanedir.

## Kurulum

```bash
npm install borsajs
```

## 🚀 Demo & Showcase

**[Live Demo](https://borsajs-showcase.web.app/)** - Tüm özellikleri canlı olarak deneyin!

Kütüphanenin tüm yeteneklerini gösteren interaktif demo uygulaması:
- 📊 10 farklı API modülünün canlı örnekleri
- 💻 Her API için kod örnekleri

🔗 **Demo Kaynağı:** [GitHub - borsajs-demo](https://github.com/mesutpiskin/borsajs-demo)

## İçindekiler

- [Hızlı Başlangıç](#hızlı-başlangıç)
- [API Referansı](#api-referansı)
  - [Ticker (Hisse Senedi)](#ticker-hisse-senedi)
  - [FX (Döviz & Emtia)](#fx-döviz--emtia)
  - [Crypto (Kripto Para)](#crypto-kripto-para)
  - [Index (Endeksler)](#index-endeksler)
  - [Fund (Yatırım Fonları)](#fund-yatırım-fonları)
  - [Inflation (Enflasyon)](#inflation-enflasyon)
  - [KAP (Kamu Aydınlatma Platformu)](#kap-kamu-aydınlatma-platformu)
  - [EconomicCalendar (Ekonomik Takvim)](#economiccalendar-ekonomik-takvim)
  - [Bond (Tahvil Getirileri)](#bond-tahvil-getirileri)
  - [Screener (Hisse Tarayıcı)](#screener-hisse-tarayıcı)
  - [VIOP (Vadeli İşlem ve Opsiyon Piyasası)](#viop-vadeli-i̇şlem-ve-opsiyon-piyasası)
  - [Symbols (Sembol Listeleri)](#symbols-sembol-listeleri)
- [Veri Kaynakları](#veri-kaynakları)
- [Önemli Uyarılar](#️-önemli-uyarılar)
- [Lisans](#lisans)

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

**BIST hisselerinin anlık fiyat ve hacim verilerine saniyeler içinde ulaşın.** Ticker API, bir hisse senedinin güncel fiyatı, günlük değişimi, işlem hacmi ve OHLC (açılış-en yüksek-en düşük-kapanış) değerlerini kolayca almanızı sağlar. Teknik analiz, portföy takibi veya otomatik alım-satım stratejileri için ideal.

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

**Döviz kurları ve emtia fiyatlarını canlı takip edin.** FX API ile USD, EUR gibi döviz kurlarının yanı sıra altın, gümüş ve ons fiyatlarına anında erişebilirsiniz. Kur takibi, döviz arbitrajı veya altın yatırım stratejileri için güvenilir veri kaynağı.

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

**Türkiye'nin en büyük kripto borsası BtcTurk'ten anlık veriler.** 173 kripto para çiftinin fiyat, hacim ve değişim bilgilerine erişin. Bitcoin, Ethereum ve diğer kripto paraların TRY karşılığını takip etmek için en hızlı yol.

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

**BIST endekslerini gerçek zamanlı izleyin.** XU100, XU030, XBANK gibi sektör ve piyasa endekslerinin güncel değerleri ve yüzdesel değişimlerini alın. Piyasa trendlerini analiz etmek ve sektörel performansı karşılaştırmak için vazgeçilmez.

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

**TCMB'nin resmi enflasyon verilerine doğrudan erişin.** Aylık ve yıllık TÜFE oranlarını sorgulayın veya geçmiş tarihler arasında enflasyon hesaplayın. Yatırım kararlarınızı reel getiri bazında değerlendirmek için kritik.

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

**Şirketlerin resmi açıklamalarına ve bildirimlerine tek noktadan ulaşın.** KAP API ile 731 BIST şirketinin bildirimlerini, beklenen rapor takvimlerini ve kurumsal bilgilerini sorgulayabilirsiniz. Yatırım kararlarınızı şirketlerin resmi açıklamaları ışığında alın.

**Özellikler:**
- 🏢 **731 BIST şirketi** - Tüm halka açık şirketlerin listesi ve bilgileri
- 📢 **Anlık Bildirimler** - Şirketlerin KAP'a yaptığı tüm açıklamalar
- 📅 **Bildirim Takvimi** - Finansal rapor ve açıklama tarihleri
- 🏛️ **Kurumsal Bilgiler** - Sektör, pazar, web sitesi bilgileri

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

### EconomicCalendar (Ekonomik Takvim)

**Küresel ekonomik göstergeleri ve etkinlikleri gerçek zamanlı takip edin.** EconomicCalendar API ile TR, US, EU ve diğer ülkelerin önemli ekonomik verilerini, raporlarını ve açıklamalarını önceden öğrenin. Yatırım kararlarınızı makro ekonomik göstergeler ışığında alın.

```typescript
import { EconomicCalendar, economicCalendar } from 'borsajs';

const cal = new EconomicCalendar();
const events = await cal.thisWeek();
const highEvents = await cal.highImportance({ period: '1w' });

// Convenience fonksiyonu
const trEvents = await economicCalendar({ country: 'TR', importance: 'high' });
```

**Response:**
```json
[
  {
    "date": "2026-01-15T00:00:00.000Z",
    "time": "10:00",
    "country": "Türkiye",
    "countryCode": "TR",
    "event": "Enflasyon (YoY)",
    "importance": "high",
    "period": "Aralık",
    "actual": "64.77%",
    "forecast": "65.00%",
    "previous": "61.98%"
  }
]
```

**Desteklenen Ülkeler:** TR, US, EU, DE, GB, JP, CN, FR, IT, CA, AU, CH

### Bond (Tahvil Getirileri)

**Türk devlet tahvillerinin getirilerini anlık izleyin.** Bond API ile 2, 5 ve 10 yıllık tahvil faizlerini ve değişimlerini takip edin. DCF hesaplamaları için risksiz getiri oranına kolayca erişin.

```typescript
import { Bond, bonds, riskFreeRate } from 'borsajs';

// Tüm tahvilleri al
const allBonds = await bonds();
// → [{ maturity: '2Y', yield: 36.71, ... }, ...]

// Belirli bir tahvil
const bond10y = new Bond('10Y');
const yieldRate = await bond10y.getYieldRate();
const yieldDecimal = await bond10y.getYieldDecimal();

// DCF hesaplamaları için risksiz getiri
const rfr = await riskFreeRate();
// → 0.2905 (29.05% için)
```

**Response (bonds):**
```json
[
  {
    "name": "TR 2 Yıllık Tahvil Faizi",
    "maturity": "2Y",
    "yield": 36.71,
    "yieldDecimal": 0.3671,
    "change": 0.17,
    "changePct": 0.47
  }
]
```

### Screener (Hisse Tarayıcı)

**BIST hisselerini 40+ farklı kritere göre tarayın.** Screener API ile piyasa değeri, F/K oranı, temettü verimi, ROE ve daha fazla kritere göre hisse senedi bulun. 15 hazır şablon veya özel filtreler ile yatırım stratejinize uygun hisseleri keşfedin.

```typescript
import { Screener, screenStocks, sectors } from 'borsajs';

// Hazır şablon kullan
const highDivStocks = await screenStocks({ template: 'high_dividend' });

// Özel filtreler
const customStocks = await screenStocks({
  marketCapMin: 1000,  // Min 1000M TL
  peMax: 15,           // Maks 15 F/K
  dividendYieldMin: 3, // Min %3 temettü
});

// Fluent API
const screener = new Screener();
const results = await screener
  .addFilter('market_cap', { min: 215000 })
  .addFilter('roe', { min: 15 })
  .run();
```

**Hazır Şablonlar:** `small_cap`, `mid_cap`, `large_cap`, `high_dividend`, `high_upside`, `buy_recommendation`, `high_net_margin`, `low_pe`, `high_roe`, `high_foreign_ownership`

**Filtre Kriterleri:** price, market_cap, pe, pb, ev_ebitda, dividend_yield, roe, roa, net_margin, return_1w, return_1m, foreign_ratio, upside_potential ve 30+ kriter daha.

### VIOP (Vadeli İşlem ve Opsiyon Piyasası)

**Türk türev piyasasını gerçek zamanlı takip edin.** Hisse senedi vadeli işlemleri, endeks vadeli işlemleri, döviz ve emtia kontratlarına anında erişin. Riskten korunma (hedging) stratejileri ve türev ürün ticareti için vazgeçilmez.

```typescript
import { VIOP } from 'borsajs';

const viop = new VIOP();

// Tüm vadeli işlemleri al
const futures = await viop.getFutures();

// Hisse senedi vadeli işlemleri
const stockFutures = await viop.getStockFutures();

// Endeks vadeli işlemleri
const indexFutures = await viop.getIndexFutures();

// Döviz vadeli işlemleri
const currencyFutures = await viop.getCurrencyFutures();

// Emtia vadeli işlemleri
const commodityFutures = await viop.getCommodityFutures();

// Opsiyonlar
const options = await viop.getOptions();

// Belirli bir hisse için kontratlar
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

### Symbols (Sembol Listeleri)

**Tüm piyasa sembollerine tek çağrıda erişin.** Hisse senetleri, kripto paralar, dövizler ve endekslerin sembol listelerini alın. Otomatik veri çekme veya tarama algoritmaları için mükemmel başlangıç noktası.

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
| EconomicCalendar | doviz.com | [doviz.com](https://www.doviz.com/) | Ekonomik takvim |
| Bond | doviz.com | [doviz.com](https://www.doviz.com/) | Tahvil getirileri |
| Screener | İş Yatırım | [isyatirim.com.tr](https://www.isyatirim.com.tr/) | Hisse tarama |
| VIOP | İş Yatırım | [isyatirim.com.tr](https://www.isyatirim.com.tr/) | Vadeli işlem ve opsiyon |

## ⚠️ Önemli Uyarılar

### Ticari Kullanım
**Bu kütüphane yalnızca kişisel ve eğitim amaçlı kullanım için tasarlanmıştır.**

Ticari kullanım için ilgili veri kaynağı sağlayıcılarından açık izin almanız gerekmektedir.

### Referans Proje
Bu proje, [borsapy](https://github.com/saidsurucu/borsapy) Python kütüphanesinden ilham alınarak TypeScript'e port edilmiştir.

## Lisans

Apache 2.0 - Detaylar için [LICENSE](LICENSE) dosyasına bakınız.
