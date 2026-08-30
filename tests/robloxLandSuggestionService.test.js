'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');

class MockComponent {
  constructor() {
    this.components = [];
  }
  setCustomId(id) { this.customId = id; return this; }
  setLabel(lbl) { this.label = lbl; return this; }
  setStyle(sty) { this.style = sty; return this; }
  setEmoji(em) { this.emoji = em; return this; }
  setTitle(t) { this.title = t; return this; }
  setPlaceholder(p) { this.placeholder = p; return this; }
  setRequired(r) { this.required = r; return this; }
  addComponents(...c) { this.components = c; return this; }
}

const mockDiscord = {
  ActionRowBuilder: MockComponent,
  ButtonBuilder: MockComponent,
  ButtonStyle: { Primary: 1, Secondary: 2, Success: 3, Danger: 4 },
  ModalBuilder: MockComponent,
  TextInputBuilder: MockComponent,
  TextInputStyle: { Short: 1, Paragraph: 2 }
};

const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'discord.js') {
    return mockDiscord;
  }
  return originalRequire.apply(this, arguments);
};

const {
  handleSuggestionMessage,
  handleSuggestionInteraction,
  SUGGESTION_CHANNEL_ID,
  FIRST_ADMIN_ID,
  SECOND_ADMIN_ID
} = require('../bot/services/robloxLandSuggestionService');

const SUGGESTIONS_DB_FILE = path.join(__dirname, '../data/robloxland_suggestions.json');

test('robloxLandSuggestionService constants are set correctly', () => {
  assert.equal(SUGGESTION_CHANNEL_ID, '1538469516953001994');
  assert.equal(FIRST_ADMIN_ID, '1497600770634289194');
  assert.equal(SECOND_ADMIN_ID, '1263456561410605120');
});

test('handleSuggestionMessage sends first to FIRST_ADMIN_ID (1497600770634289194)', async () => {
  const sentDMs = [];
  const mockClient = {
    users: {
      fetch: async (id) => {
        return {
          id,
          send: async (payload) => {
            sentDMs.push({ targetId: id, payload });
            return {};
          }
        };
      }
    }
  };

  const mockMessage = {
    id: 'test_msg_001',
    guild: { id: 'test_guild_1' },
    guildId: 'test_guild_1',
    channelId: SUGGESTION_CHANNEL_ID,
    author: { id: 'req_user_1', tag: 'UserOne#1234', username: 'UserOne', bot: false },
    content: 'Yeni bir script eklensin lütfen',
    attachments: new Map(),
    react: async () => {}
  };

  const handled = await handleSuggestionMessage(mockMessage, mockClient);
  assert.equal(handled, true);
  assert.equal(sentDMs.length, 1);
  assert.equal(sentDMs[0].targetId, FIRST_ADMIN_ID);
  assert.ok(sentDMs[0].payload.content.includes('Yeni bir script eklensin'));
});

test('handleSuggestionInteraction forwards to SECOND_ADMIN_ID when FIRST_ADMIN_ID clicks Hayır', async () => {
  const sentDMs = [];
  const mockClient = {
    users: {
      fetch: async (id) => {
        return {
          id,
          send: async (payload) => {
            sentDMs.push({ targetId: id, payload });
            return {};
          }
        };
      }
    }
  };

  let updatedMessage = null;
  const mockInteraction = {
    customId: 'istek_hayir_req_user_1_test_msg_001',
    isButton: () => true,
    isStringSelectMenu: () => false,
    isModalSubmit: () => false,
    user: { id: FIRST_ADMIN_ID },
    message: { content: 'İstek bildirimi' },
    update: async (opts) => {
      updatedMessage = opts;
    }
  };

  const handled = await handleSuggestionInteraction(mockInteraction, mockClient);
  assert.equal(handled, true);
  assert.ok(updatedMessage.content.includes('2. YETKİLİYE AKTARILDI'));
  assert.equal(sentDMs.length, 1);
  assert.equal(sentDMs[0].targetId, SECOND_ADMIN_ID);
  assert.ok(sentDMs[0].payload.content.includes('1. Yetkiliden Sana Yönlendirildi'));

  // Cleanup test entries from DB file
  try {
    if (fs.existsSync(SUGGESTIONS_DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(SUGGESTIONS_DB_FILE, 'utf8'));
      delete data['test_msg_001'];
      delete data['user_1_test_msg_001'];
      fs.writeFileSync(SUGGESTIONS_DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }
  } catch (_) {}
});
