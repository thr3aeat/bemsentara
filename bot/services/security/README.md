# 🔒 Yeni Hesap Güvenlik Sistemi

24 saat içinde oluşturulmuş hesapları otomatik tespit eden, anket sistemi ile doğrulayan ve moderatör soruşturması yaptıran kapsamlı güvenlik sistemi.

## 📋 Özellikler

### 1. **Otomatik Tespit**
- ✅ 24 saat içinde oluşturulan hesapları tespit eder
- ✅ Risk puanı hesaplar (0-100)
- ✅ Otomatik karantina rolü verir

### 2. **Risk Puanı Kriterleri**
- **Hesap Yaşı** (0-40 puan)
  - < 1 saat: 40 puan
  - < 6 saat: 30 puan
  - < 12 saat: 20 puan
  - < 24 saat: 10 puan
- **Profil Resmi Yok**: 15 puan
- **Şüpheli Kullanıcı Adı**: 20 puan
  - `user123`, `discord456`, `alt1`, `backup`, `test`
  - Tekrarlayan karakterler: `aaa`, `111`
  - Kısa harf + uzun rakam: `a1234`, `xy9999`
- **Az Ortak Sunucu**: 15 puan
  - 1 sunucu: 15 puan
  - 2-3 sunucu: 10 puan
  - 4-5 sunucu: 5 puan
- **Bio Yok**: 10 puan

**Risk Seviyeleri:**
- 🟡 **0-39**: Düşük Risk
- 🟠 **40-69**: Orta Risk
- 🔴 **70-100**: Yüksek Risk

### 3. **Anket Sistemi**
Kullanıcıya DM üzerinden 9 soruluk bir anket gönderilir:

1. Discord kullanıcı adın nedir?
2. Sunucumuza nasıl ulaştın?
   - Davet linki
   - Arkadaş tavsiyesi
   - Sosyal medya
   - Diğer
3. Sunucuya katılma amacın nedir?
4. Daha önce bu sunucuda bulundun mu?
5. Herhangi bir alternatif (alt) hesabın var mı?
6. Kuralları okudun ve kabul ediyor musun?
7. Eklemek istediğin bir şey var mı? (İsteğe bağlı)
8. Hesabını neden yeni oluşturdun? (İsteğe bağlı)
9. Mikrofonun var mı?

### 4. **Moderatör Seçimi**
Sistem en uygun moderatörü otomatik seçer:
1. 🟢 **Online** moderatörler öncelikli
2. 🌙 **Idle** moderatörler ikinci sırada
3. 🔴 **DND** moderatörler üçüncü sırada
4. ⚫ **Offline** - En son aktif olan seçilir

**Moderatör Kriterleri:**
- `mod`, `moderator`, `yetkili`, `staff`, `yönetici`, `admin` rolü
- Veya `Administrator` yetkisi

### 5. **Moderatör Bildirimi**
Moderatöre DM ile detaylı bildirim gönderilir:
- Kullanıcı bilgileri
- Hesap yaşı
- Risk skoru
- Anket cevapları

**Butonlar:**
- 🔍 **Soruşturmayı Başlat** - DM üzerinden konuşma
- ✅ **Temiz** - Onaylama
- 🔒 **Geçici Hapis** - Süreli ceza
- ⛓️ **Süresiz Hapis** - Kalıcı hapis
- 🚫 **Ban** - Sunucudan yasaklama

### 6. **DM Soruşturma Sistemi**
Moderatör "Soruşturmayı Başlat" butonuna bastığında:
- ✅ Moderatör ve kullanıcı arasında DM köprüsü kurulur
- ✅ Moderatörün yazdığı her mesaj kullanıcıya iletilir
- ✅ Kullanıcının cevapları moderatöre gelir
- ✅ Soru sayısı ve süre otomatik kaydedilir

**Güvenlik:**
- ✅ Başka moderatörler aynı vakayı göremez (tek moderatör sahipliği)
- ✅ Tüm konuşma veritabanında saklanır
- ✅ Zaman damgaları kaydedilir

### 7. **Karar Alma**
Moderatör karar verdikten sonra:

**✅ Temiz:**
- Doğrulanmış rolü verilir
- Karantina rolü kaldırılır
- Kullanıcıya başarı mesajı gönderilir

**🔒 Geçici Hapis:**
- Hapis rolü verilir
- Discord timeout uygulanır
- Süre seçenekleri:
  - 10 dakika
  - 30 dakika
  - 1 saat
  - 6 saat
  - 12 saat
  - 1 gün

**⛓️ Süresiz Hapis:**
- Hapis rolü verilir
- Manuel `/unjail` komutu gerekir

**🚫 Ban:**
- Sunucudan yasaklanır
- Sebep kaydedilir

### 8. **Loglama**
Her soruşturma log kanalına kaydedilir:
- Kullanıcı bilgileri
- Risk skoru
- Moderatör bilgileri
- Soruşturma süresi
- Soru sayısı
- Karar ve sebep

## 📁 Dosya Yapısı

```
bot/
├── handlers/
│   ├── newAccountHandler.js           # Ana handler (guildMemberAdd)
│   ├── newAccountButtonHandler.js     # Button interactions
│   └── newAccountMessageHandler.js    # DM message handling
│
├── services/
│   └── security/
│       ├── newAccountDetector.js      # Hesap yaşı ve risk puanı
│       ├── newAccountSurvey.js        # Anket sistemi
│       ├── moderatorSelector.js       # Moderatör seçimi
│       └── accountInvestigation.js    # Soruşturma yönetimi
│
models/
└── AccountInvestigation.js            # Veritabanı modeli
```

## 🔧 Kurulum

1. **Veritabanı Modeli**: Otomatik olarak oluşturulur (MongoDB)
2. **Handler'lar**: `bot/handlers/index.js` içine entegre edildi
3. **Button Handler**: `buttonHandler.js` içine eklendi

## ⚙️ Yapılandırma

### Gerekli Roller:
- **Karantina Rolü**: `karantin`, `quarantine`, veya `yeni`
- **Doğrulanmış Rolü**: `doğrulan` veya `verified`
- **Hapis Rolü**: `hapis` veya `jail`

### Config Değişkenleri:
- `LOG_CHANNEL_ID`: Soruşturma logları için kanal ID

## 📊 Veritabanı Şeması

```javascript
{
  userId: String,
  guildId: String,
  accountAge: Number,          // saat cinsinden
  riskScore: Number,           // 0-100
  surveyAnswers: {
    username: String,
    howFound: String,
    joinPurpose: String,
    wasHereBefore: Boolean,
    hasAltAccounts: Boolean,
    rulesAccepted: Boolean,
    additionalInfo: String,
    whyNewAccount: String,
    hasMicrophone: String,
  },
  assignedModeratorId: String,
  investigationMessages: [{
    from: 'moderator' | 'user',
    message: String,
    timestamp: Date
  }],
  questionCount: Number,
  decision: 'pending' | 'clean' | 'temp_jail' | 'perma_jail' | 'banned',
  decisionReason: String,
  tempJailDuration: Number,
  status: 'survey_sent' | 'survey_completed' | 'assigned' | 'investigating' | 'completed'
}
```

## 🚀 Kullanım

### Otomatik Çalışma:
1. Yeni hesap sunucuya katılır
2. Bot otomatik tespit eder ve DM gönderir
3. Kullanıcı anketi doldurur
4. Moderatör bildirim alır
5. Moderatör soruşturma yapar
6. Karar verilir ve uygulanır

### Manuel Kontrol:
Veritabanından soruşturma kayıtlarını görebilirsiniz:
```javascript
const AccountInvestigation = require('./models/AccountInvestigation');
const investigations = await AccountInvestigation.find({ status: 'investigating' });
```

## 🎯 Gelecek Geliştirmeler

- [ ] Otomatik devralma (5 dk cevap yoksa başka moderatör)
- [ ] Hazır soru paketleri
- [ ] İtiraz sistemi
- [ ] Geçmiş kayıt görüntüleme
- [ ] Risk puanı threshold ayarları
- [ ] Whitelist sistemi

## 🐛 Sorun Giderme

**Problem:** DM gönderilemedi
- **Çözüm**: Kullanıcının DM'leri kapalı olabilir, moderatöre direkt bildirim gönderilir

**Problem:** Moderatör bulunamadı
- **Çözüm**: Sunucuda moderatör rolü olan aktif üye olmadığını kontrol edin

**Problem:** Risk puanı yanlış hesaplanıyor
- **Çözüm**: `newAccountDetector.js` içindeki kriterleri gözden geçirin

## 📝 Notlar

- Sistem sadece **24 saat içinde** oluşturulan hesapları kontrol eder
- Bot'un DM izni olmalıdır
- Moderatör rollerinin doğru ayarlandığından emin olun
- Log kanalının erişilebilir olduğunu kontrol edin

## 👨‍💻 Geliştirici: Kiro AI Assistant
Tarih: 2026-08-03
