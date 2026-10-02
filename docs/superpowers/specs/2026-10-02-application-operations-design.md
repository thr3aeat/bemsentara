# Başvuru Operasyon Merkezi ve Güvenli Mülakat Onayı Tasarımı

## Amaç

Admin panelindeki doldurulan başvuru formlarını güvenilir, düzenli ve site temasıyla uyumlu bir operasyon merkezine dönüştürmek; adaya gönderilen Discord mesajlarını accentsiz Components v2 biçimine taşımak; mülakat öncesi site üzerinden kimlik doğrulamalı onay ve çizim imzası almak.

Başarı ölçütleri:

- Başvurular ekranı sekme açıldığında veriyi yükler ve hiçbir hata durumunda süresiz `Yükleniyor…` göstermez.
- Admin, adayları soldaki kuyruktan bulup sağdaki tek aday dosyasında inceleyebilir.
- Onay, ret, soru, zaman planlama ve bildirim işlemleri açık bir süreç sırasına uyar.
- Aday, Discord hesabı ve kişiye özel bağlantıyla doğrulanmadan başvuru onayı veya imza veremez.
- Mülakat, gerekli site onayı ve çizim imzası tamamlanmadan ilerletilemez.
- Kullanıcıya giden ilgili Discord mesajları accentsiz Components v2 kullanır ve site içindeki ilgili kaynaklara bağlanır.

## Mevcut Sorun ve Kök Neden

Yeni Admin Control Center kabuğu, başvuru çalışma alanını `server/views.js` içindeki eski inline HTML ve JavaScript bloğundan göstermektedir. Yeni navigasyon çalışma alanını görünür yaparken eski `loadSubmissions()` başlangıcını çağırmadığı için başvuru listesi ilk açılışta `Yükleniyor…` durumunda kalabilmektedir. Başvuru arayüzü, API çağrıları, modal üretimi ve işlem mantığının aynı büyük dosyada bulunması bu hatanın test edilmesini ve yeni akışların güvenli eklenmesini zorlaştırmaktadır.

## Seçilen Yaklaşım

Başvuru yönetimi, mevcut Control Center ve veri modeli korunarak bağımsız bir modüle ayrılacaktır. Tüm admin panelini yeni bir SPA olarak yazmak veya legacy bloğu büyütmek kapsam dışıdır.

Modül sınırları:

- Sunucu görünümü: Başvuru çalışma alanının semantik HTML iskeleti.
- Admin istemcisi: Liste yükleme, filtreleme, aday seçimi, ayrıntı gösterimi ve işlemler.
- Admin stili: Control Center temasıyla uyumlu, bağımsız ve duyarlı stil katmanı.
- Başvuru operasyon servisi: Liste, ayrıntı, durum geçişi, token ve bildirim orkestrasyonu.
- Başvuru route modülü: Admin API uçları ile adayın onay/imza sayfası ve API uçları.
- Mesaj üreticisi: Tüm başvuru ve mülakat Components v2 payload’larının tek kaynağı.

## Admin Deneyimi

Seçilen masaüstü düzeni “kuyruk + aday dosyası”dır.

### Sol sütun: aday kuyruğu

- Serbest metin araması
- Form türü, durum ve tarih filtresi
- Bekleyen, onay/imza bekleyen, mülakata hazır, tamamlanan ve reddedilen durumları
- Aday adı, form adı, güncel aşama ve son güncelleme zamanı
- Boş, yükleniyor, hata ve sonuç bulunamadı durumları

### Sağ sütun: aday dosyası

- Özet
- Form Yanıtları
- Mülakat
- İmza ve Onay
- İşlem Geçmişi

Ana eylemler adayın mevcut aşamasına göre gösterilir. Süreç sırasına aykırı eylemler yalnızca görsel olarak kapatılmaz; sunucu tarafında da reddedilir. Mobil ekranda kuyruk ve aday dosyası art arda yerleşir; aday dosyasından kuyruğa dönüş açık bir kontrolle sağlanır.

## Aday Onay ve İmza Deneyimi

Seçilen düzen, mobil öncelikli rehberli üç adımdır:

1. Aday ve mülakat bilgilerini doğrula.
2. Taahhütleri ve ilgili kaynakları inceleyip kabul et.
3. Fare, kalem veya dokunmatik ekranla imzayı çiz ve gönder.

Sayfada adayın adı, başvurduğu ekip, başvuru referansı ve planlanan mülakat zamanı gösterilir. Dokümantasyon, topluluk kuralları, yardım merkezi ve blog bağlantıları aynı ekranda erişilebilir olur. İmza tamamlandığında kullanıcı açık bir başarı ekranı ve sonraki adımlar bilgisi görür.

## Güvenlik Modeli

- Admin “Site onayı gönder” işlemini başlattığında kriptografik olarak güçlü, tek kullanımlık bir token üretilir.
- Ham token saklanmaz; SHA-256 hash’i, başvuru kimliği, Discord kullanıcı kimliği, oluşturulma ve sona erme zamanı saklanır.
- Token 24 saat geçerlidir. Admin, önceki kullanılmamış tokenı geçersiz kılarak yeni bağlantı gönderebilir.
- Aday Discord oturumu yoksa OAuth girişine gider ve güvenli dönüş adresiyle onay sayfasına döner.
- Oturumdaki Discord ID, tokenın bağlı olduğu başvuru sahibiyle eşleşmelidir.
- Kullanılmış, süresi dolmuş, değiştirilmiş veya başka kullanıcıya ait token işlem yapamaz.
- Durum değiştiren tüm istekler mevcut origin/CSRF korumalarına tabidir.
- İmza istemciden hazır HTML/SVG olarak kabul edilmez. Sınırlandırılmış çizgi/nokta verisi doğrulanır ve sunucu tarafında PNG çıktısına dönüştürülür.
- Boş çizim, izin verilen boyutu aşan veri, geçersiz koordinat veya aşırı nokta sayısı reddedilir.
- İmza dosyası tahmin edilemeyen doğrudan URL yerine yetkili admin endpoint’i üzerinden görüntülenir.
- İmza kaydına SHA-256 dosya hash’i, imzalayan Discord ID ve imza zamanı eklenir.

## Durum Akışı

Başvurunun mevcut `PENDING`, `APPROVED`, `REJECTED` ve `AI_DETECTED` üst durumları geriye uyumluluk için korunur. Ayrıntılı operasyon aşaması ayrı `workflowState` alanında tutulur:

- `SUBMITTED`
- `UNDER_REVIEW`
- `SITE_APPROVAL_SENT`
- `SITE_APPROVAL_COMPLETED`
- `INTERVIEW_SCHEDULED`
- `INTERVIEW_READY`
- `INTERVIEW_FINISHED`
- `ACCEPTED`
- `REJECTED`

Eski kayıtlarda `workflowState` yoksa mevcut status ve interview alanlarından güvenli bir görüntüleme aşaması türetilir. Kalıcı geçiş ancak yeni bir admin veya aday işlemi gerçekleştiğinde yazılır.

Mülakatı kabul etme veya bitirme işlemleri için `SITE_APPROVAL_COMPLETED` ve geçerli imza kaydı zorunludur. Zaman planlama onaydan önce yapılabilir; `INTERVIEW_READY` ancak zaman, onay ve imza birlikte mevcutsa oluşur.

## Veri Akışı

1. Admin aday dosyasını açar ve site onay isteğini gönderir.
2. Servis yeni token kaydını oluşturur, önceki açık tokenları geçersiz kılar ve işlem geçmişine kayıt düşer.
3. Mesaj üreticisi accentsiz Components v2 payload’ı oluşturur.
4. Bot, adaya kişiselleştirilmiş mesajı ve site bağlantısını gönderir.
5. Aday bağlantıyı açar, Discord OAuth ile doğrulanır ve üç adımlı akışı tamamlar.
6. Sunucu taahhütleri, tokenı, kullanıcı kimliğini ve çizimi yeniden doğrular.
7. İmza PNG olarak üretilir; hash ve audit bilgileri başvuruya bağlanır; token tüketilir.
8. Başvurunun iş akışı uygun aşamaya ilerletilir ve admin görünümü yenilenir.
9. Adaya tamamlanma mesajı gönderilir. Mesaj gönderilemezse onay işlemi geri alınmaz; bildirim durumu yeniden denenebilir olarak kaydedilir.

## Discord Components v2 Tasarımı

Başvuru ile ilgili yeni veya dönüştürülen kullanıcı mesajları `ComponentsV2Factory` üzerinden üretilecektir.

- Container üzerinde `accent_color` bulunmaz.
- Eski embed fallback’i yalnızca Discord API’nin V2 mesajını teknik olarak reddettiği kanıtlanmış uyumluluk durumlarında kullanılır; normal akış değildir.
- Başlık, adayın adı, form/ekip, güncel aşama ve tek birincil eylem açık biçimde gösterilir.
- Link butonları bağlama göre `/forms`, aday onay sayfası, herkese açık `/help/moderation`, `/yardim`, `/blog` ve `/video-blog` hedeflerini kullanır. Yetkili girişi isteyen `/staff/docs` aday mesajlarında kullanılmaz.
- Mesaj sonu adayın adı ve başvuru referansıyla kişiselleştirilir; kurum imzası “EkoYıldız People & Community” olur.
- Ret ve hata mesajlarında neden açıklanır; kullanıcı çıkmazda bırakılmaz ve uygun yardım bağlantısı sunulur.

## Hata Yönetimi

- Admin liste ve ayrıntı istekleri 12 saniyede zaman aşımına uğrar.
- Her yüklenebilir alan `idle`, `loading`, `ready`, `empty` veya `error` durumlarından birini gösterir.
- Hata, önceki başarılı içeriği gereksiz yere silmez ve “Tekrar dene” eylemi sunar.
- JSON olmayan veya yetkisiz API yanıtları güvenli, anlaşılır mesajlara çevrilir.
- İşlem düğmeleri istek sürerken kilitlenir ve çift gönderim sunucu tarafında idempotency kontrolüyle engellenir.
- Bot çevrimdışı veya DM kapalıysa esas admin/adayı onaylama işlemi tutarlı kalır; bildirim `FAILED` olarak kaydedilir ve admin yeniden gönderebilir.
- İmza dosyası yazılamazsa token tüketilmez ve iş akışı ilerlemez.
- Her başarısız durum sunucu loguna teknik bağlamla, kullanıcı ekranına hassas ayrıntı sızdırmadan yazılır.

## Test Stratejisi

### Birim testleri

- İş akışı geçişleri ve yasak geçişler
- Token oluşturma, hash doğrulama, süre sonu, tek kullanım ve kullanıcı eşleşmesi
- İmza çizgisi doğrulama ve boş/aşırı veri reddi
- Components v2 payload’larında accent color bulunmaması ve doğru linklerin bulunması
- Legacy kayıtlardan görüntüleme aşaması türetme

### Route ve servis testleri

- Admin olmayan kullanıcının tüm admin uçlarından reddedilmesi
- Liste/ayrıntı response sözleşmeleri
- Site onay isteği oluşturma ve yeniden gönderme
- OAuth kullanıcısı ile token sahibinin eşleşmesi
- İmza tamamlandıktan sonra mülakata hazır geçişi
- Bot/DM hatasının ana işlemi bozmaması ve yeniden gönderilebilir kayıt oluşturması

### Görünüm ve istemci testleri

- Başvurular çalışma alanı açıldığında listenin yüklenmesi
- İstek başarısızlığında sonsuz yükleme yerine hata ve yeniden deneme görünmesi
- Arama, form türü ve durum filtreleri
- Aday seçimi ve sağ panel sekmeleri
- Mobil yerleşim için gerekli semantik bağlar
- Adayın üç adımlı onay ve imza ekranının erişilebilir kontrolleri

### Regresyon doğrulaması

- Mevcut admin, form gönderimi ve mülakat testlerinin tamamı
- Node test takımının tamamı
- Başvuru ekranının masaüstü ve mobil görsel kontrolü
- Gerçek tarayıcıda yükleme, hata, boş liste, token süresi dolmuş ve başarılı imza senaryoları

## Kapsam Dışı

- Admin panelinin diğer bölümlerini yeniden yazmak
- Form katalog ve soru içeriklerini baştan tasarlamak
- Hukuken nitelikli elektronik imza sağlamak
- Harici dosya depolama servisi eklemek
- Discord dışı yeni bir kimlik sağlayıcısı eklemek

Çizim imzası bu ürün kapsamında adayın taahhüdünü ve işlem zamanını kaydeden operasyonel onaydır; nitelikli elektronik imza iddiası taşımaz.

## Geçiş ve Geriye Uyumluluk

- Yeni route modülü `server/app.js` içinde mevcut admin route sırasına eklenir.
- Yeni admin çalışma alanı aynı `adm-submissions` hash hedefini korur.
- Yeni API sözleşmesine geçiş sırasında gerekli eski endpoint yolları uyumluluk yönlendirmesi veya ince adaptör olarak kalır.
- Legacy başvuru HTML/JavaScript bloğu ancak yeni modül testleri ve tam takım doğrulaması geçtikten sonra kaldırılır.
- Kullanıcının mevcut `data/` değişikliklerine dokunulmaz; imza depolama dizini uygulama tarafından kontrollü biçimde oluşturulur ve imza içeriği kaynak kontrolüne alınmaz.
