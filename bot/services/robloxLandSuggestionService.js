const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const SUGGESTION_CHANNEL_ID = "1538469516953001994";
const TARGET_ADMIN_ID = "1263456561410605120";
const SUGGESTIONS_DB_FILE = path.join(__dirname, "../../data/robloxland_suggestions.json");

function loadDb() {
  try {
    if (fs.existsSync(SUGGESTIONS_DB_FILE)) {
      return JSON.parse(fs.readFileSync(SUGGESTIONS_DB_FILE, "utf8"));
    }
  } catch (_) {}
  return {};
}

function saveDb(data) {
  try {
    fs.writeFileSync(SUGGESTIONS_DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("[SuggestionService] Save DB error:", e.message);
  }
}

/**
 * İstek kanalındaki mesajları yakalar, tik ve çarpı koyar ve yöneticiye DM gönderir
 */
async function handleSuggestionMessage(message, client) {
  if (!message.guild || message.author.bot) return false;
  if (message.channelId !== SUGGESTION_CHANNEL_ID) return false;

  const content = message.content ? message.content.trim() : "";
  if (!content && message.attachments.size === 0) return false;

  // 1. Otomatik tik ve çarpı tepkisi koy
  try {
    await message.react("✅").catch(() => {});
    await message.react("❌").catch(() => {});
  } catch (reactErr) {
    console.warn("[SuggestionService] React error:", reactErr.message);
  }

  // 2. İsteği veritabanına kaydet
  const db = loadDb();
  db[message.id] = {
    messageId: message.id,
    userId: message.author.id,
    userTag: message.author.tag || message.author.username,
    content: content || "(Görsel/Ek)",
    guildId: message.guildId,
    createdAt: new Date().toISOString()
  };
  saveDb(db);

  // 3. 1263456561410605120 ID'li yöneticiye DM gönder
  try {
    const adminUser = await client.users.fetch(TARGET_ADMIN_ID).catch(() => null);
    if (!adminUser) {
      console.warn(`[SuggestionService] Admin user (${TARGET_ADMIN_ID}) bulunamadı.`);
      return true;
    }

    const messageUrl = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;

    const dmText =
      `# 📬 Selamm. Yeni istek geldi!\n\n` +
      `👤 **İstek Sahibi:** <@${message.author.id}> (\`${message.author.tag}\` - \`${message.author.id}\`)\n` +
      `📝 **İstek İçeriği:**\n` +
      `> ${content.replace(/\n/g, "\n> ")}\n\n` +
      `🔗 **Kanal Mesajı:** [İsteğe Gitmek İçin Tıkla](${messageUrl})\n\n` +
      `❓ **Bunu yapabilir misin?**`;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`istek_evet_${message.author.id}_${message.id}`)
        .setLabel("Evet, yapabilirim")
        .setStyle(ButtonStyle.Success)
        .setEmoji("✅"),
      new ButtonBuilder()
        .setCustomId(`istek_hayir_${message.author.id}_${message.id}`)
        .setLabel("Hayır, yapamam")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("❌"),
      new ButtonBuilder()
        .setCustomId(`istek_anonim_${message.author.id}_${message.id}`)
        .setLabel("Anonim DM Gönder")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("💬")
    );

    await adminUser.send({
      content: dmText,
      components: [row]
    });
  } catch (dmErr) {
    console.error("[SuggestionService] Admin DM send error:", dmErr.message);
  }

  return true;
}

/**
 * İstek butonları ve modal yanıtlarını işler
 */
async function handleSuggestionInteraction(interaction, client) {
  const customId = interaction.customId || "";
  if (!customId.startsWith("istek_")) return false;

  // 1. EVET YAPABİLİRİM BUTONU
  if (interaction.isButton() && customId.startsWith("istek_evet_")) {
    const parts = customId.split("_");
    const targetUserId = parts[2];
    const msgId = parts.slice(3).join("_");

    const db = loadDb();
    const item = db[msgId] || { content: "İsteğiniz" };

    try {
      const targetUser = await client.users.fetch(targetUserId).catch(() => null);
      if (targetUser) {
        await targetUser.send(
          `✨ **İsteğiniz Hakkında Bilgilendirme!**\n\n` +
          `Gönderdiğiniz istek:\n` +
          `> ${item.content.replace(/\n/g, "\n> ")}\n\n` +
          `✅ **Yönetici Yanıtı:** Evet, bunu yapabilirim! İsteğiniz değerlendirmeye ve geliştirme planına alındı. Bizi tercih ettiğiniz için teşekkür ederiz! 🎉`
        ).catch(() => {});
      }
    } catch (_) {}

    await interaction.update({
      content: interaction.message.content + `\n\n🟢 **[YANITLANDI]** Kullanıcıya **'Evet, yapabilirim'** bildirimi DM ile gönderildi.`,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`istek_anonim_${targetUserId}_${msgId}`).setLabel("Ekstra Anonim Mesaj Gönder").setStyle(ButtonStyle.Secondary).setEmoji("💬")
        )
      ]
    });
    return true;
  }

  // 2. HAYIR YAPAMAM BUTONU
  if (interaction.isButton() && customId.startsWith("istek_hayir_")) {
    const parts = customId.split("_");
    const targetUserId = parts[2];
    const msgId = parts.slice(3).join("_");

    const db = loadDb();
    const item = db[msgId] || { content: "İsteğiniz" };

    try {
      const targetUser = await client.users.fetch(targetUserId).catch(() => null);
      if (targetUser) {
        await targetUser.send(
          `✨ **İsteğiniz Hakkında Bilgilendirme!**\n\n` +
          `Gönderdiğiniz istek:\n` +
          `> ${item.content.replace(/\n/g, "\n> ")}\n\n` +
          `❌ **Yönetici Yanıtı:** Maalesef şu anda teknik veya operasyonel nedenlerle bu isteğinizi gerçekleştiremiyoruz. İlginiz ve öneriniz için teşekkür ederiz.`
        ).catch(() => {});
      }
    } catch (_) {}

    await interaction.update({
      content: interaction.message.content + `\n\n🔴 **[YANITLANDI]** Kullanıcıya **'Hayır, yapamam'** bildirimi DM ile gönderildi.`,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`istek_anonim_${targetUserId}_${msgId}`).setLabel("Ekstra Anonim Mesaj Gönder").setStyle(ButtonStyle.Secondary).setEmoji("💬")
        )
      ]
    });
    return true;
  }

  // 3. ANONİM DM GÖNDER BUTONU (Modal Açar)
  if (interaction.isButton() && customId.startsWith("istek_anonim_")) {
    const parts = customId.split("_");
    const targetUserId = parts[2];
    const msgId = parts.slice(3).join("_");

    const modal = new ModalBuilder()
      .setCustomId(`istek_anonim_modal_${targetUserId}_${msgId}`)
      .setTitle("İstek Sahibine Anonim DM Gönder");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("anonim_message_text")
          .setLabel("İletmek İstediğiniz Mesaj")
          .setPlaceholder("Kullanıcıya iletilecek açıklama veya soru...")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // 4. ANONİM DM MODAL GÖNDERİMİ (Admin -> Kullanıcı)
  if (interaction.isModalSubmit() && customId.startsWith("istek_anonim_modal_")) {
    const parts = customId.split("_");
    const targetUserId = parts[3];
    const msgId = parts.slice(4).join("_");
    const text = interaction.fields.getTextInputValue("anonim_message_text");

    const db = loadDb();
    const item = db[msgId] || { content: "İsteğiniz" };

    try {
      const targetUser = await client.users.fetch(targetUserId).catch(() => null);
      if (targetUser) {
        const replyRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`istek_user_reply_${interaction.user.id}_${msgId}`)
            .setLabel("💬 Yöneticiye Yanıt Ver")
            .setStyle(ButtonStyle.Primary)
        );

        await targetUser.send({
          content:
            `📩 **Yöneticiden İsteğinizle İlgili Mesaj Geldi!**\n\n` +
            `📌 **İsteğiniz:**\n` +
            `> ${item.content.replace(/\n/g, "\n> ")}\n\n` +
            `💬 **Yönetici Mesajı:**\n` +
            `> ${text.replace(/\n/g, "\n> ")}\n\n` +
            `-# Aşağıdaki 'Yöneticiye Yanıt Ver' butonuna tıklayarak doğrudan sohbet edebilirsiniz.`,
          components: [replyRow]
        });

        await interaction.reply({
          content: `✅ **Mesajınız kullanıcıya (<@${targetUserId}>) başarıyla iletildi!** Kullanıcı yanıt verdiğinde buraya bildirim gelecektir.`,
          ephemeral: true
        });
      } else {
        await interaction.reply({ content: "❌ Kullanıcıya ulaşılamadı (DM kapalı olabilir).", ephemeral: true });
      }
    } catch (e) {
      await interaction.reply({ content: `❌ Mesaj gönderilirken hata: ${e.message}`, ephemeral: true });
    }
    return true;
  }

  // 5. KULLANICININ YÖNETİCİYE YANIT VERME BUTONU (Kullanıcı DM)
  if (interaction.isButton() && customId.startsWith("istek_user_reply_")) {
    const parts = customId.split("_");
    const adminId = parts[3] || TARGET_ADMIN_ID;
    const msgId = parts.slice(4).join("_");

    const modal = new ModalBuilder()
      .setCustomId(`istek_user_reply_modal_${adminId}_${msgId}`)
      .setTitle("Yöneticiye Yanıt Gönder");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("user_reply_text")
          .setLabel("Yöneticiye İletilecek Yanıtınız")
          .setPlaceholder("Cevabınızı buraya yazınız...")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // 6. KULLANICININ YÖNETİCİYE YANIT MODALI (Kullanıcı -> Admin)
  if (interaction.isModalSubmit() && customId.startsWith("istek_user_reply_modal_")) {
    const parts = customId.split("_");
    const adminId = parts[4] || TARGET_ADMIN_ID;
    const msgId = parts.slice(5).join("_");
    const replyText = interaction.fields.getTextInputValue("user_reply_text");

    try {
      const adminUser = await client.users.fetch(adminId).catch(() => null);
      if (adminUser) {
        const reReplyRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`istek_anonim_${interaction.user.id}_${msgId}`)
            .setLabel("💬 Kullanıcıya Tekrar Yanıt Ver")
            .setStyle(ButtonStyle.Success)
        );

        await adminUser.send({
          content:
            `💬 **İstek Sahibinden Yeni Yanıt Geldi!**\n\n` +
            `👤 **Kullanıcı:** <@${interaction.user.id}> (\`${interaction.user.tag}\` - \`${interaction.user.id}\`)\n\n` +
            `📝 **Kullanıcının Yanıtı:**\n` +
            `> ${replyText.replace(/\n/g, "\n> ")}\n\n` +
            `-# Aşağıdaki butona tıklayarak kullanıcıya tekrar yanıt gönderebilirsiniz.`,
          components: [reReplyRow]
        });

        await interaction.reply({
          content: "✅ **Yanıtınız yöneticiye başarıyla iletildi!**",
          ephemeral: true
        });
      } else {
        await interaction.reply({ content: "❌ Yöneticiye ulaşılamadı.", ephemeral: true });
      }
    } catch (e) {
      await interaction.reply({ content: `❌ Yanıt iletilirken hata: ${e.message}`, ephemeral: true });
    }
    return true;
  }

  return false;
}

module.exports = {
  handleSuggestionMessage,
  handleSuggestionInteraction,
  SUGGESTION_CHANNEL_ID,
  TARGET_ADMIN_ID
};
