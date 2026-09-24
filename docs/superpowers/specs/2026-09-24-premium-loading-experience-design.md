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
- Admin ve admin/mod yetkili kullanıcılar yeni loading katmanını görmeyecektir. Mevcut yetki modelinde bu grup `isSiteStaff(user)` ile belirlenir; helper hem `user.isStaff` kullanıcılarını hem de `isSiteAdmin(user)` sonucunu kapsar.

## Loading Uygunluğu

Ortak layout ve bağımsız sayfa renderer'ları `loadingEnabled = !isSiteStaff(user)` kararını sunucu tarafında verir. Yetkili kullanıcı için loading stylesheet/script, PageLoader ve skeleton markup üretilmez. İstemci kodu `window.LoadingUI` bulunmadığında mevcut doğrudan veri/submit davranışını sürdürür.

Bu ayrım yalnızca görsel loading deneyimini etkiler. Double-submit engeli, buton disable etme, hata mesajı, authorization ve permission kontrolleri kullanıcı rolünden bağımsız olarak korunur.

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

### Admin ve Admin/Mod Alanları

Admin Control Center, Tüm Modlar ve Staff Panel yeni loading katmanının kapsamı dışındadır. Bu sayfaların mevcut veri yükleme, disable, hata ve boş durum davranışları korunur; yeni skeleton, progress bar, spinner veya loading-step eklenmez.

### Profil

Profil sayfası ekonomi, ticket ve ödül bilgilerini istemcide API üzerinden alır.

- Bakiye, kazanılan coin, ticket sayıları ve envanter alanları başlangıçta skeleton ile temsil edilir.
- Gerçek istek akışına bağlı üç durum kullanılabilir: “Profil hazırlanıyor…”, “Topluluk bilgileri yükleniyor…”, “Hazır”. Aşamalar zamanlayıcıyla değil, ilgili gerçek promise sonuçlarıyla ilerler.
- Bir alt istek hata verirse diğer başarılı veriler gösterilir; başarısız alan skeleton olarak kalmaz ve “Veri alınamadı” durumuna geçer.
- Envanter skeletonu gerçek grid kolonlarını takip eder ve içerik geldiğinde 180–220 ms opacity geçişiyle açılır.
- Profil/avatar görselleri placeholder üzerinde yüklenir ve `load` olayında fade-in olur. `error` olayında placeholder korunur.
- “Kuşan”, kutu ve çark gibi kullanıcı aksiyonlarında ilgili buton lokal olarak busy olur; sayfanın tamamı kilitlenmez.
- Profil sayfasını görüntüleyen kullanıcı admin veya admin/mod yetkiliyse skeleton, loading steps, spinner ve image-loading animasyonu üretilmez; veri geldikçe mevcut yer tutucular doğrudan güncellenir.

### Formlar

Form katalog sayfası SSR üretildiği için skeleton almaz. Yalnızca gerçek submit çağrısı loading gösterir.

- Geçerli form gönderildiğinde submit butonu disable olur, küçük spinner ve “Gönderiliyor…” metni gösterir.
- Form `aria-busy="true"`, canlı mesaj alanı `role="status"` ve `aria-live="polite"` kullanır.
- API başarılı olduğunda kısa “✓ Gönderildi” durumundan sonra mevcut başarı paneli gösterilir.
- API hata verirse buton anında normal haline döner, form değerleri korunur ve hata canlı alanda açıklanır.
- İstemci doğrulaması başarısız olduğunda loader başlamaz.
- Admin veya admin/mod yetkili kullanıcıda form yine double-submit'i önlemek için disable olur fakat spinner, geçici loading metni ve loading animasyonu göstermez.

### Global Arama

Arama diyaloğundaki debounce süresi korunur.

- İki veya daha fazla karakterden sonra gerçek istek başladığında kompakt spinner ve “İçerik getiriliyor…” durumu gösterilir.
- Sonuç container `aria-busy` kullanır ve mevcut `aria-live="polite"` davranışı korunur.
- Eski bir istek yeni sorgunun sonucunu ezmemesi için istek kimliği veya `AbortController` kullanılır.
- Sonuçlar geldiğinde 150–180 ms fade uygulanır; reduced-motion modunda geçiş kaldırılır.
- Admin veya admin/mod yetkili kullanıcıda arama mevcut sade “Aranıyor…” metniyle çalışır; spinner ve sonuç fade'i kullanılmaz.

### Sayfa Geçişleri

Page loader bütün linklerde zorunlu değildir. Ortak platform kabuğunu kullanan, aynı origin içindeki normal sayfa navigasyonlarında ince üst progress bar kullanılabilir.

- Bar tıklama anında başlar ve tarayıcı yeni belgeyi yüklerken görünür kalır.
- İndeterminate bar gerçek yüzde veya sahte görev metni göstermez.
- Yeni sayfada `pageshow` ile tamamlanır ve 150–220 ms içinde kaybolur.
- Yeni sekme, indirme, hash-only link, modifier tuşlu tıklama, dış bağlantı ve `target` kullanan linkler yakalanmaz.
- Navigasyon geciktirilmez; çıkış animasyonu için `preventDefault` veya zamanlayıcı kullanılmaz.
- Admin veya admin/mod yetkili kullanıcı için PageLoader render edilmez ve navigasyon dinleyicisi bağlanmaz.

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
- Yetki-gating testleri `isSiteStaff(user)` sonucunda loading asset, skeleton ve PageLoader üretilmediğini doğrular.
- Reduced-motion ve tema adaptörleri üretilen CSS sözleşmesi üzerinden değil, mümkün olan yerde örnek render davranışı üzerinden kontrol edilir.
- Form testleri validation hatasında busy durumunun başlamadığını; submit başladığında buton/form durumunun değiştiğini; başarı ve hatada temizlendiğini doğrular.
- Profil testleri kısmi API hatasında başarılı alanların kalmasını ve başarısız alanın skeletondan çıkmasını doğrular.
- Global arama testleri eski yanıtın yeni sorguyu ezemediğini doğrular.
- İlgili hedefli testlerden sonra tüm `node --test` paketi ve değiştirilen JavaScript dosyaları için syntax kontrolleri çalıştırılır.

## Kapsam Dışı

- Bütün sayfalara full-screen loader eklemek.
- Admin Control Center, Tüm Modlar ve Staff Panel'e yeni loading görselleri eklemek.
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
