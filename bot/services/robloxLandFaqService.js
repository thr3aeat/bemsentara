'use strict';

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  EmbedBuilder
} = require("discord.js");
const ComponentsV2Factory = require("../utils/componentsV2Factory");

const GUILD_ID = "1537407325290237973";
const FAQ_CHANNEL_ID = "1538465557031030835";

// ─── 15 BÖLÜM & HER BÖLÜMDE 10 KAPSAMLI + SAMİMİ/MİZAHİ SORU ──────────────────
const FAQ_CHAPTERS = [
  {
    id: 1,
    name: "🌐 Genel Tanıtım & Topluluk Ruhu",
    title: "Bölüm 1: 🌐 RobloxLand Nedir & Topluluk Ruhu",
    desc: "RobloxLand ekosistemi, amacımız ve sunucu dinamikleri hakkında temel bilgiler.",
    questions: [
      {
        q: "1. RobloxLand tam olarak nedir, yenir mi içilir mi?",
        a: "Yenmez ama tadından yenmez! RobloxLand; Türkiye'nin en aktif Roblox geliştirici, harita dağıtım, pazar yeri ve topluluk yönetim platformudur. Script arayanından harita sipariş edene herkes burada buluşur."
      },
      {
        q: "2. Neden başka yerler varken RobloxLand'i tercih etmeliyim?",
        a: "Çünkü bizde 'parayı aldım kaçtım' devri yok. 7/24 denetlenen resmi escrow sistemi, onaylı geliştiriciler ve 3 kademeli dolandırıcılık kalkanıyla paranız da emeğiniz de güvendedir."
      },
      {
        q: "3. Sunucuda takılmak ve sohbet etmek tamamen ücretsiz mi?",
        a: "Elbette! Girişte kimse sizden ayakbastı parası istemez. Sohbet edebilir, yeni arkadaşlar edinebilir ve projelerinizi tanıtabilirsiniz."
      },
      {
        q: "4. Buradaki 'Türkiye'nin 1 numaralı topluluğu' iddiası nereden geliyor?",
        a: "Laf olsun diye değil; 65 seviyeli rol motorumuz, anlık bilet sistemimiz ve günlük yüzlerce başarılı teslimatımızla kalitemizi tescilledik!"
      },
      {
        q: "5. Kurallara uymazsam ne olur, hemen banlanır mıyım?",
        a: "Önce tatlı dille uyarırız, devam ederseniz AutoMod kalkanımız devreye girer. Trollüğün dozu kaçarsa uzaya fırlatma bileti kesilir."
      },
      {
        q: "6. Sunucudaki kanallar neden bu kadar düzenli ve şık?",
        a: "Göz zevkinize verdiğimiz değerden! Discord Components V2 teknolojisiyle tasarlanmış kartlarımız sayesinde hiçbir şey karmaşık görünmez."
      },
      {
        q: "7. Botlar çökerse kime ulaşabilirim?",
        a: "Merak etmeyin, botlarımız %99.98 uptime ile çalışır. Nadiren kahve molası verirlerse teknik ekibimiz anında müdahale eder."
      },
      {
        q: "8. Sunucuda yaş sınırı veya kısıtlama var mı?",
        a: "Discord ToS kurallarına (+13) uyan ve saygılı davranan her yaştan Roblox tutkunu aramıza katılabilir."
      },
      {
        q: "9. Gece saatlerinde sunucuda kimse var mı?",
        a: "Geliştiriciler uyumaz, sadece gözlerini dinlendirir! Gece kuşları için sohbet ve destek kanallarımız her an aktiftir."
      },
      {
        q: "10. Topluluğa nasıl katkıda bulunabilirim?",
        a: "Sohbete katılın, bildiğiniz konularda yeni başlayanlara yardımcı olun ve seviye atlayarak rolünüzü yükseltin!"
      }
    ]
  },
  {
    id: 2,
    name: "🪙 Robux Alışverişi & Güvenli Teslimat",
    title: "Bölüm 2: 🪙 Robux Alışverişi & Güvenli Teslimat",
    desc: "En uygun fiyata hızlı ve temiz Robux teminiyle ilgili tüm detaylar.",
    questions: [
      {
        q: "1. Satın aldığım Robux ne kadar sürede hesabıma geçer?",
        a: "Ödemeniz onaylandığı andan itibaren ortalama 5–15 dakika içerisinde grup payout veya gamepass üzerinden teslim edilir."
      },
      {
        q: "2. Robux alırken hesap şifremi vermem gerekiyor mu?",
        a: "ASLA! Şifrenizi isteyen birini görürseniz kaçın. Robux teslimatı için sadece kullanıcı adınız veya gamepass linkiniz yeterlidir."
      },
      {
        q: "3. Robux'lar temiz mi, hesabım ban yer mi?",
        a: "Tüm Robux stoğumuz resmi Roblox geliştirici gelirlerinden (DevEx uyumlu) sağlanır. Kara para veya çalıntı Robux ile işimiz olmaz."
      },
      {
        q: "4. Gamepass ile alımlarda %30 Roblox vergisi kime ait?",
        a: "Sipariş verirken seçtiğiniz pakete göre vergiyi biz karşılıyoruz (Vergi Dahil paketler). Net olarak anlaştığımız miktar elinize geçer."
      },
      {
        q: "5. Pending (Beklemede) kalan Robux ne zaman açılır?",
        a: "Gamepass ile yapılan transferlerde Roblox güvenlik gereği bakiyeyi 3–5 gün bekletir. Bu süre tamamen Roblox'a aittir."
      },
      {
        q: "6. Grup Payout yöntemiyle Robux almak daha mı hızlı?",
        a: "Evet! Eğer transfer yapacağımız grupta en az 14 gün bulunuyorsanız, Payout anında hesabınıza yansır (0 bekleme süresi)."
      },
      {
        q: "7. Minimum kaç Robux satın alabilirim?",
        a: "Genellikle minimum 100 Robux'tan başlayarak dilediğiniz miktarda paket oluşturabilirsiniz."
      },
      {
        q: "8. Toplu Robux alımlarında indirim yapıyor musunuz?",
        a: "Elbette! 5.000 Robux ve üzeri siparişlerde kupon kodları veya özel indirim oranları tanımlanır."
      },
      {
        q: "9. Yanlış kullanıcı adı verirsem ne olur?",
        a: "Ödeme sonrası bilet kanalında yetkiliye anında doğru linki iletiniz. Transfer henüz yapılmadıysa düzeltilir."
      },
      {
        q: "10. Robux stoğu biterse ne yapmalıyım?",
        a: "Stoklarımız düzenli olarak yenilenir. Stok bildirim rolünü alarak anında haberdar olabilirsiniz."
      }
    ]
  },
  {
    id: 3,
    name: "🏰 Roblox Grup & Üye Satın Alımı",
    title: "Bölüm 3: 🏰 Roblox Grup & Üye Satın Alımı",
    desc: "Hazır Roblox grupları, grup üyeleri ve kuruculuk devir işlemleri.",
    questions: [
      {
        q: "1. Satın aldığım Roblox grubunun sahipliğini nasıl devralırım?",
        a: "Bilet açtıktan sonra yetkilimiz size özel transfer talimatı verir ve grubun 'Owner' yetkisini 1 dakika içinde üzerinize geçirir."
      },
      {
        q: "2. Satılan grupların geçmişinde illegal bir durum var mı?",
        a: "Hayır, satışa sunulan tüm gruplar güvenlik taramasından geçirilir ve temiz sicilli olarak teslim edilir."
      },
      {
        q: "3. Gruba üye satın alırsam üyeler bot mu gerçek mi olur?",
        a: "Paket türüne göre organik ve aktif Türk üyeler veya sayı artırıcı üyeler temin edilir."
      },
      {
        q: "4. Grup satın aldıktan sonra adını değiştirebilir miyim?",
        a: "Roblox'un kendi özelliği sayesinde 100 Robux karşılığında grup ismini dilediğiniz gibi güncelleyebilirsiniz."
      },
      {
        q: "5. Grup fonunda (Funds) Robux olan hazır gruplar satıyor musunuz?",
        a: "Evet, içerisinde hazır bakiye bulunan yatırım gruplarımız satış kanallarında periyodik olarak listelenir."
      },
      {
        q: "6. Grup devralırken 14 gün kuralı var mı?",
        a: "Roblox kuralları gereği grup sahipliği anında geçer, ancak fon transferleri için grupta kalma süreleri uygulanır."
      },
      {
        q: "7. Satın aldığım grubun kıyafet mağazasını kullanabilir miyim?",
        a: "Kesinlikle! Grup içindeki tüm varlıklar ve satış gelirleri tamamen sizin mülkiyetinize geçer."
      },
      {
        q: "8. Kendi grubuma üye bastırmak ban sebebi midir?",
        a: "Güvenli dağıtım motorumuz sayesinde Roblox algoritmalarına takılmadan doğal hızda teslimat sağlanır."
      },
      {
        q: "9. Grup devrinden sonra eski sahip grubu geri alabilir mi?",
        a: "İmkansızdır. Sahiplik devredildikten sonra eski sahibin hiçbir teknik veya idari bağı kalmaz."
      },
      {
        q: "10. Grup için özel logo ve banner tasarımı da alabilir miyim?",
        a: "Evet! GFX tasarımcılarımız grubunuza özel profesyonel ikon ve afiş hazırlar."
      }
    ]
  },
  {
    id: 4,
    name: "📜 Lua Script & Kodlama Desteği",
    title: "Bölüm 4: 📜 Lua Script & Kodlama Desteği",
    desc: "Roblox Studio için hazır scriptler, özel sistem kodlama ve hata çözümleri.",
    questions: [
      {
        q: "1. Hangi tür sistemler kodlanabiliyor?",
        a: "Envanter, Datastore, Combat (dövüş), RPG seviye sistemleri, GUI arayüzleri ve ekonomi motorları dahil her şey!"
      },
      {
        q: "2. Satın aldığım scriptte hata çıkarsa ne yapıyorsunuz?",
        a: "Ücretsiz hata düzeltme (Bug-Fix) garantisi veriyoruz. Kod çalışana kadar arkasındayız."
      },
      {
        q: "3. Kodlar optimize mi, oyunum kasar mı?",
        a: "Tüm scriptlerimiz memory leak ve lag yapmayacak şekilde temiz ve modüler yazılır."
      },
      {
        q: "4. Kendi projeme script entegrasyonu yapıyor musunuz?",
        a: "Evet, dilerseniz ekibimiz oyun dosyanıza bağlanıp scripti çalışır vaziyette kurar."
      },
      {
        q: "5. Açık kaynak (Open Source) kod veriyor musunuz?",
        a: "Evet, kodlar obfuscate edilmeden, üzerinde dilediğiniz gibi değişiklik yapabileceğiniz şekilde teslim edilir."
      },
      {
        q: "6. Sıfırdan oyun yaptırmak ne kadar sürer?",
        a: "Projenin kapsamına göre mini oyunlar 2–5 gün, büyük projeler 1–3 hafta arasında teslim edilir."
      },
      {
        q: "7. Kodlama öğrenmek isteyenlere yardımcı oluyor musunuz?",
        a: "Sohbet kanallarımızda script sorularınızı sorabilir, usta yazılımcılarımızdan tavsiye alabilirsiniz."
      },
      {
        q: "8. Anti-Cheat (Hile Koruma) sistemi yapıyor musunuz?",
        a: "Evet; Speed, Fly, Noclip ve Remote Event spam korumalı güvenlik sistemleri kuruyoruz."
      },
      {
        q: "9. Datastore sıfırlanma sorununu çözebilir misiniz?",
        a: "ProfileService ve modern Datastore v2 altyapılarıyla veri kaybını %0'a indiriyoruz."
      },
      {
        q: "10. Script siparişinde ödemeyi nasıl yapıyorum?",
        a: "Bilet kanalında detaylar konuşulur, ödeme onaylandıktan sonra kodlama süreci başlar."
      }
    ]
  },
  {
    id: 5,
    name: "🗺️ Harita Dağıtımı & Map Siparişleri",
    title: "Bölüm 5: 🗺️ Harita Dağıtımı & Map Siparişleri",
    desc: "Hazır haritalar, özel şehir, askeri üs, simülatör ve Low-Poly tasarımlar.",
    questions: [
      {
        q: "1. Haritalar hazır mı yoksa sıfırdan mı yapılıyor?",
        a: "Hem anında indirebileceğiniz zengin hazır harita kütüphanemiz var hem de hayalinizdeki özel haritayı sıfırdan inşa ediyoruz."
      },
      {
        q: "2. Hangi temalarda haritalar yapıyorsunuz?",
        a: "Şehir, Askeri Üs (Military), Anime, Simülatör, Low-Poly, Tycoon, Korku ve Gerçekçi (Realistic) mekanlar."
      },
      {
        q: "3. Haritalar Roblox Studio dosyası (.rbxl) olarak mı veriliyor?",
        a: "Evet! Tek tıkla açabileceğiniz `.rbxl` proje dosyası ve modeller olarak eksiksiz teslim edilir."
      },
      {
        q: "4. Haritanın ışıklandırması (Lighting) ve atmosferi dahil mi?",
        a: "Kesinlikle. Profesyonel post-processing, sis, gölge ve renk filtreleriyle sinematik bir atmosfer kurulur."
      },
      {
        q: "5. Harita boyutları ne kadar büyük olabiliyor?",
        a: "Küçük bir odadan kilometrelerce karelik devasa açık dünya haritalarına kadar ölçeklendirilebilir."
      },
      {
        q: "6. Düşük sistemli telefonlarda harita kasar mı?",
        a: "StreamingEnabled ve Level of Detail (LOD) optimizasyonları yaparak mobil oyuncuların kasmadan oynamasını sağlıyoruz."
      },
      {
        q: "7. Harita yapım aşamasında ekran görüntüsü atıyor musunuz?",
        a: "Tabii ki! İnşaat boyunca aşama aşama onayınızı alarak ilerliyoruz."
      },
      {
        q: "8. Beğenmediğim kısımları revize ettirebilir miyim?",
        a: "Her siparişte 2 ücretsiz revizyon hakkınız bulunur."
      },
      {
        q: "9. Ücretsiz paylaşılan haritalar var mı?",
        a: "Evet, topluluğumuza özel olarak belirli aralıklarla ücretsiz açık kaynak haritalar yayınlıyoruz."
      },
      {
        q: "10. Haritayı başka birine satabilir miyim?",
        a: "Özel sipariş ettiğiniz haritaların tüm hakları size aittir; dilediğiniz gibi kullanabilirsiniz."
      }
    ]
  },
  {
    id: 6,
    name: "🎨 GFX, UI & Tasarım Hizmetleri",
    title: "Bölüm 6: 🎨 GFX, UI & Tasarım Hizmetleri",
    desc: "Oyun ikonları, küçük resimler (Thumbnails), logo ve modern kullanıcı arayüzleri.",
    questions: [
      {
        q: "1. GFX tasarımları hangi programlarla yapılıyor?",
        a: "Blender, Cinema 4D ve Photoshop kullanılarak 4K çözünürlükte, gerçekçi render ışıklandırmasıyla hazırlanır."
      },
      {
        q: "2. Oyunumun tıklanma oranını (CTR) artıracak kapak yapar mısınız?",
        a: "Evet! Roblox algoritmasına ve oyuncu psikolojisine uygun, dikkat çekici başlık ve renk paletleri kullanıyoruz."
      },
      {
        q: "3. UI (Kullanıcı Arayüzü) tasarımları Studio'ya aktarılmış mı oluyor?",
        a: "Talebinize göre hem PSD/Figma kaynak dosyası hem de Roblox Studio GUI olarak import edilmiş halde verilir."
      },
      {
        q: "4. Tasarımlarda kendi avatarımı kullanabilir miyim?",
        a: "Elbette! Roblox kullanıcı adınızı vermeniz yeterlidir; karakterinizi 3D render'a aktarıyoruz."
      },
      {
        q: "5. Banner ve Logo siparişleri ne kadar sürede biter?",
        a: "Genellikle 24–48 saat içerisinde yüksek kaliteli PNG formatında teslim edilir."
      },
      {
        q: "6. Hareketli (Animated) banner veya ikon yapıyor musunuz?",
        a: "Evet, Discord için GIF ve Roblox reklamları için animasyonlu formatlar hazırlıyoruz."
      },
      {
        q: "7. UI tasarımı mobil ekranlara uyumlu (Scaled) oluyor mu?",
        a: "Kesinlikle! UIAspectRatioConstraint ve Scale değerleri ayarlanarak telefon, tablet ve PC'de kusursuz görünür."
      },
      {
        q: "8. Toplu tasarım paketi (Logo + Banner + 3 Thumbnail) indirimi var mı?",
        a: "Evet, 'Full Oyun Tasarım Paketi' alımlarında %25'e varan paket indirimi uygulanır."
      },
      {
        q: "9. Tasarım beğenilmezse iade var mı?",
        a: "Tasarımcılarımız istediğiniz konsepte ulaşana kadar revize eder; memnuniyet odaklı çalışırız."
      },
      {
        q: "10. Tasarım portföyünüzü nerede görebilirim?",
        a: "Sunucumuzdaki `#gfx-tasarım` kanalından geçmiş referans çalışmalarımızı inceleyebilirsiniz."
      }
    ]
  },
  {
    id: 7,
    name: "🤖 Discord & Roblox Özel Bot Geliştirme",
    title: "Bölüm 7: 🤖 Discord & Roblox Özel Bot Geliştirme",
    desc: "Sunucunuza özel Discord botları, Roblox doğrulama ve otomasyon sistemleri.",
    questions: [
      {
        q: "1. Sıfırdan kendi sunucuma özel Discord botu yaptırabilir miyim?",
        a: "Evet! İster kayıt botu, ister bilet sistemi, ister gelişmiş ekonomi veya rol yönetimi botu yapıyoruz."
      },
      {
        q: "2. Bot Roblox hesabıyla nasıl bağlanır (RoWifi/Bloxlink tarzı)?",
        a: "Roblox OpenCloud API ve OAuth2 kullanarak güvenli hesap bağlama ve otomatik rol verme motoru kuruyoruz."
      },
      {
        q: "3. Botun barındırmasını (Hosting) siz mi yapıyorsunuz?",
        a: "İster 7/24 kesintisiz kendi sunucularımızda barındıralım, isterseniz tüm kaynak kodlarıyla size teslim edelim."
      },
      {
        q: "4. Botta Components V2 (yeni nesil Discord butonları) kullanılıyor mu?",
        a: "Evet! Discord'un en modern Container ve Section tasarımlarını entegre ediyoruz."
      },
      {
        q: "5. Bot çökerse veya hata verirse destek veriyor musunuz?",
        a: "Tüm bot siparişlerimizde 30 gün ücretsiz bakım ve teknik destek sağlıyoruz."
      },
      {
        q: "6. Bot üzerinden Robux satışı otomasyonu kurulabilir mi?",
        a: "Evet, otomatik sipariş kabulü ve ödeme onay sistemiyle çalışan satış botları kodluyoruz."
      },
      {
        q: "7. Bot kaynak kodunu alabiliyor muyum?",
        a: "Evet, tam açık kaynak kodlu teslimat seçeneğimiz bulunmaktadır."
      },
      {
        q: "8. Web Panelli Discord botu yapıyor musunuz?",
        a: "Evet, sitenizden botu yönetebileceğiniz modern Dashboard panelleri geliştiriyoruz."
      },
      {
        q: "9. Hangi dillerde bot yazıyorsunuz?",
        a: "Modern Node.js (Discord.js v14) ve Python (discord.py) mimarileriyle yüksek performanslı botlar yazıyoruz."
      },
      {
        q: "10. Bot siparişi vermek için ne yapmalıyım?",
        a: "Bilet açarak aklınızdaki bot özelliklerini sıralamanız yeterlidir; fiyat ve süre teklifi iletilir."
      }
    ]
  },
  {
    id: 8,
    name: "💎 VIP Üyelik & LandCoin Sistemi",
    title: "Bölüm 8: 💎 VIP Üyelik & LandCoin Sistemi",
    desc: "RobloxLand'in sadakat para birimi LandCoin ve VIP ayrıcalıkları.",
    questions: [
      {
        q: "1. LandCoin nedir ve nasıl kazanılır?",
        a: "RobloxLand'in resmi puan birimidir. Sunucuda yaptığınız her 100 TL harcamada +10 LandCoin hesabınıza yüklenir."
      },
      {
        q: "2. LandCoin ile neler alabilirim?",
        a: "Özel indirim kuponları, ücretsiz reklam hakları, VIP rolü ve sürpriz hediye çekiliş biletleri alabilirsiniz."
      },
      {
        q: "3. Kaç LandCoin'im olduğunu nasıl öğrenirim?",
        a: "Aşağıdaki '👤 Profilim' butonuna basarak veya `!profil` yazarak bakiyenizi anında görebilirsiniz."
      },
      {
        q: "4. VIP üye olmanın avantajları nelerdir?",
        a: "Özel VIP rol rengi, tüm siparişlerde ek %10 indirim, biletlerde öncelikli sıra ve gizli VIP sohbet odası!"
      },
      {
        q: "5. VIP üyelik süreli mi yoksa kalıcı mı?",
        a: "Satın aldığınız veya puanla açtığınız VIP üyelikler kalıcıdır; süresi dolup iptal olmaz."
      },
      {
        q: "6. LandCoin başkasına transfer edilebilir mi?",
        a: "Evet! Arkadaşınıza puan hediye etmek için yetkili biletinden transfer talebi oluşturabilirsiniz."
      },
      {
        q: "7. Günlük LandCoin bonusu var mı?",
        a: "Evet, aktif olan ve her gün selam veren üyelerimize sürpriz günlük coin dağıtımları yapılmaktadır."
      },
      {
        q: "8. LandCoin gerçek paraya çevrilebilir mi?",
        a: "Nakit paraya çevrilemez ancak sunucudaki tüm ürün ve hizmetlerde indirim olarak kullanılabilir."
      },
      {
        q: "9. VIP üyelerin destek talepleri daha mı hızlı yanıtlanır?",
        a: "Evet, VIP talepleri otomatik olarak yetkili panelinde 'Yüksek Öncelikli' olarak işaretlenir."
      },
      {
        q: "10. Nasıl VIP olabilirim?",
        a: "500 LandCoin biriktirerek veya doğrudan VIP paketi satın alarak anında VIP statüsüne geçebilirsiniz."
      }
    ]
  },
  {
    id: 9,
    name: "📈 65 Seviye Rol Sistemi & XP Kazanımı",
    title: "Bölüm 9: 📈 65 Seviye Rol Sistemi & XP Kazanımı",
    desc: "Level 1–65 arası özel geliştirici rolleri, XP formülü ve sıralama mantığı.",
    questions: [
      {
        q: "1. Kaç tane seviye rolü var?",
        a: "Tam 65 tane! '🌱 Çaylak Dev' rolünden başlayıp '👑 Efsanevi Roblox Tanrısı' rolüne kadar uzanan muazzam bir hiyerarşi mevcuttur."
      },
      {
        q: "2. Nasıl XP kazanabilirim?",
        a: "Metin kanallarında sohbet ederek, sesli kanallarda vakit geçirerek ve etkinliklere katılarak XP kazanırsınız."
      },
      {
        q: "3. Seviye atladığımda rolüm otomatik veriliyor mu?",
        a: "Evet! Seviye atladığınız saniyede eski rolünüz alınıp yeni parlak rolünüz üzerinize takılır."
      },
      {
        q: "4. Seviye rolleri diğer üyelerden ayrı gösteriliyor mu (Hoist)?",
        a: "Evet! 65 seviye rolünün tümü online üye listesinde kendi özel rengi ve sırasıyla ayrı gösterilir."
      },
      {
        q: "5. Ses kanalında afk kalarak XP kasabilir miyim?",
        a: "Sessize alınmamış (unmuted) ve aktif kanallarda XP kazanılır; anti-farm sistemi sağırlaştırılmış kullanıcıları filtreler."
      },
      {
        q: "6. Sıralamada kaçıncı olduğumu nasıl görürüm?",
        a: "`!profil` yazarak veya `/status` sayfamızdan liderlik tablosunu inceleyebilirsiniz."
      },
      {
        q: "7. XP kasmak için spam yaparsam ne olur?",
        a: "1 dakikalık mesaj içi cooldown devrededir; hızlı spam yapmak XP vermez, üstüne AutoMod uyarısı alırsınız."
      },
      {
        q: "8. Gece saatlerinde seviye atlama duyurusu herkese bildirim atıyor mu?",
        a: "Hayır, gece 00:00–08:00 arası sistem otomatik olarak sessiz moda geçer ve kimseyi rahatsız etmez."
      },
      {
        q: "9. Üst seviyelere ulaştığımda özel avantajlar var mı?",
        a: "Level 20 ve üzeri üyelerimiz çekilişlerde 2x şans, özel indirim kuponları ve moderasyon ayrıcalıkları kazanır."
      },
      {
        q: "10. Seviyem sıfırlanabilir mi?",
        a: "Sunucu genel bir sezon sıfırlaması yapmadığı sürece seviyeniz ömür boyu kalıcıdır."
      }
    ]
  },
  {
    id: 10,
    name: "🚨 Dolandırıcılık, Güvenlik & Kara Liste",
    title: "Bölüm 10: 🚨 Dolandırıcılık, Güvenlik & Kara Liste",
    desc: "Şüpheli durumlar, vaka ihbarı, ID sorgulama ve güvenli ticaret önlemleri.",
    questions: [
      {
        q: "1. Biri bana DM'den ulaşıp 'ucuz Robux satıyorum' dedi, ne yapmalıyım?",
        a: "Derhal engelleyin ve `#dolandırıcı-şikayet` kanalındaki **🚨 Dolandırıcı Şikayet Et** butonundan şahsın ID'sini bildirin."
      },
      {
        q: "2. Ticaret yapacağım kişinin sicilini nasıl kontrol edebilirim?",
        a: "`#dolandırıcı-şikayet` kanalındaki **🔎 Şüpheli / ID Sorgula** butonuna basıp kullanıcının Discord ID'sini giriniz."
      },
      {
        q: "3. Birisi beni dolandırdı, nasıl ihbarda bulunabilirim?",
        a: "Şikayet formunu açın; şüphelinin ID'sini, Roblox adını, zarar tutarını ve kanıt linklerini (dekont/SS) iletin."
      },
      {
        q: "4. Kara listeye (Blacklist) alınan kişiye ne olur?",
        a: "Güven puanı anında 0/100'e düşürülür, sunucudan kalıcı banlanır ve ID'si resmi veritabanında ifşa edilir."
      },
      {
        q: "5. Yetkililer benden şifre veya doğrulama kodu ister mi?",
        a: "HAYIR! Hiçbir yetkili şifre, telefon kodu veya `.ROBLOSECURITY` çerezi istemez. İsteyen olursa derhal bildirin."
      },
      {
        q: "6. Dolandırıcılık ihbarım ne kadar sürede incelenir?",
        a: "Güvenlik birimimiz ihbarınızı vaka numarasıyla (`#SC-XXXX`) anında incelemeye alır ve delilleri doğrular."
      },
      {
        q: "7. Asılsız veya iftira niteliğinde ihbar yaparsam ne olur?",
        a: "Sahte kanıt veya iftira girişiminde bulunan kullanıcılar hakkında ters işlem uygulanır ve sunucudan uzaklaştırılır."
      },
      {
        q: "8. Escrow (Aracı Güvencesi) sistemi nasıl çalışır?",
        a: "Para ve ürün yetkili havuzunda toplanır; iki taraf da onay verdiğinde teslimat tamamlanır, risk %0'a iner."
      },
      {
        q: "9. Güven Puanı (Trust Score) nasıl yükselir?",
        a: "Sorunsuz tamamlanan her resmi sipariş ve olumlu değerlendirme güven puanınızı artırır."
      },
      {
        q: "10. Kara listeden çıkmak mümkün müdür?",
        a: "Mağdurun tüm zararı kuruşu kuruşuna telafi edilip yönetim onaylamadıkça kara listeden çıkış yoktur."
      }
    ]
  },
  {
    id: 11,
    name: "📣 Reklam, Sponsorluk & Özel Paketler",
    title: "Bölüm 11: 📣 Reklam, Sponsorluk & Özel Paketler",
    desc: "Sunucunuzu, oyununuzu veya ürününüzü RobloxLand'de tanıtma seçenekleri.",
    questions: [
      {
        q: "1. RobloxLand'de reklam vermek bana ne kazandırır?",
        a: "Binlerce aktif Roblox oyuncusu ve geliştiricisine doğrudan erişim sağlayarak oyununuzu ve sunucunuzu patlatırsınız!"
      },
      {
        q: "2. Hangi reklam paketleri mevcut?",
        a: "Everyone Duyuru, Özel Sponsor Kanalı, YouTube Tanıtımı, Kendi Paketini Oluştur ve Toplu DM seçenekleri mevcuttur."
      },
      {
        q: "3. 'Kendi Paketini Oluştur' sistemi nedir?",
        a: "`#reklam-fiyatları` kanalından bütçenize göre istediğiniz özellikleri seçip size özel reklam paketi oluşturabilirsiniz."
      },
      {
        q: "4. Reklamım ne zaman yayınlanır?",
        a: "Ödeme ve reklam metni onaylandıktan sonra belirlenen en aktif saatte (prime-time) yayına alınır."
      },
      {
        q: "5. İndirim kuponu kullanabilir miyim?",
        a: "Evet! `EKOSTAR10`, `ROBLOXLND20` veya `VIP50` gibi indirim kodlarını bilette belirterek indirim alabilirsiniz."
      },
      {
        q: "6. Reklamımda çekiliş yapabilir miyim?",
        a: "Kesinlikle! Çekilişli reklamlar çok daha yüksek etkileşim ve üye dönüşü sağlar."
      },
      {
        q: "7. YouTube kanalınızda tanıtım yapıyor musunuz?",
        a: "Evet, 7.410 ve 1.980 aboneli partner YouTube kanallarımızda oyun/video tanıtımı yapılmaktadır."
      },
      {
        q: "8. Uygunsuz veya dolandırıcı sunucuların reklamını alır mısınız?",
        a: "Asla! Reklamı yapılacak tüm içerikler güvenlik ekibimizce ön denetimden geçirilir."
      },
      {
        q: "9. Reklam performansımı görebilir miyim?",
        a: "Reklam sonrasında tıklanma ve katılım istatistikleri bilet kanalınızda sizinle paylaşılır."
      },
      {
        q: "10. Reklam satın almak için nereden başvurmalıyım?",
        a: "`#reklam-fiyatları` kanalındaki paket butonlarına basarak anında özel reklam bileti açabilirsiniz."
      }
    ]
  },
  {
    id: 12,
    name: "💳 Ödeme Yöntemleri, IBAN & İade Politikası",
    title: "Bölüm 12: 💳 Ödeme Yöntemleri, IBAN & İade Politikası",
    desc: "Geçerli tüm ödeme yolları, dekont bildirimleri ve yasal haklarınız.",
    questions: [
      {
        q: "1. Hangi ödeme yöntemlerini kabul ediyorsunuz?",
        a: "Banka Havalesi/EFT/FAST (IBAN), Papara, İtemSatış, Kredi Kartı ve belirli oyun içi varlıklar (OwO/Robux)."
      },
      {
        q: "2. IBAN'a para gönderirken açıklamaya ne yazmalıyım?",
        a: "Bilette size verilen sipariş kodunu (Örn: `#RBLX-0142`) yazmanız işlemin anında onaylanmasını sağlar."
      },
      {
        q: "3. Kredi kartı ile taksitli ödeme yapabilir miyim?",
        a: "Evet, İtemSatış ve güvenli mağaza altyapımız üzerinden 12 aya varan taksit seçenekleri mevcuttur."
      },
      {
        q: "4. Ödeme yaptıktan sonra dekontu nereye atmalıyım?",
        a: "Açtığınız sipariş bilet kanalına dekont görselini veya PDF dosyasını yükleyiniz."
      },
      {
        q: "5. Siparişim teslim edilmezse param iade edilir mi?",
        a: "Teslimat garantimiz vardır. Bizden kaynaklı teknik bir aksilikte %100 kesintisiz para iadesi yapılır."
      },
      {
        q: "6. Ürünü teslim aldıktan sonra keyfi iade edebilir miyim?",
        a: "Dijital kod, Robux ve teslim edilmiş script gibi tek kullanımlık ürünlerde keyfi iade yapılamaz."
      },
      {
        q: "7. Fatura kesiyor musunuz?",
        a: "Resmi kurumsal taleplerinizde faturalandırma seçeneği sunulmaktadır."
      },
      {
        q: "8. Hafta sonu veya gece EFT yaparsam gecikir mi?",
        a: "FAST sistemi sayesinde 7/24 saniyeler içinde hesabımıza ulaşır ve anında onaylanır."
      },
      {
        q: "9. Yurt dışından ödeme yapabilir miyim?",
        a: "Evet; Kripto (USDT), Wise ve uluslararası kart altyapılarımız mevcuttur."
      },
      {
        q: "10. Ödeme bilgilerim güvende mi?",
        a: "Hiçbir kart bilginiz sunucumuzda saklanmaz, ödemeler 256-bit SSL korumalı banka altyapısıyla gerçekleşir."
      }
    ]
  },
  {
    id: 13,
    name: "🎫 Destek Biletleri (Ticket) & Yetkili İletişimi",
    title: "Bölüm 13: 🎫 Destek Biletleri (Ticket) & Yetkili İletişimi",
    desc: "Ticket açma, yetkili sahiplenmesi, tür değiştirme ve transkript kaydı.",
    questions: [
      {
        q: "1. Nasıl destek talebi (Ticket) açabilirim?",
        a: "`#destek-talebi` kanalındaki açılır menüden talebinizin konusunu seçerek saniyeler içinde biletinizi oluşturabilirsiniz."
      },
      {
        q: "2. Bilet açtıktan sonra ne kadar sürede yanıt alırım?",
        a: "Yetkililerimiz talebinizi ortalama 1–5 dakika içinde sahiplenir ve birebir ilgilenir."
      },
      {
        q: "3. 'Talebi Üstlen' butonu ne işe yarar?",
        a: "Biletle hangi yetkilinin ilgilendiğini belirler; yetkili üstlendiğinde 'İlgilenen: @Yetkili' olarak güncellenir."
      },
      {
        q: "4. Biletime arkadaşımı veya ortağımı ekleyebilir miyim?",
        a: "Evet! Paneldeki **👤 Kullanıcı Ekle** butonuna basıp arkadaşınızın ID'sini girerek kanala dahil edebilirsiniz."
      },
      {
        q: "5. Bilet kapatılırken hemen siliniyor mu?",
        a: "Hayır! Önce kapatma nedeni sorulur, ardından tüm konuşma HTML transkript olarak kaydedilir ve DM'nize gönderilir."
      },
      {
        q: "6. Yetkiliye puan (Yıldız) verebilir miyim?",
        a: "Evet! Bilet kapandığında açılan 1–5 yıldız değerlendirme paneliyle yetkilinin performansını puanlayabilirsiniz."
      },
      {
        q: "7. Yanlış kategori seçtiysem bileti kapatmam gerekir mi?",
        a: "Gerekmez! **🔄 Tür Değiştir** butonuna basarak biletinizi Sipariş, Destek veya Şikayet olarak güncelleyebilirsiniz."
      },
      {
        q: "8. Bilette küfür veya saygısızlık yapılırsa ne olur?",
        a: "Transkript arşive kaydedilir, kullanıcı cezalandırılır ve ticket kapatılır."
      },
      {
        q: "9. Aynı anda birden fazla bilet açabilir miyim?",
        a: "Kanal kirliliğini önlemek adına her kullanıcının aynı anda maksimum 2 aktif talebi olabilir."
      },
      {
        q: "10. Geçmiş bilet transkriptlerimi nerede görebilirim?",
        a: "Botumuz bilet kapandığında transkript linkini ve özetini doğrudan DM kutunuza iletir."
      }
    ]
  },
  {
    id: 14,
    name: "👨‍💼 Yetkili Kadrosu, Başvuru & Terfi",
    title: "Bölüm 14: 👨‍💼 Yetkili Kadrosu, Başvuru & Terfi",
    desc: "RobloxLand ekibine katılma şartları, yetkili alım formu ve terfi basamakları.",
    questions: [
      {
        q: "1. Nasıl yetkili olabilirim?",
        a: "`#yetkili-alım` kanalındaki formu eksiksiz doldurarak başvuruda bulunabilirsiniz."
      },
      {
        q: "2. Yetkili olmak için yaş sınırı nedir?",
        a: "Minimum 15 yaş ve olgun iletişim becerisi aranmaktadır."
      },
      {
        q: "3. Yetkililer maaş veya prim alıyor mu?",
        a: "Başarılı sipariş yöneten ve bilet puanı yüksek olan yetkililerimize düzenli prim ve Robux ödülleri dağıtılır."
      },
      {
        q: "4. Yetkili başvurum ne zaman sonuçlanır?",
        a: "Yönetim ekibimiz başvuruları 24–48 saat içerisinde değerlendirip DM üzerinden geri dönüş yapar."
      },
      {
        q: "5. Yetkili olduktan sonra hangi görevleri yapacağım?",
        a: "Destek biletlerine bakma, sohbet düzenini sağlama, sipariş teslimatlarını koordine etme ve etkinlik yönetimi."
      },
      {
        q: "6. Yetkili terfileri neye göre belirlenir?",
        a: "Çözdüğünüz bilet sayısı, aldığınız üye puanları (5 yıldız oranı) ve sunucu içi aktifliğinize göre terfi alırsınız."
      },
      {
        q: "7. Yetkiyi kötüye kullanmanın cezası nedir?",
        a: "Anında yetki alımı (Demote), kara listeye ekleme ve kalıcı uzaklaştırma uygulanır."
      },
      {
        q: "8. Daha önce başka sunucularda yetkili olmam avantaj sağlar mı?",
        a: "Evet, tecrübenizi başvuru formunda belirterek öncelikli değerlendirme hakkı kazanabilirsiniz."
      },
      {
        q: "9. Geliştirici (Dev) veya Tasarımcı olarak ekibe girebilir miyim?",
        a: "Evet! Kodlama veya GFX portföyünüzü ileterek 'Onaylı Satıcı/Geliştirici' statüsü alabilirsiniz."
      },
      {
        q: "10. İzin (Hiatus/Leave) sistemi var mı?",
        a: "Sınav veya tatil dönemlerinde bilet açarak mazeret izni alabilirsiniz; yetkiniz askıya alınmaz."
      }
    ]
  },
  {
    id: 15,
    name: "🎮 Sosyal Medya, Çekilişler & Eğlenceli İçerikler",
    title: "Bölüm 15: 🎮 Sosyal Medya, Çekilişler & Eğlenceli İçerikler",
    desc: "YouTube yayınları, dev Robux çekilişleri, mini oyunlar ve topluluk etkinlikleri.",
    questions: [
      {
        q: "1. Çekilişlere nasıl katılabilirim?",
        a: "`#çekiliş` kanalındaki mesajlara 🎉 emojisiyle tepki vererek tek tıkla katılabilirsiniz."
      },
      {
        q: "2. Çekilişlerde torpil veya hile var mı?",
        a: "Kesinlikle hayır! Tüm çekilişler Discord botu tarafından şeffaf ve rastgele olarak belirlenir."
      },
      {
        q: "3. Çekiliş kazandığımda ödülü nasıl alırım?",
        a: "Kazanan açıklandığında bilet açarak yetkiliye ekran görüntüsü atmanız yeterlidir; ödül anında teslim edilir."
      },
      {
        q: "4. YouTube kanalınızda neler paylaşıyorsunuz?",
        a: "Roblox güncellemeleri, harita yapım tüyoları, eğlenceli oyun videoları ve canlı yayın etkinlikleri!"
      },
      {
        q: "5. Kendi oyunumu videonuzda tanıtabilir misiniz?",
        a: "Evet! Sponsorluk veya YouTube paketlerimizle oyununuzu binlerce izleyiciye ulaştırabilirsiniz."
      },
      {
        q: "6. Sunucuda OwO veya mini oyunlar var mı?",
        a: "Evet! `#owo-bot` kanalında kumar, avlanma ve para oyunları oynayabilirsiniz."
      },
      {
        q: "7. Oyun geceleri (Game Night) düzenleniyor mu?",
        a: "Her hafta sonu ses kanallarında topluca Roblox, Gartic Phone ve sesli oyun etkinlikleri düzenlenir."
      },
      {
        q: "8. Sunucuya arkadaşımı davet edersem ödül alır mıyım?",
        a: "Evet! Davet yarışmalarımızda en çok üye getiren ilk 3 kişiye devasa Robux ödülleri verilir."
      },
      {
        q: "9. Discord Boost basarsam hangi avantajları kazanırım?",
        a: "Özel Boost rolü, 2x çekiliş kazanma şansı, fotoğraf yükleme izni ve harika renkli isim ayrıcalığı!"
      },
      {
        q: "10. RobloxLand hakkında son bir söz söyler misiniz?",
        a: "RobloxLand sadece bir sunucu değil, hayallerinizi inşa ettiğiniz dev bir ailedir. Aramıza hoş geldiniz! 🚀"
      }
    ]
  }
];

// ─── 2. PAYLOAD OLUŞTURUCU ───────────────────────────────────────────────────
function buildFaqChapterPayload(chapterId = 1) {
  const ch = FAQ_CHAPTERS.find(c => c.id === Number(chapterId)) || FAQ_CHAPTERS[0];
  const total = FAQ_CHAPTERS.length;

  let desc = `### 📖 ${ch.title} (${ch.id} / ${total})\n*${ch.desc}*\n\n`;

  for (const item of ch.questions) {
    desc += `**❓ ${item.q}**\n💬 ${item.a}\n\n`;
  }

  // 15 Bölüm Select Menüsü
  const selectOptions = FAQ_CHAPTERS.map(c => ({
    label: `Bölüm ${c.id}: ${c.name.replace(/[^a-zA-Z0-9 ğüşöçıİĞÜŞÖÇ&]/g, "").trim().slice(0, 45)}`,
    value: String(c.id),
    description: c.desc.slice(0, 50),
    default: c.id === ch.id
  }));

  const selectRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("robloxland_faq_select_chapter")
      .setPlaceholder(`📖 Bölüm Seçiniz (Şu an: Bölüm ${ch.id})`)
      .addOptions(selectOptions)
  );

  const prevId = ch.id > 1 ? ch.id - 1 : total;
  const nextId = ch.id < total ? ch.id + 1 : 1;

  const btnRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`robloxland_faq_page_${prevId}`)
      .setLabel(`◀️ Önceki (${prevId})`)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`robloxland_faq_page_${nextId}`)
      .setLabel(`▶️ Sonraki (${nextId})`)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("robloxland_open_ticket_destek")
      .setLabel("🎫 Bilet Aç")
      .setStyle(ButtonStyle.Success)
      .setEmoji("💬"),
    new ButtonBuilder()
      .setCustomId("robloxland_open_my_profile")
      .setLabel("👤 Profilim")
      .setStyle(ButtonStyle.Secondary)
  );

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`❓ ROBLOXLND — SIKÇA SORULAN SORULAR (SSS)`)
    .setDescription(desc.slice(0, 4000))
    .setFooter({ text: `Bölüm ${ch.id} / ${total} • Açılır menüden veya butonlardan gezinebilirsiniz.` });

  return {
    embeds: [embed],
    components: [selectRow, btnRow]
  };
}

// ─── 3. INTERACTION DİNLEYİCİSİ ──────────────────────────────────────────────
async function handleFaqInteraction(interaction) {
  const customId = interaction.customId || "";

  // 1. Select Menüden Bölüm Seçimi
  if (interaction.isStringSelectMenu() && customId === "robloxland_faq_select_chapter") {
    const selectedId = Number(interaction.values[0]) || 1;
    const payload = buildFaqChapterPayload(selectedId);
    await interaction.update(payload);
    return true;
  }

  // 2. Önceki / Sonraki Butonları
  if (interaction.isButton() && customId.startsWith("robloxland_faq_page_")) {
    const targetId = Number(customId.replace("robloxland_faq_page_", "")) || 1;
    const payload = buildFaqChapterPayload(targetId);
    await interaction.update(payload);
    return true;
  }

  return false;
}

// ─── 4. SSS PANELİ GÖNDERME VE GÜNCELLEME ─────────────────────────────────────
async function deployFaqPanel(channel, client) {
  if (!channel || !channel.isTextBased()) return false;
  console.log(`[FaqService] SSS Kanalı (#${channel.name || channel.id}) güncelleniyor...`);

  const payload = buildFaqChapterPayload(1);
  let existingBotMsg = null;

  try {
    const messages = await channel.messages.fetch({ limit: 15 }).catch(() => null);
    const botId = client.user?.id;
    existingBotMsg = messages ? messages.find(m => m.author.id === botId && !m.flags?.has?.(8192)) : null;

    if (existingBotMsg) {
      await existingBotMsg.edit(payload);
      console.log("[FaqService] ✅ SSS Paneli Var Olan Mesajda Güncellendi.");
      return true;
    } else {
      await channel.send(payload);
      console.log("[FaqService] ✅ SSS Paneli Sıfırdan Gönderildi.");
      return true;
    }
  } catch (err) {
    console.warn(`[FaqService] Edit error (${err.message}), sending fresh message...`);
    try {
      if (existingBotMsg) {
        await existingBotMsg.delete().catch(() => {});
      }
      await channel.send(payload);
      console.log("[FaqService] ✅ SSS Paneli Temiz Mesaj Olarak Gönderildi.");
      return true;
    } catch (finalErr) {
      console.error("[FaqService] Final send error:", finalErr.message);
      return false;
    }
  }
}

// ─── 5. BOT YENİDEN BAŞLATILDIĞINDA TEK SEFERLİK OTOMATİK GÜNCELLEME ───────────
let hasDeployedFaq = false;

async function deployFaqPanelOnStartup(client) {
  if (hasDeployedFaq) return;
  hasDeployedFaq = true;

  try {
    const guild = client.guilds.cache.get(GUILD_ID) || await client.guilds.fetch(GUILD_ID).catch(() => null);
    if (!guild) return;

    const channel = guild.channels.cache.get(FAQ_CHANNEL_ID) || await guild.channels.fetch(FAQ_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    await deployFaqPanel(channel, client);
  } catch (err) {
    console.error("[FaqService] Deploy error:", err.message);
  }
}

module.exports = {
  buildFaqChapterPayload,
  handleFaqInteraction,
  deployFaqPanel,
  deployFaqPanelOnStartup,
  FAQ_CHAPTERS,
  FAQ_CHANNEL_ID
};
