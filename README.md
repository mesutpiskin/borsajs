# borsajs

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
const hisse = new Ticker('THYAO');
const info = await hisse.getInfo();           // Anlık fiyat
const history = await hisse.getHistory({ period: '1mo' });  // Geçmiş OHLCV

// Çoklu hisse
const data = await download(['THYAO', 'GARAN', 'AKBNK'], { period: '1mo' });

// Döviz
const usd = new FX('USD');
const kur = await usd.getCurrent();           // Güncel kur
const kurHistory = await usd.getHistory({ period: '1mo' });

// Kripto
const btc = new Crypto('BTCTRY');
const price = await btc.getCurrent();         // Güncel fiyat

// Yatırım fonu
const fon = new Fund('AAK');
const fonInfo = await fon.getInfo();          // Fon bilgileri

// Enflasyon
const enf = new Inflation();
const latest = await enf.getLatest();         // Son TÜFE verileri
const calc = await enf.calculate(100000, '2020-01', '2024-01');
```

---

## Ticker (Hisse Senedi)

```typescript
import { Ticker } from 'borsajs';

const hisse = new Ticker('THYAO');

// Anlık bilgi
const info = await hisse.getInfo();
console.log(info.last);           // Son fiyat
console.log(info.change);         // Değişim
console.log(info.changePercent);  // Değişim %

// Fiyat geçmişi
const df = await hisse.getHistory({ period: '1mo' });    // Son 1 ay
const df2 = await hisse.getHistory({ period: '1y' });    // Son 1 yıl
const df3 = await hisse.getHistory({ 
  start: new Date('2024-01-01'), 
  end: new Date('2024-06-30') 
});

// Farklı aralıklar
const daily = await hisse.getHistory({ period: '1mo', interval: '1d' });
const hourly = await hisse.getHistory({ period: '5d', interval: '1h' });
const weekly = await hisse.getHistory({ period: '1y', interval: '1wk' });
```

---

## Tickers ve download (Çoklu Hisse)

```typescript
import { Tickers, download } from 'borsajs';

// Birden fazla hisse
const hisseler = new Tickers('THYAO GARAN AKBNK');
// veya
const hisseler2 = new Tickers(['THYAO', 'GARAN', 'AKBNK']);

// Her hissenin bilgilerine erişim
for (const [symbol, ticker] of hisseler) {
  const info = await ticker.getInfo();
  console.log(`${symbol}: ${info.last}`);
}

// download fonksiyonu
const data = await download(['THYAO', 'GARAN'], { period: '1mo' });
console.log(data['THYAO']);  // THYAO'nun OHLCV verisi
console.log(data['GARAN']);  // GARAN'ın OHLCV verisi
```

---

## Index (Endeksler)

```typescript
import { Index, indices } from 'borsajs';

// Mevcut endeksler
console.log(indices());  // ['XU100', 'XU050', ...]

// Endeks verisi
const xu100 = new Index('XU100');
const info = await xu100.getInfo();
const history = await xu100.getHistory({ period: '1mo' });
```

---

## FX (Döviz ve Emtia)

```typescript
import { FX } from 'borsajs';

// Döviz kurları
const usd = new FX('USD');
const current = await usd.getCurrent();
const history = await usd.getHistory({ period: '1mo' });

// Altın
const gramAltin = new FX('gram-altin');
const ceyrek = new FX('ceyrek-altin');

// Diğer: EUR, GBP, CHF, gumus, BRENT, WTI
```

---

## Crypto (Kripto Para)

```typescript
import { Crypto, cryptoPairs } from 'borsajs';

// Mevcut çiftler
const pairs = await cryptoPairs();  // ['BTCTRY', 'ETHTRY', ...]

// Bitcoin/TRY
const btc = new Crypto('BTCTRY');
const current = await btc.getCurrent();
const history = await btc.getHistory({ period: '1mo' });
```

---

## Fund (Yatırım Fonları)

```typescript
import { Fund, searchFunds } from 'borsajs';

// Fon arama
const results = await searchFunds('banka');

// Fon verisi
const fon = new Fund('AAK');
const info = await fon.getInfo();
const history = await fon.getHistory({ period: '1mo' });
const performance = await fon.getPerformance();
```

---

## Inflation (Enflasyon)

```typescript
import { Inflation } from 'borsajs';

const enf = new Inflation();

// Son TÜFE verileri
const latest = await enf.getLatest();
const tufe = await enf.getTufe({ limit: 12 });

// ÜFE verileri
const ufe = await enf.getUfe({ limit: 12 });

// Enflasyon hesaplayıcı
const result = await enf.calculate(100000, '2020-01', '2024-01');
console.log(`100,000 TL -> ${result.finalValue.toLocaleString()} TL`);
```

---

## VIOP (Vadeli İşlem ve Opsiyon)

```typescript
import { VIOP } from 'borsajs';

const viop = new VIOP();

// Tüm vadeli işlemler
const futures = await viop.getFutures();
const stockFutures = await viop.getStockFutures();
const indexFutures = await viop.getIndexFutures();

// Opsiyonlar
const options = await viop.getOptions();

// Sembol bazlı arama
const thyaoDerivatives = await viop.getBySymbol('THYAO');
```

---

## Şirket Listesi

```typescript
import { companies, searchCompanies } from 'borsajs';

// Tüm şirketler
const all = await companies();

// Şirket arama
const banks = await searchCompanies('banka');
```

---

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

---

## Sorumluluk Reddi

Bu kütüphane aracılığıyla erişilen veriler, ilgili veri kaynaklarına aittir. Kütüphane yalnızca kişisel kullanım amacıyla hazırlanmıştır ve veriler ticari amaçlarla kullanılamaz.

---

## Lisans

Apache 2.0
