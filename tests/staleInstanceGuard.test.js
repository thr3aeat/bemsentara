'use strict';
const { it } = require('node:test');
const assert = require('node:assert/strict');
const { isStaleCopyMessage } = require('../bot/services/staleInstanceGuard');

it('yalnızca botun accent renkli V2 mesajını eski kopya sayar', () => {
  const m = (o) => ({ author: { id: 'me' }, flags: { bitfield: 1 << 15 }, components: [{ type: 17, accent_color: 1 }], ...o });
  assert.equal(isStaleCopyMessage(m(), 'me'), true);
  assert.equal(isStaleCopyMessage(m({ components: [{ type: 17 }] }), 'me'), false);
  assert.equal(isStaleCopyMessage(m({ author: { id: 'x' } }), 'me'), false);
  assert.equal(isStaleCopyMessage(m({ webhookId: '1' }), 'me'), false);
  assert.equal(isStaleCopyMessage(m({ flags: { bitfield: 0 } }), 'me'), false);
});
