const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const StaffProgress = require('../models/StaffProgress');
const { ensureAdminGuildMembership, syncStaffRobloxRanks, isActualActiveStaff } = require('../bot/services/staffAutomation');

test('ensureAdminGuildMembership blocks DM to users who are not active staff', async () => {
  const origFindOneUser = User.findOne;
  const origFindOneStaff = StaffProgress.findOne;

  let dmMessages = [];
  const mockClient = {
    guilds: {
      fetch: async () => ({
        members: {
          fetch: async () => null // Not in admin guild
        }
      })
    },
    users: {
      fetch: async () => ({
        send: async (msg) => { dmMessages.push(msg); }
      })
    }
  };

  try {
    // 1. Normal member with no StaffProgress
    User.findOne = async () => ({ discordId: 'normal_user', isStaff: false });
    StaffProgress.findOne = async () => null;

    const res1 = await ensureAdminGuildMembership(mockClient, 'normal_user');
    assert.equal(res1, false);
    assert.equal(dmMessages.length, 0, 'No warning DM should be sent to normal user');

    // 2. Dismissed staff member
    User.findOne = async () => ({ discordId: 'dismissed_user', isStaff: false, modStatus: 'dismissed' });
    StaffProgress.findOne = async () => ({ userId: 'dismissed_user', status: 'dismissed', level: 0 });

    const res2 = await ensureAdminGuildMembership(mockClient, 'dismissed_user');
    assert.equal(res2, false);
    assert.equal(dmMessages.length, 0, 'No warning DM should be sent to dismissed staff');

    // 3. User with isActualActiveStaff
    assert.equal(await isActualActiveStaff(mockClient, 'normal_user'), false);
    assert.equal(await isActualActiveStaff(mockClient, 'dismissed_user'), false);

  } finally {
    User.findOne = origFindOneUser;
    StaffProgress.findOne = origFindOneStaff;
  }
});

test('syncStaffRobloxRanks rejects non-staff members and does not create StaffProgress', async () => {
  const origFindOneUser = User.findOne;
  const origFindOneStaff = StaffProgress.findOne;

  try {
    User.findOne = async () => ({ discordId: 'normal_user_roblox', robloxId: '12345678', isStaff: false });
    StaffProgress.findOne = async () => null;

    const res = await syncStaffRobloxRanks(null, 'normal_user_roblox');
    assert.equal(res, false, 'Non-staff member should not be ranked in roblox or created in staff system');
  } finally {
    User.findOne = origFindOneUser;
    StaffProgress.findOne = origFindOneStaff;
  }
});
