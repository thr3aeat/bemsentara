# VDS + Render: otomatik devralma (aktif/yedek) kurulumu

İki makine (VDS ve Render) **aynı repo'yu** ve **aynı MongoDB'yi** kullanır. Yalnızca biri "lider"dir ve botu, siteyi,
zamanlayıcıları çalıştırır. Diğeri yedek bekler. Lider düşünce yedek kendiliğinden devralır.

> **Yeni repo gerekmez.** Render'a mevcut `bemsentara` repo'sunun `main` dalını bağla. İkinci bir repo, iki kopya arasında
> kod farkı (drift) yaratır ve `data/` içindeki gerçek kullanıcı verisini ikinci bir yere kopyalar.

## Nasıl çalışır

- **HA, `MONGODB_URI` tanımlıysa kendiliğinden açılır** (kapatmak için `HA_ENABLED=0`). Süreç `npm start`, `node index.js` ya da PM2
  ile açılsa da `index.js` başlangıçta HA başlatıcısına (`haBoot.js`) devreder; sunucudaki başlatma komutunu değiştirmek gerekmez.
  `MONGODB_URI` yoksa hiçbir şey değişmez, doğrudan eski gibi çalışır.
- **Roller:** Render üzerinde çalışan düğüm **yedek** (`HA_ROLE=standby`), diğer her yer (VDS) **birincil**dir. MongoDB'ye ulaşılamayan bir
  yedek asla lider olmaz. Birincil ise MongoDB'ye 2 dakika (`HA_BOOT_FAILOPEN_MS`) ulaşamazsa kirasız başlar; böylece MongoDB kesintisi
  tek başına botu düşürmez. MongoDB geri gelince kira kontrol edilir, kira başka makinedeyse bu süreç kendini kapatır.
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
| `MONGODB_URI` | **İkisinde aynı** MongoDB bağlantı adresi (HA'yı bu açar) |
| `HA_NODE_NAME` | İsteğe bağlı. Varsayılan: Render'da `render`, VDS'de makine adı. Her makinede farklı olmalı. |
| `HA_ENABLED` | İsteğe bağlı. `0` yazarsan HA tamamen kapanır. |

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

Kod `main`'e girince VDS'nin mevcut otomatik deploy'u onu çeker ve yeniden başlar; başlatma komutunu değiştirmek gerekmez.
VDS'nin `.env` dosyasında yalnızca `MONGODB_URI` bulunmalı. Daha önce yoksa ekle: ilk açılışta mevcut veri depo dosyadan
MongoDB'ye otomatik taşınır (`Store` bunu zaten yapıyor). Render'da kullandığın adresin **aynısını** yaz.

İstersen `deploy/` klasöründeki PM2/systemd şablonlarını da kullanabilirsin (süreç çökerse veya VDS yeniden başlarsa otomatik açılır).

## Bilmen gerekenler

- **Web alan adı:** `ekoyildiz.duckdns.org` VDS'nin IP'sine bağlıdır. VDS ölünce **bot ve zamanlayıcılar otomatik devralınır**, ama
  alan adı Render'a otomatik yönlenmez; site Render adresinden (`*.onrender.com`) erişilebilir olur. Alan adının da otomatik
  geçmesini istiyorsan DNS'i (örn. Cloudflare) Render'a yönlendirecek şekilde taşımak gerekir.
- **MongoDB kesintisi:** Lider MongoDB'ye ulaşamazsa çalışmaya devam eder ama devralma mekanizması çalışmaz. MongoDB kapalıyken VDS
  yeniden başlarsa 2 dakika sonra kirasız (tek başına) açılır; Render ise MongoDB'yi göremediği sürece bekler. Çok nadir bir durumda
  (VDS MongoDB'yi göremiyor ama Render görüyor) kısa süre iki bot çalışabilir; VDS MongoDB'yi görür görmez kendini kapatır.
- **Önceden kurulu Render servisi:** Render'da bu bota ait eski bir servis zaten çalışıyorsa aynı bot token'ıyla çift bot (her mesaja
  iki cevap) oluşur. Yeni servis kurmak yerine eskisini bu rehbere göre güncelle veya durdur.
- **Süreler:** `HA_LEASE_TTL_MS` (varsayılan 35000) kısaltılırsa devralma hızlanır ama geçici ağ takılmalarında gereksiz devralma riski artar.
- **Yansıtılmayan dosyalar:** `maintenance.json`, `last_restart_state.json`, `domain_monitor_state.json`, `store.json` makineye özgü olduğu için
  yansıtılmaz.
- **Doğrulama:** Kurulumdan sonra VDS'de botu durdurup (`pm2 stop sentara`) Render günlüklerinde "LİDER oldum (devralma)" satırını bekle,
  sonra VDS'yi tekrar başlat; "yedek modda" kalmalı.
