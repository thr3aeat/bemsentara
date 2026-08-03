'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const StaffProgress = require('../../models/StaffProgress');
const StaffGuild = require('../../models/StaffGuild');
const rpgService = require('../services/rpgService');
const realEstateService = require('../services/realEstateService');
const dynamicEventManager = require('../services/dynamicEventManager');

/**
 * Handle RPG & Endless Engagement Commands
 */
async function handleRpgCommands(interaction) {
  const { commandName, options, user } = interaction;

  if (commandName === 'prestij') {
    const result = await rpgService.handlePrestigeRebirth(user.id, interaction.client);
    if (!result.success) {
      return interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
    }
    return interaction.reply({
      content: `🎉 **PRESTİJ BAŞARILI!** Prestij seviyeniz **[P-${result.prestigeLevel}]** seviyesine yükseltildi!`,
      ephemeral: true
    });
  }

  if (commandName === 'sinif') {
    const chosenClass = options.getString('sınıf');
    if (!chosenClass) {
      // Sınıf listesini göster
      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('🎭 KARAKTER SINIFINIZI SEÇİN')
        .setDescription(
          `Kendinize uygun oyun stilini seçerek ilgili görev kategorisinde **x2 Puan Çarpanı** kazanabilirsiniz!\n\n` +
          `🛡️ **Muhafız (Moderatör Sınıfı):** Moderasyon ve kural ihlallerinde x2 Puan.\n` +
          `🎧 **Rehber (Ses & Sohbet Sınıfı):** Ses süresi ve mesajlarda x2 Puan.\n` +
          `🎫 **Çözücü (Ticket Sınıfı):** Ticket kapatmada x2 Puan.\n\n` +
          `*Not: Sınıf değişimi 30 günde bir yapılabilir.*`
        )
        .setFooter({ text: 'Eko Yıldız • Karakter Sınıfları' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('rpg_select_guardian').setLabel('🛡️ Muhafız Ol').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('rpg_select_guide').setLabel('🎧 Rehber Ol').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('rpg_select_solver').setLabel('🎫 Çözücü Ol').setStyle(ButtonStyle.Danger)
      );

      return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    const res = await rpgService.setUserClass(user.id, chosenClass);
    if (!res.success) return interaction.reply({ content: `❌ ${res.message}`, ephemeral: true });
    return interaction.reply({ content: `✅ Karakter sınıfınız **${res.className}** olarak güncellendi!`, ephemeral: true });
  }

  if (commandName === 'lonca') {
    const sub = options.getSubcommand ? options.getSubcommand() : 'bilgi';

    if (sub === 'olustur') {
      const name = options.getString('isim');
      const tag = options.getString('tag') || 'KLN';

      const existing = await StaffGuild.findOne({ $or: [{ leaderId: user.id }, { members: user.id }] });
      if (existing) return interaction.reply({ content: '❌ Zaten bir loncaya üyesiniz veya liderisiniz!', ephemeral: true });

      const newGuild = new StaffGuild({
        guildName: name,
        tag: tag.toUpperCase(),
        leaderId: user.id,
        members: [user.id]
      });
      await newGuild.save();

      return interaction.reply({ content: `🏛️ **${name} [${tag.toUpperCase()}]** loncası başarıyla kuruldu!`, ephemeral: true });
    }

    if (sub === 'liste' || sub === 'siralama') {
      const guilds = await StaffGuild.find({}).sort({ weeklyPoints: -1, treasury: -1 }).limit(10);
      let desc = guilds.length > 0
        ? guilds.map((g, i) => `${i + 1}. **[${g.tag}] ${g.guildName}** — 🏆 ${g.weeklyPoints} Puan | 💰 ${g.treasury} E.C. ${g.isCityRuler ? '👑 (Şehrin Hakimi)' : ''}`).join('\n')
        : 'Henüz kurulmuş bir lonca yok.';

      const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle('🏛️ HAFTALIK LONCA LİGİ & KLNA SIRALAMASI')
        .setDescription(desc)
        .setFooter({ text: 'Eko Yıldız • Lonca Savaşları' });

      return interaction.reply({ embeds: [embed] });
    }
  }

  if (commandName === 'bahsis' || commandName === 'takdir') {
    const targetUser = options.getUser('personel');
    const amount = options.getInteger('miktar') || 25;
    const type = options.getString('tur') || 'coins';

    if (!targetUser) return interaction.reply({ content: `❌ Lütfen bahşiş göndereceğiniz personeli etiketleyin.`, ephemeral: true });

    const res = await rpgService.tipPeer(user.id, targetUser.id, amount, type, interaction.client);
    if (!res.success) return interaction.reply({ content: `❌ ${res.message}`, ephemeral: true });

    return interaction.reply({ content: `💖 ${res.message}`, ephemeral: true });
  }

  if (commandName === 'emlak') {
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('🏙️ SANAL ŞEHİR EMLAK MAĞAZASI')
      .setDescription(
        `Kazandığınız EkoCoin'ler ile gayrimenkul satın alarak saatlik pasif gelir elde edebilirsiniz!\n\n` +
        `☕ **Moderatör Kahve Dükkanı:** 300 E.C. (Saatlik +10 E.C.)\n` +
        `💼 **Taktik Operasyon Ofisi:** 800 E.C. (Saatlik +30 E.C.)\n` +
        `🏙️ **Şehir Manzaralı Penthouse:** 2000 E.C. (Saatlik +85 E.C.)\n` +
        `🏛️ **Eko Yıldız Sanal Holding:** 5000 E.C. (Saatlik +250 E.C.)`
      )
      .setFooter({ text: 'Eko Yıldız • Pasif Gelir Ekosistemi' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('buy_prop_coffee_shop').setLabel('☕ Kahve Dükkanı Al (300 E.C.)').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('buy_prop_tactic_office').setLabel('💼 Taktik Ofis Al (800 E.C.)').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('buy_prop_penthouse').setLabel('🏙️ Penthouse Al (2000 E.C.)').setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  if (commandName === 'borsa') {
    const market = realEstateService.getMarketIndex();
    const embed = new EmbedBuilder()
      .setColor(market.isBull ? 0x2ecc71 : 0xe74c3c)
      .setTitle('📈 $EKO INDEX — SANAL ŞEHİR BORSASI')
      .setDescription(
        `**Mevcut Piyasa Durumu:** ${market.trend}\n` +
        `**Endeks Değeri:** $EKO ${market.value}\n\n` +
        `💡 Paranıza kâr katmak için borsaya yatırım yapabilirsiniz. Piyasa canlıyken kazanç şansınız daha yüksektir!`
      )
      .setFooter({ text: 'Eko Yıldız • Sanal Borsa' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('invest_stock_100').setLabel('📈 100 E.C. Yatır').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('invest_stock_500').setLabel('🚀 500 E.C. Yatır').setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
}

module.exports = {
  handleRpgCommands
};
