# EkoYıldız Premium Loading Deneyimi — Tasarım

## Amaç

Mevcut EkoYıldız web sitesine, gerçek veri ve kullanıcı aksiyonlarıyla bağlantılı, hızlı ve erişilebilir loading geri bildirimleri eklemek. Deneyim siteyi daha canlı ve kaliteli hissettirmeli; gerçek işlem tamamlandıktan sonra kullanıcıyı yapay olarak bekletmemeli ve yapılmayan kritik işlemleri yapılıyormuş gibi göstermemelidir.

Bu çalışma mevcut sayfaları yeniden tasarlamaz veya yeni bir frontend framework kurmaz. Express tarafından üretilen HTML, sayfa içi vanilla JavaScript ve mevcut CSS tokenları üzerinde çalışan ortak bir loading katmanı oluşturur ve yalnızca anlamlı async akışlara bağlar.

## Mevcut Teknik Yapı

- Sunucu: Node.js 20, Express 4.
- Görünüm katmanı: template-string ile sunucuda üretilen HTML.
- İstemci: vanilla JavaScript ve sayfa içi veya statik CSS.
- Ortak kabuk: `server/views.js` içindeki `_layout` ve `server/views/platformChrome.js`.
- Ayrı temalar: koyu ana platform, açık form sayfaları ve admin control center tokenları.
- Testler: Node.js yerleşik `node:test` ve `assert` modülleri.
- Frontend build pipeline veya React/Vue bileşen sistemi bulunmuyor.

## Değişmez Kurallar

- Yeni frontend framework veya runtime bağımlılığı eklenmeyecek.
- Gerçek işlem tamamlandığında loading durumu hemen sona erecek; minimum gösterim süresiyle işlem geciktirilmeyecek.
- Çok hızlı işlemlerde titreşimi önlemek için loader görünümü yaklaşık 120 ms geciktirilebilir; bu gecikme işlemin kendisine uygulanmaz.
- Görsel loading ve başarı geri bildirimi toplamda kullanıcı etkileşimini bloke etmeyecek.
- Normal animasyonlar yaklaşık 150–300 ms, kısa başarı geri bildirimi 500–800 ms aralığında olacaktır.
- Yapay ilerleme yüzdesi gösterilmeyecek. Gerçek yüzde bulunmayan progress bar yalnızca belirsiz, kısa bir navigasyon göstergesi olacaktır.
- Ödeme, güvenlik taraması, hesap doğrulama veya sipariş tamamlama gibi gerçekleşmeyen kritik durum mesajları kullanılmayacak.
- Loading metinleri nötr ve bağlama uygun olacaktır: “İçerik getiriliyor…”, “Topluluk bilgileri yükleniyor…”, “Roller hazırlanıyor…” ve “Hazır”.
- Var olan route, API payload, auth, permission ve submit sözleşmeleri korunacaktır.
- Çalışma ağacındaki konu dışı değişikliklere dokunulmayacaktır.

## Mimari

### Sunucu Tarafı Loading Yardımcıları

`server/views/loadingUi.js` ortak HTML üreticilerini ve loading varlıklarını sağlayacaktır:

- `renderLoadingSpinner(options)`
- `renderSkeleton(options)`
- `renderSkeletonCard(options)`
- `renderPageLoader(options)`
- `renderButtonLoader(options)`
- `renderProgressBar(options)`
- `renderLoadingSteps(options)`
- `loadingUiStyles()`
- `loadingUiAssets()`; ortak stylesheet ve `server/public/loading-ui.js` include'larını üretir

Yardımcılar yalnızca güvenli, önceden tanımlı varyantlar ve escape edilmiş metinler üretir. Sayfalar gerekli skeleton düzenini birkaç semantik parametreyle seçer; keyfi HTML veya kullanıcı girdisi loading bileşenlerine aktarılmaz.

### İstemci Tarafı Durum Denetleyicisi

`server/public/loading-ui.js` küçük bir global API sağlar:

- `LoadingUI.setBusy(container, busy, message)`
- `LoadingUI.setButtonState(button, state, labels)`
- `LoadingUI.setSteps(container, steps, activeIndex)`
- `LoadingUI.reveal(container)`
- `LoadingUI.bindImage(image)`
- `LoadingUI.startPageProgress()` ve `LoadingUI.finishPageProgress()`

API, bir butonun orijinal metnini ve disabled durumunu veri özniteliklerinde saklar. Aynı butonda tekrar başlayan bir işlem önceki durumla çakışmaz. Hata halinde buton eski durumuna döner; başarı durumu yalnızca kullanıcı aksiyonlarında ve kısa süreli gösterilir.

### Stil Katmanı

Ortak CSS yeni bir tasarım sistemi tanımlamaz. Aşağıdaki adaptör değişkenleri mevcut sayfa tokenlarından türetilir:

- `--loading-surface`
- `--loading-surface-strong`
- `--loading-border`
- `--loading-muted`
- `--loading-accent`
- `--loading-radius`
- `--loading-shadow`

Ana layout `--surface`, `--border`, `--muted` ve `--accent`; form sayfaları `--forms-*`; admin alanı `--acc-*` değerlerini adaptörlere bağlar. Varsayılan değerler yalnızca token bulunmayan eski sayfalarda okunabilirliği korumak için kullanılır.

Skeleton shimmer düşük kontrastlı tek bir highlight bandı kullanır. Animasyon `transform` ve `opacity` ağırlıklıdır. Kart skeletonları gerçek kart yüksekliği, avatar, başlık ve açıklama satırlarını taklit eder; DOM düğüm sayısı kart başına sınırlı tutulur.

## Hedef Ekranlar ve Loading Türleri

### Admin Control Center

`/api/admin/control-center` ilk yükleme ve manuel yenileme çağrıları gerçek loading kaynağıdır.

- İlk yüklemede altı metrik için sayı skeletonu gösterilir.
- Operasyon kuyruğu, canlı kullanıcılar, servis sağlığı ve son işlemler alanlarında gerçek satır düzenini taklit eden skeletonlar kullanılır.
- Ana overview container `aria-busy="true"` olur; sonuç veya hata işlendiğinde `false` yapılır.
- “Verileri yenile” butonu işlem boyunca disable olur, spinner ve “Yenileniyor…” metni gösterir.
- Manuel yenileme başarılı olduğunda butonda kısa “✓ Güncellendi” durumu gösterilir.
- Yenileme sırasında mevcut kullanılabilir içerik tamamen silinmez; ikinci ve sonraki yenilemelerde skeleton yerine daha hafif lokal progress kullanılır.
- 401/403 ve ağ hataları mevcut dürüst hata durumlarına dönmeye devam eder.

### Profil

Profil sayfası ekonomi, ticket ve ödül bilgilerini istemcide API üzerinden alır.

- Bakiye, kazanılan coin, ticket sayıları ve envanter alanları başlangıçta skeleton ile temsil edilir.
- Gerçek istek akışına bağlı üç durum kullanılabilir: “Profil hazırlanıyor…”, “Topluluk bilgileri yükleniyor…”, “Hazır”. Aşamalar zamanlayıcıyla değil, ilgili gerçek promise sonuçlarıyla ilerler.
- Bir alt istek hata verirse diğer başarılı veriler gösterilir; başarısız alan skeleton olarak kalmaz ve “Veri alınamadı” durumuna geçer.
- Envanter skeletonu gerçek grid kolonlarını takip eder ve içerik geldiğinde 180–220 ms opacity geçişiyle açılır.
- Profil/avatar görselleri placeholder üzerinde yüklenir ve `load` olayında fade-in olur. `error` olayında placeholder korunur.
- “Kuşan”, kutu ve çark gibi kullanıcı aksiyonlarında ilgili buton lokal olarak busy olur; sayfanın tamamı kilitlenmez.

### Tüm Modlar

`/api/tumodlar/data` moderatör kartları ve özet sayaçlarını doldurur.

- İlk yüklemede masaüstünde mevcut grid yapısına uygun kart skeletonları, mobilde tek kolon gösterilir.
- Skeleton kartta avatar dairesi, ad/rütbe barları, iki detay satırı ve eylem alanı bulunur.
- Grid `aria-busy` kullanır; başarıda gerçek kartlar kısa fade ile görünür.
- Filtre ve arama yalnızca bellekteki hazır veri üzerinde çalıştığı için loading göstermez.
- Ayar toggle, hesap değiştirme, kovma ve global toggle eylemlerinde yalnızca eylemi başlatan kontrol disable edilir ve spinner gösterir.
- Başarılı ayar değişikliklerinde “✓ Güncellendi”; başarısız durumda kontrolün önceki değeri geri yüklenir ve mevcut hata mesajı gösterilir.

### Formlar

Form katalog sayfası SSR üretildiği için skeleton almaz. Yalnızca gerçek submit çağrısı loading gösterir.

- Geçerli form gönderildiğinde submit butonu disable olur, küçük spinner ve “Gönderiliyor…” metni gösterir.
- Form `aria-busy="true"`, canlı mesaj alanı `role="status"` ve `aria-live="polite"` kullanır.
- API başarılı olduğunda kısa “✓ Gönderildi” durumundan sonra mevcut başarı paneli gösterilir.
- API hata verirse buton anında normal haline döner, form değerleri korunur ve hata canlı alanda açıklanır.
- İstemci doğrulaması başarısız olduğunda loader başlamaz.

### Ticket ve API Listeleri

İlk paket `/tickets` ve staff ticket listesi gibi istemcide gerçek API çağrısıyla dolan listelerle sınırlıdır.

- İlk veri alımında gerçek satır/kart düzenine uygun skeleton gösterilir.
- Kapatma, yeniden açma, silme ve puanlama işlemlerinde yalnızca ilgili eylem kontrolü busy olur.
- Başarılı kullanıcı aksiyonunda gerekli yerde kısa “✓ Güncellendi” veya “✓ Gönderildi” geri bildirimi kullanılır.
- Boş sonuç loading ile karıştırılmaz; istek tamamlandıktan sonra mevcut empty state gösterilir.

### Global Arama

Arama diyaloğundaki debounce süresi korunur.

- İki veya daha fazla karakterden sonra gerçek istek başladığında kompakt spinner ve “İçerik getiriliyor…” durumu gösterilir.
- Sonuç container `aria-busy` kullanır ve mevcut `aria-live="polite"` davranışı korunur.
- Eski bir istek yeni sorgunun sonucunu ezmemesi için istek kimliği veya `AbortController` kullanılır.
- Sonuçlar geldiğinde 150–180 ms fade uygulanır; reduced-motion modunda geçiş kaldırılır.

### Sayfa Geçişleri

Page loader bütün linklerde zorunlu değildir. Ortak platform kabuğunu kullanan, aynı origin içindeki normal sayfa navigasyonlarında ince üst progress bar kullanılabilir.

- Bar tıklama anında başlar ve tarayıcı yeni belgeyi yüklerken görünür kalır.
- İndeterminate bar gerçek yüzde veya sahte görev metni göstermez.
- Yeni sayfada `pageshow` ile tamamlanır ve 150–220 ms içinde kaybolur.
- Yeni sekme, indirme, hash-only link, modifier tuşlu tıklama, dış bağlantı ve `target` kullanan linkler yakalanmaz.
- Navigasyon geciktirilmez; çıkış animasyonu için `preventDefault` veya zamanlayıcı kullanılmaz.

### Dashboard

Mevcut dashboard içeriği sunucuda hazır üretilmektedir. Gerçek bir istemci veri bekleme noktası olmadığı için ilk pakette dashboard skeletonu eklenmez. Ortak page progress dışında kullanıcıya loading gösterilmez. Gelecekte dashboard kartları gerçek API isteklerine ayrılırsa ilgili kart seviyesinde skeleton eklenebilir.

## Erişilebilirlik

- Görsel spinnerlar dekoratif olduğunda `aria-hidden="true"` olur; anlamlı durum metni ayrı status düğümünde bulunur.
- Tek bir işlem için birden fazla `aria-live` duyurusu üretilmez.
- Busy container işlem başında `aria-busy="true"`, her başarı veya hata çıkışında `false` olur.
- Button loading sırasında görünen metin korunur ve butonun erişilebilir adı bağlama uygun kalır.
- Skeleton öğeleri ekran okuyucudan gizlenir; container’ın loading açıklaması duyurulur.
- `prefers-reduced-motion: reduce` durumunda shimmer durur, indeterminate hareket sade opacity durumuna dönüşür ve tüm reveal geçişleri yaklaşık anlık olur.
- Renk tek başına durum belirtmez; başarı işareti ve metin birlikte kullanılır.

## Performans

- Skeletonlar yalnızca beklenen görünür öğe sayısı kadar render edilir; uzun listeler için 4–6 örnek kart yeterlidir.
- Animasyonlar `transform` ve `opacity` ile sınırlanır; layout tetikleyen sürekli width/left animasyonlarından kaçınılır.
- Progress bar hareketi `transform: scaleX()` veya translate tabanlıdır.
- Tek ortak stylesheet/script kullanılır; her bileşen için ayrı runtime veya observer kurulmaz.
- Görsel reveal için mevcut `load` ve `error` olayları kullanılır; zorunlu IntersectionObserver eklenmez.
- İsteklerin kendisine yapay sleep, gecikme veya seri hale getirme eklenmez.

## Hata ve Yarış Durumları

- Her async akış `finally` içinde busy durumunu temizler.
- Aynı kontrol tekrar tıklanarak çift submit başlatamaz.
- Arama gibi değişken sorgulu alanlarda eski yanıt yeni sonucu ezemez.
- DOM’dan kaldırılmış bir buton veya container için completion callback hata üretmez.
- JSON parse hatası, HTTP hata kodu ve network hatası aynı loading cleanup yolunu kullanır fakat mevcut kullanıcı mesajı ayrımını korur.
- Birden çok paralel profil isteği bağımsız sonuç verebilir; tek hata bütün profili hata ekranına çeviremez.

## Test Stratejisi

Her davranış test-öncelikli uygulanacaktır.

- Loading renderer testleri semantik rol, ARIA ve escape davranışını doğrular.
- Button state testleri orijinal label/disabled durumunun hata sonrası geri geldiğini ve çift başlangıcın güvenli olduğunu doğrular.
- Reduced-motion ve tema adaptörleri üretilen CSS sözleşmesi üzerinden değil, mümkün olan yerde örnek render davranışı üzerinden kontrol edilir.
- Form testleri validation hatasında busy durumunun başlamadığını; submit başladığında buton/form durumunun değiştiğini; başarı ve hatada temizlendiğini doğrular.
- Admin testleri ilk snapshot yüklemesi, manuel yenileme, 401/403 ve hata cleanup davranışını doğrular.
- Profil testleri kısmi API hatasında başarılı alanların kalmasını ve başarısız alanın skeletondan çıkmasını doğrular.
- Tüm Modlar testleri skeleton grid, başarılı reveal ve eylem kontrolünün eski durumuna dönmesini doğrular.
- Global arama testleri eski yanıtın yeni sorguyu ezemediğini doğrular.
- İlgili hedefli testlerden sonra tüm `node --test` paketi ve değiştirilen JavaScript dosyaları için syntax kontrolleri çalıştırılır.

## Kapsam Dışı

- Bütün sayfalara full-screen loader eklemek.
- SSR ile hazır gelen statik içeriği yapay olarak gizlemek.
- Authentication, Discord OAuth veya Roblox doğrulama akışlarını yeniden tasarlamak.
- Gerçek ilerleme verisi bulunmayan işlemlerde yüzde göstermek.
- Her API çağrısını global olarak yakalayan otomatik `fetch` monkey-patch sistemi kurmak.
- Ağ hatalarını loading animasyonuyla maskelemek.
- Yeni renk, spacing, radius veya shadow tasarım sistemi oluşturmak.
- Ürün davranışıyla ilgisiz mevcut dosyaları refactor etmek.

## Başarı Ölçütleri

- Kullanıcı gerçek async içerik beklerken boş veya sıçrayan alan yerine düzeni koruyan skeleton görür.
- Gerçek işlem hızlıysa loading kullanıcıyı bekletmeden sona erer.
- Submit ve yönetim eylemlerinde çift tıklama engellenir ve hangi kontrolün çalıştığı açıktır.
- Loading metinleri nötr, doğru ve yapılan gerçek işlemle uyumludur.
- Mobil görünümde skeleton ve gerçek içerik aynı kolon yapısını izler.
- Reduced-motion tercihinde hareket belirgin biçimde azalır.
- Başarı, hata ve boş durumları loading durumundan açıkça ayrılır.
- Mevcut route, API, auth ve permission testlerinde regresyon oluşmaz.
