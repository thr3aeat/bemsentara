'use strict';

const { ButtonStyle } = require('discord.js');
const SignOffRequest = require('../../models/SignOffRequest');
const { CHANNELS } = require('./staffAutomation');
const ComponentsV2Factory = require('../utils/componentsV2Factory');
const TypographyHelper = require('../utils/typographyHelper');

async function createSignOffRequest(client, actionType, details) {
  const requestId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
  const request = new SignOffRequest({
    requestId,
    actionType,
    details
  });
  await request.save();

  const detailsString = typeof details === 'object' ? JSON.stringify(details, null, 2) : String(details);

  const payload = {
    flags: ComponentsV2Factory.FLAGS,
    components: [
      ComponentsV2Factory.container(0xE67E22, [
        ...ComponentsV2Factory.headerBlock(`Bürokratik İmza Zinciri - Evrak #${requestId}`, "📂"),
        ComponentsV2Factory.section(
          `Yüksek riskli idari eylem tetiklendi. İşlemin onaylanması için 1. ve 2. Derece imza onayları gereklidir.\n\n` +
          `📄 **Evrak Tipi:** \`${actionType}\`\n` +
          `⏱️ **Oluşturulma Zamanı:** ${TypographyHelper.timestamp(new Date(), "R")}`
        ),
        ComponentsV2Factory.separator(true),
        ComponentsV2Factory.text(
          `⚖️ **İdari Detaylar ve Parametreler:**\n` +
          TypographyHelper.codeBlock(detailsString, "json")
        ),
        ComponentsV2Factory.separator(false),
        ComponentsV2Factory.text(
          TypographyHelper.subtext(`Eko Yıldız İdari İşler • Evrak ID: ${requestId}`)
        ),
        ComponentsV2Factory.actionRow([
          {
            custom_id: `signoff_1st_${requestId}`,
            label: "✍️ 1. Derece İmza Ekle",
            style: ButtonStyle.Primary,
          },
          {
            custom_id: `signoff_2nd_${requestId}`,
            label: "✍️ 2. Derece İmza Ekle",
            style: ButtonStyle.Success,
          },
          {
            custom_id: `signoff_veto_${requestId}`,
            label: "❌ Evrağı Reddet / Veto Et",
            style: ButtonStyle.Danger,
          },
        ]),
      ]),
    ],
  };

  const logChan = await client.channels.fetch(CHANNELS.TERFI_LOG).catch(() => null);
  if (logChan && logChan.isTextBased()) {
    await logChan.send(payload);
  }

  return requestId;
}

module.exports = { createSignOffRequest };
