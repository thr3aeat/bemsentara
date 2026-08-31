'use strict';

const fs = require('fs');
const path = require('path');
const {
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionFlagsBits
} = require('discord.js');
const ComponentsV2Factory = require('../utils/componentsV2Factory');

const GUILD_ID = '1537407325290237973';
const SCAMMERS_CHANNEL_ID = '1538466803980959815';
const STAFF_LOG_CHANNEL_ID = '1543382733408174220';
const SCAMMERS_FILE = path.join(__dirname, '../../data/robloxland_scammers.json');

function loadScammers() {
  try {
    const dir = path.dirname(SCAMMERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(SCAMMERS_FILE)) {
      return JSON.parse(fs.readFileSync(SCAMMERS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[ScammerService] Load error:', err.message);
  }
  return [];
}

function saveScammers(data) {
  try {
    const dir = path.dirname(SCAMMERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SCAMMERS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[ScammerService] Save error:', err.message);
  }
}

/**
 * Builds the official Scammers and Blacklist panel payload with interactive buttons
 */
function buildScammerPanelPayload(scammers = loadScammers()) {
  const scammerListText = scammers.length === 0
    ? `*Henüz kayıtlı dolandırıcı bulunmamaktadır.*`
    : scammers.map((s, idx) => 
        `**${idx + 1}.** 👤 **${s.name}**\n` +
        `   └ ⚠️ **Sebep:** ${s.reason}\n` +
        `   └ 🚫 **Ceza:** ${s.punishment || 'Süresiz Karaliste & Uzaklaştırma'}` +
        (s.addedAt ? ` *(<t:${Math.floor(new Date(s.addedAt).getTime() / 1000)}:d>)*` : '')
      ).join('\n\n');

  const content = [
    ComponentsV2Factory.text(
      `# 🚨 ROBLOXLND — RESMİ DOLANDIRICILIK & KARALİSTE MERKEZİ\n\n` +
      `RobloxLand güvencesiyle topluluğumuzda güvenli ticareti sağlamak adına dolandırıcılık teşebbüsünde bulunan, sahte dekont ileten, teslimat yapmayan veya üyelerimizi mağdur eden şahıslar kara listeye alınır ve ifşa edilir.\n\n` +
      `### ⚖️ Şikayet & Karaliste İlkeleri:\n` +
      `1. **📁 İhbar & Kayıt:** Şüpheli şahıslar incelenip deliller doğrulandıktan sonra süresiz olarak Kara Listeye eklenir.\n` +
      `2. **🚫 Kalıcı Yaptırım:** Kara listeye alınan şahısların güven puanı \`0/100\`e düşürülür, sunucudan ve tüm bağlı projelerden süresiz uzaklaştırılır.\n` +
      `3. **🔍 Ticaret Öncesi Kontrol:** Ticaret yapmadan önce aşağıdaki listeden ve ID sorgulama sisteminden karşı tarafı mutlaka kontrol ediniz.\n\n` +
      `### 📋 Güncel Kara Liste / Dolandırıcılar:\n\n` +
      `${scammerListText}\n\n` +
      `-# ⚠️ Dolandırıcılık teşebbüsünde bulunan veya iftira atan kişiler hakkında ters işlem uygulanır.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Danger,
        label: "➕ Karalisteye Ekle (Yetkili)",
        custom_id: "robloxland_add_scammer_btn",
        emoji: { name: "📝" }
      },
      {
        style: ButtonStyle.Primary,
        label: "🚨 Dolandırıcı Şikayet Et",
        custom_id: "robloxland_scam_report",
        emoji: { name: "⚠️" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "📜 Listeyi Yenile",
        custom_id: "robloxland_refresh_scammers",
        emoji: { name: "🔄" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

/**
 * Updates/deploys the live Scammers panel in the designated channel
 */
async function renderScammerPanel(client) {
  try {
    const channel = client.channels.cache.get(SCAMMERS_CHANNEL_ID) || await client.channels.fetch(SCAMMERS_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) return false;

    const payload = buildScammerPanelPayload();
    const messages = await channel.messages.fetch({ limit: 20 }).catch(() => null);
    const botMsg = messages?.find(m => m.author.id === client.user.id);

    if (botMsg) {
      await botMsg.edit(payload).catch(() => {});
    } else {
      await channel.send(payload).catch(() => {});
    }
    return true;
  } catch (err) {
    console.error('[ScammerService] Render error:', err.message);
    return false;
  }
}

/**
 * Adds a new scammer to the blacklist and refreshes the channel panel
 */
async function addScammer({ name, reason, punishment, addedBy }, client) {
  const scammers = loadScammers();
  const newEntry = {
    id: `SCAM-${Date.now().toString().slice(-4)}`,
    name: String(name).trim(),
    reason: String(reason).trim(),
    punishment: String(punishment || 'Süresiz Karaliste & Yasaklanma').trim(),
    addedBy: String(addedBy || 'Yönetim'),
    addedAt: new Date().toISOString()
  };

  scammers.unshift(newEntry);
  saveScammers(scammers);

  if (client) {
    await renderScammerPanel(client).catch(() => {});

    // Staff log kanalına bildir
    try {
      const logChan = client.channels.cache.get(STAFF_LOG_CHANNEL_ID) || await client.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);
      if (logChan && logChan.isTextBased()) {
        await logChan.send({
          content: `🚨 **[ROBLOXLND KARALİSTE]** <@${addedBy}> tarafından **${newEntry.name}** kara listeye eklendi!\n` +
                   `• **Sebep:** ${newEntry.reason}\n` +
                   `• **Ceza:** ${newEntry.punishment}`
        }).catch(() => {});
      }
    } catch (_) {}
  }

  return newEntry;
}

/**
 * Handles interactions related to Scammers panel (Button click, modal submit)
 */
async function handleScammerInteraction(interaction) {
  const customId = interaction.customId;

  // 1. "Karalisteye Ekle (Yetkili)" Butonu
  if (customId === 'robloxland_add_scammer_btn') {
    const isStaff = interaction.member?.permissions?.has(PermissionFlagsBits.ManageGuild) ||
      interaction.member?.permissions?.has(PermissionFlagsBits.ModerateMembers) ||
      interaction.member?.roles?.cache?.some(r => /yetkili|admin|mod|yönetici/i.test(r.name));

    if (!isStaff) {
      return await interaction.reply({
        content: '❌ Bu işlemi yalnızca RobloxLand yetkilileri gerçekleştirebilir.',
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('robloxland_modal_add_scammer')
      .setTitle('🚨 Kara Listeye / Dolandırıcı Ekle');

    const nameInput = new TextInputBuilder()
      .setCustomId('scammer_name')
      .setLabel('Kullanıcı Adı / Etiket / ID')
      .setPlaceholder('Örn: Ahmet#1234 veya Roblox: Gamer99')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const reasonInput = new TextInputBuilder()
      .setCustomId('scammer_reason')
      .setLabel('Dolandırıcılık Sebebi')
      .setPlaceholder('Örn: Sahte dekont iletip teslimat yapmadı')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const punishmentInput = new TextInputBuilder()
      .setCustomId('scammer_punishment')
      .setLabel('Uygulanan Ceza / Yaptırım')
      .setPlaceholder('Örn: Süresiz Karaliste & Güven Puanı 0')
      .setStyle(TextInputStyle.Short)
      .setValue('Süresiz Karaliste & Sunucudan Yasaklama')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nameInput),
      new ActionRowBuilder().addComponents(reasonInput),
      new ActionRowBuilder().addComponents(punishmentInput)
    );

    return await interaction.showModal(modal);
  }

  // 2. Modal Submit: Karaliste Kaydetme
  if (customId === 'robloxland_modal_add_scammer') {
    await interaction.deferReply({ ephemeral: true });

    const name = interaction.fields.getTextInputValue('scammer_name');
    const reason = interaction.fields.getTextInputValue('scammer_reason');
    const punishment = interaction.fields.getTextInputValue('scammer_punishment');

    const entry = await addScammer({
      name,
      reason,
      punishment,
      addedBy: interaction.user.id
    }, interaction.client);

    return await interaction.editReply({
      content: `✅ **${entry.name}** başarıyla RobloxLand Kara Listesine eklendi!\n\n` +
               `📋 **Sebep:** ${entry.reason}\n` +
               `🚫 **Ceza:** ${entry.punishment}\n\n` +
               `📢 <#${SCAMMERS_CHANNEL_ID}> kanalındaki dolandırıcılar paneli otomatik güncellendi.`
    });
  }

  // 3. Listeyi Yenile Butonu
  if (customId === 'robloxland_refresh_scammers') {
    await interaction.deferReply({ ephemeral: true });
    await renderScammerPanel(interaction.client);
    return await interaction.editReply({ content: '✅ Kara liste paneli başarıyla yenilendi.' });
  }

  return false;
}

module.exports = {
  GUILD_ID,
  SCAMMERS_CHANNEL_ID,
  loadScammers,
  saveScammers,
  addScammer,
  buildScammerPanelPayload,
  renderScammerPanel,
  handleScammerInteraction
};
