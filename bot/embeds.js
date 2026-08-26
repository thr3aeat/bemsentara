const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const { SUPPORT_CATEGORIES } = require("../config");

function getSupportMenuEmbed() {
  return new EmbedBuilder()
    .setTitle("🛟 Destek Sistemi / Support System")
    .setDescription("Lütfen aşağıdan bir kategori seçin.\n\nPlease select a category below.")
    .setColor(0x7c6af7)
    .setFooter({ text: "Sentara Support • Eko tarafından tasarlandı" })
    .setImage("https://cdn.discordapp.com/attachments/1234567890/sentara-banner.png");
}

function getCategorySelectMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("support_category")
      .setPlaceholder("Kategori seçin / Select Category")
      .addOptions(
        { label: "🔨 Ban/Şikayet Talebi",  value: "ban",       description: "Birisini şikayet et veya ban talep et" },
        { label: "📢 Reklam Satın Al",      value: "reklam",    description: "YouTube kanalında reklam satın al" },
        { label: "🚨 Kullanıcı Şikayet",    value: "report",    description: "Küfür, taciz veya kural ihlali bildir" },
        { label: "💳 Ödeme Sorunu",         value: "billing",   description: "Ödeme veya satın alma sorunları" },
        { label: "🔧 Teknik Sorun",         value: "technical", description: "Bot veya site teknik sorunları" },
        { label: "👤 Hesap Sorunu",         value: "account",   description: "Hesap veya Roblox bağlantı sorunları" },
        { label: "💬 Genel Destek",         value: "genel",     description: "Genel soru ve destek talepleri" },
        { label: "📝 Diğer",               value: "other",     description: "Yukarıdaki kategorilere uymayan konular" }
      )
  );
}

function getSupportButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("open_support_menu")
      .setLabel("🎫 Destek Menüsünü Aç / Open Support Menu")
      .setStyle(ButtonStyle.Primary)
  );
}

function buildTicketEmbed(ticket) {
  const categoryInfo = (ticket && ticket.category && SUPPORT_CATEGORIES[ticket.category]) || SUPPORT_CATEGORIES.other || { color: 0x7c6af7 };
  const dateObj = ticket && ticket.createdAt ? new Date(ticket.createdAt) : new Date();
  const timeSeconds = Math.floor(dateObj.getTime() / 1000);

  return new EmbedBuilder()
    .setTitle(`🎫 ${ticket?.ticketId || 'Destek Talebi'}`)
    .setColor(categoryInfo.color || 0x7c6af7)
    .addFields(
      { name: "📋 Konu", value: (ticket?.subject && ticket.subject.trim()) || "Belirtilmedi", inline: false },
      { name: "📝 Açıklama", value: (ticket?.description && ticket.description.trim()) || "Belirtilmedi", inline: false },
      { name: "🎯 Öncelik", value: (ticket?.priority || "NORMAL").toUpperCase(), inline: true },
      { name: "👤 Açan", value: ticket?.userId ? `<@${ticket.userId}>` : "Bilinmiyor", inline: true },
      { name: "⏰ Tarih", value: `<t:${timeSeconds}:f>`, inline: true }
    )
    .setFooter({ text: "Sentara Support" })
    .setTimestamp(dateObj);
}

function getTicketModActionRows(ticketId) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`close_ticket_${ticketId}`)
      .setLabel("🔒 Talebi Kapat")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`claim_ticket_${ticketId}`)
      .setLabel("🙋‍♂️ Talebi Üstlen")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`ticket_notify_user_${ticketId}`)
      .setLabel("🔔 DM Bildirimi")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`ticket_ai_dispute_${ticketId}`)
      .setLabel("🚨 AI İhtilaf İncele")
      .setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_user_info_${ticketId}`)
      .setLabel("👤 Kullanıcı Sicili")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`ticket_add_note_${ticketId}`)
      .setLabel("📝 Yetkili Notu")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`ticket_save_transcript_${ticketId}`)
      .setLabel("📜 Transkript Al")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`ticket_toggle_slowmode_${ticketId}`)
      .setLabel("⏱️ Yavaş Mod")
      .setStyle(ButtonStyle.Secondary)
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_add_user_prompt_${ticketId}`)
      .setLabel("👥 Kullanıcı Ekle")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`ticket_change_priority_${ticketId}`)
      .setLabel("📌 Öncelik Değiştir")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`ticket_lock_chat_${ticketId}`)
      .setLabel("🔇 Yazma Kilidi")
      .setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2, row3];
}

function buildCloseButton(ticketId) {
  return getTicketModActionRows(ticketId);
}

/** Components V2 Ticket Detay Payload'ı (Accent colorsuz, gelişmiş bol butonlu mod paneli) */
function buildTicketV2(ticket) {
  const ComponentsV2Factory = require("./utils/componentsV2Factory");
  const categoryInfo = (ticket && ticket.category && SUPPORT_CATEGORIES[ticket.category]) || SUPPORT_CATEGORIES.other || { name: 'Genel Destek' };
  const dateObj = ticket && ticket.createdAt ? new Date(ticket.createdAt) : new Date();
  const timeSeconds = Math.floor(dateObj.getTime() / 1000);
  const ticketId = ticket?.ticketId || 'DETAY';
  const priority = (ticket?.priority || 'NORMAL').toUpperCase();

  const priorityEmojis = {
    LOW: '🟢 Düşük (Low)',
    NORMAL: '🔵 Normal',
    MEDIUM: '🟡 Orta (Medium)',
    HIGH: '🔴 Yüksek (High)',
    URGENT: '🔥 Acil (Urgent)'
  };
  const priorityText = priorityEmojis[priority] || `📌 ${priority}`;

  const claimedStatus = ticket?.claimedBy 
    ? `✅ <@${ticket.claimedBy}> tarafından üstlenildi` 
    : `🔴 **Henüz Üstlenilmedi** *(Yetkili bekleniyor)*`;

  const categoryName = categoryInfo.name || ticket?.category || 'Genel Destek';
  const cleanSubject = (ticket?.subject && ticket.subject.trim()) || 'Konu belirtilmedi';
  const cleanDesc = (ticket?.description && ticket.description.trim()) || 'Açıklama belirtilmedi';

  const components = [
    ...ComponentsV2Factory.headerBlock(`Destek Talebi — #${ticketId}`, '🎫'),
    ComponentsV2Factory.text(
      `### 👤 Kullanıcı ve Talep Künyesi\n` +
      `> 👤 **Talep Sahibi:** <@${ticket?.userId || 'Bilinmiyor'}> (\`${ticket?.userId || '—'}\`)\n` +
      `> 📂 **Kategori:** **${categoryName}**\n` +
      `> 🎯 **Öncelik:** \`${priorityText}\`\n` +
      `> ⏰ **Oluşturulma:** <t:${timeSeconds}:F> (<t:${timeSeconds}:R>)\n` +
      `> 👑 **Yetkili Durumu:** ${claimedStatus}`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.text(
      `### 📋 Talep Konusu & Açıklama\n` +
      `**Konu:** ${cleanSubject}\n\n` +
      `>>> ${cleanDesc}`
    ),
    ComponentsV2Factory.separator(false),
    ComponentsV2Factory.text(
      `### 🛡️ Moderatör & Yetkili Hızlı Eylem Masası\n` +
      `*Aşağıdaki araçları kullanarak talebi kapatabilir, üstlenebilir, kullanıcıya DM bildirimi gönderebilir veya sicilini sorgulayabilirsiniz.*`
    ),
    ComponentsV2Factory.actionRow([
      { custom_id: `close_ticket_${ticketId}`, label: "Talebi Kapat", style: ButtonStyle.Danger, emoji: { name: "🔒" } },
      { custom_id: `claim_ticket_${ticketId}`, label: "Talebi Üstlen", style: ButtonStyle.Success, emoji: { name: "🙋‍♂️" } },
      { custom_id: `ticket_notify_user_${ticketId}`, label: "DM Bildirimi", style: ButtonStyle.Primary, emoji: { name: "🔔" } },
      { custom_id: `ticket_ai_dispute_${ticketId}`, label: "AI İhtilaf Analizi", style: ButtonStyle.Secondary, emoji: { name: "🚨" } }
    ]),
    ComponentsV2Factory.actionRow([
      { custom_id: `ticket_user_info_${ticketId}`, label: "Kullanıcı Sicili", style: ButtonStyle.Secondary, emoji: { name: "👤" } },
      { custom_id: `ticket_add_note_${ticketId}`, label: "Yetkili Notu", style: ButtonStyle.Secondary, emoji: { name: "📝" } },
      { custom_id: `ticket_save_transcript_${ticketId}`, label: "Transkript Al", style: ButtonStyle.Secondary, emoji: { name: "📜" } },
      { custom_id: `ticket_toggle_slowmode_${ticketId}`, label: "Yavaş Mod", style: ButtonStyle.Secondary, emoji: { name: "⏱️" } }
    ]),
    ComponentsV2Factory.actionRow([
      { custom_id: `ticket_add_user_prompt_${ticketId}`, label: "Kullanıcı Ekle", style: ButtonStyle.Secondary, emoji: { name: "👥" } },
      { custom_id: `ticket_change_priority_${ticketId}`, label: "Öncelik Değiştir", style: ButtonStyle.Secondary, emoji: { name: "📌" } },
      { custom_id: `ticket_lock_chat_${ticketId}`, label: "Yazma Kilidi", style: ButtonStyle.Secondary, emoji: { name: "🔇" } }
    ]),
    ComponentsV2Factory.separator(false),
    ComponentsV2Factory.text(
      `-# 🛡️ Sentara Moderation & Ticket Management System • EkoYıldız Yetkili Masası`
    )
  ];

  // Components V2 Payload (accent colorsuz Container)
  return ComponentsV2Factory.buildPayload(components);
}

/** Ticket kapatma sebebi soran modal */
function buildCloseReasonModal(ticketId) {
  const modal = new ModalBuilder()
    .setCustomId(`close_reason_modal_${ticketId}`)
    .setTitle("Ticket Kapatma Sebebi");

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("close_reason")
        .setLabel("Kapatma Sebebi")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Bu ticket'ı neden kapatıyorsunuz?")
        .setRequired(true)
        .setMaxLength(500)
    )
  );

  return modal;
}

/** Kullanıcıya DM'de gönderilecek "Tekrar Aç" ve "Değerlendir" butonları */
function buildReopenAndRateRow(ticketId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`reopen_ticket_${ticketId}`)
      .setLabel("🔓 Tekrar Aç")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`rate_ticket_${ticketId}`)
      .setLabel("⭐ Değerlendir")
      .setStyle(ButtonStyle.Primary)
  );
}

/** Değerlendirme modal'ı (5 yıldız + yorum) */
function buildRatingModal(ticketId) {
  const modal = new ModalBuilder()
    .setCustomId(`rating_modal_${ticketId}`)
    .setTitle("Destek Değerlendirmesi");

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("rating_score")
        .setLabel("Puan (1-5)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("1, 2, 3, 4 veya 5 girin")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(1)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("rating_note")
        .setLabel("Değerlendirme Notu (isteğe bağlı)")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Destek hakkında düşüncelerinizi yazın...")
        .setRequired(false)
        .setMaxLength(500)
    )
  );

  return modal;
}

/** Components V2 Destek Menüsü Payload'ı */
function getSupportMenuV2() {
  const ComponentsV2Factory = require("./utils/componentsV2Factory");
  const TypographyHelper = require("./utils/typographyHelper");

  return ComponentsV2Factory.buildPayload(0x7c6af7, [
    ComponentsV2Factory.section(
      `${TypographyHelper.h2("🛟 Destek Sistemi / Support System")}\n` +
      "Lütfen aşağıdan bir kategori seçin.\nPlease select a category below.\n\n" +
      `${TypographyHelper.quote("Hızlı ve 7/24 kesintisiz destek için doğru kategoriyi seçin.")}`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.text(
      `${TypographyHelper.subtext("Sentara Support • Eko tarafından tasarlandı • ") + TypographyHelper.timestamp(new Date(), "R")}`
    ),
  ]);
}

module.exports = {
  getSupportMenuEmbed,
  getSupportMenuV2,
  getCategorySelectMenu,
  getSupportButton,
  buildTicketEmbed,
  buildTicketV2,
  buildCloseButton,
  getTicketModActionRows,
  buildCloseReasonModal,
  buildReopenAndRateRow,
  buildRatingModal,
};

