'use strict';

const { ButtonStyle } = require('discord.js');
const ComponentsV2Factory = require('../utils/componentsV2Factory');

const SECRET_MESSAGE = "Dikkat! bu mesaj sunucunun kurucusu eko yani ege izmirli tarafından saklanmıştır. Bu mesajı görüyorsanız aferin! :D";

/**
 * Gizli Paskalya Yumurtası (Easter Egg) Components V2 Yanıtı
 */
function buildSecretEasterEggPayload() {
  const content = [
    ComponentsV2Factory.text(
      `# ✨ GİZLİ PASKALYA YUMURTASI BULUNDU! ✨\n\n` +
      `> 🕵️‍♂️ **${SECRET_MESSAGE}**\n\n` +
      `-# 🎮 RobloxLand & EkoYıldız Gizli Sistemleri • Sentara Engine`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: "🎉 Aferin Bana! :D",
        custom_id: "eko_easter_egg_ack",
        emoji: { name: "⭐" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

/**
 * Mesajlarda Gizli Kod ve Kelime Kontrolü
 */
async function handleEasterEggMessage(message) {
  if (!message || message.author?.bot) return false;
  const content = message.content?.trim().toLowerCase();
  if (!content) return false;

  const triggers = [
    'e!eko',
    'e!ege',
    'e!izmirli',
    'e!secret',
    'e!easteregg',
    'e!paskalya',
    '.eko',
    '.ege'
  ];

  if (triggers.includes(content)) {
    const payload = buildSecretEasterEggPayload();
    await message.reply(payload);
    return true;
  }

  return false;
}

/**
 * Buton ve Etkileşimlerde Gizli Easter Egg Kontrolü
 */
async function handleEasterEggInteraction(interaction) {
  const customId = interaction?.customId;
  if (!customId) return false;

  const isEasterEgg = (
    customId === 'eko_easter_egg_secret' ||
    customId === 'robloxland_easter_egg_secret' ||
    customId === 'ekoyildiz_easter_egg_secret' ||
    customId.includes('_easter_egg_') ||
    customId.includes('_secret_eko_') ||
    customId === 'eko_easter_egg_ack'
  );

  if (isEasterEgg) {
    if (customId === 'eko_easter_egg_ack') {
      await interaction.reply({
        content: `😎 **Tebrikler!** Sunucunun en gizli köşelerini keşfettin. İyi eğlenceler! :D`,
        ephemeral: true
      });
      return true;
    }

    const payload = buildSecretEasterEggPayload();
    await interaction.reply({ ...payload, ephemeral: true });
    return true;
  }

  return false;
}

module.exports = {
  SECRET_MESSAGE,
  buildSecretEasterEggPayload,
  handleEasterEggMessage,
  handleEasterEggInteraction
};
