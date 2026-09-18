'use strict';

const authors = {
  'eko-safety': { slug: 'eko-safety', name: 'EkoYıldız Safety', role: 'Güvenlik ve topluluk ekibi', initials: 'ES', bio: 'Topluluğun güvenli kalması için rehberler, uyarılar ve şeffaflık raporları hazırlayan ekip.', mascot: 'safety', mascotName: 'Kalkanlı Eko', specialty: 'Hesap güvenliği · Safety Center', status: 'Şüpheli bağlantıları tarıyor.' },
  'deniz-kaya': { slug: 'deniz-kaya', name: 'Deniz Kaya', role: 'Topluluk Operasyonları', initials: 'DK', bio: 'Moderasyon süreçleri, üyelik deneyimi ve topluluk iletişimi üzerine çalışıyor.', mascot: 'community', mascotName: 'Topluluk Eko', specialty: 'Topluluk · Moderasyon süreçleri', status: 'Topluluktan güzel haberler topluyor.' },
  'arda-yilmaz': { slug: 'arda-yilmaz', name: 'Arda Yılmaz', role: 'Ürün ve Bot Ekibi', initials: 'AY', bio: 'EkoYıldız’ın botları, doğrulama akışları ve yeni ürün deneyimlerini geliştiriyor.', mascot: 'builder', mascotName: 'Üretici Eko', specialty: 'Botlar · Ürün notları', status: 'Yeni bir Phibi özelliğini test ediyor.' },
};

const posts = [
  {
    slug: 'roblox-askeri-kamplarin-perde-arkasi',
    category: 'Topluluk',
    date: '18 Eylül 2026',
    title: 'Roblox Askeri Kamp RP Dünyası: Neden Herkes Mareşal Olmak İstiyor? (Ve Neden Olamıyor?)',
    excerpt: 'Sınır kapısında zıplayan acemilerden, Discord’da 14 yaşında mareşal olan Ahmet’in disiplin nutuklarına kadar: Askeri RP dünyasının eğlenceli anatomisi.',
    author: 'deniz-kaya',
    featured: true,
    body: [
      'Roblox Türk topluluklarında bir gün geçirmiş herkes o manzarayı çok iyi bilir: Gri beton zemin, arkada çalan marş, nizamiye kapısında birbirinin kafasının üstüne zıplayarak "Abi rütbe atlar mıyım?" diye soran yirmi kişi ve uzaktan ağır adımlarla yürüyüp gelen "Korgeneral" rütbeli bir oyuncu. Evet, Roblox askeri kamp roleplay (RP) dünyasına hoş geldiniz! Burası ciddiyetin doruklara ulaştığı, ancak bir lag dalgasıyla tüm ordunun aynı anda havaya uçabildiği eşsiz bir paralel evrendir.',
      '## 1. Nizamiye Kapısındaki Dram: "Komutanım Shift Basıyorum Olmuyor"',
      'Bir acemi erin askeri kampa adım atışı her zaman büyük bir heyecanla başlar. Üniforma giyilir, bereler takılır ve "Hizaya geç!" emri verilir. Fakat o da ne? Takımın yarısı klavyede shift tuşunu bulamaz, diğer yarısı ise oyun içi ping 400ms olduğu için komutanın arkasından duvara doğru koşmaya devam eder. Komutanın chatte büyük harflerle "DÜZ ÇİZGİ OLUN DEDİM SİZE!" diye haykırışı, aslında modern dijital tiyatronun en saf halidir.',
      '<div class="callout-box fun"><div class="callout-title">🎖️ Komutanın Telsiz Notu</div><p>“Asker! Nizamiyede amuda kalkarak selam verilmez. Bir de o elindeki dondurmayı hemen envanterine geri koy, burası sınır karakolu!”</p></div>',
      '## 2. Rütbe Sevdası ve Discord Hiyerarşisi',
      'Askeri kamplarda rütbe bir unvan değil, bir yaşam biçimidir. Bir er, onbaşı olduğunda yürüyüşü değişir; teğmen olduğunda Discord durumuna felsefi sözler koymaya başlar; general olduğunda ise artık sesli sohbette yalnızca derin nefes alıp vererek otorite kurar. Fakat unutulan küçük bir detay vardır: Gerçek hayatta akşam ödevini bitirmesi gereken bir öğrenci, Roblox’ta 500 kişilik bir tümenin kaderini belirlemektedir. Bu tezat, topluluğun en tatlı ve en komik dinamiğidir.',
      '<details class="blog-accordion"><summary>🔍 Askeri Kamp Rütbe Rehberi (Görünmeyen Gerçekler)</summary><div class="blog-accordion-content"><ul><li><strong>Er / Acemi:</strong> Görevi sürekli zıplamak, kapıyı açmaya çalışmak ve chatte "e nolcak şimdi" yazmaktır.</li><li><strong>Çavuş:</strong> Ses tonunu kalınlaştırmaya çalışan, takımı düz sıraya sokmak için ömründen 3 yıl veren fedakar kişidir.</li><li><strong>Subay / Komutan:</strong> Elinde telsiz animasyonuyla gezen, Roblox mesajlarında nokta ve virgülü eksiksiz kullanan karizma abidesi.</li><li><strong>Mareşal:</strong> Sunucuda yılda bir kez görünür, tek bir kelime yazar: "Devam edin." ve ortadan kaybolur.</li></ul></div></details>',
      '## 3. Disiplin ile Eğlencenin Hassas Dengesi',
      'EkoYıldız olarak askeri kamplara ve rol yapma topluluklarına her zaman saygı duyuyoruz; çünkü burada inanılmaz bir takım çalışması, koordinasyon ve dostluk yatıyor. Ancak bazen hırsın dostluğun önüne geçmemesi gerektiğini hatırlatmakta fayda var. Rütbeler dijital piksellerden ibarettir, fakat kurulan arkadaşlıklar ve o gece geç saatlerde gülmekten karnınıza ağrılar sokan anılar gerçektir.',
      '<div class="interactive-quiz"><div class="quiz-question">🎯 Mini Test: Askeri Kampta Sınır İhlali Yapan Birini Gördün, Ne Yaparsın?</div><div class="quiz-options"><button type="button" class="quiz-btn" data-correct="false" data-explain="Telsizden megafonla bağırmak sadece herkesin kulaklığını patlatır!">A) Telsizden 15 saniye boyunca "SALDIRI VAAAAR" diye bağırmak</button><button type="button" class="quiz-btn" data-correct="true" data-explain="Harika bir disiplin örneği! Sakin kalıp prosedürü uyguladın, terfiyi kaptın.">B) Sakince nizamiyeyi uyarıp yetkiliye haber vermek ve telsiz disiplinini korumak</button><button type="button" class="quiz-btn" data-correct="false" data-explain="Bunu yaparsan kendini doğrudan karaliste kanıt dosyasında bulabilirsin dostum.">C) Şüpheliye gidip "kanka bana Robux ver seni içeri alayım" demek</button></div><div class="quiz-feedback"></div></div>',
      'Sonuç olarak; askeri kamplarda nöbet tutarken eğlenmeyi unutmayın, komutanınız emir verirken chatte dans emojisi atmayın ve en önemlisi dostlukları rütbelerin üzerinde tutun!'
    ]
  },
  {
    slug: 'bedava-nitro-ve-hacker-drami',
    category: 'Güvenlik',
    date: '17 Eylül 2026',
    title: 'Bedava Nitro Yalanları ve 12 Yaşındaki Hacker’ın Dramı: Bir Hesabın Hazin Sonu',
    excerpt: '“Kanka Steam 50$ cüzdan kodu dağıtıyor tıkla al” diyen botlardan, QR kod tarayıp hesabını Rus ruletine çevirenlere: Phishing komedisi ve gerçek güvenlik tüyoları.',
    author: 'eko-safety',
    body: [
      'Gecenin bir yarısı Discord’da sakin sakin arkadaşlarınızla sohbet ederken aniden en yakın dostunuzdan gelen o mesaj: "Hey kanka, Discord 3 aylık Nitro dağıtıyor! Buradan claim et: dıscord-nitro-free-gift-2026.ru.xyz". Dostunuzun profilinde anime kızı fotoğrafı, altında da şüpheli bir link... İşte modern internetin en büyük trajedilerinden biri daha o an başlar.',
      '## 1. Bedava Peynir Sadece Kapanında Olur',
      'İnternet dünyasının değişmeyen kuralıdır: Hiç kimse durup dururken tanımadığı birine 10 dolarlık Nitro veya 5000 Robux hediye etmez. O linke tıkladığınız anda karşınıza açılan sayfa, gerçek Discord sitesinin birebir kopyasıdır. Butona basarsınız, "Giriş yap veya QR kodu tara" der. Siz o kodu telefonunuzdaki Discord uygulamasıyla taradığınız an, aslında hesabınızın kapı anahtarını (Token) ellerinizle saldırgana teslim etmiş olursunuz.',
      '<div class="callout-box alert"><div class="callout-title">🚨 Acı Gerçek Tablosu</div><p>Eğer bir sitede “Bedava”, “Free”, “Claim”, “Sadece ilk 100 kişiye” yazıyorsa ve sizden Discord ile QR okutmanız isteniyorsa, o siteden koşarak uzaklaşın. Arkanıza bile bakmayın!</p></div>',
      '## 2. Token Çalındığında Ne Olur? Arkadaş Listesine Saldırı',
      'Hesabınız çalındığında saldırgan hemen profil fotoğrafınızı değiştirmez veya şifrenizi sıfırlamaz. İlk yaptığı şey, hesabınızı bir zombi robota dönüştürüp tüm arkadaşlarınıza ve bulunduğunuz tüm sunuculara aynı sahte linki göndermektir. Bir bakmışsınız anneanneniz bile Discord’dan "Kanka bedava Valorant skini aldım tıkla" mesajı almış. İşte bu yüzden hesap güvenliği sadece sizi değil, tüm çevrenizi korur.',
      '<details class="blog-accordion"><summary>🛠️ Şüpheli Linke Tıkladıysan Hemen Yapılacak 3 İlk Yardım Adımı</summary><div class="blog-accordion-content"><ol><li><strong>Şifreni Değiştir:</strong> Şifrenizi değiştirdiğiniz anda Discord eski oturum tokenınızı anında geçersiz kılar. Tüm yabancı cihazlar kapı dışarı edilir.</li><li><strong>İki Aşamalı Doğrulamayı (2FA) Aç:</strong> Authenticator uygulaması kullanın. Şifreniz bilinse dahi kod olmadan kimse hesabınıza giremez.</li><li><strong>Yetkili Uygulamaları Temizle:</strong> Ayarlar > Yetkili Uygulamalar sekmesine girin ve tanımadığınız tüm bot/site izinlerini iptal edin.</li></ol></div></details>',
      '<div class="interactive-quiz"><div class="quiz-question">🕵️ Dedektif Testi: Hangisi %100 Güvenli Bir Discord Bağlantısıdır?</div><div class="quiz-options"><button type="button" class="quiz-btn" data-correct="false" data-explain="Dikkatli bak! dls-cord yazıyor, sahte bir oltalama sitesi!">A) https://dls-cord.gift/nitro-promo-drop</button><button type="button" class="quiz-btn" data-correct="true" data-explain="Mükemmel gözler! discord.com resmi alan adıdır ve https protokolü kullanır.">B) https://discord.com/safety</button><button type="button" class="quiz-btn" data-correct="false" data-explain="discord-app-free.com bir klon phishing alan adıdır!">C) https://discord-app-free.com/login</button></div><div class="quiz-feedback"></div></div>',
      'EkoYıldız Safety ekibi olarak hatırlatıyoruz: EkoYıldız yetkilileri sizden asla şifre, doğrulama kodu veya QR taraması istemez. Uyanık olun, hesabınızı ve arkadaşlarınızı koruyun!'
    ]
  },
  {
    slug: 'gece-3te-acilan-efsanevi-ticketlar',
    category: 'Behind the Scenes',
    date: '16 Eylül 2026',
    title: 'Saat 03:47, Ticket Kanalında Bir Hayalet Var: Gece Nöbetindeki Yetkilinin Günlüğü',
    excerpt: '“Abi sevgilimden ayrıldım rolümü alır mısın?”, “Roblox çöktü oyunu sen mi kapattın?”: Moderatörlerin sabır seviyesini sınayan gece nöbeti hikayeleri.',
    author: 'arda-yilmaz',
    body: [
      'Saat gece 03:47. Sokaklar sessiz, Discord sunucusu derin bir uykuda... Birden bot bildirim sesi çalar: "Dı-dın! Yeni Ticket Açıldı: #ticket-0412". Nöbetteki yetkili heyecanla ekrana döner, belki acil bir güvenlik ihlali veya sunucu saldırısı vardır. Bilet açılır ve kullanıcının mesajı okunur: "selam abi uyudun mu". İşte yetkililik mesleğinin felsefi derinliklerine inildiği an o andır.',
      '## 1. Gece Nöbetinde Karşılaşılan En Tuhaf 4 Bilet Türü',
      'Yıllar içinde destek panellerimizde binlerce bilet çözüldü. Fakat gece vardiyasında açılan bazı biletler var ki, onları ekip odamızın duvarına çerçeveletip asmak istiyoruz.',
      '<div class="callout-box fun"><div class="callout-title">☕ Efsanevi Bilet Koleksiyonu</div><p><strong>Vaka 1:</strong> "Abi Roblox açılmıyor, internet kablosunu çekip taktım yine olmadı. Sunucunun fişine mi bastınız?"<br><strong>Vaka 2:</strong> "Sayın yetkili, az önce arkadaşımla kavga ettik, onun rütbesini alıp bana verebilir misiniz rica etsem?"<br><strong>Vaka 3:</strong> "Abi ticket nasıl açılıyor bilgi verir misiniz?" <em>(Ticketın içinden sorulmuştur.)</em></p></div>',
      '## 2. Destek Talebi Açarken Hayat Kurtaran İpuçları',
      'Şaka bir yana, destek ekibimiz günün 24 saati sizlere yardımcı olmak için canla başla çalışıyor. Bir sorununuz olduğunda hızlı ve etkili çözüm almanın çok basit formülleri var.',
      '<details class="blog-accordion"><summary>📋 Yetkiliden 3 Dakikada Çözüm Alma Formülü</summary><div class="blog-accordion-content"><p>Yetkiliye yalnızca "abi baksana" yazıp beklerseniz, yetkili size "efendim ne vardı?" diyecek, siz 10 dakika sonra döneceksiniz ve süreç uzayacaktır. Bunun yerine:</p><ul><li><strong>Sorunu tek mesajda anlatın:</strong> Ne oldu, hangi kanalda oldu?</li><li><strong>Kanıt veya ekran görüntüsü ekleyin:</strong> Hata kodunun veya olayın fotoğrafını yükleyin.</li><li><strong>Kullanıcı adınızı veya ID’nizi yazın:</strong> Böylece yetkili anında sistemden logları tarayabilir.</li></ul></div></details>',
      '## 3. Moderatörler de İnsandır (Çayınızı Eksik Etmeyin)',
      'Ekranın arkasında çalışan yetkili ekibimiz de sizin gibi topluluğu seven, zamanını ve emeğini sunucunun huzuru için ayıran gönüllü insanlardır. Açtığınız her saygılı ve anlaşılır destek talebi, gece nöbetindeki bir moderatörün yüzünde sıcacık bir tebessüm oluşturur.',
      '<div class="interactive-quiz"><div class="quiz-question">🎭 Sabır Testi: Gece 04:00\'te açılan "Selam abi nasılsın" biletine ne yanıt verilmelidir?</div><div class="quiz-options"><button type="button" class="quiz-btn" data-correct="false" data-explain="Agresif olmak yetkili etiğine uymaz dostum!">A) Caps Lock açıp "Bu saatte bu soru sorulur mu?!" yazmak</button><button type="button" class="quiz-btn" data-correct="true" data-explain="Harika bir profesyonellik! Nazikçe sorunu öğrenip bileti çözüme kavuşturdun.">B) "İyiyim teşekkürler, EkoYıldız desteğe hoş geldin! Sana nasıl yardımcı olabilirim?"</button><button type="button" class="quiz-btn" data-correct="false" data-explain="Bileti görmezden gelmek SLA süremizi bozar!">C) Bilgisayarı kapatıp uyumaya gitmek</button></div><div class="quiz-feedback"></div></div>',
      'Bir sonraki ticketınızda bir yetkiliye "Kolay gelsin" demeyi unutmayın; inanın enerjimizi ikiye katlıyor!'
    ]
  },
  {
    slug: 'scammer-tuzaklari-ve-akil-sagligi',
    category: 'Safety',
    date: '15 Eylül 2026',
    title: 'Dolandırıcılara Karşı Akıl Sağlığını Koruma Rehberi: Karalistedeki Efsaneler',
    excerpt: '“Önce sen ver sonra ben kesin vericem valla” taktiklerinden, panel tehditlerine kadar: Roblox ticaretinde dolandırılmadan hayatta kalma sanatı.',
    author: 'eko-safety',
    body: [
      'Roblox ve Discord topluluklarında ticaret yapmak bazen Vahşi Batı’da altın aramaya benzer. Bir yanda dürüst oyuncular, diğer yanda ise binbir türlü kurnazlıkla envanterinizi boşaltmaya çalışan acemi dolandırıcılar. Bugün, EkoYıldız Karaliste (Blacklist) sistemimizin tecrübelerinden yola çıkarak, dolandırıcılık tuzaklarını ve bunlardan nasıl korunacağınızı masaya yatırıyoruz.',
      '## 1. Klasikleşmiş Scammer Numarası: "Önce Sen Ver"',
      'Takas yaparken karşı tarafın ilk cümlesi "Kanka önce sen teslim et, ben hemen ardından atıyorum, bak profilime güvenilir adamım" ise iç sesiniz derhal kırmızı alarm çalmalıdır. Çünkü o "hemen ardından" anı asla gelmez; teslimatı yaptığınız saniye arkadaşlıktan çıkarılır, Discord’dan engellenir ve ortada kalırsınız.',
      '<div class="callout-box fun"><div class="callout-title">🧠 Scammer Sözlüğü</div><p>• <strong>“Valla billa atıcam:”</strong> %99 ihtimalle atmayacak.<br>• <strong>“Bende panel var hesabını kapatırım:”</strong> Tarayıcının incele (F12) konsolunu yeni keşfetmiş 11 yaşında bir çocuk.<br>• <strong>“Ben EkoYıldız gizli yöneticisiyim:”</strong> EkoYıldız’da gizli yönetici yoktur, tüm ekibimiz rozetleriyle açıktır!</p></div>',
      '## 2. Karaliste Sistemi Nasıl Çalışır? (15 Gün Kuralı)',
      'EkoYıldız Karaliste sistemi, kanıtı doğrulanmış dolandırıcıları ve kural ihlalcilerini tüm projelerimizden süresiz olarak tecrit eder. Bir kişi karalisteye alındığında adı, fotoğrafı ve gerekçesi resmi kanalda ilan edilir. Karalistedeki bir kişi hatasını anlayıp sorunu çözerse, kaydı "Kaldırıldı" durumuna geçer ve 15 gün sonra sistemden tamamen silinir. Bu süreçte topluluğumuzun güvenliği her şeyin önündedir.',
      '<details class="blog-accordion"><summary>🛡️ Güvenli Ticaret İçin 3 Altın Kural</summary><div class="blog-accordion-content"><ul><li><strong>Resmi Aracı (Middleman) Kullanın:</strong> Büyük takaslarda mutlaka sunucumuzun onaylı yetkililerini aracı olarak talep edin.</li><li><strong>Ekran Kaydı Alın:</strong> Takas anında video veya ekran kaydı almak, olası bir mağduriyette karaliste ekibimizin en büyük kanıtıdır.</li><li><strong>Karaliste Kanalını Kontrol Edin:</strong> Ticaret yapacağınız kişinin adını önce Discord karaliste kanalımızda aratın!</li></ul></div></details>',
      '<div class="interactive-quiz"><div class="quiz-question">⚖️ Durum Analizi: Biri sana "Önce eşyayı ver, sonra EkoYıldız hesabına 1000 Robux yüklenecek" dedi. Ne yaparsın?</div><div class="quiz-options"><button type="button" class="quiz-btn" data-correct="false" data-explain="Büyük hata! Eşyan gitti ve geri gelmeyecek.">A) İnanıp eşyayı hemen trade ekranından vermek</button><button type="button" class="quiz-btn" data-correct="true" data-explain="Mükemmel refleks! Sistemi suistimal edenleri anında saf dışı bıraktın.">B) Ekran görüntüsü alıp derhal ticket açarak kullanıcıyı dolandırıcılıktan bildirmek</button><button type="button" class="quiz-btn" data-correct="false" data-explain="Karşı tarafla tartışmak vakit kaybıdır, resmi kanaldan bildirin!">C) Karşı tarafla 2 saat boyunca tartışıp hakaret etmek</button></div><div class="quiz-feedback"></div></div>',
      'Unutmayın: EkoYıldız ailesinde dürüst ticaret baş tacıdır. Dolandırıcılara asla taviz vermeyiz!'
    ]
  },
  {
    slug: 'yeni-moderasyon-araclari',
    category: 'Safety',
    date: '12 Eylül 2026',
    title: 'Daha güvenli bir topluluk için yeni moderasyon araçlarımız',
    excerpt: 'Yeni raporlama sistemi, vaka merkezi, akıllı raid kalkanı ve geliştirilmiş spam koruması yayında.',
    author: 'eko-safety',
    body: [
      'Topluluk büyüdükçe arkadaki moderasyon yükü de katlanarak artıyor. Günde yüzlerce mesajın, onlarca sesli odanın ve sayısız takasın döndüğü bir ekosistemde eski usul "chatte gezip tek tek mesaj silme" devri çoktan geride kaldı. Son üç aydır üzerinde titizlikle çalıştığımız yeni nesil moderasyon araçlarımızı duyurmaktan büyük mutluluk duyuyoruz!',
      '## 1. Akıllı Vaka Merkezi ve Şeffaf Sicil Sistemi',
      'Artık verilen her moderasyon işlemi havada asılı kalmıyor. Yeni sistemimiz sayesinde ceza alan her kullanıcının sicilinde işlemin tarihi, uygulayan yetkili, ceza maddesi ve doğrulanmış ekran kanıtı tek bir vaka dosyasında mühürleniyor. Böylece hem kullanıcı neden yaptırım aldığını şeffafça görebiliyor hem de yetkili ekibi süreci geriye dönük denetleyebiliyor.',
      '<div class="callout-box fun"><div class="callout-title">🛡️ Şeffaflık Prensibimiz</div><p>Bizde “kafama göre banladım” devri yoktur. Her cezanın bir kanıtı, her vakanın bir dosya numarası ve her kullanıcının itiraz hakkı vardır!</p></div>',
      '## 2. Geliştirilmiş Raid Kalkanı ve Spam Avcısı',
      'Sunucumuza aynı saniyede katılan 50 bot hesabın spam mesajlar yağdırdığı o can sıkıcı anları hatırlıyor musunuz? Yeni AI destekli spam korumamız, insan davranışı ile bot davranışını saliseler içinde ayırt edebiliyor. Şüpheli bir akın başladığında sistem otomatik olarak kalkan moduna geçiyor ve sunucu üyelerimiz sohbetine hiçbir şey olmamış gibi devam edebiliyor.',
      '<details class="blog-accordion"><summary>📊 Neler Değişti? Tüm Yenilikler Listesi</summary><div class="blog-accordion-content"><ul><li><strong>Anında Kanıt Eşleme:</strong> Komutla ceza verilirken doğrudan görsel kanıt URL’si sisteme işlenir.</li><li><strong>İtiraz Takip Portalı:</strong> Kullanıcılar web panelinden itirazlarının hangi yetkili tarafından incelendiğini görebilir.</li><li><strong>Otomatik Ceza İndirimi:</strong> Belirli süre boyunca hiçbir kural ihlali yapmayan kullanıcıların Trust Score puanı otomatik yenilenir.</li></ul></div></details>',
      'Topluluğumuzun güvenliği için çalışmaya aralıksız devam ediyoruz. Güvenli ve huzurlu sohbetler dileriz!'
    ]
  },
  {
    slug: 'report-sistemi-yenilendi',
    category: 'Güncellemeler',
    date: '04 Eylül 2026',
    title: 'Report sistemi yenilendi: 3 Tıkla Şüpheli Bildirimi',
    excerpt: 'Bir kullanıcıyı bildirirken doğru bilgiyi vermek ve inceleme sürecini hızlandırmak artık çocuk oyuncağı.',
    author: 'deniz-kaya',
    body: [
      'Eski report sistemimizde üyelerimiz genellikle genel bir kanala "Yetkili baksın biri küfrediyor" yazıp çıkıyordu. Yetkili kanala geldiğinde ise mesaj çoktan geçmişte kaybolmuş oluyordu. Bu karmaşayı kökünden çözmek için tek tıkla çalışan yepyeni raporlama altyapımızı devreye aldık!',
      '## 1. Olay Türünü Seç, Kanıtı Bırak, Gerisini Bize Bırak',
      'Yeni sistemde bir kullanıcıyı bildirmek istediğinizde karşınıza kategorize edilmiş net seçenekler çıkıyor: Taciz, Phishing/Dolandırıcılık, Reklam veya Oyun İçi İhlal. Seçiminizi yaptıktan sonra mesaj bağlantısını yapıştırmanız yeterli. Sistem otomatik olarak ilgili mesajın anlık kaydını alıp yetkili denetim odasına iletiyor.',
      '<div class="callout-box"><div class="callout-title">💡 Küçük Bir Hatırlatma</div><p>Doğru kategoride yapılan bildirimler ortalama <strong>4 kat daha hızlı</strong> çözümlenir. Spam bildirimler ise bildirenin güven puanını düşürebilir.</p></div>',
      'Topluluk hepimizin evi. Huzuru bozanları tespit etmekte bizim gözümüz kulağımız olduğunuz için teşekkür ederiz!'
    ]
  },
  {
    slug: 'discord-ile-giris-nasil-calisir',
    category: 'Güvenlik',
    date: '13 Eylül 2026',
    title: 'Discord ile giriş nasıl çalışır? Şifrenizi Görüyor muyuz?',
    excerpt: 'OAuth yetkilendirmesi, DM kodu ve PIN sisteminin arkasındaki teknoloji: Neden şifrenize asla dokunmuyoruz?',
    author: 'eko-safety',
    body: [
      'Web sitemizde veya panelimizde "Discord ile Giriş Yap" butonuna bastığınızda kafanızda şu soru belirebilir: "EkoYıldız benim Discord şifremi görüyor mu?". Cevap çok net ve büyük harflerle: <strong>KESİNLİKLE HAYIR!</strong>',
      '## 1. OAuth2 Protokolü Nedir ve Nasıl Çalışır?',
      'OAuth2, modern internetin en güvenli kimlik doğrulama standardıdır. Siz "Giriş Yap" butonuna bastığınızda, doğrudan Discord’un kendi resmi sunucularına yönlendirilirsiniz. Discord size "EkoYıldız sadece kullanıcı adınızı ve avatarınızı görmek istiyor, onaylıyor musunuz?" diye sorar. Onay verdiğinizde Discord bize sadece "Evet, bu kullanıcı gerçek ve adı şudur" diyen geçici bir anahtar teslim eder. Şifreniz tamamen Discord’un çelik kasalarında kalır.',
      '<div class="callout-box fun"><div class="callout-title">🔒 Güvenlik Güvencesi</div><p>EkoYıldız veritabanında hiçbir kullanıcının Discord veya Roblox şifresi barındırılmaz. Barındırılamaz, çünkü bu veriye erişimimiz bile yoktur!</p></div>',
      'Gönül rahatlığıyla panellerimizi kullanabilir, yetkilerinizi ve destek taleplerinizi tek tıkla yönetebilirsiniz.'
    ]
  },
  {
    slug: 'roblox-hesabi-nasil-dogrulanir',
    category: 'Güvenlik',
    date: '13 Eylül 2026',
    title: 'Roblox hesabı nasıl doğrulanır? Adım Adım Rehber',
    excerpt: 'OAuth, arkadaş isteği ve profil açıklaması yöntemleriyle Roblox hesabınızı güvenle Discord profilinizle eşleştirin.',
    author: 'eko-safety',
    body: [
      'Sunucumuzda Roblox rütbelerinizi almak, grup yönetiminden faydalanmak ve çekiliş ödüllerini teslim alabilmek için Roblox hesabınızı doğrulamanız gerekir. Peki bunu en güvenli şekilde nasıl yaparsınız?',
      '## 1. Yöntemler ve Tercihler',
      '• <strong>Roblox OAuth (En Hızlısı):</strong> Resmi Roblox izin penceresi üzerinden tek tıkla hesabınızı eşleştirin.<br>• <strong>Profil Açıklamasına Kod Ekleme:</strong> Botun size özel ürettiği kodu Roblox profilinizin "About" kısmına yapıştırıp onaylatın.<br>• <strong>Arkadaş İsteği Yöntemi:</strong> Doğrulama botumuza Roblox üzerinden arkadaşlık isteği gönderin.',
      '<div class="callout-box alert"><div class="callout-title">⚠️ Kritik Uyarı</div><p>Hiçbir doğrulama yönteminde sizden Roblox şifreniz, .ROBLOSECURITY çereziniz veya e-posta kodunuz istenmez. İsteyen olursa derhal bildirin!</p></div>',
      'Doğrulamanızı tamamlayarak EkoYıldız dünyasındaki tüm ayrıcalıkların kilidini açabilirsiniz!'
    ]
  },
  {
    slug: 'cekilislere-guvenle-katilma-rehberi',
    category: 'Topluluk',
    date: '13 Eylül 2026',
    title: 'Çekilişlere güvenle nasıl katılırsın? Ödül Bahanesiyle Yapılan Tuzaklar',
    excerpt: 'Resmi çekilişleri ayırt etme rehberi, görev puanı sistemi ve sahte kazandınız mesajlarına karşı alınacak önlemler.',
    author: 'eko-safety',
    body: [
      'EkoYıldız topluluğunda her hafta binlerce Robux, özel roller ve sürpriz hediyeler dağıtıyoruz. Ancak çekilişlerin popülerliği, dolandırıcıların da iştahını kabartıyor. Bu rehberde gerçek çekilişleri nasıl tanıyacağınızı özetliyoruz.',
      '## 1. Çekiliş Kuralları ve Katılım Adımları',
      'Sitemizdeki çekilişler tamamen şeffaf bir algoritma ile çalışır. Görevleri tamamlayarak bilet kazanırsınız ve çekiliş günü geldiğinde sistem kazananı otomatik belirler.',
      '<div class="callout-box fun"><div class="callout-title">🎉 Altın Kural</div><p>Eğer kazandıysanız, ödülünüz size DM’den şüpheli link atılarak değil; resmi sitemiz ve sunucu duyuru kanalımız üzerinden ulaştırılır. "Kazandın, almak için bu linke tıkla" diyen sahte hesaplara prim vermeyin!</p></div>',
      'Bol şanslar dileriz, çekiliş sayfamızı takipte kalın!'
    ]
  },
  {
    slug: 'yetkili-ekibinde-calismak',
    category: 'Topluluk',
    date: '11 Eylül 2026',
    title: 'EkoYıldız’da yetkili ekibinde çalışmak: Bir Aile Olmanın Anlamı',
    excerpt: 'Esnek nöbet saatleri, kişisel gelişim fırsatları, takım ruhu ve sağlıklı moderasyon kültürü.',
    author: 'deniz-kaya',
    body: [
      'EkoYıldız yetkili ekibi, sadece kuralları uygulayan bir denetim mekanizması değildir. Burası aynı zamanda gençlerin iletişim yeteneklerini geliştirdiği, kriz yönetimini öğrendiği ve sımsıkı dostluklar kurduğu büyük bir okuldur.',
      '## 1. Ekipte Neler Yapıyoruz?',
      'Yetkililerimiz kullanıcıların sorunlarını çözer, etkinlikleri koordine eder, sunucudaki sohbetin seviyeli kalmasını sağlar ve yeni projelerde fikir üretir. Her yetkilimize düzenli geri bildirim verilir ve gösterdikleri emek ödüllendirilir.',
      'Eğer siz de bu dinamik ailenin bir parçası olmak istiyorsanız, personel alım dönemlerimizi kaçırmayın!'
    ]
  },
  {
    slug: 'moderasyon-sistemini-nasil-tasarladik',
    category: 'Behind the Scenes',
    date: '28 Ağustos 2026',
    title: 'Moderasyon sistemimizi nasıl tasarladık?',
    excerpt: 'Araçlardan önce ilkeleri, hızdan önce adaleti düşündük.',
    author: 'deniz-kaya',
    body: [
      'İyi bir moderasyon sistemi yalnızca ceza vermek için kurulmaz. Bağlamı görmek, üyeyi dinlemek ve kararın nedenini açıklamak için kurulur.',
      'Bu nedenle işlem geçmişi, itiraz ve geri bildirim kanallarını aynı vaka akışında buluşturduk.'
    ]
  },
  {
    slug: 'bot-v42-yayinlandi',
    category: 'Geliştirici',
    date: '20 Ağustos 2026',
    title: 'Bot v4.2 yayınlandı: Yeni Nesil Hız ve Güvenlik',
    excerpt: 'Daha hızlı olay işleme, net komut yanıtları ve yenilenmiş doğrulama akışı.',
    author: 'arda-yilmaz',
    body: [
      'v4.2 ile doğrulama, destek ve güvenlik akışlarını baştan yazdık. Bot, üyeyi sadece doğru sayfaya yönlendirmekle kalmıyor; durumuna uygun bir sonraki adımı da gösteriyor.',
      'Her yeni sürümde güvenlik ve veri minimizasyonu ilkelerini gözden geçiriyoruz.'
    ]
  }
];

const safetyGuides = [
  {
    slug: 'discord-sahte-dm-ve-phishing', category: 'Discord güvenliği', icon: '🕵️', title: 'Sahte DM ve phishing bağlantılarını tanı', summary: 'Sahte Nitro, QR kod, token hırsızlığı ve kendini yetkili gibi gösteren hesaplara karşı uygulanabilir savunma rehberi.', mascot: 'Kalkanlı Eko diyor ki: “Bedava Nitro” bazen yalnızca pahalı bir baş ağrısıdır.', relatedSlugs: ['hesabimi-guvene-alma', 'kullanici-raporlama'],
    sections: [
      { title: 'Ne yapmalıyım?', body: 'Beklemediğin bir DM geldiğinde gönderen kişinin profilini, ortak sunucuları ve bağlantının gerçek alan adını ayrı ayrı kontrol et. Discord giriş ekranı gibi görünen sayfalara DM bağlantısından gitme; uygulamayı veya adresi kendin aç. Şifre, token veya doğrulama kodu istemeyiz.', steps: ['Mesajın ve profilin ekran görüntüsünü al.', 'Bağlantıya tıklamadan kullanıcıyı engelle ve Discord üzerinden bildir.', 'EkoYıldız yetkilisi olduğunu söylüyorsa resmî sunucudaki rolünü ayrıca kontrol et.'] },
      { title: 'Ne yapmamalıyım?', body: 'QR kod tarama, tarayıcı konsoluna kod yapıştırma, kullanıcı tokenını gönderme veya ekran paylaşırken giriş bilgilerini gösterme. Gerçek bir yetkili acele ettirerek hesabını doğrulamanı istemez; “şimdi yapmazsan ban” baskısı güvenilirlik işareti değil, kırmızı bayraktır.', steps: ['Mesajı arkadaşlarına test ettirme.', 'Şüpheli dosyayı indirip açma.', 'Kanıtları herkese açık kanalda kişisel bilgilerle paylaşma.'] },
      { title: 'Sonraki adım', body: 'Bir bilgi girdiysen Discord parolanı hemen değiştir, tüm cihazlardaki oturumları kapat, iki aşamalı doğrulamayı etkinleştir ve tanımadığın yetkili uygulamaları kaldır. Ardından kanıtlarıyla rapor oluştur; ödeme veya hesap kaybı varsa ilgili platformun resmî destek kanalına da başvur.', steps: ['Hesabı güvene alma rehberini tamamla.', 'EkoYıldız Safety ekibine rapor gönder.', 'Gerekirse yeni bir destek bileti aç.'] }
    ]
  },
  {
    slug: 'roblox-hesap-guvenligi', category: 'Roblox güvenliği', icon: '🎮', title: 'Roblox hesabını güvenle doğrula', summary: 'OAuth, arkadaş isteği ve profil açıklaması yöntemlerinin nasıl çalıştığını ve çerez hırsızlığından nasıl korunacağını öğren.', mascot: 'Üretici Eko notu: Robux sihir değildir; “bedava” düğmesi de genelde sihirbaz değildir.', relatedSlugs: ['discord-sahte-dm-ve-phishing', 'hesabimi-guvene-alma'],
    sections: [
      { title: 'Ne yapmalıyım?', body: 'Doğrulama için yalnızca EkoYıldız portalındaki resmî yöntemleri kullan. OAuth ekranında alan adını kontrol et; arkadaş isteği veya profil açıklaması yönteminde yalnızca sistemin verdiği geçici ifadeyi uygula. Roblox parolan portalımıza gelmez ve doğrulama tamamlandıktan sonra geçici açıklamayı kaldırabilirsin.', steps: ['Roblox kullanıcı adının doğru hesabı gösterdiğini kontrol et.', 'Mümkünse Roblox iki adımlı doğrulamayı aç.', 'Bağlı e-posta adresini güncel tut.'] },
      { title: 'Ne yapmamalıyım?', body: 'Kimseye `.ROBLOSECURITY` çerezini, tarayıcı depolama verisini, şifreni veya e-posta doğrulama kodunu gönderme. Ücretsiz Robux, grup rütbesi veya çekiliş ödülü bahanesiyle uzantı kurma. Bir yetkili bu bilgileri isterse rolü ne kadar parlak görünürse görünsün işlemi durdur.', steps: ['Bilinmeyen tarayıcı uzantısı kurma.', 'Ekran paylaşımında geliştirici araçlarını açma.', 'Hesap bağlantısını DM’de gönderilen kopya siteden yapma.'] },
      { title: 'Sonraki adım', body: 'Doğrulama başarısızsa aynı işlemi art arda tekrarlamak yerine kullanıcı adını ve seçtiğin yöntemi kontrol et. Sorun devam ederse hata metnini kopyala, yaklaşık saati belirt ve ticket sorun giderici üzerinden temiz bir destek talebi oluştur. Böylece ekip hangi aşamanın başarısız olduğunu görebilir.', steps: ['Portal oturumunu yenile.', 'Alternatif doğrulama yöntemini dene.', 'Hata koduyla destek bileti aç.'] }
    ]
  },
  {
    slug: 'youtube-topluluk-kurallari', category: 'YouTube ve topluluk', icon: '▶️', title: 'YouTube topluluğunda sağlıklı katılım', summary: 'Yorumlar, canlı yayınlar, eleştiri, içerik paylaşımı ve topluluk sınırları için sade davranış rehberi.', mascot: 'Topluluk Eko: Caps Lock bazen heyecandır; on satır sürerse küçük bir konser olabilir.', relatedSlugs: ['kullanici-raporlama', 'yetkiliyle-iletisim'],
    sections: [
      { title: 'Ne yapmalıyım?', body: 'Videoları, yayınları ve topluluk paylaşımlarını eleştirirken kişiye değil içeriğe odaklan. Farklı görüşlerin konuşulmasına izin ver, iddian varsa kaynağını açıkça belirt ve başkasının özel bilgisini paylaşma. Yayın sohbetinde moderasyon uyarısı aldıysan tartışmayı büyütmeden açıklamayı oku.', steps: ['Eleştiriyi somut ve anlaşılır yaz.', 'Spoiler veya hassas içerik için uyarı ekle.', 'İzinsiz kişisel bilgi görürsen raporla.'] },
      { title: 'Ne yapmamalıyım?', body: 'Hedef gösterme, tehdit, ayrımcı ifade, kişisel bilgi yayma, sahte kanıt üretme veya başka topluluklara toplu saldırı çağrısı yapma. Aynı mesajı tekrar tekrar göndermek görünürlüğü artırmaz; yalnızca sohbeti okunamaz hâle getirir ve moderasyon sürecini başlatabilir.', steps: ['Kavga için kullanıcı etiketleme.', 'Kırpılmış görüntüyü bağlamından koparma.', 'Moderasyon kararını başka kullanıcılara baskı aracı yapma.'] },
      { title: 'Sonraki adım', body: 'Rahatsız edici bir içerik gördüğünde bağlantıyı, video zaman damgasını ve kısa açıklamayı sakla. YouTube üzerindeki ihlali YouTube’a, EkoYıldız alanındaki topluluk ihlalini bize bildir. Acil fiziksel tehlike veya ciddi tehdit durumunda yalnızca topluluk ekibine güvenmek yerine güvendiğin bir yetişkine ve yerel mercilere ulaş.', steps: ['Platform raporlama aracını kullan.', 'Kanıtı değiştirmeden sakla.', 'Gerekirse EkoYıldız raporu oluştur.'] }
    ]
  },
  {
    slug: 'kullanici-raporlama', category: 'Raporlama', icon: '🚨', title: 'Bir kullanıcıyı doğru şekilde raporla', summary: 'Taciz, tehdit, reklam, sahte yetkili ve topluluk ihlallerinde incelemeyi hızlandıran kanıtları hazırla.', mascot: 'Kalkanlı Eko: 47 bulanık ekran görüntüsü yerine üç net kanıt çok daha atletiktir.', relatedSlugs: ['discord-sahte-dm-ve-phishing', 'ceza-ve-itiraz'],
    sections: [
      { title: 'Ne yapmalıyım?', body: 'Raporunda kim, ne yaptı, nerede oldu ve yaklaşık ne zaman gerçekleşti sorularını cevapla. Mesaj bağlantısını, kullanıcı kimliğini ve bağlamı gösteren ekran görüntülerini ekle. Kanıtın orijinal hâlini koru; kişisel verileri yalnızca inceleme için gerekli olduğunda ve güvenli destek kanalında paylaş.', steps: ['Olayı bir veya iki paragrafta özetle.', 'Mesaj bağlantılarını kronolojik sıraya koy.', 'Beklediğin çözümü açıkça belirt.'] },
      { title: 'Ne yapmamalıyım?', body: 'Topluluğu kullanıcıya karşı örgütleme, kanıtları düzenleyerek anlamını değiştirme veya aynı olay için çok sayıda bilet açma. Rapor göndermek otomatik ceza garantisi değildir; ekip kanıtı, bağlamı ve varsa önceki kayıtları birlikte değerlendirir. Yanlış bilgi süreci yavaşlatır.', steps: ['Herkese açık ifşa başlığı açma.', 'Başkasının hesabına girerek kanıt toplama.', 'Yetkiliden belirli bir ceza talep ederek baskı kurma.'] },
      { title: 'Sonraki adım', body: 'Rapor alındığında bir bilet numarası oluşur. Yetkili ek bilgi isterse yalnızca aynı vaka üzerinden yanıt ver. İnceleme sürerken kullanıcıyı engelleyebilir ve gizlilik ayarlarını sıkılaştırabilirsin. Sonuç paylaşımı, diğer kişilerin gizliliği nedeniyle her ayrıntıyı içermeyebilir.', steps: ['Bilet numaranı sakla.', 'Yeni kanıtı mevcut bilete ekle.', 'Yanıt bildirimlerini kontrol et.'] }
    ]
  },
  {
    slug: 'ceza-ve-itiraz', category: 'Moderasyon', icon: '⚖️', title: 'Ceza ve itiraz sürecini anla', summary: 'Bir kararın neden göründüğünü, hangi bilginin incelendiğini ve sağlıklı bir itirazın nasıl yazıldığını öğren.', mascot: 'Topluluk Eko: “Ama herkes yapıyor” bir savunma olabilir; güçlü bir kanıt sayılmaz.', relatedSlugs: ['kullanici-raporlama', 'yetkiliyle-iletisim'],
    sections: [
      { title: 'Ne yapmalıyım?', body: 'Önce bildirilen kuralı, işlem tarihini ve varsa vaka numarasını oku. İtirazında kararın hangi kısmının yanlış olduğunu, bunu destekleyen yeni bilgiyi ve olayın bağlamını açıkça yaz. Sorumluluk aldığın bir bölüm varsa dürüstçe belirtmek incelemeyi kolaylaştırır ve iletişimi daha sağlıklı tutar.', steps: ['Karar metnini tamamen oku.', 'Yeni ve doğrulanabilir kanıtı ekle.', 'Tek bir vaka üzerinden sakin biçimde iletişim kur.'] },
      { title: 'Ne yapmamalıyım?', body: 'Yetkililere toplu DM gönderme, tehdit etme, yeni hesapla cezayı aşma veya aynı metni farklı biletlerde tekrar gönderme. İtiraz, kararı veren kişiye karşı bir saldırı değil kararın yeniden incelenmesi talebidir. Sahte veya değiştirilmiş kanıt yeni bir ihlal olarak değerlendirilebilir.', steps: ['Kişisel hakaret kullanma.', 'Banı yan hesapla aşmaya çalışma.', 'Karar çıkmadan topluluk baskısı oluşturma.'] },
      { title: 'Sonraki adım', body: 'İtiraz alındıktan sonra karar onanabilir, değiştirilebilir veya ek bilgi istenebilir. Ret mesajında son başvuru hakkı belirtilmişse yalnızca yeni bilgiyle kullan. Teknik hata, yanlış kullanıcı eşleşmesi veya açılmayan bağlantı görürsen moderasyon kararından ayrı bir teknik destek bileti aç.', steps: ['İtiraz durumunu aynı sayfadan izle.', 'Ek bilgi talebine süre içinde yanıt ver.', 'Teknik sorunu ticket sihirbazına bildir.'] }
    ]
  },
  {
    slug: 'yetkiliyle-iletisim', category: 'Yetkili rehberi', icon: '🛡️', title: 'Yetkililerle güvenli ve verimli iletişim', summary: 'Resmî yetkiliyi tanı, doğru kanalı seç ve senden asla istenmemesi gereken bilgileri öğren.', mascot: 'Kalkanlı Eko: Yetkili rozeti iletişimi kolaylaştırır; telepati özelliği henüz eklenmedi.', relatedSlugs: ['kullanici-raporlama', 'ticket-sorun-giderici'],
    sections: [
      { title: 'Ne yapmalıyım?', body: 'Yetkilinin resmî sunucudaki rolünü kontrol et ve destek konularını mümkün olduğunca ticket üzerinden konuş. Sorunu kısa bir özet, hata metni ve beklediğin sonuçla anlat. Bir moderasyon görüşmesinde sakin kal, sorulara doğru bilgi ver ve anlamadığın karar gerekçesini açıklamasını iste.', steps: ['Doğru destek kategorisini seç.', 'Kişisel bilgileri gereksiz yere paylaşma.', 'Görüşme sonunda bilet numarasını sakla.'] },
      { title: 'Ne yapmamalıyım?', body: 'Yetkili olduğunu söyleyen kişiye şifre, token, tarayıcı çerezi, iki faktör kodu veya uzaktan erişim izni verme. EkoYıldız ekibi bu bilgileri istemez. Özel konuşmayı izinsiz yayımlama; tehdit, ısrarcı etiketleme veya farklı yetkililere aynı anda baskı yapma.', steps: ['AnyDesk benzeri erişim verme.', 'Kod veya çerez gönderme.', 'Acil olmayan konuda sürekli DM atma.'] },
      { title: 'Sonraki adım', body: 'Yanıt alamıyorsan mevcut bilete bir kez güncel bilgi ekle ve makul süre bekle. Bilet teknik olarak açılmıyorsa ticket sorun gidericiyi çalıştır. Bir yetkilinin davranışıyla ilgili şikâyetin varsa olayı o kişiye değil, denetim ekibine ve kanıtlarıyla bildir.', steps: ['Mevcut bilet durumunu kontrol et.', 'Teknik sihirbazı çalıştır.', 'Gerekirse yetkili davranışı raporu aç.'] }
    ]
  },
  {
    slug: 'ticket-sorun-giderici', category: 'Destek', icon: '🎫', title: 'Ticket hata sihirbazı', summary: 'Bilet açılmıyor, gönderimde kalıyor veya Discord kanalı görünmüyorsa sorunun hangi aşamada olduğunu bul.', mascot: 'Üretici Eko: Bileti üç kez tıklamak onu daha hızlı yapmaz; sadece üçüz yapabilir.', relatedSlugs: ['yetkiliyle-iletisim', 'hesabimi-guvene-alma'],
    sections: [
      { title: 'Ne yapmalıyım?', body: 'Önce sitede oturumunun açık olduğunu ve Discord hesabının doğru kullanıcıya bağlı göründüğünü kontrol et. Kategori seç, açıklamaya en az bir net cümle yaz ve gönder düğmesine bir kez bas. Sonuç kutusunda bilet numarası görünüyorsa kayıt alınmıştır; Discord teslimi sırada olsa bile tekrar bilet açma.', steps: ['Sayfayı bir kez yenileyip oturumu kontrol et.', 'Reklam engelleyici veya katı script engelini geçici test et.', 'Gösterilen bilet numarasını not al.'] },
      { title: 'Ne yapmamalıyım?', body: 'Gönder düğmesine art arda basma, aynı sorun için farklı kategorilerde bilet üretme veya hata metnini gizleyerek yalnızca “çalışmıyor” yazma. Tarayıcı konsolunda gördüğün token, çerez veya özel oturum değerlerini kimseye gönderme; yalnızca hata mesajı ve saat yeterlidir.', steps: ['Sayfa yüklenirken sekmeyi kapatma.', 'Özel oturum bilgisini ekran görüntüsüne alma.', 'Bilet numarası oluştuysa yeni kayıt açma.'] },
      { title: 'Sonraki adım', body: '“Discord’a teslim edildi” mesajını görürsen bilet Discord ekibine ulaşmıştır. “Teslim sırada” mesajında kayıt güvendedir ve bot yeniden erişilebilir olduğunda ekip web listesinden görebilir. Hiç bilet numarası oluşmazsa ekran görüntüsü, saat ve kullandığın cihazla teknik destek kanalına ulaş.', steps: ['Biletlerim sayfasında kaydı ara.', 'Teslim durumunu not et.', 'Kayıt yoksa teknik hata raporu gönder.'] }
    ]
  },
  {
    slug: 'hesabimi-guvene-alma', category: 'Hesap güvenliği', icon: '🔐', title: 'Hesabını ele geçirilme sonrası güvene al', summary: 'Discord veya Roblox hesabında şüpheli etkinlik fark ettiğinde ilk dakikalarda uygulanacak kurtarma adımları.', mascot: 'Kalkanlı Eko: Önce oturumları kapatıyoruz, sonra dedektif şapkasını takıyoruz.', relatedSlugs: ['discord-sahte-dm-ve-phishing', 'roblox-hesap-guvenligi'],
    sections: [
      { title: 'Ne yapmalıyım?', body: 'Temiz olduğuna güvendiğin bir cihazdan önce e-posta hesabının, ardından Discord veya Roblox hesabının parolasını değiştir. Tüm aktif oturumları kapat, iki aşamalı doğrulamayı aç ve bağlı uygulamalar ile tarayıcı uzantılarını incele. Kurtarma kodlarını çevrimdışı ve güvenli bir yerde sakla.', steps: ['E-posta güvenliğini önce tamamla.', 'Bilinmeyen oturum ve uygulamaları kaldır.', 'Cihazda güncel güvenlik taraması çalıştır.'] },
      { title: 'Ne yapmamalıyım?', body: 'Şüpheli cihazdan yeni parola oluşturma, saldırganla pazarlık yapma veya hesabı kurtarma vaadiyle para isteyen kişilere güvenme. EkoYıldız hesabını doğrudan geri veremez; Discord ve Roblox hesap kurtarma işlemleri yalnızca ilgili platformların resmî destek kanallarından yürütülür.', steps: ['Kurtarma kodlarını DM ile gönderme.', 'Aynı parolayı yeniden kullanma.', 'Sahte destek hesabına ödeme yapma.'] },
      { title: 'Sonraki adım', body: 'Hesabını güvene aldıktan sonra arkadaşlarına hesabından gönderilmiş şüpheli mesajları açmamalarını söyle ve platform desteğine olayın saatini bildir. EkoYıldız sunucusunda hesabından ihlal yapıldıysa kanıtlarla destek bileti aç; ekip topluluk içindeki etkileri ayrıca değerlendirebilir.', steps: ['Şüpheli mesajları bildirin.', 'Platform destek talebini sakla.', 'Topluluk etkisi için EkoYıldız bileti aç.'] }
    ]
  }
];

const topics = [
  ['Ticket Kullanımı', 'Destek', 'ticket-sorun-giderici'], ['Dolandırıcılıktan Korunma', 'Güvenlik', 'discord-sahte-dm-ve-phishing'], ['Sahte Personeller', 'Güvenlik', 'yetkiliyle-iletisim'], ['Ban Affı', 'Cezalar', 'ceza-ve-itiraz'], ['Moderasyon Kuralları', 'Moderasyon', 'ceza-ve-itiraz'], ['Personel İşlemleri', 'Yetkili rehberi', 'yetkiliyle-iletisim'], ['EkoYıldız Sistemleri', 'Destek', 'ticket-sorun-giderici'],
  ['Hesabımı nasıl korurum?', 'Güvenlik temelleri', 'hesabimi-guvene-alma'], ['2FA neden önemli?', 'Güvenlik temelleri', 'hesabimi-guvene-alma'], ['Şüpheli bağlantıya tıkladım', 'Hesap güvenliği', 'discord-sahte-dm-ve-phishing'], ['Hesabım ele geçirildi', 'Hesap güvenliği', 'hesabimi-guvene-alma'], ['Sahte botları nasıl anlarım?', 'Dolandırıcılık', 'discord-sahte-dm-ve-phishing'], ['Sahte Nitro bağlantıları', 'Dolandırıcılık', 'discord-sahte-dm-ve-phishing'], ['QR kod dolandırıcılığı', 'Dolandırıcılık', 'discord-sahte-dm-ve-phishing'], ['Token hırsızlığı', 'Dolandırıcılık', 'discord-sahte-dm-ve-phishing'], ['Sahte moderatörler', 'Dolandırıcılık', 'yetkiliyle-iletisim'], ['Bedava Robux dolandırıcılıkları', 'Dolandırıcılık', 'roblox-hesap-guvenligi'], ['Bir kullanıcıyı nasıl raporlarım?', 'Topluluk', 'kullanici-raporlama'], ['Taciz durumunda ne yapmalıyım?', 'Topluluk', 'kullanici-raporlama'], ['DM reklamlarını nasıl bildiririm?', 'Topluluk', 'kullanici-raporlama'], ['YouTube yorum kuralları', 'YouTube', 'youtube-topluluk-kurallari'], ['Moderasyon sistemimiz nasıl çalışıyor?', 'Moderasyon', 'ceza-ve-itiraz'], ['Neden ceza aldım?', 'Cezalar', 'ceza-ve-itiraz'], ['İtiraz nasıl yapılır?', 'Cezalar', 'ceza-ve-itiraz'], ['Bir yetkiliyle nasıl iletişim kurarım?', 'Destek', 'yetkiliyle-iletisim'], ['Ticket açılmıyor', 'Destek', 'ticket-sorun-giderici'], ['Ticket teslim durumları', 'Destek', 'ticket-sorun-giderici'],
];

const activeAlert = { date: '12 Eylül', title: 'Sahte Nitro bağlantılarında artış görüyoruz', text: 'Bilmediğiniz kişilerden gelen bağlantılara giriş yapmayın; resmî sayfa dışındaki QR kodları taramayın.' };
const pastAlerts = ['3 Eylül — QR giriş dolandırıcılığı', '27 Ağustos — Sahte moderatör hesapları'];

module.exports = { authors, posts, topics, safetyGuides, activeAlert, pastAlerts };
