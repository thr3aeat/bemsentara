const test = require('node:test');
const assert = require('node:assert/strict');

test('giveaway admin dependencies expose the user activity collection', () => {
  const Store = require('../models/Store');

  assert.ok(Store.userActivityLogs, 'userActivityLogs collection should be exported');
  assert.equal(typeof Store.userActivityLogs.find, 'function');
});
