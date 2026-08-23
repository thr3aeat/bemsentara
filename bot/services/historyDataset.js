'use strict';

/**
 * Türk ve Atatürk Tarihi Kapsamlı Veritabanı ve Samimi Tarihsel Anlatım Motoru.
 * Her gün düzenli olarak mesaj atan, sıcak, arkadaş canlısı ve tutkulu bir anlatıcı
 * üslubuyla ("Evet dostlar, geldik bugüne!", "Dün hatırlarsanız..." vb.)
 * 2 detaylı ve akıcı paragraftan oluşan tarih anlatımı sunar.
 */

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

// Tarihe özel yüksek detaylı, samimi ve sürükleyici anlatımlar
const SPECIFIC_DATE_EVENTS = {
  // ── OCAK ───────────────────────────────────────────────────────────────────
  "0_1": `🎆 Yeni yılınız kutlu olsun sevgili EkoYıldız ailesi! Yeni bir yılın ilk günü olan 1 Ocak tarihine hep birlikte büyük bir neşeyle merhaba diyoruz! Sağlık, mutluluk ve başarılarla dolu harika bir yıl olsun! 1 Ocak 1923 tarihinde, Lozan Barış Konferansı'nın o en çetin günlerinde Gazi Mustafa Kemal Atatürk, Türk heyetine tam bağımsızlıktan zerre kadar taviz verilmemesi yönündeki kesin talimatını yinelemişti. 

Mustafa Kemal Paşa'nın "Siyasi ve askeri zaferler ne kadar büyük olursa olsunlar, iktisadi zaferlerle taçlandırılmazlarsa yaşayamaz" vizyonu doğrultusunda genç cumhuriyetimizin temelleri atıldı. Tüm EkoYıldız ailesine huzurlu, bereketli ve nice zaferlerle dolu harika bir yıl dileriz!`,

  "0_10": `Evet arkadaşlar, geldik 10 Ocak gününe! Dün konuştuğumuz hazırlıkların ardından bugün Türk Kurtuluş Savaşı'nın en gurur verici askeri zaferlerinden birine tanıklık ediyoruz. 10 Ocak 1921 tarihinde, Albay İsmet (İnönü) Bey komutasındaki düzenli ordumuz, Birinci İnönü Muharebesi'nde Yunan işgal kuvvetlerini kesin bir yenilgiye uğrattı. Gazi Mustafa Kemal Paşa'nın Ankara'dan büyük bir inançla yönettiği bu zafer, milletin Meclis'e olan güvenini zirveye taşıdı.

Bu büyük zafer sadece cephede kalmadı; İtilaf Devletleri'nin TBMM'yi Londra Konferansı'na çağırmasını sağlayarak Ankara Hükümeti'nin dünyada resmen tanınmasının önünü açtı. Düzenli ordumuzun bu ilk büyük zaferi, bağımsız Türkiye Cumhuriyeti'nin doğum müjdecisi oldu.`,

  "0_20": `Evet dostlar, takvimler 20 Ocak gününü gösteriyor! 20 Ocak 1921 tarihinde, Türkiye Büyük Millet Meclisi tarihi bir karara imza atarak yeni Türk devletinin ilk anayasası olan Teşkilât-ı Esasîye Kanunu'nu kabul etti. Mustafa Kemal Paşa'nın meclis kürsüsünden haykırdığı "Hâkimiyet bilâkaydü şart milletindir" (Egemenlik kayıtsız şartsız milletindir) ilkesi ilk kez anayasal bir hüküm haline getirildi.

Bu tarihi anayasa, millet iradesini padişah ve hilafet baskısından kurtarıp doğrudan halkın ellerine teslim etti ve Kurtuluş Savaşı'mızın hukuki temel taşını oluşturdu.`,

  "0_28": `Evet arkadaşlar, geldik 28 Ocak tarihine! 28 Ocak 1920'de, son Osmanlı Mebusan Meclisi, Mustafa Kemal Paşa'nın Ankara'dan hazırladığı o tarihi bağımsızlık manifestosunu, yani Misak-ı Millî'yi (Milli Ant) oy birliğiyle kabul etti. Vatanın bölünmez sınırları ve kapitülasyonların kesinlikle reddedildiği tüm dünyaya ilan edildi.

Bu tarihi karar işgalci güçlerin İstanbul'u basmasına sebep olsa da, Mustafa Kemal Paşa'nın Ankara'da Türkiye Büyük Millet Meclisi'ni açmasının en büyük meşruiyet gücü oldu.`,

  // ── ŞUBAT ──────────────────────────────────────────────────────────────────
  "1_17": `Evet sevgili dostlar, geldik 17 Şubat gününe! 17 Şubat 1923 tarihinde, savaştan yeni çıkmış ve fabrikası dahi bulunmayan genç milletimiz için Gazi Mustafa Kemal Atatürk, İzmir İktisat Kongresi'ni topladı. Atatürk o tarihi konuşmasında, "Kılıç ile kazanılan zaferler, sabanla kazanılan zaferlerle taçlandırılmalıdır" diyerek ekonomik bağımsızlığın milli egemenliğin temeli olduğunu vurguladı.

Bu tarihi kongrede yerli malı üretimi, milli sanayi ve tasarruf ilkeleri kabul edilerek Türkiye'nin kalkınma atılımı başlatıldı.`,

  // ── MART ───────────────────────────────────────────────────────────────────
  "2_3": `Evet dostlar, bugün 3 Mart ve tarihimizin en büyük devrim günlerinden birindeyiz! 3 Mart 1924 tarihinde Gazi Mustafa Kemal Atatürk'ün liderliğinde TBMM; hilafeti kaldırdı, Şeriye ve Evkaf Vekaleti'ni lağvetti ve Tevhid-i Tedrisat (Öğretim Birliği) Kanunu'nu kabul etti. Eğitim ve hukuk tek çatı altında modernleştirildi.

Bu tarihi adımlar, Türkiye Cumhuriyeti'nin laik, çağdaş ve demokratik bir hukuk devleti olarak yükselmesini sağlayan en güçlü temel taşları oldu.`,

  "2_12": `Evet arkadaşlar, geldik 12 Mart'a, yani tüylerimizi diken diken eden o kutlu güne! 12 Mart 1921 tarihinde, Mehmet Âkif Ersoy'un cephedeki Mehmetçiğin çelikten iradesini kaleme aldığı İstiklal Marşı'mız, TBMM'de milletvekillerinin ve Mustafa Kemal Paşa'nın ayakta alkışlarıyla milli marşımız olarak kabul edildi.

"Korkma, sönmez bu şafaklarda yüzen al sancak!" mısralarıyla başlayan bu eşsiz destan, bağımsızlık mücadelemizin ve milletimizin sarsılmaz andı olarak sonsuza dek tescillendi.`,

  "2_16": `Evet sevgili dostlar, bugün 16 Mart! 16 Mart 1920 tarihinde İtilaf Devletleri donanması İstanbul'u resmen işgal etti ve Meclis-i Mebusan'ı basarak milli mebusları Malta'ya sürdü. Mustafa Kemal Paşa, bu haksız işgali dünya devletlerine telgraflarla protesto ederek milli iradenin artık sadece Ankara'da temsil edileceğini duyurdu.

Bu karanlık işgal, Ankara'da Türkiye Büyük Millet Meclisi'nin açılmasına giden yolu açan en kritik tarihi kırılma noktası oldu.`,

  "2_18": `Evet dostlar, geldik 18 Mart'a; bir milletin çelikten iradesiyle devleştiği o büyük güne! 18 Mart 1915 tarihinde dönemin en güçlü müttefik donanması Çanakkale Boğazı'nda Türk topçusunun ve Mehmetçiğin sarsılmaz imanı karşısında hezimete uğradı. Nusret Mayın Gemisi ve Seyit Onbaşı'nın kahramanlığıyla "Çanakkale Geçilmez" gerçeği tüm dünyaya haykırıldı.

Bu deniz zaferi, Anafartalar Kahramanı Yarbay Mustafa Kemal'in askeri dehasıyla birleşerek Kurtuluş Savaşı'mızın milli ruhunu doğuran büyük bir dönüm noktası oldu.`,

  "2_31": `Evet arkadaşlar, 31 Mart günündeyiz! 31 Mart 1921 gecesi Albay İsmet Bey komutasındaki ordumuz, İkinci İnönü Muharebesi'ni kesin bir zaferle noktaladı. Mustafa Kemal Paşa, İsmet Paşa'ya çektiği tarihi telgrafta o unutulmaz sözleri söyledi: "Siz orada yalnız düşmanı değil, milletin makûs talihini de yendiniz!"

Bu kutlu zafer, Milli Mücadele'nin nihai zafere ulaşacağına dair milletimizin inancını perçinledi.`,

  // ── NİSAN ──────────────────────────────────────────────────────────────────
  "3_10": `Evet dostlar, geldik 10 Nisan tarihine! 10 Nisan 1928'de TBMM Anayasa değişikliği yaparak "Devletin dini İslam'dır" maddesini metinden çıkardı ve Türkiye Cumhuriyeti'nin laiklik ilkesini anayasal güvenceye kavuşturdu.

Atatürk'ün akıl, bilim ve din-vicdan özgürlüğünü esas alan bu devrimi, ülkemizi çağdaş hukuk devleti kimliğiyle taçlandırdı.`,

  "3_23": `Evet sevgili EkoYıldız ailesi, geldik 23 Nisan'a, milletimizin en büyük bayramına! 23 Nisan 1920'de Gazi Mustafa Kemal Atatürk'ün önderliğinde Ankara'da Türkiye Büyük Millet Meclisi dualarla açıldı ve "Egemenlik kayıtsız şartsız milletindir!" ilkesi devletin temeli oldu.

Atatürk bu kutlu günü tüm dünya çocuklarına bayram olarak armağan etti. 23 Nisan, dünyada çocuklara ithaf edilen ilk ve tek bayram olarak bağımsızlığımızın ebedi gururudur.`,

  // ── MAYIS ──────────────────────────────────────────────────────────────────
  "4_19": `Evet arkadaşlar, geldik 19 Mayıs'a; bağımsızlık ateşinin ilk kıvılcımının çaktığı o büyük güne! 19 Mayıs 1919'da Gazi Mustafa Kemal Atatürk Bandırma Vapuru ile Samsun'a ayak basarak Türk Kurtuluş Savaşı'nı başlattı.

Atatürk'ün "Doğum günüm" dediği ve gençliğe emanet ettiği 19 Mayıs, Türk milletinin esarete asla boyun eğmeyeceğinin ve bağımsızlığın genç nesillerin omuzlarında yükseleceğinin ölümsüz meşalesidir.`,

  "4_29": `Evet dostlar, takvimler 29 Mayıs'ı gösteriyor! 29 Mayıs 1453 tarihinde, Fatih Sultan Mehmet Han komutasındaki şanlı Türk ordusu İstanbul'u fethederek Orta Çağ'ı kapattı ve Yeni Çağ'ı açtı.

İstanbul'un fethi sadece askeri bir zafer değil, adaletin, hoşgörünün ve cihan devleti vizyonumuzun dünyaya mührü oldu.`,

  // ── HAZİRAN ────────────────────────────────────────────────────────────────
  "5_22": `Evet arkadaşlar, geldik 22 Haziran'a! 22 Haziran 1919'da Mustafa Kemal Paşa ve silah arkadaşları Amasya Genelgesi'ni yayımladı: "Vatanın bütünlüğü, milletin bağımsızlığı tehlikededir. Milletin bağımsızlığını yine milletin azim ve kararı kurtaracaktır!"

Bu tarihi genelge, padişah otoritesine karşı milli egemenliği esas alan bir milli ihtilal bildirisi oldu.`,

  // ── TEMMUZ ─────────────────────────────────────────────────────────────────
  "6_1": `Evet sevgili dostlar, bugün 1 Temmuz Denizcilik ve Kabotaj Bayramı! 1 Temmuz 1926'da yürürlüğe giren Kabotaj Kanunu ile karasularımızda deniz ticareti ve liman işletmesi hakkı tamamen Türk denizcilerine devredildi.

Atatürk'ün "Denizciliği Türk'ün büyük milli ülküsü olarak düşünmeliyiz" sözleriyle mavi vatanımızdaki mutlak egemenliğimiz tescillendi.`,

  "6_20": `Evet arkadaşlar, geldik 20 Temmuz'a! 20 Temmuz 1936'da imzalanan Montrö Boğazlar Sözleşmesi ile Çanakkale ve İstanbul Boğazları'nın mutlak kontrolü ve egemenliği Türkiye Cumhuriyeti'ne verildi. Aynı gün 1974 yılında Türk Silahlı Kuvvetleri Kıbrıs Barış Harekâtı'nı başlatarak soydaşlarımızı katliamdan kurtardı.

Atatürk'ün diplomasi dehası olan Montrö, bugün dahi boğazlarımızın ve Karadeniz'in en güçlü kalkanıdır.`,

  "6_23": `Evet dostlar, 23 Temmuz günündeyiz! 23 Temmuz 1919'da Mustafa Kemal Paşa başkanlığında toplanan Erzurum Kongresi'nde "Milli sınırlar içinde vatan bir bütündür, parçalanamaz" ve "Manda ve himaye kabul edilemez" kararları alındı.

Bu kongre, Misak-ı Millî'nin ve topyekûn kurtuluş stratejimizin omurgasını oluşturdu.`,

  "6_24": `Evet sevgili arkadaşlar, bugün 24 Temmuz ve bağımsızlığımızın tapu senedi günündeyiz! 24 Temmuz 1923'te imzalanan Lozan Barış Antlaşması ile Sevr yırtılıp atıldı ve yeni Türk devleti tüm dünya tarafından tanındı.

Atatürk bu antlaşmayı, "Türk milleti aleyhine asırlardır hazırlanan büyük bir suikastın yıkılış belgesidir" sözleriyle tanımlamıştır.`,

  // ── AĞUSTOS ────────────────────────────────────────────────────────────────
  "7_14": `Evet dostlar, geldik 14 Ağustos gününe! 14 Ağustos 1922 tarihinde, Mustafa Kemal Atatürk Batı Cephesi Karargahı'nda kurmaylarıyla toplanarak Büyük Taarruz öncesi son askeri hazırlıkları denetledi. Düşmanı Anadolu'dan söküp atmak için yürütülen gizli sevkiyatlar tamamlandı.

Bu stratejik hamleler, çok yakında başlayacak olan 26 Ağustos Büyük Taarruzu'nun ve 30 Ağustos Büyük Zaferi'nin temellerini attı.`,

  "7_23": `Evet sevgili EkoYıldız ailesi, geldik 23 Ağustos'a! Dün bahsettiğimiz hazırlıkların ardından bugün Türk tarihinin en kanlı ve kader belirleyici dönüm noktasına tanıklık ediyoruz. 23 Ağustos 1921 tarihinde, Başkomutan Mustafa Kemal Paşa komutasında 100 kilometrelik hatta Sakarya Meydan Muharebesi başladı.

Mustafa Kemal Paşa'nın "Hattı müdafaa yoktur, sathı müdafaa vardır. O satıh bütün vatandır. Vatanın her karış toprağı vatandaşın kanıyla ıslanmadıkça terk olunamaz" tarihi emri bu savaşta verildi. 22 gün süren bu destan, Türk ordusunun yüzyıllardır süren geri çekilişine son verdi.`,

  "7_26": `Evet arkadaşlar, geldik 26 Ağustos'a; tarihin iki büyük zaferle düğümlendiği o eşsiz güne! 26 Ağustos 1071'de Sultan Alparslan Malazgirt Zaferi ile Anadolu'nun kapılarını milletimize açtı. Tam 851 yıl sonra, 26 Ağustos 1922'de Başkomutan Mustafa Kemal Paşa Afyon Kocatepe'den Büyük Taarruz emrini verdi!

Topçularımızın gürlemesiyle başlayan hücum, emperyalist işgale son darbeyi vurdu ve Anadolu'nun ebedi Türk yurdu olduğunu tescilledi.`,

  "7_30": `Evet dostlar, geldik 30 Ağustos Zafer Bayramı'mıza! 30 Ağustos 1922'de Dumlupınar'da Başkomutan Mustafa Kemal Paşa bizzat yönettiği Başkomutanlık Meydan Muharebesi ile işgal ordularını tamamen imha etti.

Zaferin ardından Atatürk'ün verdiği "Ordular! İlk hedefiniz Akdeniz'dir, ileri!" tarihi emriyle Mehmetçik İzmir'e doğru akarak vatanı tamamen temizledi. 30 Ağustos bağımsızlığımızın ebedi zaferidir.`,

  // ── EYLÜL ──────────────────────────────────────────────────────────────────
  "8_4": `Evet sevgili arkadaşlar, bugün 4 Eylül! 4 Eylül 1919'da Mustafa Kemal Paşa başkanlığında toplanan Sivas Kongresi'nde bütün milli cemiyetler tek çatı altında birleştirildi ve "Manda ve himaye asla kabul edilemez" kararı perçinlendi.`,

  "8_9": `Evet dostlar, geldik 9 Eylül'e; İzmir'in dağlarında çiçeklerin açtığı o şanlı güne! 9 Eylül 1922'de Türk ordusu İzmir'e girerek Hükümet Konağı'na şanlı bayrağımızı çekti ve 3 yıllık karanlık işgal sona erdi.

Bu büyük zafer, bağımsız Türkiye Cumhuriyeti'nin doğum müjdesi oldu.`,

  "8_27": `Evet arkadaşlar, 27 Eylül günündeyiz! 27 Eylül 1538 tarihinde Barbaros Hayreddin Paşa komutasındaki Osmanlı Donanması, Preveze Deniz Zaferi ile Haçlı Donanması'nı Akdeniz'in sularına gömdü ve Akdeniz bir Türk gölü haline geldi.`,

  // ── EKİM ───────────────────────────────────────────────────────────────────
  "9_13": `Evet dostlar, takvimler 13 Ekim'i gösteriyor! 13 Ekim 1923'te TBMM kararıyla Ankara, genç Türkiye Cumhuriyeti'nin başkenti ilan edildi. Milli Mücadele'nin karargahı olan bu bozkır şehri, cumhuriyetimizin kalbi oldu.`,

  "9_28": `Evet sevgili arkadaşlar, geldik 28 Ekim akşamına! 28 Ekim 1923 akşamı Çankaya Köşkü'nde Gazi Mustafa Kemal Paşa o tarihi sözü söyledi: "Efendiler! Yarın Cumhuriyeti ilan edeceğiz!"

Gece boyunca süren hazırlıklar, ertesi gün millet egemenliğinin bayramı olacak Cumhuriyet'in doğumunu müjdeledi.`,

  "9_29": `Evet sevgili EkoYıldız ailesi, geldik 29 Ekim'e, en büyük bayramımıza! 29 Ekim 1923'te TBMM'de Cumhuriyet ilan edildi ve Gazi Mustafa Kemal Atatürk oy birliğiyle ilk Cumhurbaşkanımız seçildi.

Atatürk'ün "En büyük eserim" dediği Cumhuriyet, Türk milletinin ebedi bağımsızlık tacıdır. Cumhuriyet Bayramı'mız kutlu olsun!`,

  // ── KASIM ──────────────────────────────────────────────────────────────────
  "10_1": `Evet dostlar, bugün 1 Kasım! 1 Kasım 1922'de TBMM saltanatı kaldırarak 600 yıllık Osmanlı saltanatına son verdi ve egemenliğin yalnızca millete ait olduğunu dünyaya duyurdu.`,

  "10_10": `Evet sevgili dostlar, bugün 10 Kasım; kalbimizin en derin yerinden Gazi Mustafa Kemal Atatürk'ü andığımız o hüzünlü ve minnet dolu gün. Saat 09:05'te ebediyete irtihal eden Ata'mızı saygı, sevgi, özlem ve minnetle anıyoruz.

Onun fikirleri ve devrimleri her daim yolumuzu aydınlatmaya devam edecektir.`,

  "10_24": `Evet arkadaşlar, bugün 24 Kasım Öğretmenler Günü! 24 Kasım 1928'de Atatürk'e Başöğretmen unvanı verildi. "Yeni nesil sizin eseriniz olacaktır" diyen Ata'mızın izindeki tüm öğretmenlerimize minnettarız.`,

  // ── ARALIK ─────────────────────────────────────────────────────────────────
  "11_5": `Evet dostlar, geldik 5 Aralık gününe! 5 Aralık 1934'te Türk kadınına milletvekili seçme ve seçilme hakkı tanındı. Atatürk'ün vizyonuyla kadınlarımız birçok Avrupa ülkesinden yıllar önce Meclis'te yerini aldı.`,

  "11_27": `Evet sevgili arkadaşlar, takvimler 27 Aralık'ı gösteriyor! 27 Aralık 1919'da Mustafa Kemal Paşa Ankara'ya geldi ve binlerce Seymen tarafından "Vatanı kurtarmaya geldik Paşam!" nidalarıyla karşılandı. Ankara, bağımsızlığın sarsılmaz kalesi oldu.`,

  "11_31": `🎆 Yeni yılınız şimdiden kutlu olsun sevgili EkoYıldız ailesi! Koskoca bir yılın son günü olan 31 Aralık'tayız! Hep birlikte yeni bir yıla adım atarken sağlık, başarı, huzur ve mutluluk dolu harika bir yıl diliyoruz! 31 Aralık 1922 tarihinde, Gazi Mustafa Kemal Atatürk ve TBMM, yeni bir yıla girerken tam bağımsızlık andını ve aydınlık Türkiye vizyonunu tüm dünyaya duyurmuştu.

Eski yılın yorgunluklarını geride bırakırken, Atatürk'ün "Yükselen yeni nesil, istikbal sizsiniz" sözleriyle cumhuriyetimizin ışığında yeni yıla umutla yürüyoruz. Yeni yılınız kutlu olsun dostlar!`
};

/**
 * Samimi, arkadaş canlısı ve tarihsel derinliğe sahip 2 paragraflık günlük tarih metni üretir.
 * @param {number} day - Gün (1-31)
 * @param {number} month - Ay indeksi (0-11)
 * @returns {string} Samimi ve akıcı 2 paragraflık metin
 */
function getHistoricalFallbackEvent(day, month) {
  const key = `${month}_${day}`;
  if (SPECIFIC_DATE_EVENTS[key]) {
    return SPECIFIC_DATE_EVENTS[key];
  }

  const monthName = MONTH_NAMES[month];

  // Dünün tarihini hesapla
  let yesterdayDay = day - 1;
  let yesterdayMonth = month;
  if (yesterdayDay <= 0) {
    yesterdayMonth = (month + 11) % 12;
    yesterdayDay = 30; // Yaklaşık son gün
  }
  const yesterdayMonthName = MONTH_NAMES[yesterdayMonth];

  // Aylık dinamik ve samimi temalar
  const monthThemes = [
    {
      m: "Ocak",
      theme: "Milli Mücadele'nin kış şartlarındaki çetin savunması ve ordu yapılanması",
      p1: `Evet sevgili EkoYıldız ailesi, geldik ${day} Ocak gününe! Dün ${yesterdayDay} ${yesterdayMonthName} tarihindeki hazırlıkların ardından bugün, ordumuzun kış şartlarında vatan savunmasını nasıl büyük bir disiplinle ördüğünü görüyoruz. ${day} Ocak tarihinde Gazi Mustafa Kemal Atatürk ve Batı Cephesi komutanları, düzenli ordumuzun mevzilenmelerini ve stratejik gücünü artırmak için gece gündüz çalıştı.`,
      p2: `Atatürk'ün Ankara'dan yürüttüğü bu kararlı vizyon, Türk milletinin kendi vatanında esir edilemeyeceğini gösterdi. İşte ${day} Ocak'ta atılan bu askeri ve idari adımlar, sonrasında kazanacağımız büyük zaferlerin en sağlam temeli oldu. Yarın tarihin bir başka heyecan verici gününde buluşmak üzere!`
    },
    {
      m: "Şubat",
      theme: "Milli iradenin diplomasi ve meclis hazırlıkları",
      p1: `Evet arkadaşlar, takvimler bugün ${day} Şubat'ı gösteriyor! Dün ${yesterdayDay} ${yesterdayMonthName}'ta konuştuğumuz gibi bağımsızlık mücadelesi sadece cephede değil, meclis kürsülerinde ve diplomatik masalarda da büyük bir dirayetle sürüyordu. ${day} Şubat tarihinde Mustafa Kemal Paşa, milli iradenin tek yürek olması için tarihi temaslar yürüttü.`,
      p2: `Türk milletinin vatanın bölünmezliğinden asla taviz vermeyeceğini tüm dünyaya gösteren bu kararlı adımlar, modern Türkiye Cumhuriyeti'nin kuruluş felsefesini pekiştirdi. Tarihimizin bu kıymetli anını bugün hep birlikte saygıyla anıyoruz.`
    },
    {
      m: "Mart",
      theme: "Çanakkale ve İnönü zaferlerinin bahar uyanışı",
      p1: `Evet sevgili dostlar, geldik ${day} Mart gününe! Dün ${yesterdayDay} ${yesterdayMonthName}'ta hissettiğimiz o bağımsızlık coşkusu bugün de tüm heyecanıyla sürüyor. ${day} Mart tarihinde Türk ordusu ve milletimiz, Gazi Mustafa Kemal Paşa'nın askeri dehası etrafında kenetlenerek bağımsızlık meşalesini tüm Anadolu'ya yaydı.`,
      p2: `Mehmetçiğin fedakarlığı ve milletimizin sarsılmaz vatan sevgisi, tarihin akışını değiştiren en büyük güç oldu. ${day} Mart'ta sergilenen bu tarihi duruş, cumhuriyetimize giden yolu aydınlatmaya devam ediyor.`
    },
    {
      m: "Nisan",
      theme: "Milli egemenliğin ve Meclis iradesinin tecellisi",
      p1: `Evet arkadaşlar, bugün ${day} Nisan! Dün ${yesterdayDay} ${yesterdayMonthName} tarihindeki tarihi adımların devamında, millet iradesinin Ankara'da yükselişine şahit oluyoruz. ${day} Nisan tarihinde Gazi Mustafa Kemal Atatürk, milletin kendi geleceğine bizzat sahip çıkması için tarihi kararlar aldı.`,
      p2: `"Egemenlik kayıtsız şartsız milletindir" ilkesiyle hareket eden Türkiye Büyük Millet Meclisi, vatanın her karış toprağını koruma kararlılığını tüm dünyaya ilan etti. Bu kutlu miras bizlere emanettir!`
    },
    {
      m: "Mayıs",
      theme: "19 Mayıs ruhu ve Anadolu'da milli direniş",
      p1: `Evet sevgili EkoYıldız dostları, geldik ${day} Mayıs'a! Dün ${yesterdayDay} ${yesterdayMonthName}'ta yanan o kurtuluş ateşi, bugün de milletimizin yüreğinde parlamaya devam ediyor. ${day} Mayıs tarihinde Mustafa Kemal Atatürk ve dava arkadaşları, işgallere karşı Anadolu halkını tek bir amaç etrafında birleştirdi.`,
      p2: `Esarete boyun eğmeyen Türk milletinin bağımsız yaşama azmi, tüm engelleri birer birer aştı. ${day} Mayıs'ta filizlenen bu milli şuur, bağımsız Türkiye'nin en büyük güvencesi oldu.`
    },
    {
      m: "Haziran",
      theme: "Kongreler süreci ve milli birlik genelgeleri",
      p1: `Evet arkadaşlar, takvimler ${day} Haziran'ı gösteriyor! Dün ${yesterdayDay} ${yesterdayMonthName}'ta bahsettiğimiz gibi Amasya ve kongreler sürecinde tarihi beyannameler hazırlanıyordu. ${day} Haziran tarihinde Mustafa Kemal Paşa, milletin sesini tüm dünyaya haykırmak için gece gündüz çalıştı.`,
      p2: `Vatanın bölünmez bütünlüğü yönünde sergilenen bu yüksek inanç, Kurtuluş Savaşı'mızın rotasını belirledi. Bu kutlu tarihi adımları bugün bir kez daha saygı ve gururla hatırlıyoruz.`
    },
    {
      m: "Temmuz",
      theme: "Erzurum Kongresi ve Lozan diplomasisi",
      p1: `Evet dostlar, geldik ${day} Temmuz'a! Dün ${yesterdayDay} ${yesterdayMonthName}'ta konuştuğumuz tarihi adımların ardından bugün, manda ve himayenin kesin olarak reddedildiği o onurlu duruşu anıyoruz. ${day} Temmuz tarihinde Gazi Mustafa Kemal Atatürk, tam bağımsızlık ilkelerini tavizsiz şekilde savundu.`,
      p2: `Milli sınırlar içinde vatanın bir bütün olduğu gerçeği hem cephede hem de diplomatik masada tescil edildi. ${day} Temmuz'da yaşanan bu gelişmeler, bağımsızlığımızın ebedi teminatı oldu.`
    },
    {
      m: "Ağustos",
      theme: "Büyük Taarruz ve Sakarya destanı",
      p1: `Evet sevgili EkoYıldız ailesi, geldik ${day} Ağustos gününe! Dün ${yesterdayDay} ${yesterdayMonthName}'ta bahsettiğimiz o büyük hazırlıkların ardından bugün, ordumuzun bağımsızlık yürüyüşünün tarihi bir aşamasına tanık oluyoruz. ${day} Ağustos tarihinde Mustafa Kemal Atatürk, vatan topraklarını işgalden kurtarmak için stratejik kararları bizzat yönetti.`,
      p2: `Ordumuzun ve milletimizin bu yüksek inancı ve askeri disiplini, 30 Ağustos Büyük Zaferi'nin kapısını araladı. ${day} Ağustos'ta yazılan bu destanı bugün hep birlikte gururla anıyoruz!`
    },
    {
      m: "Eylül",
      theme: "İzmir'in kurtuluşu ve nihai zafer günleri",
      p1: `Evet arkadaşlar, bugün ${day} Eylül! Dün ${yesterdayDay} ${yesterdayMonthName}'ta şahlanan ordumuzun izinde, vatan topraklarının işgalden birer birer temizlendiği zafer günlerini yaşıyoruz. ${day} Eylül tarihinde Başkomutan Mustafa Kemal Paşa'nın orduları hürriyet türküleriyle ilerledi.`,
      p2: `Yıllar süren acı ve işgal dönemi Mehmetçiğin kahramanlığıyla son buldu. ${day} Eylül'de kazanılan bu kutlu başarılar, modern Türkiye Cumhuriyeti'nin doğuşunu müjdeledi.`
    },
    {
      m: "Ekim",
      theme: "Cumhuriyetimizin kuruluşu ve başkent Ankara",
      p1: `Evet sevgili dostlar, geldik ${day} Ekim gününe! Dün ${yesterdayDay} ${yesterdayMonthName}'ta konuştuğumuz cumhuriyet heyecanı bugün de Meclis çatısı altında yankılanıyor. ${day} Ekim tarihinde Mustafa Kemal Atatürk, halk egemenliğini taçlandıracak cumhuriyet devrimlerini hazırladı.`,
      p2: `Milletimizin çağdaş ve aydınlık geleceğe doğru yürüdüğü bu kutlu günler, cumhuriyetimizin sarsılmaz sütunları oldu. Yaşasın tam bağımsız Türkiye Cumhuriyeti!`
    },
    {
      m: "Kasım",
      theme: "Atatürk'ün devrimleri ve aydınlanma yürüyüşü",
      p1: `Evet arkadaşlar, takvimler ${day} Kasım'ı gösteriyor! Dün ${yesterdayDay} ${yesterdayMonthName}'ta bahsettiğimiz gibi Gazi Mustafa Kemal Atatürk, eğitim, kültür ve bilim alanında Türkiye'yi çağdaş medeniyet seviyesine ulaştıracak köklü adımlara öncülük etti.`,
      p2: `"Hayatta en hakiki mürşit ilimdir" ilkesiyle şekillenen bu devrimler, milletimizi modern dünyanın saygın bir üyesi yaptı. Ata'mızın bu kutlu mirasını daima yaşatacağız.`
    },
    {
      m: "Aralık",
      theme: "Ankara'ya geliş ve iktisadi atılımlar",
      p1: `Evet sevgili dostlar, yılın son ayı olan ${day} Aralık günündeyiz! Dün ${yesterdayDay} ${yesterdayMonthName}'ta konuştuğumuz adımların devamında, genç cumhuriyetimizin ekonomik ve toplumsal refahını sağlamak adına tarihi kararlar alındı. Mustafa Kemal Atatürk, üretimi ve kalkınmayı teşvik etti.`,
      p2: `Kendi ayakları üzerinde duran güçlü ve bağımsız Türkiye ideali, tam da bu günlerde hayat buldu. Yarın tarihin bir başka sayfasında görüşmek üzere!`
    }
  ];

  const theme = monthThemes[month] || monthThemes[7];
  return `${theme.p1}\n\n${theme.p2}`;
}

module.exports = {
  getHistoricalFallbackEvent,
  SPECIFIC_DATE_EVENTS,
  MONTH_NAMES
};
