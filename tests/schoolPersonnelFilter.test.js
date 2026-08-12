const test = require('node:test');
const assert = require('node:assert/strict');
const StaffProgress = require('../models/StaffProgress');

test('sendContractDM blocks sending DM if user is not in StaffProgress or not active', async () => {
  const origFindOne = StaffProgress.findOne;
  let sentDM = false;

  const mockClient = {
    users: {
      fetch: async () => ({
        send: async () => { sentDM = true; }
      })
    }
  };

  try {
    // 1. Case: User not in StaffProgress at all
    StaffProgress.findOne = async () => null;
    const { sendContractDM } = require('../bot/services/moderatorSchool');
    await sendContractDM('user_not_in_staff_123', mockClient);
    assert.equal(sentDM, false, 'DM should NOT be sent when user is not in personnel system');

    // 2. Case: User in StaffProgress but status is inactive/suspended
    StaffProgress.findOne = async () => ({ userId: 'user_inactive', status: 'suspended' });
    await sendContractDM('user_inactive', mockClient);
    assert.equal(sentDM, false, 'DM should NOT be sent when user status is not active');
  } finally {
    StaffProgress.findOne = origFindOne;
  }
});
