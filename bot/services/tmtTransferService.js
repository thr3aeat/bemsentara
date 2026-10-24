'use strict';

// TMT ordu transfer başvuru sistemi: destek sistemiyle aynı ticket altyapısını kullanır
// (kategori "transfer"); başvuru formu diğer ordulardan gelen üyeler için özelleştirilmiştir.

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags
} = require('discord.js');
const { TMT_GUILD_ID } = require('../../config');
const { appMeta, saveStoreNow } = require('../../models/Store');

const TRANSFER_CHANNEL_ID = '1563518341048565800';
const OPEN_BUTTON_ID = 'tmt_transfer_open';
const MODAL_ID = 'tmt_transfer_modal';

const FIELDS = [
  { id: 'roblox', label: 'Roblox kullanıcı adın', style: TextInputStyle.Short, required: true, max: 50 },
  { id: 'army', label: 'Geldiğin ordu (isim ve grup linki)', style: TextInputStyle.Short, required: true, max: 200 },
  { id: 'rank', label: 'O ordudaki rütben ve süren', style: TextInputStyle.Short, required: true, max: 150 },
  { id: 'reason', label: 'Neden TMT\'ye transfer olmak istiyorsun?', style: TextInputStyle.Paragraph, required: true, max: 1000 },
  { id: 'proof', label: 'Kanıt (rütbe ekran görüntüsü linki vb.)', style: TextInputStyle.Paragraph, required: false, max: 500 }
];

function buildTransferPanel() {
  const gap = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false);
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('## 🔄 Ordu Transfer Başvurusu'))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
      '> Başka bir ordudan TMT\'ye geçmek istiyorsan buradan başvurabilirsin. Başvurun yalnızca senin ve ' +
      'transfer ekibinin görebileceği özel bir kanalda değerlendirilir.'
    ))
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
      '* **Başvurmadan önce;**\n' +
      '  * Roblox hesabın TMT ile bağlı olsun (`/update`).\n' +
      '  * Geldiğin ordudaki rütbeni gösteren bir kanıt hazırla.\n' +
      '  * Rütben, eski ordudaki görevin ve süren değerlendirilerek denk rütbe verilir.\n' +
      '  * Sahte bilgi veren başvurular reddedilir ve yaptırım uygulanabilir.\n' +
      '  * Açık bir başvurun varsa yenisini açma, sonucu bekle.'
    ))
    .addSeparatorComponents(gap())
    .addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(OPEN_BUTTON_ID).setLabel('Transfer Başvurusu Yap').setEmoji('🔄').setStyle(ButtonStyle.Primary)
    ));
  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

// Kanalda tek panel tutar: kayıtlı mesajı günceller, yoksa gönderir.
async function ensureTransferPanel(client) {
  const guild = await client.guilds.fetch(TMT_GUILD_ID).catch(() => null);
  const channel = guild && await guild.channels.fetch(TRANSFER_CHANNEL_ID).catch(() => null);
  if (!channel) return;

  const payload = buildTransferPanel();
  const meta = appMeta ? appMeta.findOne({ key: 'tmtTransferPanel' }) : null;
  const existing = meta?.messageId && await channel.messages.fetch(meta.messageId).catch(() => null);
  if (existing) return existing.edit(payload);

  const sent = await channel.send(payload);
  if (appMeta) {
    if (meta) { meta.messageId = sent.id; meta.save(); }
    else appMeta.create({ key: 'tmtTransferPanel', messageId: sent.id, channelId: channel.id });
    saveStoreNow();
  }
}

function showTransferModal(interaction) {
  const modal = new ModalBuilder().setCustomId(MODAL_ID).setTitle('Ordu Transfer Başvurusu');
  for (const f of FIELDS) {
    modal.addComponents(new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(f.id).setLabel(f.label).setStyle(f.style).setRequired(f.required).setMaxLength(f.max)
    ));
  }
  return interaction.showModal(modal);
}

// Transfer formunu destek ticketinin konu/açıklama alanlarına çevirir.
function buildTicketFields(interaction) {
  const get = (id) => (interaction.fields.getTextInputValue(id) || '').trim();
  return {
    support_subject: `Transfer: ${get('army')}`.slice(0, 100),
    support_description:
      `**Roblox:** ${get('roblox')}\n` +
      `**Geldiği ordu:** ${get('army')}\n` +
      `**Rütbe / süre:** ${get('rank')}\n` +
      `**Sebep:** ${get('reason')}\n` +
      `**Kanıt:** ${get('proof') || 'Belirtilmedi'}`
  };
}

module.exports = {
  OPEN_BUTTON_ID,
  MODAL_ID,
  ensureTransferPanel,
  showTransferModal,
  buildTicketFields
};
