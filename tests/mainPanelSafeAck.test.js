const assert = require('assert');
const StaffProgress = require('../models/StaffProgress');

// Mock Mongoose calls so tests don't buffer on DB connection
StaffProgress.findOne = async () => ({
  userId: '1031620522406072350',
  status: 'active',
  level: 5,
  modReports: { unloggedCount: 0 }
});
StaffProgress.countDocuments = async () => 5;
StaffProgress.find = async () => [];

const { handlePanelButton, handlePanelSelect } = require('../bot/services/mainPanelService');

async function testPanelTabAlreadyDeferred() {
  console.log('--- Testing panel_tab_staff when already deferred ---');
  let deferUpdateCalled = false;
  let editReplyCalled = false;

  const fakeInteraction = {
    customId: 'panel_tab_staff',
    deferred: true, // Already deferred (e.g. by deferTimer)
    replied: false,
    user: { id: '1031620522406072350', tag: 'eko#0001' },
    member: {
      user: { id: '1031620522406072350', tag: 'eko#0001' },
      permissions: {
        has: () => true
      }
    },
    guild: {
      name: 'EkoYıldız',
      iconURL: () => null
    },
    deferUpdate: async () => {
      deferUpdateCalled = true;
      const err = new Error('Interaction has already been acknowledged.');
      err.code = 40060;
      throw err;
    },
    editReply: async (data) => {
      editReplyCalled = true;
      return data;
    },
    reply: async () => {
      const err = new Error('Interaction has already been acknowledged.');
      err.code = 40060;
      throw err;
    }
  };

  // Calling handlePanelButton should NOT throw 40060 because deferUpdate should not be called if already deferred
  await handlePanelButton(fakeInteraction);

  assert.strictEqual(deferUpdateCalled, false, 'deferUpdate must NOT be called if interaction is already deferred');
  assert.strictEqual(editReplyCalled, true, 'editReply must be called to update the panel');
  console.log('✅ panel_tab_staff handled safely when already deferred (no 40060 error).');
}

async function testPanelTabNotDeferred() {
  console.log('--- Testing panel_tab_staff when not yet deferred ---');
  let deferUpdateCalls = 0;
  let editReplyCalled = false;

  const fakeInteraction = {
    customId: 'panel_tab_staff',
    deferred: false,
    replied: false,
    user: { id: '1031620522406072350', tag: 'eko#0001' },
    member: {
      user: { id: '1031620522406072350', tag: 'eko#0001' },
      permissions: {
        has: () => true
      }
    },
    guild: {
      name: 'EkoYıldız',
      iconURL: () => null
    },
    deferUpdate: async function() {
      deferUpdateCalls++;
      this.deferred = true;
    },
    editReply: async (data) => {
      editReplyCalled = true;
      return data;
    },
    reply: async () => {}
  };

  await handlePanelButton(fakeInteraction);

  assert.strictEqual(deferUpdateCalls, 1, 'deferUpdate should be called exactly once');
  assert.strictEqual(editReplyCalled, true, 'editReply should be called');
  console.log('✅ panel_tab_staff correctly defers once and updates panel.');
}

async function testPanelCloseSafeUpdate() {
  console.log('--- Testing panel_close when already deferred ---');
  let editReplyCalled = false;
  let updateCalled = false;

  const fakeInteraction = {
    customId: 'panel_close',
    deferred: true,
    replied: false,
    update: async () => {
      updateCalled = true;
      const err = new Error('Interaction has already been acknowledged.');
      err.code = 40060;
      throw err;
    },
    editReply: async () => {
      editReplyCalled = true;
    }
  };

  await handlePanelButton(fakeInteraction);

  assert.strictEqual(updateCalled, false, 'update should NOT be called if already deferred');
  assert.strictEqual(editReplyCalled, true, 'editReply should be called if already deferred');
  console.log('✅ panel_close safely uses editReply when already deferred.');
}

async function testPanelSelectSafeAck() {
  console.log('--- Testing handlePanelSelect when already deferred ---');
  let deferUpdateCalled = false;
  let editReplyCalled = false;

  const fakeInteraction = {
    customId: 'panel_blacklist_select',
    values: ['1'],
    deferred: true,
    replied: false,
    user: { id: '1031620522406072350', tag: 'eko#0001' },
    member: {
      user: { id: '1031620522406072350', tag: 'eko#0001' },
      permissions: {
        has: () => true
      }
    },
    guild: {
      name: 'EkoYıldız',
      iconURL: () => null
    },
    deferUpdate: async () => {
      deferUpdateCalled = true;
      throw new Error('Interaction has already been acknowledged.');
    },
    editReply: async () => {
      editReplyCalled = true;
    }
  };

  await handlePanelSelect(fakeInteraction);

  assert.strictEqual(deferUpdateCalled, false, 'deferUpdate must NOT be called on blacklist select if already deferred');
  assert.strictEqual(editReplyCalled, true, 'editReply should be called');
  console.log('✅ handlePanelSelect safely executes without re-deferring.');
}

async function run() {
  await testPanelTabAlreadyDeferred();
  await testPanelTabNotDeferred();
  await testPanelCloseSafeUpdate();
  await testPanelSelectSafeAck();
  console.log('\n🎉 ALL PANEL SAFE ACKNOWLEDGEMENT TESTS PASSED!');
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
