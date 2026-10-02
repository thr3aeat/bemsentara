# Gelişmiş Kurumsal İşe Alım Formları Tasarımı

## Amaç

Moderatör, Etkinlik Ekibi, Topluluk Elçisi, Geliştirici ve Hata Ayıklama Ofisi başvurularını kısa ve jenerik formlar olmaktan çıkarıp büyük teknoloji şirketlerinin kariyer deneyimine yakın, ciddi, role özel ve interaktif bir değerlendirme sürecine dönüştürmek.

Genel iletişim, hata bildirimi, içerik önerisi, partnerlik ve güvenlik bildirimi formları kısa görev formları olarak kalır.

## Başarı Ölçütleri

- Her işe alım formu 6–8 adım, 20–35 anlamlı soru ve yaklaşık 20–35 dakikalık tahmini süre sunar.
- Ortak aday bilgileri tekrar sorulmaz; doğrulanmış Discord kimliği otomatik gelir.
- Her rol gerçekten farklı yetkinlikleri ölçen role özel senaryo ve takip soruları içerir.
- Aday ilerlemesini kaybetmeden ara verebilir, başka cihazda devam edebilir ve göndermeden önce tüm cevaplarını gözden geçirebilir.
- Admin, her cevabı gerçek soru etiketi ve bölüm bağlamıyla eksiksiz görür.
- Formlar mobil, klavye ve ekran okuyucu kullanımında tamamlanabilir.
- Görsel dil EkoYıldız site temasıyla uyumlu, ciddi ve sakin olur; sahte kurumsal metin, oyunlaştırılmış rozet veya gereksiz animasyon kullanılmaz.

## Seçilen Mimari

“Ortak çekirdek + role özel modüller” yaklaşımı kullanılacaktır.

Ortak çekirdek bölümleri:

1. Doğrulanmış kimlik ve temel profil
2. Uygunluk, zaman planı ve çalışma koşulları
3. Geçmiş deneyim ve somut kanıtlar
4. Motivasyon, iletişim ve ekip uyumu
5. Etik, güvenlik ve gizlilik
6. Son kontrol ve aday beyanı

Her role özel modüller ortak çekirdeğin arasına veya sonuna eklenir. Form tanımı yalnızca alan listesinden oluşmaz; bölüm, açıklama, soru türü, doğrulama, koşul, değerlendirme etiketi ve admin görünüm metadata’sı içerir.

## Rol Bazlı İçerik

### Moderatör

- Topluluk geçmişi ve ceza yaklaşımı
- Tarafsızlık, çıkar çatışması ve gizlilik
- Sohbet krizi, taciz, yanlış bilgi ve yetki suistimali senaryoları
- Kanıt toplama, audit log okuma ve eskalasyon
- Kullanıcıya yazılı karar bildirme örneği

### Etkinlik Ekibi

- Etkinlik planlama ve zaman yönetimi
- Katılım artırma, sunucu/kanal koordinasyonu ve görev dağılımı
- Teknik aksaklık, düşük katılım, adalet itirazı ve kriz senaryoları
- Örnek etkinlik fikri, takvim ve başarı ölçütleri
- Etkinlik sonrası rapor ve geri bildirim yaklaşımı

### Topluluk Elçisi

- Marka temsili, topluluk tonu ve paydaş iletişimi
- Üye bağlılığı, onboarding ve geri bildirim toplama
- Kamuya açık kriz, yanlış anlaşılma ve eleştiri senaryoları
- İlk 30 gün planı ve ölçülebilir topluluk girişimi
- İçerik/duyuru yazma örneği

### Geliştirici

- Ana uzmanlık, teknoloji seti ve portföy bağlantıları
- Proje sahipliği, kod inceleme ve dokümantasyon alışkanlığı
- Hata ayıklama, güvenlik, performans ve veri bütünlüğü senaryoları
- Role göre koşullu Node.js, Roblox/Luau, web veya tasarım soruları
- Küçük sistem tasarımı ve teknik karar gerekçesi
- Gizlilik, fikri mülkiyet ve üretim erişimi taahhütleri

### Hata Ayıklama Ofisi

- Yeniden üretim, ortam bilgisi ve kanıt standardı
- Client/server ayrımı, log okuma ve hipotez kurma
- Aralıklı hata, regresyon ve yanlış pozitif senaryoları
- Örnek hata raporu ve önem/öncelik sınıflandırması
- Sorumlu açıklama ve hassas veri yaklaşımı

## Soru Türleri ve Koşullu Akış

Desteklenen soru türleri:

- Kısa metin
- Uzun metin
- Tek seçim
- Çoklu seçim
- Evet/hayır ve taahhüt onayı
- Tarih veya uygunluk aralığı
- Güvenli HTTP(S) bağlantısı
- Tekrarlanabilir deneyim/proje kaydı

Dosya yükleme ilk sürümde kapsam dışıdır. Portföy, özgeçmiş ve kanıt için güvenli URL alanları kullanılır.

Koşullu sorular yalnızca önceki cevabın anlamlı bir takip gerektirdiği durumlarda açılır. Örneğin deneyimi olduğunu belirten adaydan rol, süre ve ayrılma nedeni; geliştiricide seçilen uzmanlık alanına göre teknik senaryo istenir. Gizlenen koşullu alanlar gönderim payload’ına dahil edilmez ve zorunlu sayılmaz.

## Aday Deneyimi

- İşe alım formları yalnızca başarılı bot-DM kimlik doğrulamasından sonra açılır.
- Üst bölümde rol, tahmini süre, ilerleme ve taslak durumu görünür.
- Sol/üst adım göstergesi tamamlandı, mevcut ve eksik adımları metin ve simgeyle ayırır.
- Her adım tek bir değerlendirme temasına odaklanır; uzun duvar metinleri kullanılmaz.
- Karakter sayacı yalnızca anlamlı minimum veya maksimum olduğunda gösterilir.
- Minimum içerik gerektiren sorular, anlamsız tek kelimelik cevapları sunucu tarafında reddeder.
- Otomatik taslak sunucuya debounce ile kaydedilir; tarayıcı yerel taslağı yalnızca bağlantı kesintisi yedeğidir.
- Aday “Kaydet ve çık” ile güvenli biçimde ayrılabilir.
- Son adımda bölüm bazlı cevap özeti ve doğrudan düzenleme bağlantıları bulunur.
- Başarılı gönderimden sonra takip numarası, süreç açıklaması ve aday paneli bağlantısı gösterilir.

## Taslak ve Sürümleme

Her taslak doğrulanmış Discord ID, form türü ve form şema sürümüne bağlanır. Bir adayın aynı rol için tek aktif taslağı olabilir.

- Taslak cevapları sunucuda doğrulanmış kısmi veri olarak saklanır.
- Her kayıtta `schemaVersion`, `currentStep`, `completionPercent`, `updatedAt` ve cevaplar bulunur.
- Form tanımı değişirse uyumlu alanlar taşınır; kaldırılan alanlar kaybolmadan legacy cevap olarak korunur.
- Gönderilmiş başvurunun soru etiketleri ve bölüm başlıkları snapshot olarak saklanır. Böylece katalog sonradan değişse bile admin geçmiş başvuruyu gönderildiği günkü sorularla görür.
- Gönderim atomiktir: taslak başvuruya dönüştürülürken iki kayıt veya yarım başvuru oluşmaz.

## Veri Modeli

Form tanımında her soru için kararlı bir `id` kullanılır. Görünen metin değişse bile kimlik değişmez.

Gönderilmiş başvuru aşağıdaki normalize edilmiş verileri taşır:

- `formType`
- `schemaVersion`
- `questionSnapshot`
- `answers`
- `completionMetadata`
- `identitySnapshot`
- mevcut geriye uyumlu `formData`

`questionSnapshot`, yalnızca başvuruda kullanılan bölüm/soru etiketlerini ve güvenli görüntüleme metadata’sını içerir; çalıştırılabilir istemci kodu içermez. Eski `formData` kayıtları admin cevap normalleştiricisiyle okunmaya devam eder.

## Doğrulama ve Güvenlik

- İstemci doğrulaması yalnızca kullanıcı deneyimidir; aynı kurallar sunucuda tekrar uygulanır.
- Bilinmeyen soru kimlikleri, koşula göre görünmemesi gereken cevaplar ve izin verilmeyen seçim değerleri reddedilir.
- Metin uzunluğu yanında role göre belirlenen anlamlı minimum uzunluklar uygulanır.
- URL’ler yalnızca HTTP(S) olur; şema ve maksimum uzunluk doğrulanır.
- Form payload’ı, taslak ve route seviyesinde boyut sınırına tabidir.
- HTML bütün cevaplarda düz metin olarak ele alınır.
- Doğrulanmış Discord kimlik alanları istemci payload’ından alınmaz; oturumdan yazılır.
- Aynı rol için aktif başvuru ve gönderim tekrarları idempotency anahtarıyla engellenir.

## Hata Yönetimi

- Taslak kaydı başarısız olursa aday yazmaya devam edebilir; durum açıkça “Yerel olarak bekliyor” gösterilir ve bağlantı gelince yeniden denenir.
- Adım yüklenemediğinde girilmiş cevaplar silinmez.
- Oturum süresi dolarsa cevaplar yerel yedekte tutulur; DM koduyla tekrar girişten sonra sunucu taslağıyla güvenli birleştirme yapılır.
- Şema sürümü uyuşmazlığı sessiz veri kaybına yol açmaz; kullanıcıya güncellenen alanlar gösterilir.
- Gönderim isteği zaman aşımına uğrarsa takip/idempotency anahtarıyla sonuç sorgulanır; kullanıcıdan körlemesine tekrar göndermesi istenmez.

## Test Stratejisi

### Form şeması

- Beş rolün beklenen 6–8 bölüm ve 20–35 soru aralığında olması
- Tüm soru kimliklerinin kararlı ve form içinde benzersiz olması
- Koşullu soruların geçerli kaynak soruya ve seçeneğe bağlı olması
- Admin etiketi ve aday etiketi bulunmayan soru olmaması

### Doğrulama

- Zorunlu, minimum/maksimum uzunluk, URL ve seçim doğrulamaları
- Gizli koşullu alanların zorunlu sayılmaması ve payload’dan atılması
- Bilinmeyen alan ve değiştirilmiş seçim değerinin reddi
- Oturum kimliğinin payload kimliğine üstün gelmesi

### Taslak ve gönderim

- Sunucu taslağı oluşturma, güncelleme, başka cihazda sürdürme ve sürüm taşıma
- Aynı role ait tek aktif taslak ve tek aktif başvuru
- Atomik/idempotent gönderim
- Başarılı gönderimde soru snapshot’ının saklanması

### Görünüm ve erişilebilirlik

- Klavyeyle adımlar arasında ilerleme ve hatalı alana odaklanma
- Ekran okuyucu için label, açıklama, hata ve canlı durum ilişkileri
- Mobil düzen, uzun Türkçe metin ve taşma koruması
- Taslak, çevrimdışı, hata, son kontrol ve başarı durumları

### Entegrasyon

- Bot-DM koduyla girişten form taslağına ve gönderime tam akış
- Gönderilen yeni şema cevaplarının admin aday dosyasında gerçek sorularla görünmesi
- Eski düz ve eski bölümlü kayıtların aynı admin görünümünde okunması

## Teslim Sırası

1. Başvuru Operasyon Merkezi: yükleme hatası, cevap normalleştirme ve güvenli admin aday dosyası.
2. Bot-DM kimlik doğrulama sertleştirmesi.
3. Gelişmiş form şeması, taslak servisi ve ortak form motoru.
4. Beş role özel içerik modülü.
5. Site onayı, çizim imzası ve mülakat geçişleri.

Her teslim kendi testleriyle çalışır durumda olur; sonraki teslim öncekinin tanımlı arayüzlerini kullanır.

## Kapsam Dışı

- Genel görev formlarını gereksiz yere uzatmak
- Dosya yükleme ve harici depolama
- Otomatik aday puanlayıp karar veren yapay zekâ
- Hukuken nitelikli elektronik imza iddiası
- Admin panelinin başvuru dışındaki bölümlerini yeniden yazmak
