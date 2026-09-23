# EkoYıldız Forms ve Sponsor Alanı Tasarımı

**Tarih:** 2026-09-23  
**Durum:** Kullanıcı tasarım onayı alındı; uygulama planı bekleniyor.

## Amaç

EkoYıldız Forms deneyimini, mevcut ana sayfanın açık renkli, sakin ve premium görsel diliyle aynı tasarım sistemine taşımak. Sonuç; klasik bir yönetim paneli, oyun arayüzü veya kart yığını değil, topluluk ve başvuru süreçleri için güven veren, ferah bir ürün yüzeyi olmalıdır.

Bu çalışma aşağıdaki işlevsel beklentileri de kapsar:

- Oyun Moderasyon Ekibi dışındaki tüm formlar açık ve gönderilebilir kalır.
- Topluluk Elçisi için süresi geçmiş zaman kısıtı, liste ve API katmanından kaldırılır.
- Yeni genel amaçlı formlar gerçekten doğrulanır, kaydedilir ve mevcut güvenli başvuru akışına bağlanır.
- Mevcut route'lar, oturum bilgisi, gönderim kayıtları, yönetici görünümü ve bot bildirimleri korunur.

## Kapsam

### Dahil

- `/forms` kataloğunun yeniden tasarımı.
- Mevcut yetkili başvuru ekranlarının ortak bir altyapı üzerinde modernleştirilmesi.
- Beş yeni form: Genel İletişim, İçerik / Video Önerisi, Hata Bildirimi, Partnerlik / İş Birliği ve Güvenlik Bildirimi.
- İstemci ve sunucu tarafı doğrulama, yükleniyor/hata/başarı durumları.
- `SPONSORLU BAĞLANTI` bileşeninin tasarım ve boş durum davranışı.
- Masaüstü, tablet ve mobil davranışlar ile erişilebilirlik kontrolleri.

### Hariç

- Sponsor reklam veri modelinin veya yönetim ekranının gereksiz yeniden yazımı.
- Kimlik doğrulama, dashboard veya mevcut moderasyon iş akışlarının davranış değişikliği.
- Mevcut yetkili başvuru değerlendirme politikalarının değiştirilmesi.

## Bilgi Mimarisi

Forms kataloğu iki bölümden oluşur:

1. **Yetkili Alımları:** Etkinlik Ekibi, Topluluk Elçisi, Geliştirici Ekibi, Hata Ayıklama Ofisi ve Oyun Moderasyon Ekibi.
2. **Diğer Formlar:** Genel İletişim, İçerik / Video Önerisi, Hata Bildirimi, Partnerlik / İş Birliği ve Güvenlik Bildirimi.

Yeni genel formlar yetkili alımları bölümünde gösterilmez. Ayrı `Yetkili Başvuru` veya `Topluluk Geri Bildirim` kayıtları oluşturulmaz; aynı ihtiyacı mevcut başvuru ve iletişim kategorileri karşılar.

Oyun Moderasyon Ekibi, tek kapalı kayıttır. Katalogdaki eylemi devre dışıdır ve açıkça `Bakımda` olarak açıklanır. Başka hiçbir formda zaman aşımı, bakım, kapalı veya yakında durumuyla erişim engellenmez.

## Sayfa Tasarımı

### Ortak görsel sistem

Forms yüzeyleri ana sayfanın tasarım kurallarını kullanır: Inter, açık zemin, koyu metin, yumuşak pembe vurgu, ince gri çizgiler, 9–16 px arası tutarlı köşe yarıçapları ve geniş beyaz alanlar. Platform header ve footer bileşenleri korunur.

Gradient, neon, glow, yoğun blur, cam efekti, dev emoji ve iç içe kartlar kullanılmaz. İkonlar tek renkli, küçük ve anlam destekleyici olur.

### Forms kataloğu

Girişte `Formlar` başlığı, kısa yönlendirme metni ve küçük güven/akış notları yer alır. Bunlar büyük metrik kartları değildir. Her bölüm, başlık ve kısa açıklamayla ayrılır.

Her form bir "form satırı" bileşenidir:

- küçük kategori etiketi ve minimal ikon,
- ad, kısa açıklama ve tahmini süre,
- erişilebilir açık/bakım durumu,
- sağda `Forma Git` metni ve yön oku.

Satırlar ince bir sınıra, düşük kontrastlı yüzeye ve yalnızca hover/focus sırasında hafif arka plan değişimi ile 1–2 px'lik hareket etkisine sahiptir. Mobilde üst bilgiler ile eylem alt alta akar; hiçbir satır yatay kaydırma üretmez.

### Form ayrıntı sayfası

Her formun üstünde geri bağlantısı, başlık, kısa açıklama, kategori, tahmini süre ve gizlilik/inceleme notu bulunur. Alanlar tek büyük konteynıra sıkıştırılmaz; anlamlı bölüm başlıkları altında sıralanır.

Uzun yetkili formlar bölüm bazlı ilerler. İlerleme göstergesi `1 / 4 — Temel Bilgiler` biçiminde metinsel ve sadedir. Kısa genel formlar tek sayfa halinde kalabilir; gereksiz adımlara bölünmez.

### Form alanları ve durumlar

Tüm alanlarda gerçek `label`, gerekiyorsa açıklama, placeholder, required işareti ve hata alanı bulunur. Focus görünür bir border/ring ile belirtilir; hata mesajları Türkçe ve eyleme dönük olur. Örnek: `Bu alanı doldurman gerekiyor.`

Gönder butonu makul boyutta, güçlü fakat sakin bir ana eylemdir. Gönderim sırasında çift tıklama engellenir ve durum metni görünür. Başarılı sonuç, aynı sayfada `Başvurun alındı.` mesajı, değerlendirme bilgisi ve mevcut sistemin döndürdüğü başvuru kimliğiyle gösterilir. Ağ veya sunucu hataları kullanıcının ne yapabileceğini açıklayan mesajlarla görünür.

## Form Tanımları ve Veri Akışı

Paylaşılabilir Forms altyapısı, her form için route, başlık, kategori, süre, alanlar, istemci kuralları ve endpoint eşleşmesini bir tanım olarak tutar. Görsel katman bu tanımlardan katalog satırını ve form ekranını üretir; yalnızca özel soru yapısına sahip mevcut yetkili formlar gerektiğinde özel bölüm şablonları kullanabilir.

Mevcut endpointler (`event-staff`, `community-ambassador`, `developer`, `debug-office`) ve bunların FormSubmission kaydı/bot bildirim davranışı korunur. Topluluk Elçisi endpointindeki tarihi kapatma denetimi kaldırılır.

Yeni formlar için ayrı, açık isimli endpointler eklenir. Her endpoint:

1. oturum varsa kullanıcının Discord bilgilerini mevcut akıştan alır;
2. gerekli alanları sunucuda doğrular;
3. `FormSubmission` içine form türü, başlık ve yanıtlarla kayıt oluşturur;
4. mevcut başvuru bildirim mekanizmasını güvenle yeniden kullanır;
5. başarıda `submissionId`, hatada açık Türkçe hata metni döndürür.

Yeni form soru çerçeveleri:

| Form | Gerekli bilgi |
| --- | --- |
| Genel İletişim | konu, mesaj, tercih edilen geri dönüş bilgisi |
| İçerik / Video Önerisi | öneri başlığı, ilgili bağlantı, neden uygun olduğu |
| Hata Bildirimi | özet, yeniden üretim adımları, beklenen/gerçekleşen sonuç, isteğe bağlı ek bağlantı |
| Partnerlik / İş Birliği | kurum/kanal, iletişim kişisi, hedef kitle, teklif özeti |
| Güvenlik Bildirimi | güvenlik konusu, etkilenen alan, yeniden üretim veya kanıt, iletişim tercihi |

Güvenlik bildirimindeki serbest metinler yönetici ekranına güvenli biçimde escape edilerek aktarılır; kullanıcıdan parola, erişim anahtarı veya gizli kimlik bilgisi istenmez.

## Sponsorlu Bağlantı

Sponsor verisi ve tıklama/gösterim takibi korunur. Bileşen, Forms ve legacy layout içinde uygun temaya uyum sağlayan ortak bir yüzey olarak render edilir:

- küçük `Sponsorlu bağlantı` etiketi ve marka adı,
- sabit ölçülü, kırpmayan görsel alanı,
- başlık/açıklama için esnek metin kolonu,
- açık, fakat baskın olmayan CTA.

Desktop'ta öğeler hizalı tek sıra; tablette CTA alt sıraya; mobilde ise tam genişlik eyleme dönüşür. Aktif sponsor yoksa kırık veya yalnızca boş alan yerine, reklam alanının şu an kullanılmadığını belirten kısa ve düşük öncelikli bir empty state gösterilir.

## Erişilebilirlik ve Responsive Davranış

- Tüm kontroller klavyeyle kullanılabilir; `:focus-visible` görünürdür.
- Durumlar yalnızca renkle ifade edilmez; metin de içerir.
- Form hataları ilişkili alanla programatik olarak bağlanır ve aria-live bölgesinde özetlenir.
- 320 px genişlikte katalog satırları, ilerleme bilgisi, alanlar ve CTA'lar taşmadan akmalıdır.
- `prefers-reduced-motion` altında hover/geçiş etkileri azaltılır.
- Açık ve koyu platform temalarında kontrast, sınır ve form alanı görünürlüğü korunur.

## Doğrulama ve Test Stratejisi

Uygulama sonrası aşağıdaki kanıtlar üretilecektir:

- Yeni ve mevcut tüm açık route'lar için render/route testleri.
- Oyun Moderasyon dışındaki formların açık olduğu ve Topluluk Elçisi tarihi engelinin bulunmadığı endpoint testleri.
- Yeni endpointlerin geçerli veriyle FormSubmission oluşturduğu; eksik veride Türkçe 4xx hata döndürdüğü testler.
- Sponsor aktif ve boş durumları için görünüm testleri.
- Başlık/footer bütünlüğü, form semantiği ve responsive CSS denetimleri.
- Yerel uygulama üzerinde masaüstü, tablet ve mobil viewport görsel kontrolü; tarayıcı konsolunda yeni hata bulunmadığının kontrolü.

## Başarı Ölçütleri

Forms, EkoYıldız'ın ana ürünü gibi görünür; ana sayfanın görsel dilinden ayrışmaz. Kullanıcı açık bir formu bulur, doldurur, anlaşılır biçimde doğrulanır ve gönderim sonucunu görür. Sadece Oyun Moderasyon Ekibi bakım durumundadır. Sponsor alanı her ekranda hiyerarşik, ölçülü ve kırılmadan görünür.
