'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Collection, MessageFlags } = require('discord.js');
const {
  GUILD_ID,
  CHANNEL_ID,
  ROLE_IDS,
  buildSelfRolePanelPayload,
  handleSelfRoleInteraction
} = require('../bot/services/robloxLandSelfRolePanelService');

test('self-role panel is Components V2 without an accent color', () => {
  const payload = buildSelfRolePanelPayload();
  const container = payload.components[0].toJSON();
  const json = JSON.stringify(container);

  assert.equal(CHANNEL_ID, '1538466308688183367');
  assert.equal(payload.flags, MessageFlags.IsComponentsV2);
  assert.equal(Object.hasOwn(container, 'accent_color'), false);
  assert.equal(container.components.length, 10);
  assert.match(json, /rl_selfrole_region/);
  assert.match(json, /rl_selfrole_interests/);
  assert.match(json, /rl_selfrole_profile/);
  assert.match(json, /rl_selfrole_notifications/);
  assert.doesNotMatch(json, /1537465202403053630/, 'Booster rolü panelden dağıtılmamalı');
});

function createInteraction(customId, values, assignedRoleIds = []) {
  const roleNames = {
    [ROLE_IDS.region_tr]: 'Türk Üye',
    [ROLE_IDS.region_foreign]: 'Yabancı Üye',
    [ROLE_IDS.interest_map]: 'Map',
    [ROLE_IDS.interest_system]: 'Sistem',
    [ROLE_IDS.interest_gfx]: 'GFX',
    [ROLE_IDS.interest_model]: 'Model',
    [ROLE_IDS.profile_male]: 'Erkek',
    [ROLE_IDS.profile_female]: 'Kız',
    [ROLE_IDS.notification_giveaway]: 'Çekiliş'
  };
  const guildRoles = new Collection(
    Object.entries(roleNames).map(([id, name]) => [id, { id, name, editable: true, managed: false }])
  );
  const memberRoleCache = new Collection(
    assignedRoleIds.map(id => [id, guildRoles.get(id)])
  );
  const added = [];
  const removed = [];
  const replies = [];
  const guild = { roles: { cache: guildRoles } };
  const member = {
    guild,
    roles: {
      cache: memberRoleCache,
      add: async ids => added.push(...(Array.isArray(ids) ? ids : [ids])),
      remove: async ids => removed.push(...(Array.isArray(ids) ? ids : [ids]))
    }
  };

  return {
    customId,
    values,
    guild,
    guildId: GUILD_ID,
    member,
    user: { tag: 'test#0001' },
    reply: async payload => replies.push(payload),
    added,
    removed,
    replies
  };
}

test('region selection replaces the other region role', async () => {
  const interaction = createInteraction(
    'rl_selfrole_region',
    ['region_tr'],
    [ROLE_IDS.region_foreign]
  );

  assert.equal(await handleSelfRoleInteraction(interaction), true);
  assert.deepEqual(interaction.removed, [ROLE_IDS.region_foreign]);
  assert.deepEqual(interaction.added, [ROLE_IDS.region_tr]);
  assert.equal(interaction.replies[0].ephemeral, true);
});

test('interest selections toggle each selected role independently', async () => {
  const interaction = createInteraction(
    'rl_selfrole_interests',
    ['interest_map', 'interest_gfx'],
    [ROLE_IDS.interest_map]
  );

  await handleSelfRoleInteraction(interaction);
  assert.deepEqual(interaction.removed, [ROLE_IDS.interest_map]);
  assert.deepEqual(interaction.added, [ROLE_IDS.interest_gfx]);
});
