const axios = require('axios');
const { DMChannel } = require('discord.js');
const logger = require('../../utils/logger');

let installed = false;

function serialisePayload(payload) {
  if (typeof payload === 'string') return { content: payload };
  if (!payload || typeof payload !== 'object') return {};
  const out = { ...payload };
  if (Array.isArray(out.embeds)) out.embeds = out.embeds.map((embed) => typeof embed?.toJSON === 'function' ? embed.toJSON() : embed);
  if (Array.isArray(out.components)) out.components = out.components.map((component) => typeof component?.toJSON === 'function' ? component.toJSON() : component);
  delete out.files; // Discord upload attachments require multipart; retain Sentara's original error for those.
  return out;
}

async function sendWithPhibi(recipientId, payload) {
  const token = String(process.env.PHIBI_TOKEN || '').trim();
  if (!token || !recipientId) throw new Error('Phibi DM fallback yapılandırılmamış.');
  const headers = { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' };
  const dm = await axios.post('https://discord.com/api/v10/users/@me/channels', { recipient_id: String(recipientId) }, { headers, timeout: 12000 });
  return axios.post(`https://discord.com/api/v10/channels/${dm.data.id}/messages`, serialisePayload(payload), { headers, timeout: 12000 });
}

/**
 * Captures only Discord DM channel sends. Guild channels and every other Sentara
 * feature continue to use Sentara; Phibi is used solely after a DM send failure.
 */
function installPhibiDmFallback() {
  if (installed || !DMChannel?.prototype?.send) return;
  installed = true;
  const originalSend = DMChannel.prototype.send;
  DMChannel.prototype.send = async function sentaraFirstDmSend(payload, ...args) {
    try {
      return await originalSend.call(this, payload, ...args);
    } catch (sentaraError) {
      const recipientId = this.recipientId || this.recipient?.id;
      try {
        await sendWithPhibi(recipientId, payload);
        logger.warn(`[DM Fallback] Sentara DM gönderemedi; Phibi üzerinden teslim edildi (${recipientId}).`);
        return { fallback: 'phibi', recipientId };
      } catch (phibiError) {
        logger.warn(`[DM Fallback] Sentara ve Phibi DM gönderemedi (${recipientId}): ${phibiError.message}`);
        throw sentaraError;
      }
    }
  };
}

module.exports = { installPhibiDmFallback, sendWithPhibi };
