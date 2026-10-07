# Kesintisiz Çalışma Runbook'u (bot + web)

Bu belge sistemin kendi kendini nasıl onardığını ve **VDS kapanırsa** ne yapılacağını anlatır.
Önce neyin otomatik, neyin ek kaynak (ikinci makine, veritabanı) gerektirdiğini ayırıyoruz.

## 1. Katmanlar

| Katman | Ne yapar | Süreci yeniden başlatır mı? | Durum |
|---|---|---|---|
| **Uygulama içi onarım** (`bot/services/selfHealingService.js`) | Discord koparsa aynı süreçte `destroy()+login()` ile yeniden bağlar. Web sunucusu dinlemeyi bırakırsa aynı portta yeniden dinletir, takılı bağlantıları temizler. Başarısız onarımda üstel geri çekilmeyle denemeye devam eder. | **Hayır** | Kodda aktif |
| **Bakım modu** (`server/services/maintenanceService.js`) | Aşırı yük/bellek/disk sorununda site kontrollü bakım ekranına geçer, acil sistemler (durum, destek, itiraz, yardım, giriş) açık kalır. | Hayır | Kodda aktif (main'e alınınca) |
| **Süreç denetçisi** (`deploy/ecosystem.config.js` veya `deploy/sentara.service`) | Süreç çökerse veya VDS yeniden başlarsa botu otomatik ayağa kaldırır. | Evet, ama yalnızca son çare | Sunucuda **kurulum gerekir** |
| **Dış izleyici** (`deploy/github-uptime-watchdog.yml`) | VDS tamamen kapansa bile GitHub'ın sunucularından 5 dakikada bir sağlık kontrolü yapar, Discord'a haber verir. | Hayır | **Kurulum gerekir** (aşağıda) |
| **Başka makinede otomatik devralma** (`haBoot.js`) | VDS ölünce ikinci makine (örn. Render) ~35–45 sn içinde botu ve siteyi devralır, `data/*.json` dosyalarını MongoDB'den geri yükler. | Hayır (yedek makine zaten ayakta bekler) | Kodda hazır, **kurulum gerekir:** `docs/HA_RENDER_KURULUM.md` |

Süreç içinden VDS'yi ayağa kaldırmak mümkün değildir: makine kapalıysa kod da çalışmıyordur.
Bu yüzden VDS düşmesine karşı çözüm her zaman **makinenin dışında** bir şeydir (dış izleyici, ikinci makine).

## 2. Bir kerelik kurulum (sunucuda)

1. **Süreç denetçisi:** `pm2 start deploy/ecosystem.config.js && pm2 save && pm2 startup`
   (`pm2 startup` çıktısındaki komutu çalıştır; VDS yeniden başlayınca bot kendiliğinden açılır.)
   PM2 yerine systemd istersen `deploy/sentara.service` içindeki yolları düzeltip etkinleştir.
   **İkisini birden çalıştırma**, bot iki kopya olur ve her mesaja iki kez cevap verir.
2. **Dış izleyici:** `deploy/github-uptime-watchdog.yml` dosyasını `.github/workflows/uptime-watchdog.yml` olarak kopyala,
   repo ayarlarından `HEALTH_URL` (örn. `https://ekoyildiz.duckdns.org/api/health`) ve `ALERT_WEBHOOK_URL` (Discord kanal webhook'u) değerlerini ekle.
3. **Uyarı webhook'u:** Aynı `ALERT_WEBHOOK_URL` değerini botun ortam değişkenlerine de ekle. Discord kapalıyken bile
   onarım uyarıları bu webhook ile gider.

### Ortam değişkenleri

| Değişken | Anlamı |
|---|---|
| `ALERT_WEBHOOK_URL` | Discord'dan bağımsız uyarı kanalı (gateway kapalıyken de çalışır) |
| `SELF_HEAL_ALERT_CHANNEL_ID` | Discord hazırsa ayrıca uyarı yazılacak kanal (varsayılan: sistem izleme kanalı) |
| `SELF_HEAL_EXIT_ON_FAIL=1` | Kalıcı arızada son çare olarak süreci kapatır (PM2/systemd yeniden açar). Varsayılan kapalı. |
| `MONGODB_URI` | Verinin VDS dışında tutulması için (bölüm 3) |

## 3. VDS kapanırsa / yok olursa

**Veri nerede?** `MONGODB_URI` tanımlı değilse veri VDS'deki dosyalardadır (`data/`). VDS yok olursa veri de gider.
`models/db.js` MongoDB desteği içerir; ücretsiz bir bulut MongoDB (örn. Atlas) kullanıp `MONGODB_URI` tanımlamak,
verinin makineden bağımsız yaşaması için en önemli adımdır. Bu kod yolunun canlıda gerçekten her yazmayı
senkronladığını kurulumdan sonra bir kez doğrula.

**Hazır bir yedek makine varsa (elle devralma, ~5 dk):**

```bash
git clone https://github.com/thr3aeat/bemsentara.git && cd bemsentara
cp <yedeklediğin>.env .env          # aynı MONGODB_URI ve token'lar
npm ci --omit=dev
pm2 start deploy/ecosystem.config.js && pm2 save && pm2 startup
# Alan adı DuckDNS ise yeni makinenin IP'sine çevir:
curl "https://www.duckdns.org/update?domains=ekoyildiz&token=<DUCKDNS_TOKEN>"   # IP'yi çağıran makineden alır
```

**Önemli:** Eski VDS geri gelirse önce orada botu durdur (`pm2 stop sentara`), yoksa aynı bot token'ı iki yerde
çalışır ve her şey çift gönderilir.

**Otomatik devralma** için `docs/HA_RENDER_KURULUM.md` içindeki aktif/yedek kurulumunu yap; bu elle adımların çoğunu gereksiz kılar.

## 4. Sen yokken sistem

- `.env` dosyasının şifreli bir kopyasını ve bu belgeyi güvendiğin bir kişiyle paylaş.
- Barındırma panelinde, GitHub repo'sunda ve Discord botunda en az bir yetkili daha bulunsun.
- Dış izleyici uyarılarını tek kişiye değil bir yetkili kanalına yönlendir.
