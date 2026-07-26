'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { get7DayAnalytics, generateQuickChartUrl } = require('./usageTracker');

/**
 * Generates and sends the s!grafikler response embed with interactive controls & QuickChart images
 */
async function sendGrafiklerMenu(target, viewType = 'trend') {
  const analytics = get7DayAnalytics();
  const embed = new EmbedBuilder().setTimestamp();

  const isInteraction = typeof target.reply === 'function' && target.isRepliable;

  // Build ActionRow buttons
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('grafik_view_trend')
      .setLabel('📈 Trend Grafiği')
      .setStyle(viewType === 'trend' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('grafik_view_donut')
      .setLabel('🍩 Sistem Dağılımı')
      .setStyle(viewType === 'donut' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('grafik_view_buttons')
      .setLabel('🔘 Buton Tıklamaları')
      .setStyle(viewType === 'buttons' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('grafik_view_commands')
      .setLabel('📜 Komut Detayları')
      .setStyle(viewType === 'commands' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('grafik_view_refresh')
      .setLabel('🔄 Yenile')
      .setStyle(ButtonStyle.Success)
  );

  if (viewType === 'trend') {
    const chartUrl = generateQuickChartUrl('line');
    embed
      .setColor(0x7c6af7)
      .setTitle('📊 Sentara Bot — Canlı Sistem Kullanım Grafiği')
      .setDescription(
        'Bot üzerindeki tüm komut çalıştırma ve buton tıklama aktiviteleri anlık olarak izlenmektedir.\n' +
        'Aşağıdaki grafikte son 7 günlük kullanım verileri görselleştirilmiştir.'
      )
      .setImage(chartUrl)
      .addFields(
        {
          name: '📌 Bugünkü Özet',
          value: `• **🔘 Bugün Basılan Butonlar:** \`${analytics.today.totalButtonClicks}\` kez\n` +
                 `• **📜 Bugün Çalıştırılan Komutlar:** \`${analytics.today.totalCommands}\` kez\n` +
                 `• **📝 Gönderilen Modallar:** \`${analytics.today.totalModalSubmits}\` kez`,
          inline: true
        },
        {
          name: '📈 7 Günlük Ortalama',
          value: `• **Günlük Buton Ortalaması:** \`${analytics.avgButtonsPerDay}\` tıklama/gün\n` +
                 `• **Günlük Komut Ortalaması:** \`${analytics.avgCommandsPerDay}\` komut/gün\n` +
                 `• **Toplam 7G İşlem:** \`${analytics.totalButtonsAllDays + analytics.totalCommandsAllDays}\` adet`,
          inline: true
        }
      );
  } else if (viewType === 'donut') {
    const chartUrl = generateQuickChartUrl('donut');
    embed
      .setColor(0x2ecc71)
      .setTitle('🍩 Sistem Bazlı Kullanım Dağılım Grafiği')
      .setDescription('Bot bileşenlerinin ve modüllerinin toplam kullanım içerisindeki yüzde payları aşağıda listelenmiştir.')
      .setImage(chartUrl);

    let catList = '';
    const totalAllCat = Object.values(analytics.categories).reduce((a, b) => a + b, 0) || 1;
    for (const [cat, count] of Object.entries(analytics.categories)) {
      if (count > 0) {
        const pct = ((count / totalAllCat) * 100).toFixed(1);
        catList += `• **${cat}:** \`${count}\` kullanım (\`%${pct}\`)\n`;
      }
    }
    if (!catList) catList = '• Henüz kaydedilmiş kategori kullanımı bulunmuyor.';

    embed.addFields({ name: '📊 Kategori İstatistikleri', value: catList, inline: false });

  } else if (viewType === 'buttons') {
    embed
      .setColor(0x3498db)
      .setTitle('🔘 Buton İstatistikleri & Günlük Basılma Oranları')
      .setDescription('Sunucuda en sık tıklanan butonlar ve günlük ortalama basılma sayıları:');

    if (analytics.topButtons.length > 0) {
      analytics.topButtons.forEach((btn, idx) => {
        embed.addFields({
          name: `${idx + 1}. \`${btn.name}\``,
          value: `👉 **Günde yaklaşık \`${btn.dailyAvg}\` kez basılıyor.** (Toplam: \`${btn.total}\` tıklama)`,
          inline: false
        });
      });
    } else {
      embed.addFields({ name: 'ℹ️ Bilgi', value: 'Henüz buton tıklama kaydı oluşturulmadı.' });
    }
  } else if (viewType === 'commands') {
    embed
      .setColor(0xe67e22)
      .setTitle('📜 Komut İstatistikleri & Günlük Çalıştırılma Oranları')
      .setDescription('En çok kullanılan komutlar ve günlük ortalama çalıştırılma sayıları:');

    if (analytics.topCommands.length > 0) {
      analytics.topCommands.forEach((cmd, idx) => {
        embed.addFields({
          name: `${idx + 1}. \`${cmd.name}\``,
          value: `👉 **Günde yaklaşık \`${cmd.dailyAvg}\` kez çalıştırılıyor.** (Toplam: \`${cmd.total}\` kullanım)`,
          inline: false
        });
      });
    } else {
      embed.addFields({ name: 'ℹ️ Bilgi', value: 'Henüz komut çalıştırma kaydı oluşturulmadı.' });
    }
  }

  embed.setFooter({ text: 'Sentara Analytics Engine • s!grafikler ile istatistikleri canlı izleyebilirsiniz' });

  if (isInteraction) {
    if (target.replied || target.deferred) {
      return target.editReply({ embeds: [embed], components: [row] }).catch(() => {});
    } else {
      return target.reply({ embeds: [embed], components: [row] }).catch(() => {});
    }
  } else if (target.reply) {
    return target.reply({ embeds: [embed], components: [row] }).catch(() => {});
  }
}

module.exports = {
  sendGrafiklerMenu
};
