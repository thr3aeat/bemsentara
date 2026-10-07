# VDS + Render: otomatik devralma (aktif/yedek) kurulumu

İki makine (VDS ve Render) **aynı repo'yu** ve **aynı MongoDB'yi** kullanır. Yalnızca biri "lider"dir ve botu, siteyi,
zamanlayıcıları çalıştırır. Diğeri yedek bekler. Lider düşünce yedek kendiliğinden devralır.

> **Yeni repo gerekmez.** Render'a mevcut `bemsentara` repo'sunun `main` dalını bağla. İkinci bir repo, iki kopya arasında
> kod farkı (drift) yaratır ve `data/` içindeki gerçek kullanıcı verisini ikinci bir yere kopyalar.

## Nasıl çalışır

- `npm start` artık `haBoot.js` çalıştırır. `HA_ENABLED=1` değilse doğrudan `index.js` çalışır, yani HA kapalıyken hiçbir şey değişmez.
- Liderlik kirası MongoDB'deki `ha_lease` koleksiyonunda tek bir belgedir. Lider her ~10 sn yeniler, süresi 35 sn.
- **Lider aniden ölürse** (VDS kapandı): kira ≤35 sn içinde dolar, yedek devralır (toplam ~35–45 sn).
- **Lider temiz kapanırsa** (deploy, yeniden başlatma): kira hemen bırakılır, aynı makine ~1–2 sn içinde liderliği geri alır.
- **Devralmada** `data/*.json` dosyaları (RobloxLand verileri vb.) MongoDB'deki son kopyadan geri yüklenir. Lider bu dosyaları
  değiştikçe ~30 sn içinde MongoDB'ye yansıtır. (Ana veri deposu `Store` zaten MongoDB'dedir.)
- **Çift lider olmaz:** lider kirayı yenilerken başkasına geçtiğini görürse kendini kapatır, PM2/Render yeniden açınca yedek olarak bekler.
- MongoDB'ye **geçici** ulaşılamazsa lider çalışmaya devam eder (kesintisiz çalışma önceliklidir). Yeni açılan bir makine ise
  MongoDB'yi göremezse lider olmaz, yedek bekler.

## Kurulum

### 1. İki makinede de (VDS ve Render)

| Değişken | Değer |
|---|---|
| `HA_ENABLED` | `1` |
| `MONGODB_URI` | **İkisinde aynı** MongoDB bağlantı adresi |
| `HA_NODE_NAME` | VDS'de `vds`, Render'da `render` (her makinede farklı olmalı) |

VDS'deki `.env` dosyasının **tamamını** Render ortam değişkenlerine de kopyala (`TOKEN`, `SESSION_SECRET`, Roblox/Groq anahtarları,
kanal ve rol kimlikleri vb.). Bot token'ı ve `SESSION_SECRET` iki makinede **aynı** olmalı; böylece devralmada oturumlar geçerli kalır.

### 2. Yalnızca Render'da

| Değişken | Değer |
|---|---|
| `BASE_URL` | Render adresin, örn. `https://sentara.onrender.com` (özel alan adı bağlarsan onu yaz) |
| `RENDER_EXTERNAL_URL` | Aynı adres |
| `NODE_ENV` | `production` |
| `PORT` | **Ekleme**; Render kendisi verir |

Discord Developer Portal → OAuth2 → Redirects bölümüne Render adresinin giriş geri dönüş adresini de ekle (VDS'dekinin Render karşılığı).

### 3. Render servis ayarları

- Tür: **Web Service**, repo: `bemsentara`, dal: `main`
- Build: `npm install` — Start: `npm start` — Node: 20
- Health Check Path: `/api/health` (yedekteyken de 200 döner)
- **Plan: Starter veya üstü.** Render'ın ücretsiz planı 15 dk istek gelmezse servisi uyutur; uyuyan yedek devralamaz.
  Ücretsiz planda kalacaksan bir dış pinger (örn. UptimeRobot) ile `https://<render-adresin>/api/health` adresini 5 dakikada bir çağır.

### 4. VDS'de

PM2 veya systemd şablonları artık `haBoot.js`'i çalıştırır (`deploy/` klasörü). Şablonları güncelledikten sonra süreci yeniden başlat.

## Bilmen gerekenler

- **Web alan adı:** `ekoyildiz.duckdns.org` VDS'nin IP'sine bağlıdır. VDS ölünce **bot ve zamanlayıcılar otomatik devralınır**, ama
  alan adı Render'a otomatik yönlenmez; site Render adresinden (`*.onrender.com`) erişilebilir olur. Alan adının da otomatik
  geçmesini istiyorsan DNS'i (örn. Cloudflare) Render'a yönlendirecek şekilde taşımak gerekir.
- **MongoDB tek bağımlılık:** Lider MongoDB'ye ulaşamazsa çalışmaya devam eder ama devralma mekanizması çalışmaz. Aynı anda iki
  şey birden bozulursa (MongoDB kapalı + lider yeniden başlıyor) yeni açılan makine lider olamaz.
- **Süreler:** `HA_LEASE_TTL_MS` (varsayılan 35000) kısaltılırsa devralma hızlanır ama geçici ağ takılmalarında gereksiz devralma riski artar.
- **Yansıtılmayan dosyalar:** `maintenance.json`, `last_restart_state.json`, `domain_monitor_state.json`, `store.json` makineye özgü olduğu için
  yansıtılmaz.
- **Doğrulama:** Kurulumdan sonra VDS'de botu durdurup (`pm2 stop sentara`) Render günlüklerinde "LİDER oldum (devralma)" satırını bekle,
  sonra VDS'yi tekrar başlat; "yedek modda" kalmalı.
