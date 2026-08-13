const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { CHANNELS } = require('./staffAutomation');

async function refreshPanel(client, channelId, embed, components = []) {
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (channel && channel.isTextBased()) {
    try {
      const messages = await channel.messages.fetch({ limit: 50 });
      // Find existing panel message with the exact same title
      const existingMsg = messages.find(m => m.author.id === client.user.id && m.embeds.length > 0 && m.embeds[0].title === embed.data.title);
      
      const msgOptions = { embeds: [embed] };
      if (components.length > 0) {
        msgOptions.components = components;
      } else {
        msgOptions.components = [];
      }

      if (existingMsg) {
        // Edit existing message to avoid deleting/resending every time the bot starts
        await existingMsg.edit(msgOptions);
      } else {
        // Only send a new message if it was deleted/not found
        await channel.send(msgOptions);
      }
    } catch (e) {
      console.error(`[PanelManager] refreshPanel Error for ${channelId}:`, e.message);
    }
  }
}

async function ensureAdminPanels(client) {
  try {
    // 1. Bot Komut Rehberi
    const cmdEmbed = new EmbedBuilder()
      .setTitle("📖 EkoYıldız Komut Kütüphanesi & Rehberi")
      .setDescription(
        "EkoYıldız bünyesindeki aktif yetkililerin ve personelin kullanabileceği tüm bot komutları ve işlevleri aşağıda listelenmiştir.\n\n" +
        "### 👤 Genel Yetkili Komutları\n" +
        "• `/profil` ➔ Performans istatistiklerinizi, XP puanınızı ve görev durumunuzu gösterir.\n" +
        "• `/izin_iste` ➔ Yapay zeka kontrollü inaktiflik ve izin talebi oluşturur.\n" +
        "• `/personel-dogrula` ➔ Roblox hesabınızı Discord profilinizle eşleştirir.\n\n" +
        "### 👑 Üst Düzey Yönetici Komutları\n" +
        "• `/odulver [kullanıcı] [ödül_miktarı]` ➔ Başarılı personele ödül puanı yansıtır.\n" +
        "• `/konus [kullanıcı] [konu]` ➔ Yapay zeka destekli kişiselleştirilmiş rehberlik görüşmesi açar."
      )
      .setColor(0x5865F2);
    await refreshPanel(client, '1466947058442305637', cmdEmbed);

    // 2. İzin Formu
    const leaveEmbed = new EmbedBuilder()
      .setTitle("📅 İnaktiflik & İzin Bildirim Paneli")
      .setDescription(
        "Görev süreleriniz boyunca inaktif kalacağınız durumları (sağlık, eğitim, sınav vb.) bu panel üzerinden resmi izin formunu doldurarak iletebilirsiniz.\n\n" +
        "⚠️ **Önemli:** Talebiniz yapay zeka tarafından işleme alınarak yetkili profilinize otomatik yansıtılacaktır."
      )
      .setColor(0xF1C40F);
    const leaveRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_leave_form').setLabel('İzin Formu Doldur').setStyle(ButtonStyle.Primary).setEmoji('📝')
    );
    await refreshPanel(client, '1466945552385048776', leaveEmbed, [leaveRow]);

    // 3. Tavsiye Formu
    const suggestionEmbed = new EmbedBuilder()
      .setTitle("💡 Öneri, Geliştirme & Tavsiye Kutusu")
      .setDescription(
        "EkoYıldız ekosistemini, yönetim standartlarını veya teknik altyapımızı geliştirmek için fikirlerinizi bize ulaştırın.\n\n" +
        "*Her bir yapıcı öneri, sunucumuzun geleceğine yön vermektedir.*"
      )
      .setColor(0x2ECC71);
    const suggestionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_suggestion_form').setLabel('Tavsiye Gönder').setStyle(ButtonStyle.Success).setEmoji('💭')
    );
    await refreshPanel(client, '1466946002547249296', suggestionEmbed, [suggestionRow]);

    // 4. Moderatör Ekibi | Personel & Nöbet Anasayfası
    const modHomeEmbed = new EmbedBuilder()
      .setTitle("🛡️ EkoYıldız Moderatör Ekibi | Personel & Nöbet Anasayfası")
      .setDescription(
        "EkoYıldız Moderatör Ekibinin resmi yönetim, nöbet takip ve yetkili portalı.\n\n" +
        "⚡ **NÖBET VE AKTİFLİK İŞLEMLERİ:**\n" +
        "• **⚡ Nöbet Başlat:** Aktif nöbetinizi ve puan takibini başlatır.\n" +
        "• **🛑 Nöbeti Bitir:** Nöbetinizi sonlandırır ve devir notu göndermenizi sağlar.\n" +
        "• **📊 Canlı Durum:** Nöbetteki yetkilileri ve aktiflik sürenizi gösterir.\n" +
        "• **☕ Mola Al:** Geçici nöbet molanızı başlatır/bitirir.\n\n" +
        "🚪 **DİĞER İŞLEMLER:**\n" +
        "• Görevden kendi isteğinizle ayrılmak için **'🚪 İstifa Et'** butonunu kullanabilirsiniz."
      )
      .setColor(0x2ECC71);

    const modHomeRow1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_duty_start').setLabel('⚡ Nöbet Başlat').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('btn_duty_end').setLabel('🛑 Nöbet Bitir & Devret').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('btn_duty_status').setLabel('📊 Canlı Durum').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('btn_duty_break').setLabel('☕ Mola Al').setStyle(ButtonStyle.Primary)
    );

    const modHomeRow2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_resign_form').setLabel('🚪 İstifa Et').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('btn_modcheck_open_modal').setLabel('🔓 Mod DM Kontrolü Aç').setStyle(ButtonStyle.Success)
    );

    await refreshPanel(client, '1466945894250188912', modHomeEmbed, [modHomeRow1, modHomeRow2]);

    // 12. Pazar Yeri & Borsa Mum Grafiği Paneli
    const marketEmbed = new EmbedBuilder()
      .setTitle("🛒 Sentara Pazar Yeri & $EKO Borsa Paneli")
      .setDescription(
        "Mülk, rozet ve coin alım-satım pazarını açmak veya canlı $EKO Index borsa mum grafiğini görüntülemek için butonları kullanabilirsiniz."
      )
      .setColor(0x9B59B6);
    const marketRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_market_panel').setLabel('🛒 Pazar Yerini Aç').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('btn_stock_chart').setLabel('📈 $EKO Canlı Grafik').setStyle(ButtonStyle.Success)
    );
    await refreshPanel(client, '1466947058442305637', marketEmbed, [marketRow]);

  } catch (error) {
    console.error("[PanelManager] ensureAdminPanels Error:", error);
  }
}

module.exports = {
  ensureAdminPanels
};
