'use strict';

/**
 * Global Discord.js outgoing message sanitizer & crash guard:
 * 1. Prevents @everyone / @here unintentional pings from bot responses.
 * 2. Completely prevents "Cannot send an empty message" (DiscordAPIError[50006]) across the ENTIRE bot.
 * 3. Patches Message.prototype.reply, TextChannel.prototype.send, User.prototype.send, Interaction.prototype.reply/editReply/followUp, etc.
 */

function _sanitizeString(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/@everyone/gi, '@\u200beveryone').replace(/@here/gi, '@\u200bhere');
}

function _sanitizeEmbed(embed) {
  if (!embed) return embed;
  const e = embed.data ? embed.data : { ...embed };
  if (e.title) e.title = _sanitizeString(e.title);
  if (e.description) e.description = _sanitizeString(e.description);
  if (e.footer && e.footer.text) e.footer.text = _sanitizeString(e.footer.text);
  if (Array.isArray(e.fields)) {
    e.fields = e.fields.map(f => ({
      name: _sanitizeString(f.name || '\u200B'),
      value: _sanitizeString(f.value || '\u200B'),
      inline: f.inline || false
    }));
  }
  return e;
}

function _sanitizeOptions(opts) {
  if (opts === undefined || opts === null) {
    return { content: '\u200B' };
  }

  // If passed as a primitive string
  if (typeof opts === 'string') {
    const sanitized = _sanitizeString(opts).trim();
    return { content: sanitized.length > 0 ? sanitized : '\u200B' };
  }

  // If passed as a number or boolean
  if (typeof opts === 'number' || typeof opts === 'boolean') {
    return { content: String(opts) };
  }

  // If passed as an options object
  const out = { ...opts };
  if (out.content !== undefined && out.content !== null) {
    out.content = _sanitizeString(String(out.content)).trim();
  }

  // Check if payload contains any valid visual or interactive component
  const hasContent = typeof out.content === 'string' && out.content.length > 0;
  const hasEmbeds = Array.isArray(out.embeds) && out.embeds.length > 0;
  const hasFiles = Array.isArray(out.files) && out.files.length > 0;
  const hasComponents = Array.isArray(out.components) && out.components.length > 0;
  const hasPoll = !!out.poll;
  const hasStickers = Array.isArray(out.stickers) && out.stickers.length > 0;

  // Discord Components V2 (flags & 8192 veya type 17/10/9/14) legacy content alanı kullanımını yasaklar.
  let isV2 = out.flags !== undefined && (Number(out.flags) & 8192) !== 0;
  if (!isV2 && Array.isArray(out.components)) {
    isV2 = out.components.some(c => c && (c.type === 17 || c.type === 10 || c.type === 9 || c.type === 14));
  }

  if (isV2) {
    delete out.content;
    out.flags = (Number(out.flags) || 0) | 8192;
  } else {
    // If completely empty, inject zero-width space / fallback so Discord API never rejects it
    if (!hasContent && !hasEmbeds && !hasFiles && !hasComponents && !hasPoll && !hasStickers) {
      out.content = '\u200B';
    }
  }

  if (out.embeds && Array.isArray(out.embeds)) {
    out.embeds = out.embeds.map(_sanitizeEmbed);
  }

  // Sanitize button/component labels
  if (out.components && Array.isArray(out.components)) {
    try {
      out.components = JSON.parse(JSON.stringify(out.components));
      for (const row of out.components) {
        if (row && Array.isArray(row.components)) {
          for (const comp of row.components) {
            if (comp.label) comp.label = _sanitizeString(comp.label);
            if (comp.custom_id) comp.custom_id = _sanitizeString(comp.custom_id);
          }
        }
      }
    } catch (_) {}
  }

  return out;
}

module.exports = function applyGlobalMessageGuard() {
  try {
    const classes = require('discord.js');

    // 1. Patch channel / user / member send methods
    const sendTargets = [
      classes.TextChannel && classes.TextChannel.prototype,
      classes.NewsChannel && classes.NewsChannel.prototype,
      classes.ThreadChannel && classes.ThreadChannel.prototype,
      classes.DMChannel && classes.DMChannel.prototype,
      classes.PartialDMChannel && classes.PartialDMChannel.prototype,
      classes.VoiceChannel && classes.VoiceChannel.prototype,
      classes.StageChannel && classes.StageChannel.prototype,
      classes.ForumChannel && classes.ForumChannel.prototype,
      classes.User && classes.User.prototype,
      classes.GuildMember && classes.GuildMember.prototype
    ];

    for (const proto of sendTargets) {
      if (!proto) continue;
      const origSend = proto.send;
      if (typeof origSend !== 'function') continue;

      proto.send = async function sendSanitized(content, options) {
        let payload;
        if (typeof content === 'string' || content === undefined || content === null) {
          if (options !== undefined && options !== null && typeof options === 'object') {
            payload = _sanitizeOptions({ ...options, content: content !== undefined && content !== null ? content : options.content });
          } else {
            payload = _sanitizeOptions(content);
          }
        } else {
          payload = _sanitizeOptions(content);
        }

        try {
          return await origSend.call(this, payload);
        } catch (err) {
          if (err && (err.code === 50006 || String(err.message || '').includes('Cannot send an empty message'))) {
            try {
              return await origSend.call(this, { content: 'ℹ️ (İçerik boş)' });
            } catch (_) {}
          }
          throw err;
        }
      };
    }

    // 2. Patch Message.prototype.reply and Message.prototype.edit
    if (classes.Message && classes.Message.prototype) {
      const mp = classes.Message.prototype;

      if (typeof mp.reply === 'function') {
        const origReply = mp.reply;
        mp.reply = async function replySanitized(content, options) {
          let payload;
          if (typeof content === 'string' || content === undefined || content === null) {
            if (options !== undefined && options !== null && typeof options === 'object') {
              payload = _sanitizeOptions({ ...options, content: content !== undefined && content !== null ? content : options.content });
            } else {
              payload = _sanitizeOptions(content);
            }
          } else {
            payload = _sanitizeOptions(content);
          }

          try {
            return await origReply.call(this, payload);
          } catch (err) {
            // If Cannot send an empty message
            if (err && (err.code === 50006 || String(err.message || '').includes('Cannot send an empty message'))) {
              try {
                return await origReply.call(this, { content: 'ℹ️ (İçerik boş)' });
              } catch (_) {}
            }
            // If original message was deleted (Unknown Message / 10008), fallback to sending in channel
            if (err && (err.code === 10008 || String(err.message || '').includes('Unknown Message'))) {
              try {
                if (this.channel && typeof this.channel.send === 'function') {
                  return await this.channel.send(payload);
                }
              } catch (_) {}
            }
            throw err;
          }
        };
      }

      if (typeof mp.edit === 'function') {
        const origEdit = mp.edit;
        mp.edit = async function editSanitized(content, options) {
          let payload;
          if (typeof content === 'string' || content === undefined || content === null) {
            if (options !== undefined && options !== null && typeof options === 'object') {
              payload = _sanitizeOptions({ ...options, content: content !== undefined && content !== null ? content : options.content });
            } else {
              payload = _sanitizeOptions(content);
            }
          } else {
            payload = _sanitizeOptions(content);
          }

          try {
            return await origEdit.call(this, payload);
          } catch (err) {
            if (err && (err.code === 50006 || String(err.message || '').includes('Cannot send an empty message'))) {
              try {
                return await origEdit.call(this, { content: 'ℹ️ (İçerik boş)' });
              } catch (_) {}
            }
            throw err;
          }
        };
      }
    }

    // 3. Patch Interaction reply, editReply, followUp
    const interactionProtos = [
      classes.Interaction && classes.Interaction.prototype,
      classes.CommandInteraction && classes.CommandInteraction.prototype,
      classes.ButtonInteraction && classes.ButtonInteraction.prototype,
      classes.ModalSubmitInteraction && classes.ModalSubmitInteraction.prototype,
      classes.StringSelectMenuInteraction && classes.StringSelectMenuInteraction.prototype,
      classes.UserSelectMenuInteraction && classes.UserSelectMenuInteraction.prototype,
      classes.RoleSelectMenuInteraction && classes.RoleSelectMenuInteraction.prototype,
      classes.ChannelSelectMenuInteraction && classes.ChannelSelectMenuInteraction.prototype,
      classes.MentionableSelectMenuInteraction && classes.MentionableSelectMenuInteraction.prototype
    ];

    for (const ip of interactionProtos) {
      if (!ip) continue;

      if (typeof ip.reply === 'function' && !ip.reply._isGuarded) {
        const origReply = ip.reply;
        ip.reply = async function replySanitized(options) {
          const payload = _sanitizeOptions(options);
          try {
            return await origReply.call(this, payload);
          } catch (err) {
            if (err && (err.code === 50006 || String(err.message || '').includes('Cannot send an empty message'))) {
              try {
                return await origReply.call(this, { content: 'ℹ️ (İçerik boş)', ephemeral: true });
              } catch (_) {}
            }
            throw err;
          }
        };
        ip.reply._isGuarded = true;
      }

      if (typeof ip.editReply === 'function' && !ip.editReply._isGuarded) {
        const origEdit = ip.editReply;
        ip.editReply = async function editSanitized(options) {
          const payload = _sanitizeOptions(options);
          try {
            return await origEdit.call(this, payload);
          } catch (err) {
            if (err && (err.code === 50006 || String(err.message || '').includes('Cannot send an empty message'))) {
              try {
                return await origEdit.call(this, { content: 'ℹ️ (İçerik boş)' });
              } catch (_) {}
            }
            throw err;
          }
        };
        ip.editReply._isGuarded = true;
      }

      if (typeof ip.followUp === 'function' && !ip.followUp._isGuarded) {
        const origFollow = ip.followUp;
        ip.followUp = async function followSanitized(options) {
          const payload = _sanitizeOptions(options);
          try {
            return await origFollow.call(this, payload);
          } catch (err) {
            if (err && (err.code === 50006 || String(err.message || '').includes('Cannot send an empty message'))) {
              try {
                return await origFollow.call(this, { content: 'ℹ️ (İçerik boş)', ephemeral: true });
              } catch (_) {}
            }
            throw err;
          }
        };
        ip.followUp._isGuarded = true;
      }
    }

    // 4. Patch WebhookClient send
    try {
      const { WebhookClient } = classes;
      if (WebhookClient && WebhookClient.prototype && typeof WebhookClient.prototype.send === 'function' && !WebhookClient.prototype.send._isGuarded) {
        const origWebhook = WebhookClient.prototype.send;
        WebhookClient.prototype.send = async function webhookSanitized(options) {
          const payload = _sanitizeOptions(options);
          try {
            return await origWebhook.call(this, payload);
          } catch (err) {
            if (err && (err.code === 50006 || String(err.message || '').includes('Cannot send an empty message'))) {
              try {
                return await origWebhook.call(this, { content: 'ℹ️ (İçerik boş)' });
              } catch (_) {}
            }
            throw err;
          }
        };
        WebhookClient.prototype.send._isGuarded = true;
      }
    } catch (_) {}

  } catch (err) {
    try { console.error('[globalMessageGuard] patch failed:', err.message); } catch (_) {}
  }
};
