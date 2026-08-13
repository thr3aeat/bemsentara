'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { handleGruptanCekCommand, AUTHORIZED_USER_ID } = require('../bot/services/robloxGroupDemoteService');

test('robloxGroupDemoteService module exports required functions and constants', () => {
  assert.equal(typeof handleGruptanCekCommand, 'function');
  assert.equal(AUTHORIZED_USER_ID, '1031620522406072350');
});

test('handleGruptanCekCommand rejects unauthorized users', async () => {
  let repliedContent = '';
  const mockMessage = {
    author: { id: 'unauthorized_user_123' },
    reply: async (options) => {
      repliedContent = options.content || '';
      return {};
    }
  };

  await handleGruptanCekCommand(mockMessage, ['SomeUser']);
  assert.ok(repliedContent.includes('yetkiniz bulunmamaktadır'));
});

test('handleGruptanCekCommand warns when no target user is provided', async () => {
  let repliedContent = '';
  const mockMessage = {
    author: { id: '1031620522406072350' },
    reply: async (options) => {
      repliedContent = options.content || '';
      return {};
    }
  };

  await handleGruptanCekCommand(mockMessage, []);
  assert.ok(repliedContent.includes('Kullanım:'));
});

test('handleGruptanCekCommand handles missing TMTCOOKIE env variable gracefully', async () => {
  const originalCookie = process.env.TMTCOOKIE;
  delete process.env.TMTCOOKIE;

  let editedEmbeds = [];
  const mockMessage = {
    author: { id: '1031620522406072350' },
    reply: async () => ({
      edit: async (options) => {
        editedEmbeds = options.embeds || [];
      }
    })
  };

  try {
    await handleGruptanCekCommand(mockMessage, ['TestUser']);
    assert.equal(editedEmbeds.length, 1);
    assert.ok(editedEmbeds[0].data.description.includes('TMTCOOKIE'));
  } finally {
    if (originalCookie) process.env.TMTCOOKIE = originalCookie;
  }
});
