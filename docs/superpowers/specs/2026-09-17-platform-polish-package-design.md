# EkoYıldız Platform Polish — İlk Geliştirme Paketi Tasarımı

## Amaç

Mevcut EkoYıldız web sitesini yeniden yazmadan; çalışan route, authentication, Discord OAuth/bot, ticket, permission ve API davranışlarını koruyarak public platform, bilgi merkezleri ve dashboard deneyimini daha düzenli, erişilebilir ve kurumsal bir ürün seviyesine yükseltmek.

Bu paket yeni bir site kurmaz. Var olan sayfaları ortak bir tasarım dili, daha anlaşılır navigasyon ve gerçek içerik/veri akışlarıyla olgunlaştırır.

## Değişmez Uyumluluk Kuralları

- Mevcut URL'ler kaldırılmayacak veya anlamı değiştirilmeden taşınmayacak.
- Authentication, session, Discord OAuth, Discord DM doğrulaması ve site hesabı akışlarının endpoint sözleşmeleri korunacak.
- Discord bot entegrasyonları, ticket lifecycle, form gönderimleri, permission kontrolleri ve admin/staff authorization yalnızca görsel katmana bırakılmayacak.
- Backend'de bulunmayan metrik, servis durumu, ekip üyesi veya moderasyon verisi üretilmeyecek.
- Mevcut içerikler silinmeyecek; sunum, metadata, ilişkilendirme ve bulunabilirlik katmanları geliştirilecek.
- Çalışan özelliklerin yerine mock buton ya da statik gösterim konulmayacak.
- Değişiklikler küçük, bağımsız ve regresyon testleriyle doğrulanabilir dilimler halinde uygulanacak.

## Mevcut Yapının İlk Sınıflandırması

### EXISTS_AND_WORKS

- `/dashboard`, `/blog`, `/video-blog`, `/help/:topic?`, `/appeals`, `/status`, `/wiki` ve mevcut auth route'ları.
- Ticket, forms, Discord bot ve permission altyapıları.
- Ortak `_layout` fonksiyonu ile temel header/footer yapısı.
- Safety rehber verileri ve konu sayfaları.

### EXISTS_BUT_NEEDS_IMPROVEMENT

- Ortak header, footer, mobil navigation ve aktif sayfa hiyerarşisi.
- Blog ile video-blog arasındaki editoryal ilişki.
- Dashboard bilgi yoğunluğu, loading/empty/error durumları ve responsive davranış.
- Help/Safety merkezleri arasındaki geçişler, ortak arama ve içerik metadata'sı.
- Status sayfasındaki gerçek veri bağlantısı bulunmayan durumların sunumu.

### EXISTS_BUT_BROKEN

- `/safety` şu anda bağımsız bir Safety Center girişine sahip olmayıp `/yardim` adresine yönleniyor.
- Çekiliş admin panelindeki `userActivityLogs` export hatası ayrı bir P0 düzeltmesi olarak giderildi ve regresyon testi eklendi.

### PARTIALLY_IMPLEMENTED

- Global içerik araması ve komut paleti.
- Safety, Help, blog ve wiki içeriklerinin ortak sonuç modelinde aranması.
- Ortak tasarım token'larının bütün public ve dashboard yüzeylerinde tutarlı kullanımı.

## Bilgi Mimarisi

### Help Center

Help Center ürün ve kullanım odaklı kalacaktır:

- hesap ve giriş sorunları;
- Discord hesabı bağlama ve doğrulama;
- EkoYıldız Bot komutları ve izinleri;
- panel özellikleri;
- ticket ve form kullanımı;
- sorun giderme ve destek alma.

Mevcut `/help/:topic?` adresleri korunur. Mevcut `/yardim` içeriği incelenerek kullanım odaklı sayfalar Help Center'a ait navigasyon ve arama kategorileriyle işaretlenir; URL zorunlu olmadıkça taşınmaz.

### Safety Center

Safety Center güvenlik ve Trust & Safety odaklı ayrı bir merkez olacaktır:

- hesap güvenliği, phishing ve scam korunması;
- Discord/Roblox/topluluk güvenliği;
- Fair Play ve topluluk davranışı;
- moderasyon süreçleri;
- raporlama, kanıt toplama ve itiraz rehberleri;
- politikalar ve gizlilik kaynakları.

`/safety`, yeni profesyonel Safety Center giriş route'u olur. Mevcut Safety rehberlerinin kanonik URL'leri ilk aşamada değiştirilmez. `/yardim/<safety-slug>` gibi kullanımda olan bağlantılar çalışmaya devam eder ve yeni Safety Center'dan bu sayfalara ulaşılabilir. Yeni kanonik route eklenirse eski URL kalıcı redirect veya alias ile korunur; link taraması ve test yapılmadan yön değiştirilmez.

### Ortak Katman

Help ve Safety ayrı merkezlerdir fakat şu öğeleri paylaşır:

- aynı design token ve makale bileşenleri;
- ortak arama indeks formatı;
- breadcrumb, kategori, yazar/güncelleme tarihi ve ilgili içerik modeli;
- merkezler arası bağlamsal yönlendirme;
- aynı erişilebilirlik, klavye ve responsive kuralları.

## Uygulama Aşamaları

### 1. Ortak Layout, Header ve Footer

Mevcut `_layout` korunur ve olgunlaştırılır. Public navigation; Topluluk, Ürünler, Safety, Kaynaklar ve Hakkımızda başlıklarını mevcut gerçek route'lara bağlar. Olmayan sayfalar için ölü link üretilmez. Giriş yapmış kullanıcı için mevcut panel/admin/staff izin davranışı korunur.

Desktop navigation kontrollü dropdown/mega-menu kullanabilir. Mobil görünüm klavye ile açılıp kapanabilen, focus yönetimli bir drawer olur. Footer; Help, Safety, Blog, Status, Privacy/Terms ve mevcut iletişim bağlantılarını sınırlı, anlaşılır gruplarda sunar.

### 2. Help + Safety Bilgi Mimarisi

Mevcut yardım/safety veri kaynakları tek bir içerik deposuna zorla taşınmaz. Önce içerik türleri ve route sahipliği sınıflandırılır. Paylaşılan metadata adaptörü, arama ve kart bileşenlerinin iki kaynaktan da tutarlı veri almasını sağlar.

`/safety` landing sayfası mevcut güvenlik rehberlerini kategori bazında sunar. `/help` kullanım odaklı merkez olarak korunur. Her iki merkezde arama, kategori navigasyonu, ilgili içerikler ve anlaşılır empty state bulunur.

### 3. Blog ve Video Blog

Mevcut `/blog`, `/blog/:slug` ve `/video-blog` route'ları korunur. Blog kartlarına kategori, tarih, yazar/mascot profili, okuma süresi ve ilgili içerik sunumu eklenir. Video blog, ayrı veri türü olarak kalır fakat Blog/Newsroom içinde YouTube filtresi ve karşılıklı bağlantılarla görünür olur.

Paylaşım ve reaksiyon özellikleri mevcut backend destekliyorsa kullanılır; destek yoksa çalışıyormuş gibi gösterilmez. Mevcut içerikler korunur.

### 4. Dashboard Polish

Dashboard'ın mevcut işlevleri ve route'u korunur. İlk görünüm; karşılama, role göre önemli durumlar, bekleyen işlemler, son aktiviteler ve hızlı işlemler şeklinde hiyerarşik hale getirilir. Admin/staff verileri mevcut permission kontrollerine göre görünür.

Kart, tablo, modal ve form alanları mevcut stiller üzerinden standardize edilir. Boş alanlar açıklayıcı empty state; ağ çağrıları loading/skeleton; hatalar tekrar deneme ve ilgili destek bağlantısı gösterir.

### 5. Global Arama

`Ctrl/Cmd + K` ile açılan erişilebilir bir arama diyaloğu eklenir. İlk indeks yalnızca mevcut ve güvenli public içerikleri kapsar:

- Help makaleleri;
- Safety rehberleri;
- blog ve video-blog içerikleri;
- wiki/policy içerikleri.

Sonuç formatı başlık, kategori, breadcrumb, kısa açıklama ve gerçek URL içerir. Arama sunucu verisini kullanıyorsa mevcut auth/permission sınırlarını aşmaz; private staff içeriği normal kullanıcının indeksine girmez.

### 6. Gerçek Veri ve Dürüst Durumlar

Gerçek API veya kalıcı veri bulunan alanlar mevcut kaynaklarına bağlı kalır. Veri bulunmayan status/transparency/metrik alanlarında sahte “Operational” veya hayali sayı yerine bağlantı durumu ve açıklayıcı empty state gösterilir.

İstemci hataları kontrollü mesajlara dönüştürülür; sunucu ayrıntıları kullanıcıya sızdırılmaz. 403, 404 ve 500 deneyimleri mevcut layout ile uyumlu, geri dönüş/support eylemleri olan sayfalara dönüştürülür.

## Tasarım Sistemi

Yeni bir UI framework eklenmez. Mevcut CSS değişkenleri ve bileşen kalıpları şu ortak token gruplarıyla standardize edilir:

- tipografi ölçeği;
- spacing ve container genişlikleri;
- surface, border, radius ve shadow;
- button, input, card, badge, alert, modal ve empty state;
- focus ring ve reduced-motion davranışı.

Public landing sayfaları editoryal ve ferah; Help/Safety dokümantasyon odaklı; dashboard daha yoğun fakat hiyerarşik görünür. EkoYıldız marka karakteri korunur; aşırı neon, glow ve gereksiz hareket azaltılır.

## Erişilebilirlik ve Responsive Kuralları

- Etkileşimli öğeler klavye ile kullanılabilir ve görünür focus durumuna sahip olur.
- Menü, drawer, dialog ve accordion öğelerinde uygun ARIA bilgileri bulunur.
- Form alanlarında görünür label ve bağlamsal hata mesajı kullanılır.
- Renk kontrastı WCAG AA hedefiyle kontrol edilir.
- `prefers-reduced-motion` desteklenir.
- Navigation, tablolar, modallar ve formlar mobilde yatay taşma veya erişilemeyen eylem üretmez.

## Güvenlik

- Kullanıcı girdileri mevcut escape/sanitize yardımcılarından geçirilir.
- Secret, bot token, OAuth token ve session ayrıntıları istemci HTML/JS içine eklenmez.
- UI'da öğe gizlemek authorization yerine geçmez; backend permission middleware'leri korunur.
- Yeni arama endpoint'i gerekirse yalnızca allowlist edilmiş public metadata döndürür.
- Mevcut CSRF/session/cookie davranışı bilinmeden auth akışında değişiklik yapılmaz.

## Test Stratejisi

Her aşamada önce davranışı sabitleyen test yazılır ve ilgili route/view testi çalıştırılır. Paket sonunda:

- mevcut tüm Node testleri;
- syntax kontrolleri;
- route/backward-compatibility testleri;
- Help ve Safety içerik ayrımı testleri;
- global arama permission testleri;
- auth/login/logout/session regression kontrolleri;
- ticket oluşturma/görüntüleme;
- form gönderme;
- admin/staff permission kontrolleri;
- mobil navigation ve temel erişilebilirlik davranış testleri

çalıştırılır. Test sırasında değişen kalıcı JSON fixture'ları ürün değişikliği olarak commit edilmez.

## Kapsam Dışı

- Authentication veya Discord OAuth akışını yeniden yazmak.
- İkinci bir ticket, moderation, blog veya Help backend'i oluşturmak.
- Var olmayan monitoring altyapısını varmış gibi göstermek.
- Mevcut bütün view dosyalarını tek seferde başka framework'e taşımak.
- Route isimlerini estetik amaçla değiştirmek.
- İlk pakette tam kapsamlı yeni appeals/moderation veri modeli kurmak; mevcut appeal deneyimi yalnızca sunum ve navigasyon açısından iyileştirilebilir.

## Başarı Ölçütü

Kullanıcı aynı EkoYıldız özelliklerini ve URL'lerini kullanmaya devam eder; ancak site genelinde daha tutarlı navigation, ayrı fakat bağlantılı Help/Safety merkezleri, daha güçlü editoryal içerik sunumu, daha anlaşılır dashboard ve tek noktadan arama deneyimi elde eder. Mevcut kritik akışların regresyon testleri geçer ve yeni görünüm sahte veri üretmez.
