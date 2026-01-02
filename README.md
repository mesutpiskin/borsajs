# borsajs

**[Türkçe](README.md) | [English](README.en.md)**

> **TypeScript/JavaScript port of [borsapy](https://github.com/saidsurucu/borsapy)** - Python versiyonundan ilham alınarak geliştirilmiştir.

Türkiye finansal piyasaları için TypeScript/JavaScript veri kütüphanesi. BIST hisseleri, döviz, kripto, yatırım fonları ve ekonomik veriler için yfinance benzeri API.

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

Bu kütüphane aşağıdaki kamuya açık veri kaynaklarından yararlanmaktadır:

| Modül | Kaynak | Web Sitesi | Açıklama |
|-------|--------|------------|----------|
| Ticker | Paratic | [paratic.com](https://www.paratic.com/) | Hisse senedi verileri |
| Index | Paratic | [paratic.com](https://www.paratic.com/) | BIST endeksleri |
| FX | doviz.com | [doviz.com](https://www.doviz.com/) | Döviz kurları, altın, emtia |
| Crypto | BtcTurk | [btcturk.com](https://www.btcturk.com/) | Kripto para verileri |
| Fund | TEFAS | [tefas.gov.tr](https://www.tefas.gov.tr/) | Yatırım fonu verileri |
| Inflation | TCMB | [tcmb.gov.tr](https://www.tcmb.gov.tr/) | Enflasyon verileri |
| VIOP | İş Yatırım | [isyatirim.com.tr](https://www.isyatirim.com.tr/) | Vadeli işlem ve opsiyon |
| Companies | KAP | [kap.org.tr](https://www.kap.org.tr/) | Şirket bilgileri ve bildirimleri |

## ⚠️ Önemli Uyarılar

### Veri Kaynakları Hakkında
Bu kütüphane aracılığıyla erişilen veriler, yukarıda listelenen üçüncü taraf kaynaklara aittir. Veriler ilgili kaynakların kullanım koşullarına tabidir.

### Ticari Kullanım
**Bu kütüphane yalnızca kişisel ve eğitim amaçlı kullanım için tasarlanmıştır.**

Ticari kullanım için:
- İlgili veri kaynağı sağlayıcılarından açık izin almanız gerekmektedir
- Bu kütüphanenin yazarları, verilerin izinsiz ticari kullanımından sorumlu değildir

### Referans Proje
Bu proje, [borsapy](https://github.com/saidsurucu/borsapy) Python kütüphanesinden ilham alınarak TypeScript'e port edilmiştir.

## Lisans

Apache 2.0 - Detaylar için [LICENSE](LICENSE) dosyasına bakınız.
