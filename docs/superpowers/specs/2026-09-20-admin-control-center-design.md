# EkoYıldız Admin Control Center Tasarımı

**Tarih:** 20 Eylül 2026
**Durum:** Kullanıcı incelemesi bekleniyor

## 1. Amaç

Mevcut `/admin` sayfasını, çalışan yönetim işlevlerini yeniden yazmadan modern ve güvenilir bir operasyon merkezine dönüştürmek. Başarılı sonuç; yöneticinin canlı durumu birkaç saniyede anlayabildiği, bekleyen işleri bulabildiği, kullanıcı veya personel üzerinde güvenli işlem yapabildiği ve farklı yönetim sayfalarına kaybolmadan ulaşabildiği bir kontrol panelidir.

Bu çalışma yalnızca görsel makyaj değildir. Bilgi mimarisi, işlem güvenliği, veri sunumu, hata durumları, erişilebilirlik ve responsive davranış birlikte ele alınacaktır.

## 2. Korunacak Sistemler

Aşağıdaki davranışlar değiştirilmeyecektir:

- `/admin` erişiminde mevcut `isSiteAdmin` yetki kontrolü.
- Discord OAuth, site oturumu ve authentication akışları.
- Mevcut kullanıcı, rol, ban, coin, hesap aktarımı ve form endpoint sözleşmeleri.
- Ticket, Discord botu, çekiliş, reklam ve grup yönetimi servislerinin iş mantığı.
- Mevcut mutation işlemlerinin sunucu tarafı doğrulamaları.
- `/admin` adresi ve eski sekme/hash bağlantıları.

Çalışan özellikler yeni bir sistemle kopyalanmayacak. Yeni arayüz mevcut endpointleri tüketir; yalnızca kontrol merkezi özet verileri için tek bir read-only aggregator endpoint eklenir.

## 3. Mevcut Durum

Mevcut admin sayfasında şu işlevler vardır ancak uzun yatay sekmeler, yoğun inline stiller ve birbirinden kopuk formlar nedeniyle keşfedilmeleri zordur:

- Aktif ve inaktif kullanıcı istatistikleri.
- Kullanıcı arama ve rol yönetimi.
- Personel geri alma ve moderatör okulu işlemleri.
- Hesap aktarımı.
- Coin verme.
- Site/Discord ban yönetimi.
- Panel formları ve doldurulan başvurular.
- Avukat alım otomasyonu.
- Grup değişiklikleri ve geri alma araçları.
- Debug sayfası ve çeşitli ayrı yönetim ekranlarına bağlantılar.

Sayfa içindeki bazı istatistik çağrıları için görünür bir API karşılığı bulunmadığından dashboard değerleri boş veya hata durumunda kalabilir. Yeni kontrol merkezi bu verileri doğrulanmış modellerden üreten tek bir özet servisi kullanacaktır.

## 4. Önerilen Bilgi Mimarisi

### 4.1 Uygulama kabuğu

Admin sayfası üç ana bölgeden oluşur:

1. **Daraltılabilir sol sidebar:** çalışma alanları, durum rozetleri ve hızlı bağlantılar.
2. **Üst komuta çubuğu:** admin araması, hızlı işlem menüsü, veri yenileme durumu ve yönetici kimliği.
3. **Ana çalışma alanı:** seçilen modülün dashboard veya yönetim yüzeyi.

Desktop görünümde sidebar sabittir. Tablet ve mobilde drawer olarak açılır. Ana içerik yatay taşmaz; geniş tablolar kart görünümüne veya kontrollü yatay kaydırmaya dönüşür.

### 4.2 Navigasyon grupları

**Genel**

- Genel Bakış
- Canlı Operasyon
- Bildirimler / Bekleyen İşler

**İnsanlar**

- Kullanıcılar
- Personel
- Banlar ve Güvenlik
- Ekonomi

**Operasyon**

- Ticket’lar
- Başvurular
- Panel Formları
- Otomasyonlar
- Grup Değişiklikleri

**İçerik ve Topluluk**

- Reklam / Sponsor Yönetimi
- Çekiliş Yönetimi
- Blog / Video Blog bağlantıları
- Formlar ve personel alımları

**Sistem**

- Servis Durumu
- Audit / Aktivite Akışı
- Debug Araçları
- Site Ayarları

Ayrı ve çalışan yönetim sayfaları iframe veya duplicate ekran olarak gömülmez. Sidebar bu sayfalara bağlanır; kullanıcı aynı admin kabuğunda nerede olduğunu anlayacak görsel hiyerarşiyi korur.

## 5. Genel Bakış Dashboard’u

İlk ekran aşağıdaki bölümlerden oluşur:

### 5.1 Üst özet kartları

- Son 24 saatte aktif kullanıcı.
- Açık ticket.
- Bekleyen form/başvuru.
- Aktif ban.
- Personel durumu.
- Kritik servis uyarısı.

Her kart gerçek API verisi kullanır. Veri yoksa `0` ile başarı taklidi yapmak yerine “Henüz veri yok” veya “Servise ulaşılamadı” durumu gösterilir.

### 5.2 Operasyon kuyruğu

Yöneticinin işlem bekleyen öğeleri öncelik sırasıyla gösterilir:

- Yanıt bekleyen veya uzun süredir açık ticket’lar.
- İnceleme bekleyen başvurular.
- Çözümlenmemiş hata raporları.
- Süresi yaklaşan personel izinleri veya görüşmeler.
- Servis sağlığı uyarıları.

İlk pakette yalnızca mevcut modellerden güvenilir şekilde hesaplanabilen kuyruk türleri gösterilir. Kaynağı olmayan metrik üretilmez.

### 5.3 Canlı kullanıcılar

- Kullanıcı adı ve avatar.
- Son görülme zamanı.
- Mevcut sayfa veya aktivite türü, sistemde gerçekten kayıtlıysa.
- IP adresi yalnızca mevcut güvenlik/yetki politikası izin veriyorsa ve tam değer yerine maskelenmiş biçimde.
- Kullanıcı detayına hızlı geçiş.

### 5.4 Son yönetim işlemleri

Audit kayıtlarından son güvenli işlemler gösterilir: ban, rol, coin, form değerlendirmesi ve hesap aktarımı. Hassas payload arayüze taşınmaz.

### 5.5 Hızlı işlemler

- Kullanıcı bul.
- Ticket’lara git.
- Başvuruları incele.
- Ban oluştur.
- Coin ver.
- Çekiliş yönetimine git.
- Reklam yönetimine git.

## 6. Çalışma Alanları

### 6.1 Kullanıcı ve personel

Kullanıcı araması tek alanda Discord adı, Discord ID veya site kullanıcı adı kabul eder. Sonuç kartında kimlik, hesap bağlantı durumu, site rolleri, ban durumu ve son aktivite görünür.

Rol düzenleme, personel geri alma, mod okulunu tamamlama ve hesap aktarımı ayrı araç kartlarına ayrılır. Hesap aktarımı gibi yüksek riskli işlem doğrudan çalışmaz; önce kaynak ve hedef hesabı özetleyen bir doğrulama ekranı gösterir.

### 6.2 Ban ve güvenlik

Aktif banlar filtrelenebilir liste halinde gösterilir. Site ve Discord kapsamı açık rozetlerle belirtilir. Ban kaldırma ve yeni ban işlemleri işlem özeti, sebep zorunluluğu ve ikinci onay kullanır.

### 6.3 Ekonomi

Coin verme aracı kullanıcıyı önce doğrular, ardından miktar ve sebep ister. Hızlı miktarlar korunur. İşlem sonrası gerçek API yanıtından oluşan makbuz kartı gösterilir.

### 6.4 Formlar ve başvurular

Bekleyen, onaylanan, reddedilen ve AI inceleme işaretli başvurular filtrelenir. Detaylar erişilebilir drawer içinde açılır. Onay/red işlemleri mevcut endpointleri kullanır; kullanıcıya gidecek not işlem öncesi özetlenir.

### 6.5 Ticket operasyonu

Admin dashboard ticket sistemini yeniden uygulamaz. Mevcut `/tickets` ve personel araçlarına hızlı erişim verir; kontrol merkezi özet endpointi yalnızca açık, bekleyen ve eskimiş ticket sayılarını sağlar.

### 6.6 İçerik, reklam ve çekiliş

Mevcut reklam ve çekiliş yönetim ekranları tek “İçerik ve Topluluk” grubunda görünür. Durum ve bekleyen öğe sayıları güvenilir kaynak varsa sidebar rozeti olarak gösterilir. Yeni özel reklam bilgilendirme sayfasına önizleme bağlantısı eklenir.

## 7. Görsel Tasarım Sistemi

- Koyu, premium ve kontrollü liquid-glass yüzeyler.
- Ana vurgu rengi mor; başarı yeşil, uyarı amber, tehlike kırmızı.
- Renk yalnızca anlam taşımak için kullanılır; metin ve ikon desteği her zaman bulunur.
- 12–18 px yüzey radiusları; aşırı yuvarlak veya neon görünüm yoktur.
- Yoğun veride kartlar, tablolar ve ayrıntı drawer’ları kullanılır.
- Skeleton yükleme, dürüst empty state ve bağlantı hatası kartları aynı tasarım diline sahiptir.
- Hover efektleri hafif; `prefers-reduced-motion` desteklenir.
- Klavye ile sidebar, sekmeler, modal/drawer ve komut paleti kullanılabilir.
- Mobilde en önemli özetler önce gelir; destructive işlemler küçük ekranda da yanlış dokunmaya karşı korunur.

## 8. Komut Paleti ve Admin Araması

`Ctrl/Cmd + K`, public site aramasından ayrı bir admin komut paleti açar. Palet:

- Admin modüllerine gider.
- Kullanıcı araması başlatır.
- Hızlı işlem ekranlarını açar.
- Yetkisiz komutları göstermez.

İlk sürümde palet client-side tanımlı modül/aksiyon listesini kullanır. Kullanıcı araması seçildiğinde mevcut `/api/admin/users` endpointine gider. Genel public arama sistemiyle duplicate içerik indeksi oluşturulmaz.

## 9. Veri ve API Tasarımı

Yeni read-only endpoint:

`GET /api/admin/control-center`

Örnek yanıt alanları:

```json
{
  "success": true,
  "generatedAt": "2026-09-20T12:00:00.000Z",
  "summary": {
    "activeUsers24h": 0,
    "openTickets": 0,
    "pendingSubmissions": 0,
    "activeBans": 0,
    "activeStaff": null
  },
  "liveUsers": [],
  "queue": [],
  "recentActions": [],
  "services": []
}
```

Kurallar:

- Endpoint yalnızca `isSiteAdmin` kullanıcılara açıktır.
- Her bölüm bağımsız hata sınırına sahiptir; bir modelin hatası tüm dashboard’u düşürmez.
- Hesaplanamayan değer `null` döner ve arayüz “Veri alınamadı” gösterir.
- IP, token, session, OAuth ve hassas log içeriği response’a eklenmez.
- Mutation endpointleri değiştirilmez.
- Arayüz açılışta yükler, görünürken 30 saniyede bir yeniler ve manuel yenileme sunar.

## 10. Durum, Hata ve Empty State’ler

Her modül şu durumlara sahip olur:

- İlk yüklenme: skeleton.
- Başarılı ve veri var: gerçek içerik.
- Başarılı fakat veri yok: açıklayıcı empty state ve ilgili aksiyon.
- Bölümsel hata: yalnızca ilgili kartta hata ve yeniden dene.
- Yetki kaybı / 401–403: işlem durdurulur ve güvenli giriş yönlendirmesi gösterilir.
- Ağ hatası: kullanıcı verisi kaybolmadan tekrar deneme.

İşlem butonlarında double-submit engellenir. Sunucu yanıtı alınmadan başarı bildirimi gösterilmez.

## 11. Güvenlik ve İşlem Koruması

- Mevcut sunucu tarafı admin kontrolü her endpointte korunur.
- Destructive işlemler için tek tip onay modalı kullanılır.
- Ban, hesap aktarımı ve rol değişikliğinde hedef kullanıcı açıkça gösterilir.
- Onay butonu kısa süreli disable edilir ve çift gönderim engellenir.
- API hataları HTML olarak basılmaz; güvenli metin olarak gösterilir.
- Kullanıcı adları ve dış kaynaklı metinler escape edilir.
- Audit görünümünde hassas alanlar redakte edilir.

## 12. Backward Compatibility

- `/admin` aynı kalır.
- Eski `adm-*` bölüm kimlikleri ve hash bağlantıları yeni navigation resolver tarafından karşılanır.
- Inline `onclick` çağrılarını kullanan mevcut aksiyon fonksiyonları ilk aşamada korunur; görsel kabuk bunları çağırmaya devam eder.
- Mutation payload ve response beklentileri değiştirilmez.
- Ayrı `/debug`, çekiliş admini ve grup admin sayfaları çalışmaya devam eder.

## 13. Uygulama Sınırları

Bu paket şunları içerir:

- Yeni admin kabuğu ve dashboard.
- Mevcut tüm admin sekmelerinin yeni çalışma alanı düzenine taşınması.
- Read-only control-center özet servisi ve endpointi.
- Admin komut paleti.
- Güvenli onay modalı ve ortak feedback sistemi.
- Responsive, erişilebilir ve empty-state destekli görünüm.
- Özel reklam sayfası için admin önizleme bağlantısı.

Bu paket şunları içermez:

- Authentication veya permission modelinin yeniden tasarlanması.
- Yeni bir React/Vue SPA veya build sistemi.
- Mevcut bot/ticket/form iş mantığının yeniden yazılması.
- Gerçek kaynağı olmayan analitik veya tahmini sayı üretimi.
- Ayrı yönetim sayfalarının işlevlerinin kopyalanması.

## 14. Test Stratejisi

- Admin route permission regresyon testi.
- Control-center aggregator için gerçek model davranışlarını izole eden unit testler.
- Eksik model/veri durumunda `null` ve empty-state testleri.
- Admin HTML’inde sidebar, özet kartları, komut paleti ve eski bölüm kimliklerinin varlık testleri.
- Kullanıcı verisinin escape edildiği güvenlik testi.
- Destructive işlem modalının hedef ve sebep göstermesi testi.
- Mevcut admin endpoint testlerinin regresyon çalıştırması.
- Desktop ve mobil viewport’ta yatay taşma ve navigasyon görsel kontrolü.
- Sözdizimi, `git diff --check` ve ilgili Node test paketi doğrulaması.

## 15. Teslim Sırası

1. Control-center veri servisi ve endpointi.
2. Admin uygulama kabuğu, sidebar ve üst komuta çubuğu.
3. Genel bakış dashboard’u ve operasyon kuyruğu.
4. Mevcut kullanıcı, personel, ban ve ekonomi araçlarının yeni yüzeye taşınması.
5. Form, başvuru, otomasyon ve grup logu alanlarının iyileştirilmesi.
6. İçerik/topluluk bağlantıları ve admin komut paleti.
7. Ortak hata, empty-state ve güvenli onay sistemi.
8. Responsive/görsel doğrulama ve regresyon testleri.

Bu sıra, çalışan sistemin her aşamada kullanılabilir kalmasını ve hata durumunda değişikliğin küçük parçalar halinde incelenebilmesini sağlar.
