# Stok Paneli

[Stok API](https://github.com/Ahmetrahatlik/stok-api) için React + TypeScript web arayüzü. Hırdavat dükkânı sahibi stok durumunu, kritik ürünleri, ciro ve kârı tek ekranda görür; giriş yapınca satış, mal girişi ve veresiye tahsilatı kaydeder.

*React + TypeScript dashboard for the Stok API: stock overview, low-stock alerts, profit, sales, purchases and customer credit. English summary below.*

![CI](https://github.com/Ahmetrahatlik/stok-panel/actions/workflows/ci.yml/badge.svg)

**Canlı demo:** https://stok-panel-7p4r.onrender.com — giriş: `demo` / `demo1234`. Ücretsiz sunucu uykudaysa ilk açılış ~50 saniye sürer.

## Özellikler

- **Özet kartları:** ürün çeşidi, kritik stok sayısı, ciro, brüt kâr, veresiye alacağı.
- **Ürün tablosu:** Türkçe arama ("çek" → "Çekiç"), kritik stok etiketi, giriş yapılınca satır içinden mal girişi.
- **Satış formu:** birden çok kalem, canlı toplam, nakit veya veresiye; veresiyede müşteri zorunlu. Stok yetmezse API'nin hangi ürünün yetmediğini söyleyen mesajı gösterilir.
- **Veresiye defteri:** borçlu müşteriler ve tahsilat.
- **Giriş (JWT):** okumak serbest, veri değiştirmek için giriş gerekir; token tarayıcıda saklanır.
- **Açık/koyu tema** ve mobil uyumlu düzen.

## Önemli kararlar

- **Arama sunucuda:** Türkçe büyük/küçük harf kuralları API'de çözüldüğü için panel aramayı kendisi yapmıyor, API'ye soruyor (250 ms gecikmeyle).
- **Hata mesajları:** FastAPI'nin üç farklı hata biçimi (metin, `{message, items}`, doğrulama listesi) tek fonksiyonda okunur hâle getiriliyor.
- **Test edilebilir istemci:** `StokApi` sınıfı `fetch`'i dışarıdan alıyor, `App` bileşeni de API'yi parametre olarak alabiliyor. Testler sahte API ile ağ olmadan çalışıyor.

## Çalıştırma

```bash
npm install
npm run dev          # http://localhost:5173
```

Varsayılan olarak canlı demo API'sine bağlanır. Yerel API için `.env` dosyasına `VITE_API_URL=http://localhost:8000` yazın.

## Testler

```bash
npm test             # Vitest + Testing Library
npm run lint
npm run build
```

## Proje yapısı

```
src/
  api.ts             Stok API istemcisi ve hata mesajları
  format.ts          TL ve miktar biçimlendirme
  App.tsx            veri yükleme, giriş, sayfa düzeni
  components/        Summary, Products, SaleForm, Customers, Login
```

## Geliştirme süreci

Proje, Claude Code ile yapay zekâ destekli geliştirildi. Ekranları ve davranışları ben belirledim, kod ajanla yazıldı ve testlerle doğrulandı.

---

## English summary

- React 18 + TypeScript + Vite single-page dashboard for the Stok API, deployed as a static site on Render.
- Read-only for visitors; JWT login unlocks sales, purchases and payments.
- Server-side Turkish-aware search, unified FastAPI error handling, light/dark theme.
- Vitest + Testing Library tests with an injected fake API; lint, tests and build run in GitHub Actions.
