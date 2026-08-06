'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const StaffUnit = require('../../models/StaffUnit');
const StaffProgress = require('../../models/StaffProgress');

// Birim Konfigürasyonları ve Görev Ağaçları
const UNIT_QUESTS = {
  BAN_BIRIMI: {
    label: 'BAN BİRİMİ',
    emoji: '🛡️',
    color: 0xE74C3C,
    dailyQuests: [
      { id: 'ban_q1', title: '🛡️ Güvenlik Nöbeti', desc: 'Bugün en az 1 moderasyon eylemi gerçekleştir veya log incele.', xp: 50, coins: 200 },
      { id: 'ban_q2', title: '🎫 Bilet Desteği', desc: 'Bilet kanallarında 2 aktif bilet incele veya çözüme kavuştur.', xp: 75, coins: 350 },
      { id: 'ban_q3', title: '⚖️ Mahkeme Denetimi', desc: 'Bir adli soruşturma veya dava kaydını kontrol et.', xp: 100, coins: 500 }
    ]
  },
  SES_BIRIMI: {
    label: 'SES BİRİMİ',
    emoji: '🎤',
    color: 0x3498DB,
    dailyQuests: [
      { id: 'ses_q1', title: '🎤 Sesli Devriye', desc: 'Sesli kanallarda en az 30 dakika aktif bulun.', xp: 50, coins: 200 },
      { id: 'ses_q2', title: '🔊 Oda Düzeni', desc: 'Ses odalarında kural ihlallerini ve mikrofon spamlarını denetle.', xp: 75, coins: 350 },
      { id: 'ses_q3', title: '🎧 Etkinlik Rehberliği', desc: 'Sesli bir oda etkinliğine katılım sağla.', xp: 100, coins: 500 }
    ]
  },
  SOHBET_BIRIMI: {
    label: 'SOHBET BİRİMİ',
    emoji: '💬',
    color: 0x2ECC71,
    dailyQuests: [
      { id: 'sohbet_q1', title: '💬 Muhabbet Kıvılcımı', desc: 'Yazılı sohbette en az 20 mesaj göndererek aktifliği canlı tut.', xp: 50, coins: 200 },
      { id: 'sohbet_q2', title: '👋 Yeni Üye Karşılama', desc: 'Sunucuya yeni katılan 3 üyeyi karşıla ve kuralları hatırlat.', xp: 75, coins: 350 },
      { id: 'sohbet_q3', title: '🌟 Sohbet Etkinliği', desc: 'Sohbette ilgi çekici bir tartışma veya soru konusu başlat.', xp: 100, coins: 500 }
    ]
  }
};

/**
 * Kullanıcının birim görev ağacını ve kasasını görüntüler
 */
async function showUnitQuestPanel(interaction) {
  await interaction.deferReply({ ephemeral: true }).catch(() => {});
  try {
    const userId = interaction.user.id;
    const staffUnit = await StaffUnit.findOne({ userId });

    if (!staffUnit || !staffUnit.unitName) {
      return interaction.editReply({
        content: '❌ **Aktif bir birim üyesi değilsiniz!** Görevlere erişmek için öncelikle `/birim-alimi` ile bir birime başvurmalısınız.'
      });
    }

    const unitKey = staffUnit.unitName;
    const questData = UNIT_QUESTS[unitKey] || UNIT_QUESTS.SOHBET_BIRIMI;
    const unitXP = staffUnit.unitXP || 0;
    const unitLevel = staffUnit.unitLevel || 1;
    const unitVault = staffUnit.vaultCoins || 0;

    const embed = new EmbedBuilder()
      .setColor(questData.color)
      .setTitle(`${questData.emoji} ${questData.label} | Günlük Görev Ağacı & Birim Kasası`)
      .setDescription(
        `Hoş geldin <@${userId}>! Birimindeki aktifliğinle XP kazanabilir ve birim kasasını büyütebilirsin.\n\n` +
        `📊 **Birim Seviyesi:** Level ${unitLevel} (${unitXP} XP)\n` +
        `💰 **Birim Ortak Kasası:** \`${unitVault.toLocaleString('tr-TR')} Coin\`\n` +
        `🎖️ **Birim Rütbeniz:** Rütbe ${staffUnit.rank || 1}\n\n` +
        `📋 **BUGÜNKÜ BİRİM GÖREVLERİNİZ:**`
      );

    const completedQuests = staffUnit.completedDailyQuests || [];

    questData.dailyQuests.forEach((q, idx) => {
      const isDone = completedQuests.includes(q.id);
      const statusText = isDone ? '✅ **Tamamlandı**' : '⏳ **Bekliyor**';
      embed.addFields({
        name: `${idx + 1}. ${q.title} (${statusText})`,
        value: `${q.desc}\n🎁 Ödül: **+${q.xp} XP** | **+${q.coins} Coin**`,
        inline: false
      });
    });

    embed.setFooter({ text: 'EkoYıldız Birim & Görev Sistemi V2.0' }).setTimestamp();

    const buttons = [
      new ButtonBuilder()
        .setCustomId('unit_quest_claim_all')
        .setLabel('🎁 Görev Ödüllerini Topla')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('unit_vault_deposit_modal')
        .setLabel('💰 Kasaya Coin Bağışla')
        .setStyle(ButtonStyle.Primary)
    ];

    if (staffUnit.rank >= 3) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId('unit_vault_upgrade')
          .setLabel('⚡ Birim Seviyesini Yükselt (Kasadan)')
          .setStyle(ButtonStyle.Danger)
      );
    }

    const row = new ActionRowBuilder().addComponents(buttons);

    return interaction.editReply({ embeds: [embed], components: [row] });
  } catch (err) {
    console.error('[unitQuestService] showUnitQuestPanel hatası:', err.message);
    return interaction.editReply({ content: `❌ Görev paneli yüklenirken hata oluştu: ${err.message}` });
  }
}

/**
 * Görev ödüllerini toplayıp birim XP'sini ve kasasını günceller
 */
async function claimUnitQuestRewards(interaction) {
  await interaction.deferReply({ ephemeral: true }).catch(() => {});
  try {
    const userId = interaction.user.id;
    const staffUnit = await StaffUnit.findOne({ userId });

    if (!staffUnit || !staffUnit.unitName) {
      return interaction.editReply({ content: '❌ Aktif birim üyesi bulunamadı.' });
    }

    const questData = UNIT_QUESTS[staffUnit.unitName] || UNIT_QUESTS.SOHBET_BIRIMI;
    const completedQuests = staffUnit.completedDailyQuests || [];

    let gainedXP = 0;
    let gainedCoins = 0;
    const newCompleted = [...completedQuests];

    questData.dailyQuests.forEach((q) => {
      if (!completedQuests.includes(q.id)) {
        gainedXP += q.xp;
        gainedCoins += q.coins;
        newCompleted.push(q.id);
      }
    });

    if (gainedXP === 0) {
      return interaction.editReply({ content: 'ℹ️ Bugünkü tüm birim görev ödüllerinizi zaten topladınız! Yarın tekrar bekleriz.' });
    }

    staffUnit.completedDailyQuests = newCompleted;
    staffUnit.unitXP = (staffUnit.unitXP || 0) + gainedXP;
    staffUnit.vaultCoins = (staffUnit.vaultCoins || 0) + Math.floor(gainedCoins / 2); // Yarısı birim kasasına
    await staffUnit.save();

    // Kullanıcının kendi coin bakiyesine de ödül yansıt
    const staffProgress = await StaffProgress.findOne({ userId });
    if (staffProgress) {
      staffProgress.coin = (staffProgress.coin || 0) + Math.floor(gainedCoins / 2);
      await staffProgress.save();
    }

    const embed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle('🎉 Birim Görev Ödülleri Alındı!')
      .setDescription(
        `Tebrikler <@${userId}>!\n\n` +
        `⭐ **Kazanılan XP:** +${gainedXP} Birim XP\n` +
        `💰 **Kişisel Coin:** +${Math.floor(gainedCoins / 2)} Coin\n` +
        `🏦 **Birim Ortak Kasası:** +${Math.floor(gainedCoins / 2)} Coin Aktarıldı!\n\n` +
        `Birliğinize katkılarınızdan dolayı teşekkür ederiz! 🚀`
      )
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error('[unitQuestService] claimUnitQuestRewards hatası:', err.message);
    return interaction.editReply({ content: `❌ Ödül toplanırken hata: ${err.message}` });
  }
}

module.exports = {
  UNIT_QUESTS,
  showUnitQuestPanel,
  claimUnitQuestRewards
};
