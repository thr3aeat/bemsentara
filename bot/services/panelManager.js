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

    // 4. İstifa Formu
    const resignEmbed = new EmbedBuilder()
      .setTitle("🚪 Personel İstifa İşlemleri")
      .setDescription(
        "EkoYıldız yetkili kadrosundaki görevinizden kendi isteğinizle ayrılmak için bu paneli kullanabilirsiniz.\n\n" +
        "🚨 **Dikkat:** İstifa işleminin onaylanması durumunda tüm yetki rolleriniz ve erişim haklarınız **kalıcı olarak** kaldırılacaktır."
      )
      .setColor(0xE74C3C);
    const resignRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_resign_form').setLabel('İstifa Et').setStyle(ButtonStyle.Danger).setEmoji('⚠️')
    );
    await refreshPanel(client, '1466945894250188912', resignEmbed, [resignRow]);

    // 5. Kanıtlı Mod İşlem Formu
    const modActionEmbed = new EmbedBuilder()
      .setTitle("⚖️ Moderasyon Ceza Kanıt Raporlama")
      .setDescription(
        "Sunucu düzenini korumak amacıyla uyguladığınız tüm yaptırımları (Ban, Mute, Kick, Warn vb.) kanıtlarıyla birlikte bu panel üzerinden kayıt altına almalısınız.\n\n" +
        "*Raporlanmayan cezalar performans değerlendirmesine dahil edilmeyecektir.*"
      )
      .setColor(0x9B59B6);
    const modActionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_modaction_form').setLabel('İşlem Raporla').setStyle(ButtonStyle.Primary).setEmoji('🔨')
    );
    await refreshPanel(client, '1466946794763321394', modActionEmbed, [modActionRow]);

    // 6. EkoYıldız Moderatör Ekibi | Doğrulama Sistemi
    const verifyEmbed = new EmbedBuilder()
      .setTitle("🔐 Personel Kimlik Doğrulama & Yetkilendirme")
      .setDescription(
        "EkoYıldız yetkilendirilmiş personeli için entegre kimlik doğrulama portalı.\n\n" +
        "👇 Aşağıdaki butona tıklayarak Roblox ve Discord hesaplarınızı eşleştirip **yetkili rollerinizi otomatik olarak devralabilirsiniz.**"
      )
      .setColor(0x3498DB);
    const verifyRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_personel_check').setLabel('Doğrula & Rollerimi Ver').setStyle(ButtonStyle.Success).setEmoji('✅')
    );
    await refreshPanel(client, '1466933699122565120', verifyEmbed, [verifyRow]);

    // 7. Ban Rapor Sistemi
    const banReportEmbed = new EmbedBuilder()
      .setTitle("🔨 Yasaklama (Ban) Rapor Paneli")
      .setDescription(
        "Sunucumuzdan yasaklanan veya yasaklanması talep edilen kullanıcıların detaylı gerekçe ve kanıt girişlerini bu form üzerinden yapabilirsiniz."
      )
      .setColor(0xE74C3C);
    const banReportRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_ban_report_form').setLabel('Ban Raporla').setStyle(ButtonStyle.Danger).setEmoji('🔨')
    );
    await refreshPanel(client, '1466946902154018967', banReportEmbed, [banReportRow]);

    // 8. Mute Rapor Sistemi
    const muteReportEmbed = new EmbedBuilder()
      .setTitle("🔇 Susturma (Mute) Rapor Paneli")
      .setDescription(
        "Kuralları ihlal ettiği için susturulan (Mute) kullanıcıların ceza sürelerini ve kanıtlarını raporlamak için bu paneli kullanın."
      )
      .setColor(0xF39C12);
    const muteReportRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_mute_report_form').setLabel('Mute Raporla').setStyle(ButtonStyle.Primary).setEmoji('🔇')
    );
    await refreshPanel(client, '1466946762190229589', muteReportEmbed, [muteReportRow]);

    // 9. Mod Şikayet Sistemi
    const modComplainEmbed = new EmbedBuilder()
      .setTitle("⚠️ Yetkili Hak İhlali & Şikayet Bildirimi")
      .setDescription(
        "Kuralları suistimal eden, yetkisini kötüye kullanan veya adil davranmayan yetkilileri, kimliğiniz **tamamen gizli kalacak şekilde** üst yönetime rapor edebilirsiniz."
      )
      .setColor(0x992D22);
    const modComplainRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_mod_complain_form').setLabel('Mod Şikayet Et').setStyle(ButtonStyle.Danger).setEmoji('⚠️')
    );
    await refreshPanel(client, '1466946497206816973', modComplainEmbed, [modComplainRow]);

    // 10. Moderatör Okulu Yönetim Paneli
    const modSchoolEmbed = new EmbedBuilder()
      .setTitle("🏫 Moderatör Okulu Disiplin Paneli")
      .setDescription(
        "Eğitim sürecinde başarısız olan, devamsızlık yapan veya okul kurallarını ihlal eden öğrencileri okul sisteminden uzaklaştırmak için yetkili işlem aracı."
      )
      .setColor(0xE67E22);
    const modSchoolRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_modschool_kick_panel').setLabel('Öğrenci At').setStyle(ButtonStyle.Danger).setEmoji('👢')
    );
    await refreshPanel(client, '1466947058442305637', modSchoolEmbed, [modSchoolRow]);

  } catch (error) {
    console.error("[PanelManager] ensureAdminPanels Error:", error);
  }
}

module.exports = {
  ensureAdminPanels
};
