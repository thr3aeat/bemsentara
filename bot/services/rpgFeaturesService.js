'use strict';

/**
 * V7.0 RPG Features - Sonsuz Sezon & Yeni Sistem
 * 
 * 1. Prestij (Rebirth) - Seviye 6'da sıfırla, [P-1] bonusu al
 * 2. Karakter Sınıfları - Muhafız/Rehber/Çözücü seç, x2 bonus
 * 3. Lonca Savaşları - Klan kur, haftalık lig
 * 4. Sanal Şehir & Emlak - Pasif gelir
 * 5. $EKO Index Borsası - Yatırım sistemi
 * 6. AI Mahkemesi - İtiraz jürisi
 * 7. Takdir & Bahşiş - Ekip ödülleri
 */

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');

const StaffProgress = require('../../models/StaffProgress');

/**
 * Generate Prestige/Rebirth Info Embed
 */
function getPrestigeEmbed(progress) {
  const currentLevel = progress.level || 1;
  const prestigeLevel = progress.gamification?.prestigeLevel || 0;
  const prestigeBonus = (prestigeLevel * 10);

  const embed = new EmbedBuilder()
    .setTitle('👑 Prestij Sistemi (Rebirth)')
    .setColor(0x9b59b6)
    .setDescription(
      `**Sonsuz Sezon'da ilerlemek için prestij yap!**\n\n` +
      `Seviye 6'ya ulaştığında Prestij yapabilirsin.\n` +
      `Her Prestij sıfırlanacak ama [P-${prestigeLevel + 1}] unvanını alacaksın.\n\n` +
      `**Mevcut Durum:**\n` +
      `• Rütbe: ${currentLevel}/6\n` +
      `• Prestij Seviyesi: [P-${prestigeLevel}]\n` +
      `• Prestij Bonusu: +%${prestigeBonus}`
    )
    .addFields(
      {
        name: '✨ Prestij Faydaları',
        value: '+%10 Bonus Çarpan • Kalıcı Seviye Göstergesi • Özel Unvan',
        inline: false,
      },
      {
        name: '🎯 Şart',
        value: currentLevel === 6 ? '✅ Prestij yapmaya hazırsın!' : `Seviye ${currentLevel}/6 - ${6 - currentLevel} seviye kaldı`,
        inline: false,
      }
    )
    .setFooter({ text: 'V7.0 Sonsuz Sezon • Prestij Sistemi' })
    .setTimestamp();

  return embed;
}

/**
 * Generate Character Class Selection Embed
 */
function getCharacterClassEmbed(progress) {
  const selectedClass = progress.gamification?.characterClass || 'Seçilmedi';
  const classBonus = selectedClass !== 'Seçilmedi' ? '✅ x2 Puan Çarpanı Aktif' : '⏳ Sınıf seç, x2 bonus kazan';

  const embed = new EmbedBuilder()
    .setTitle('🎭 Karakter Sınıfları')
    .setColor(0x3498db)
    .setDescription(
      `**Üç sınıftan birini seç ve uzmanlık alanında x2 puan kazan!**\n\n` +
      `**Mevcut Seçim:** ${selectedClass}\n\n` +
      classBonus
    )
    .addFields(
      {
        name: '🛡️ Muhafız',
        value: 'Moderasyon işlemleri 2x puan • Ban/Kick/Warn',
        inline: true,
      },
      {
        name: '📖 Rehber',
        value: 'Yardım mesajları 2x puan • Hoş geldin/Rehberlik',
        inline: true,
      },
      {
        name: '🎫 Çözücü',
        value: 'Ticket çözümü 2x puan • Destek işlemleri',
        inline: true,
      }
    )
    .setFooter({ text: 'V7.0 Karakter Sınıfları • Uzmanlık Bonusu' })
    .setTimestamp();

  return embed;
}

/**
 * Generate Guild Wars Info Embed
 */
function getGuildWarsEmbed() {
  const embed = new EmbedBuilder()
    .setTitle('🏛️ Lonca Savaşları & Klanlar')
    .setColor(0xf1c40f)
    .setDescription(
      `**3-5 kişilik ekibinle lonca kur ve haftalık ligde "Şehrin Hakimi" ol!**\n\n` +
      `Loncaların haftalık puanı toplanır ve en yüksek puana sahip lonca\n` +
      `**"Şehrin Hakimi"** unvanı ile böbürlenebilir!\n\n` +
      `**Lonca Seviyeleri:**\n` +
      `Seviye 1-10 → Unvan ve prestij kazanma\n` +
      `Seviye 10+ → Ekstra Elmas ve kazan\n\n` +
      `**Haftalık Ödüller:**\n` +
      `🥇 1. Lonca: +500 EkoCoin + 100 Elmas\n` +
      `🥈 2. Lonca: +300 EkoCoin + 50 Elmas\n` +
      `🥉 3. Lonca: +150 EkoCoin + 25 Elmas`
    )
    .setFooter({ text: 'V7.0 Lonca Savaşları • Ekip Ligi' })
    .setTimestamp();

  return embed;
}

/**
 * Generate Real Estate Info Embed
 */
function getRealEstateEmbed() {
  const embed = new EmbedBuilder()
    .setTitle('🏙️ Sanal Şehir & Emlak')
    .setColor(0x2ecc71)
    .setDescription(
      `**Sanal mülk satın alarak pasif gelir elde et!**\n\n` +
      `Emlak yatırımları gün içinde otomatik gelir getirir.\n` +
      `Ne kadar çok mülk, o kadar çok pasif gelir!\n\n` +
      `**Mülkler:**\n\n` +
      `☕ **Kahve Dükkanı** - 500 TL\n` +
      `   Günlük gelir: +10 TL\n\n` +
      `🏢 **Tactic Ofis** - 2,000 TL\n` +
      `   Günlük gelir: +50 TL\n\n` +
      `🏙️ **Penthouse** - 10,000 TL\n` +
      `   Günlük gelir: +200 TL\n\n` +
      `🏛️ **Holding** - 50,000 TL\n` +
      `   Günlük gelir: +500 TL`
    )
    .setFooter({ text: 'V7.0 Sanal Emlak • Pasif Gelir Sistemi' })
    .setTimestamp();

  return embed;
}

/**
 * Generate Stock Market Info Embed
 */
function getStockMarketEmbed() {
  const embed = new EmbedBuilder()
    .setTitle('📈 $EKO Index Borsası')
    .setColor(0xe74c3c)
    .setDescription(
      `**EkoCoin bakiyeni borsada yatırıma dönüştürüp katla!**\n\n` +
      `Haftalık piyasa trendine göre hisse fiyatları değişir.\n` +
      `Doğru zamanında satıp kazanç elde et!\n\n` +
      `**Borsanın Durumu:**\n` +
      `📊 Seçim menüsünde güncel grafikleri görebilirsin\n\n` +
      `**Hisse Türleri:**\n` +
      `🟢 EKO Hisseleri - İstikrarlı ve güvenilir\n` +
      `🔵 STAFF Hisseleri - Yüksek risk, yüksek getiri\n` +
      `🟠 TICKET Hisseleri - Orta seviye volatilite\n` +
      `🔴 MOD Hisseleri - Spekülatif ve riskli`
    )
    .setFooter({ text: 'V7.0 Borsa • Yatırım Sistemi' })
    .setTimestamp();

  return embed;
}

/**
 * Generate AI Court Info Embed
 */
function getAICourtEmbed() {
  const embed = new EmbedBuilder()
    .setTitle('⚖️ Yapay Zeka Mahkemesi')
    .setColor(0x9b59b6)
    .setDescription(
      `**İtiraz davalarında jüri ol ve Adalet Elçisi ödüllerini topla!**\n\n` +
      `Sunucuda yaşanan ceza itirazlarında jüri üyesi olabilirsin.\n` +
      `Senin oyun diğer jürileri etkileyecek ve toplu karar verilecek.\n\n` +
      `**Ödüller:**\n` +
      `Per Oy: +5 EkoCoin + +1 Adalet Puanı\n` +
      `Haftalık Bonus: 10+ oy yapan → +50 EkoCoin\n` +
      `Aylık Bonus: 50+ oy yapan → Adalet Elçisi Unvanı\n\n` +
      `**Kurallar:**\n` +
      `• Her itiraz davasında 1 oy hakkın var\n` +
      `• Kabul / Reddet / Erteleme seçenekleri\n` +
      `• Tarafsız kararlar verilmeli`
    )
    .setFooter({ text: 'V7.0 AI Mahkemesi • Jüri Sistemi' })
    .setTimestamp();

  return embed;
}

/**
 * Generate Appreciation & Tip Info Embed
 */
function getAppreciationEmbed() {
  const embed = new EmbedBuilder()
    .setTitle('💝 Takdir & Bahşiş Sistemi')
    .setColor(0xff69b4)
    .setDescription(
      `**Ekip arkadaşlarına Elmas, EkoCoin veya Takdir Kartı gönder!**\n\n` +
      `Günlük sınırı: 5 bahşiş\n` +
      `Aylık sınırı: 100 bahşiş\n\n` +
      `**Bahşiş Seçenekleri:**\n\n` +
      `💎 **Elmas** - 1 Elmas = 100 EkoCoin değeri\n` +
      `Arkadaşları bazen sevindir!\n\n` +
      `💰 **EkoCoin** - 10 - 1000 EkoCoin arası\n` +
      `Değişken miktarda bahşiş ver!\n\n` +
      `🎖️ **Takdir Kartı** - Günlük bonus\n` +
      `Alıcıya +50% puan bonusu (24 saat)`
    )
    .addFields(
      {
        name: '🏆 Takdir Kartı Faydaları',
        value: 'Tüm işlerde +50% puan bonusu',
        inline: true,
      },
      {
        name: '🎁 Aylık Limit',
        value: '100 bahşiş = Sınırsız Bahşiş Günü',
        inline: true,
      }
    )
    .setFooter({ text: 'V7.0 Takdir Sistemi • Ekip Ödülleri' })
    .setTimestamp();

  return embed;
}

/**
 * Get all V7.0 features as menu options
 */
function getV7FeaturesMenu() {
  return new StringSelectMenuBuilder()
    .setCustomId('select_v7_feature')
    .setPlaceholder('V7.0 Yeni Özelliği seç...')
    .addOptions([
      new StringSelectMenuOptionBuilder()
        .setLabel('👑 Prestij Sistemi')
        .setValue('feature_prestige')
        .setDescription('Seviye 6\'da prestij yap, kalıcı bonuslar kazan')
        .setEmoji('👑'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🎭 Karakter Sınıfları')
        .setValue('feature_classes')
        .setDescription('Muhafız/Rehber/Çözücü seç, uzmanlık bonusu')
        .setEmoji('🎭'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🏛️ Lonca Savaşları')
        .setValue('feature_guilds')
        .setDescription('Klan kur, haftalık ligde "Şehrin Hakimi" ol')
        .setEmoji('🏛️'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🏙️ Sanal Emlak')
        .setValue('feature_realestate')
        .setDescription('Pasif gelir elde eden mülk yatırımları')
        .setEmoji('🏙️'),
      new StringSelectMenuOptionBuilder()
        .setLabel('📈 Borsa')
        .setValue('feature_stocks')
        .setDescription('$EKO Index\'te yatırım yap ve kazanç sağla')
        .setEmoji('📈'),
      new StringSelectMenuOptionBuilder()
        .setLabel('⚖️ AI Mahkemesi')
        .setValue('feature_court')
        .setDescription('İtiraz davalarında jüri ol, ödül kazan')
        .setEmoji('⚖️'),
      new StringSelectMenuOptionBuilder()
        .setLabel('💝 Takdir & Bahşiş')
        .setValue('feature_appreciation')
        .setDescription('Ekip arkadaşlarına ödül gönder')
        .setEmoji('💝'),
    ]);
}

/**
 * Get V7.0 features info row (for dashboard tips)
 */
function getV7FeaturesRow() {
  return new ActionRowBuilder().addComponents(getV7FeaturesMenu());
}

/**
 * Claim V7.0 Version Upgrade Reward
 */
async function claimV7VersionReward(userId, client) {
  try {
    const progress = await StaffProgress.findOne({ userId });
    if (!progress) {
      return { success: false, message: 'Personel kaydı bulunamadı.' };
    }

    if (progress.gamification?.versionRewardClaimedV7) {
      return {
        success: false,
        message: '❌ V7.0 Sürüm Yükseltme Ödülünü zaten aldınız!',
      };
    }

    // Grant reward
    progress.gamification = progress.gamification || {};
    progress.gamification.versionRewardClaimedV7 = true;
    progress.gamification.ecoCoins = (progress.gamification.ecoCoins || 0) + 500;
    progress.gamification.diamonds = (progress.gamification.diamonds || 0) + 200;
    progress.leaves = progress.leaves || {};
    progress.leaves.totalCredits = (progress.leaves.totalCredits || 0) + 1;

    await progress.save();

    // Send DM notification
    const user = await client.users.fetch(userId).catch(() => null);
    if (user) {
      const rewardEmbed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle('🎉 V7.0 Sürüm Yükseltme Ödülü!')
        .setDescription(
          `**Sonsuz Sezon**'a hoş geldiniz! 🎊\n\n` +
          `Yeni sistemin başlamasını kutlamak için:\n\n` +
          `✨ +500 EkoCoin\n` +
          `💎 +200 Elmas\n` +
          `📅 +1 İzin Kredisi\n\n` +
          `Bu ödül tek seferlik olup, moderatör panelinden talep edilmiştir.`
        )
        .setFooter({ text: 'V7.0 Sonsuz Etkileşim Döngüsü' })
        .setTimestamp();

      await user.send({ embeds: [rewardEmbed] }).catch(() => {});
    }

    return {
      success: true,
      message: '🎉 **V7.0 Ödülü Başarıyla Alındı!** +500 EkoCoin, +200 Elmas, +1 İzin Kredisi',
    };
  } catch (err) {
    console.error('[rpgFeaturesService] claimV7VersionReward error:', err.message);
    return { success: false, message: `Hata: ${err.message}` };
  }
}

module.exports = {
  getPrestigeEmbed,
  getCharacterClassEmbed,
  getGuildWarsEmbed,
  getRealEstateEmbed,
  getStockMarketEmbed,
  getAICourtEmbed,
  getAppreciationEmbed,
  getV7FeaturesMenu,
  getV7FeaturesRow,
  claimV7VersionReward,
};
