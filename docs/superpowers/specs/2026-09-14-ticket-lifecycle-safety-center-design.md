# Ticket Lifecycle ve Safety Center Tasarımı

## Amaç

EkoYıldız destek taleplerini web, Discord modalı ve DM girişlerinden aynı güvenilir yaşam döngüsüne bağlamak. Her açık ticket kalıcı kayda, profesyonel kullanıcı paneline, yetkili araçlarına ve kategoriye uygun Safety Center dokümanına sahip olur.

## Mimari

### `ticketLifecycleService`

Bu servis ticket oluşturma sırasının tek sahibi olur:

1. Kimlik, kullanıcı, kategori, konu, açıklama ve zaman ile ticket kaydını `pending_delivery` durumunda oluşturur.
2. Hedef Discord sunucusu ile destek kategorisini çözer ve kanalı oluşturur.
3. `guildId`, `channelId`, teslim zamanı ve açık durumunu ticket kaydına yazar.
4. Kullanıcı karşılama panelini ve yetkili işlem panelini gönderir.
5. Panel gönderimi tamamlanınca `panelMessageId`, `staffPanelMessageId`, `panelDeliveredAt` ve `deliveryState: delivered` alanlarını kaydeder.

Kanal veya panel gönderimi başarısız olursa kayıt silinmez. `deliveryState: pending_retry`, son hata bilgisi ve hata zamanı kaydedilir. Mevcut ticket üzerinde güvenli bir yeniden gönderim işlemi çalışabilir.

### `ticketPanelService`

Servis Discord.js bileşenleriyle iki ayrı panel üretir.

- Kullanıcı paneli: Ticketi Kapat, Personel Çağır, Safety Center, İlgili Dokümanlar ve Ticket Bilgileri.
- Yetkili paneli: üstlenme, kapatma, kullanıcıya DM, kullanıcı sicili, not, transkript, öncelik, kategori ve yazma kilidi araçları.

Safety Center ve doküman düğmeleri link button olarak gönderilir; bu nedenle bot yeniden başladıktan sonra da çalışır. Etkileşim gerektiren düğmeler mevcut kalıcı button handler yapısına eklenir. Personel çağırma ticket sahibine açık olur, her ticket için kısa bir cooldown uygulanır; çağrı mevcut personel/rol düzenini kullanarak kanala yazılır.

### `ticketGuideResolver`

Kategori ile doküman slug eşlemesi tek kaynakta tutulur:

| Ticket kategorisi | Safety Center rehberi |
| --- | --- |
| `ban` | `ceza-ve-itiraz` |
| `report` | `kullanici-raporlama` |
| `account` | `hesabimi-guvene-alma` |
| `technical` | `ticket-sorun-giderici` |
| `billing` | `ticket-sorun-giderici` |
| `reklam`, `genel`, `other` | `yetkiliyle-iletisim` |

Eşleme bulunmazsa yardım merkezi ana sayfası kullanılır. Bu eşleme web ticket sayfasındaki öneriyle de paylaşılır.

## Veri ve hata yönetimi

Ticket modeli geriye uyumlu alanlarını korur. Yeni alanlar isteğe bağlıdır: `deliveryState`, `deliveryError`, `deliveryErrorAt`, `panelMessageId`, `staffPanelMessageId`, `panelDeliveredAt`, `staffCallRequestedAt` ve `staffCallCount`.

Başarısız panel gönderimi `TICKET_PANEL_SEND_FAILED` etiketiyle loglanır. Logda ticket ID, guild ID, channel ID, user ID ve Discord hata mesajı bulunur. Kanal oluşturma tamamlanıp panel gönderimi başarısızsa ticket açık kalır ve personel paneli/yeniden deneme işlemi ile onarılabilir.

## Safety Center

Mevcut `/yardim/:slug` rehberleri korunur. Yardım merkezi; Hesap Güvenliği, Discord Güvenliği, Dolandırıcılık, Sahte Personeller, Ticket Kullanımı, Ceza ve İtiraz, Ban Affı, Moderasyon, Topluluk, Personel, Roblox ve EkoYıldız Sistemleri kategorileri altında genişletilir. Arama mevcut istemci tarafı filtrelemesini hem başlık hem kategori hem özet üzerinde çalıştırır. Yeni sayfalar aynı dokümantasyon kabuğunu kullanır.

## Doğrulama

- Ticket kaydı kanal/panel işleminden önce oluşturulur.
- Her giriş yolu aynı panel üreticisini kullanır.
- Her kategori doğru rehber linkini üretir.
- Panel hatası loglanır ve ticket yeniden denemeye uygun kalır.
- Personel çağrısı yetki ve cooldown kurallarına uyar.
- Safety Center linkleri açılır, arama sonuçları doğru rehberleri gösterir.
