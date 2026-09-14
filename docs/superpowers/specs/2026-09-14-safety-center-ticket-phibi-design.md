# EkoYıldız Safety Center, Ticket ve Phibi DM Tasarımı

## Amaç

EkoYıldız’ın YouTube ve Discord topluluğu için, Discord Safety Center benzeri ancak topluluğa özgü rehberlerden oluşan anlaşılır bir güvenlik merkezi sağlamak; webden ticket açmayı güvenilir ve anlaşılır yapmak; Phibi üzerinden teslim edilen DM’lerde web paneli bağlantılarını çalışır tutmak.

## Kapsam

1. Safety Center’daki her konu bir URL’ye ve gerçek, uzun bir rehbere sahip olacak.
2. Rehberler Discord hesap güvenliği, sahte bağlantılar, Roblox güvenliği, YouTube/topluluk davranışı, raporlama, ceza/itiraz, yetkili davranışı ve ticket sorun giderme konularını kapsayacak.
3. Web ticket formu gönderim sırasında çift tıklamayı engelleyecek; bilet numarasını, veritabanı kaydını ve Discord kanal teslim durumunu kullanıcıya ayrı ayrı açıklayacak.
4. Phibi fallback üzerinden gönderilen DM’lerde Sentara tarafından işlenemeyecek özel butonlar, güvenli web bağlantılarına dönüştürülecek. `app_open_home` için hedef `/staff` olacak.

## Tasarım

### Safety Center içerik modeli

`knowledgeCenterData.js`, her rehber için `slug`, kategori, başlık, kısa açıklama, yazar ve bölümlendirilmiş içerik saklayacak. Safety Center ana sayfasındaki konu kartları doğrudan `/yardim/<slug>` adreslerine bağlanacak. Bu sayfa uzun rehberi; ne yapılmalı, ne yapılmamalı, kanıt toplama, ilgili rehberler ve ticket sihirbazına bağlantı ile gösterecek.

Yazı dili resmi, sakin ve yaş grubuna uygun olacaktır. Uyarı metinleri kesin olmayan teknik iddialar içermeyecek; şifre, token, giriş kodu, çerez veya ekran paylaşımı istenmediğini her güvenlik akışında açıkça belirtecek. EkoMaskot, dikkat dağıtmayan kısa mizahi notlarla kullanılacaktır.

### Ticket teslim akışı

`POST /api/tickets`, önce kalıcı ticket kaydını oluşturacak, sonra Discord kanalını açmayı deneyecek. Discord erişilemezse ticket başarısız sayılmayacak ancak yanıtta `deliveryStatus: "queued"` ve kullanıcı için anlaşılır teslim metni bulunacak. Kanal açılırsa `deliveryStatus: "delivered"` dönülecek. Form, istekteyken düğmeyi devre dışı bırakacak ve dönen teslim durumunu kullanıcıya gösterecek.

Bu davranış, Discord botunun geçici çevrimdışı olduğu anlarda destek talebinin kaybolmasını önler. Kullanıcının bilet açtığını belirten Phibi/Sentara DM bildirimi, mevcut DM fallback mekanizmasını kullanmaya devam eder.

### Phibi DM bağlantı köprüsü

Phibi bir DM’yi gönderdiğinde Discord etkileşimi Phibi uygulamasına ulaşır; Sentara’nın `custom_id` butonlarını Sentara işleyemez. Fallback serileştiricisi, bilinen web yönlendirmeli düğmeleri Discord Link Button’a çevirir. İlk kapsamda `app_open_home` `/staff` adresine gider. Eşlenmeyen özel düğmeler kaldırılmaz; kullanıcıya işlevin Sentara ile açılan DM’de kullanılabildiğini belirten güvenli bir metin eklenir.

URL’ler tek bir normalize edilmiş site kök adresinden üretilir. Eksik ya da localhost değerinde ise üretim alan adı `https://ekoyildiz.duckdns.org` kullanılır. Böylece Phibi’nin gönderdiği bağlantılar yerel adrese yönlenmez.

## Hata Yönetimi

- Ticket API’si istemciye yalnızca güvenli ve açıklayıcı hata metni döndürür; Discord hata ayrıntıları sunucu logunda kalır.
- Ticket sayfası JSON olmayan hataları da ele alır ve kullanıcıya bağlantı hatası yerine uygun durum metni gösterir.
- Phibi API hatası, özgün Sentara DM hatasını korur; fallback dışında hiçbir Discord kanal gönderimi Phibi’ye yönlendirilmez.

## Test Stratejisi

- Safety verisi için her konu slug’ının gerçek rota üretmesi ve ana sayfadaki kartın o rotaya bağlanması test edilir.
- Ticket oluşturma servisi için Discord kanal teslimi başarılı ve erişilemez senaryolarında kalıcı kayıt ve doğru `deliveryStatus` yanıtı test edilir.
- Phibi payload dönüşümü için `app_open_home` düğmesinin `Link` tipine ve güvenli `/staff` URL’sine dönüştüğü; normal guild payload’larının etkilenmediği test edilir.
- Node söz dizimi kontrolleri ve ilgili test dosyaları tam çalıştırılır.

## Kapsam Dışı

- Phibi’ye genel Discord interaction handler kurmak.
- Kullanıcı şifreleri, tokenlar, çerezler veya doğrulama kodlarını işleyen yeni bir sistem eklemek.
- Mevcut Discord ticket kanalı yetki modelini değiştirmek.
