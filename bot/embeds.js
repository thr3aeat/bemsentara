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
  const categoryInfo = SUPPORT_CATEGORIES[ticket.category] || SUPPORT_CATEGORIES.other;
  return new EmbedBuilder()
    .setTitle(`🎫 ${ticket.ticketId}`)
    .setColor(categoryInfo.color)
    .addFields(
      { name: "📋 Konu", value: ticket.subject, inline: false },
      { name: "📝 Açıklama", value: ticket.description, inline: false },
      { name: "🎯 Öncelik", value: ticket.priority.toUpperCase(), inline: true },
      { name: "👤 Açan", value: `<@${ticket.userId}>`, inline: true },
      { name: "⏰ Tarih", value: `<t:${Math.floor(ticket.createdAt.getTime() / 1000)}:f>`, inline: true }
    )
    .setFooter({ text: "Sentara Support" })
    .setTimestamp();
}

function buildCloseButton(ticketId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`close_ticket_${ticketId}`)
      .setLabel("🔒 Ticket'ı Kapat")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`claim_ticket_${ticketId}`)
      .setLabel("🙋‍♂️ Üstlen")
      .setStyle(ButtonStyle.Success)
  );
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

/** Components V2 Ticket Detay Payload'ı */
function buildTicketV2(ticket) {
  const ComponentsV2Factory = require("./utils/componentsV2Factory");
  const TypographyHelper = require("./utils/typographyHelper");
  const categoryInfo = SUPPORT_CATEGORIES[ticket.category] || SUPPORT_CATEGORIES.other;

  return ComponentsV2Factory.buildPayload(categoryInfo.color || 0x5865F2, [
    ComponentsV2Factory.section(
      `${TypographyHelper.h2(`🎫 Destek Talebi: ${ticket.ticketId}`)}\n` +
      `${TypographyHelper.quote(ticket.subject)}`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.text(
      `📝 **Açıklama:**\n${ticket.description}\n\n` +
      `🎯 **Öncelik:** \`${ticket.priority.toUpperCase()}\`\n` +
      `👤 **Açan:** <@${ticket.userId}>\n` +
      `⏰ **Tarih:** ${TypographyHelper.timestamp(ticket.createdAt, "F")} (${TypographyHelper.timestamp(ticket.createdAt, "R")})`
    ),
    ComponentsV2Factory.separator(false),
    ComponentsV2Factory.text(
      TypographyHelper.subtext(`Sentara Automated Ticket Service • ID: ${ticket.ticketId}`)
    ),
    ComponentsV2Factory.actionRow([
      { custom_id: `close_ticket_${ticket.ticketId}`, label: "🔒 Ticket'ı Kapat", style: ButtonStyle.Danger },
      { custom_id: `claim_ticket_${ticket.ticketId}`, label: "🙋‍♂️ Üstlen", style: ButtonStyle.Success }
    ])
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
  buildCloseReasonModal,
  buildReopenAndRateRow,
  buildRatingModal,
};

