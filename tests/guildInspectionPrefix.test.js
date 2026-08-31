'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Collection, PermissionFlagsBits } = require('discord.js');
const { handleGuildInspectionMessage } = require('../bot/services/guildInspectionCommands');

function createMessage(content) {
  const replies = [];
  const role = {
    id: 'role-1',
    name: 'Test Rolü',
    position: 5,
    hexColor: '#ff0000',
    members: new Collection()
  };
  const roles = new Collection([[role.id, role]]);

  return {
    content,
    replies,
    author: { id: 'owner-1', tag: 'owner#0001' },
    member: { permissions: { has: flag => flag === PermissionFlagsBits.Administrator } },
    guild: {
      id: 'guild-1',
      ownerId: 'owner-1',
      roles: {
        cache: roles,
        fetch: async () => roles
      }
    },
    channel: {
      send: async payload => {
        replies.push(typeof payload === 'string' ? payload : payload.content);
        return payload;
      }
    },
    reply: async payload => {
      replies.push(typeof payload === 'string' ? payload : payload.content);
      return { edit: async () => {}, delete: async () => {} };
    }
  };
}

for (const prefix of ['e!', 's!', 'e !', 's !', '!', '.']) {
  test(`tumroller supports ${prefix} prefix`, async () => {
    const message = createMessage(`${prefix}tumroller`);
    const handled = await handleGuildInspectionMessage(message);

    assert.equal(handled, true);
    assert.equal(message.replies.length, 1);
    assert.match(message.replies[0], /Sunucudaki Tüm Roller/);
    assert.match(message.replies[0], /Test Rolü/);
  });
}

test('unknown e! command is left for the suggestion handler', async () => {
  const message = createMessage('e!bilinmeyenkomut');
  assert.equal(await handleGuildInspectionMessage(message), false);
  assert.equal(message.replies.length, 0);
});
