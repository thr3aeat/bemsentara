const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const StaffProgress = require('../models/StaffProgress');

test('syncStaffDiscordRoles strips staff roles when user is marked as dismissed or not staff', async () => {
  const origFindOneUser = User.findOne;
  const origFindOneStaff = StaffProgress.findOne;

  let removedRoles = [];
  let addedRoles = [];

  const mockCache = new Map([['1518692389169135666', { id: '1518692389169135666' }]]);
  mockCache.map = function(fn) {
    return Array.from(this.values()).map(fn);
  };

  const mockClient = {
    guilds: {
      fetch: async () => ({
        roles: { cache: new Map(), fetch: async () => {} },
        members: {
          fetch: async () => ({
            roles: {
              cache: mockCache,
              remove: async (roles) => { removedRoles.push(...roles); },
              add: async (roles) => { addedRoles.push(...roles); }
            }
          })
        }
      })
    }
  };

  try {
    User.findOne = async () => ({ discordId: '123', robloxId: '456', isStaff: false, isLeft: true, modStatus: 'dismissed' });
    StaffProgress.findOne = async () => ({ userId: '123', status: 'dismissed' });

    const { syncStaffDiscordRoles } = require('../bot/services/staffAutomation');
    const result = await syncStaffDiscordRoles(mockClient, '123');

    assert.equal(result, true);
    assert.ok(removedRoles.includes('1518692389169135666'), 'Dismissed user should have Mod role removed');
    assert.equal(addedRoles.length, 0, 'No staff roles should be added to dismissed user');
  } finally {
    User.findOne = origFindOneUser;
    StaffProgress.findOne = origFindOneStaff;
  }
});
