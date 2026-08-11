'use strict';

/**
 * Event Staff Onboarding Service
 * Etkinlik Sorumlusu mülakat başarılı olduktan sonra oryantasyon ve rol verme
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Etkinlik Sorumlusuna tebrik mesajı gönder ve oryantasyon başlat
 * @param {string} userId - Discord kullanıcı ID
 * @param {Object} client - Discord.js client
 * @returns {Promise<boolean>} Başarı durumu
 */
async function startEventStaffOnboarding(userId, client) {
  try {
    if (!client || !client.users) return false;

    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) {
      console.error('[EventStaffOnboarding] Kullanıcı bulunamadı:', userId);
      return false;
    }

    // 1. TEBRİK MESAJINI GÖNDER
    const congratsEmbed = new EmbedBuilder()
      .setColor(0x34D399)
      .setTitle('🎉 TEBRİKLER! ETKİNLİK SORUMLUSU OLMAYA HAK KAZANDIN!')
      .setDescription(
        `Merhaba **${user.username}**,\n\n` +
        `Etkinlik Sorumluluğu Başvuruların başarıyla değerlendirilmiş ve **ONAYLANMIŞSIN**! 🏆\n\n` +
        `Bu başarıdan dolayı seni tebrik ediyor, EkoYıldız ailesi olarak seni aramızda görmekten mutlu oluyoruz.`
      )
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .setFooter({ text: 'EkoYıldız Etkinlik Organizasyonu • Kurumsal Yönetim' })
      .setTimestamp();

    const onboardingEmbed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('📚 Etkinlik Sorumlusu Oryantasyonu Başlıyor')
      .setDescription(
        `Aşağıdaki butonları kullanarak **adım adım oryantasyonumuzu** tamamlayabilirsin.\n\n` +
        `Her bölüm seni **görev ve sorumlulukların** hakkında detaylı bilgilendirecek.\n\n` +
        `**Oryantasyon Bölümleri:**\n` +
        `1️⃣ Talimatname & Sunucu Kuralları\n` +
        `2️⃣ Etkinlik Yönetimi Temel İlkeleri\n` +
        `3️⃣ Teknik Aksaklık Yönetimi\n` +
        `4️⃣ Görevlerin Özeti & Beklentiler\n` +
        `5️⃣ Rol Atanması & Tamamlama`
      )
      .setFooter({ text: 'Saygıyla, EkoYıldız Yönetim Ekibi' })
      .setTimestamp();

    const onboardingButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`event_onboard_step_1_${userId}`)
        .setLabel('1️⃣ Kurallar & Talimatname')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`event_onboard_step_2_${userId}`)
        .setLabel('2️⃣ Etkinlik Yönetimi')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`event_onboard_step_3_${userId}`)
        .setLabel('3️⃣ Kriz Yönetimi')
        .setStyle(ButtonStyle.Primary)
    );

    const moreButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`event_onboard_step_4_${userId}`)
        .setLabel('4️⃣ Görevler & Beklentiler')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`event_onboard_complete_${userId}`)
        .setLabel('✅ Oryantasyonu Tamamla')
        .setStyle(ButtonStyle.Success)
    );

    // DM'ye mesajları gönder
    await user.send({ embeds: [congratsEmbed, onboardingEmbed], components: [onboardingButtons, moreButtons] });

    console.log(`[EventStaffOnboarding] Oryantasyon başlatıldı: ${userId}`);
    return true;
  } catch (err) {
    console.error('[EventStaffOnboarding] Hata:', err.message);
    return false;
  }
}

/**
 * Etkinlik Sorumlusunun rol atanması ve oryantasyon tamamlanması
 * @param {string} userId - Discord kullanıcı ID
 * @param {Object} client - Discord.js client
 * @returns {Promise<boolean>} Başarı durumu
 */
async function completeEventStaffOnboarding(userId, client) {
  try {
    if (!client || !client.guilds) return false;

    const guildId = process.env.STAFF_GUILD_ID || '1367646464804655104';
    const roleId = '1536443812950315038'; // Etkinlik Sorumlusu Rolü

    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) {
      console.error('[EventStaffOnboarding] Guild bulunamadı:', guildId);
      return false;
    }

    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) {
      console.error('[EventStaffOnboarding] Üye bulunamadı:', userId);
      return false;
    }

    // Rolü ver
    await member.roles.add(roleId, 'Etkinlik Sorumlusu Oryantasyonu Tamamlandı').catch((err) => {
      console.error('[EventStaffOnboarding] Rol verme hatası:', err.message);
    });

    // Tamamlama mesajı gönder
    const user = await client.users.fetch(userId).catch(() => null);
    if (user) {
      const completionEmbed = new EmbedBuilder()
        .setColor(0x34D399)
        .setTitle('✅ Oryantasyon Tamamlandı!')
        .setDescription(
          `Tebrikler **${user.username}**!\n\n` +
          `Etkinlik Sorumlusu oryantasyonunu başarıyla tamamladın. 🎓\n\n` +
          `**Sana verilen yetkiler:**\n` +
          `✅ Etkinlik düzenleme ve yönetme\n` +
          `✅ Katılımcı duyuruları yapma\n` +
          `✅ Etkinlik kanallarını kullanma\n` +
          `✅ Moderasyon ekibi ile işbirliği\n\n` +
          `**Görevlerine başlarken:**\n` +
          `1. EkoYıldız Kurumsal Yönetim Talimatnamesi'ni gözden geçir\n` +
          `2. Etkinlik duyuru kanalını takip et\n` +
          `3. Herhangi bir soru için yönetim ekibine ulaş\n\n` +
          `Good luck! 🚀`
        )
        .setFooter({ text: 'EkoYıldız Etkinlik Organizasyonu' })
        .setTimestamp();

      await user.send({ embeds: [completionEmbed] });
    }

    console.log(`[EventStaffOnboarding] Tamamlandı ve rol verildi: ${userId}`);
    return true;
  } catch (err) {
    console.error('[EventStaffOnboarding] Tamamlama hatası:', err.message);
    return false;
  }
}

/**
 * Oryantasyon adımlarının içeriklerini döndür
 * @param {number} stepNumber - Adım numarası (1-4)
 * @returns {Object} Embed ve butonlar
 */
function getOnboardingStepContent(stepNumber) {
  const steps = {
    1: {
      embed: new EmbedBuilder()
        .setColor(0x818CF8)
        .setTitle('📋 Bölüm 1: Talimatname & Kurallar')
        .setDescription(
          `**EkoYıldız Kurumsal Yönetim Talimatnamesi'ni incelemelisin:**\n\n` +
          `[🔗 Talimatname Kanalı](https://discord.com/channels/1367646464804655104/1536444172838506576)\n\n` +
          `Bu kanalda şunları bulabilirsin:\n` +
          `• Etkinlik Organizasyonu Protokolü\n` +
          `• İçerik Kürasyonu Standartları\n` +
          `• Haber Yayıncılığı Yöntemi\n` +
          `• Topluluk Yönetimi İlkeleri\n` +
          `• Moderasyon Davranış Kodu\n\n` +
          `**Lütfen talimatnameyi detaylıca oku ve denetimlemeyi tamamla.**`
        )
        .setFooter({ text: 'Adım 1/4' })
        .setTimestamp(),
      action: 'read_guidelines'
    },
    2: {
      embed: new EmbedBuilder()
        .setColor(0x34D399)
        .setTitle('🎪 Bölüm 2: Etkinlik Yönetimi Temel İlkeleri')
        .setDescription(
          `**Etkinlik Organizasyonu İçin Temel Adımlar:**\n\n` +
          `**1. İçerik Seçimi** — Topluluk için uygun oyunlar/aktiviteler belirle\n` +
          `📌 Roblox, Steam, Web tabanlı seçenekler\n\n` +
          `**2. Duyuru Yapma** — Profesyonel şablonla etkinlik duyur\n` +
          `📌 [OYUN ADI], [Kurallar], [Saat], [Konum]\n\n` +
          `**3. Katılım Takibi** — Emoji tike basanları say\n` +
          `📌 3+ katılımcı = Etkinlik gerçekleştir\n` +
          `📌 <3 katılımcı = Protokolle iptal et\n\n` +
          `**4. Operasyon** — Etkinlik saatında yönet\n` +
          `📌 30 dakika öncesinden hazırlıkları yap\n` +
          `📌 Sorunları ve troll saldırılarını yönet\n\n` +
          `**5. Sonlandırma** — Katılımcılara teşekkür et`
        )
        .setFooter({ text: 'Adım 2/4' })
        .setTimestamp(),
      action: 'event_management'
    },
    3: {
      embed: new EmbedBuilder()
        .setColor(0xF59E0B)
        .setTitle('⚠️ Bölüm 3: Kriz ve Sorun Yönetimi')
        .setDescription(
          `**Beklenmedik Durumlar ve Çözümleri:**\n\n` +
          `**Teknik Aksaklıklar:**\n` +
          `🔴 Ses kesintisi → Yedek kanal açı, üyeleri bilgilendir\n` +
          `🔴 Yayın sorunu → Alternatif platform kullan\n\n` +
          `**Uygunsuz Davranış:**\n` +
          `🚫 Spam/Troll → Sözlü uyarı yap\n` +
          `🚫 Tekrarlayan → Kanalı geçici kitle, moderatöre haber ver\n\n` +
          `**Düşük Katılım:**\n` +
          `📉 Nedenleri analiz et ve yönetimi bilgilendir\n` +
          `📉 Sonraki etkinliklerde iyileştirmeler yap\n\n` +
          `**Önemli:** Sakin kalmayı ve profesyonel iletişimi koru.`
        )
        .setFooter({ text: 'Adım 3/4' })
        .setTimestamp(),
      action: 'crisis_management'
    },
    4: {
      embed: new EmbedBuilder()
        .setColor(0xEC4899)
        .setTitle('🎯 Bölüm 4: Görevler & Beklentiler')
        .setDescription(
          `**Etkinlik Sorumlusunun Ana Görevleri:**\n\n` +
          `**Haftalık Sorumluluğunuz:**\n` +
          `📅 En az 1 etkinlik düzenle\n` +
          `📋 Duyuru metinlerini profesyonel yaz\n` +
          `📊 Katılım ve geri dönüşleri kaydet\n\n` +
          `**Aylık Beklentiler:**\n` +
          `📈 Etkinlik kalitesini sürekli iyileştir\n` +
          `📢 Haber ve duyurular kanalında bilgi paylaş\n` +
          `🎓 Yönetim ekibi toplantılarına katıl\n\n` +
          `**Performans Değerlendirmesi:**\n` +
          `✅ Aylık değerlendirmeler yapılacak\n` +
          `✅ Olumlu geri dönüş = Ödüller ve terfi\n` +
          `✅ İhmal = Uyarı ve görev gözden geçirme\n\n` +
          `Başarılarınız sunucunun geleceğini şekillendiriyor! 💪`
        )
        .setFooter({ text: 'Adım 4/4' })
        .setTimestamp(),
      action: 'tasks_expectations'
    }
  };

  return steps[stepNumber] || steps[1];
}

module.exports = {
  startEventStaffOnboarding,
  completeEventStaffOnboarding,
  getOnboardingStepContent
};
