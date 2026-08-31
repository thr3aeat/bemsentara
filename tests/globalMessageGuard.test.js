'use strict';

const assert = require('node:assert/strict');
const guard = require('../bot/patches/disableEveryone');

const { _sanitizeOptions, _preserveLegacyEditBody } = guard._test;

const originalMessage = {
  content: 'Sonuç metni',
  embeds: [{ title: 'Sonuç kartı' }]
};

const componentOnlyEdit = _sanitizeOptions({
  components: [{ type: 1, components: [{ type: 2, custom_id: 'again', label: 'Tekrar', style: 1 }] }]
});
const preserved = _preserveLegacyEditBody(originalMessage, componentOnlyEdit);

assert.equal(preserved.content, 'Sonuç metni');
assert.deepEqual(preserved.embeds, originalMessage.embeds);
assert.equal(preserved.components[0].components[0].label, 'Tekrar');

const explicitClear = _preserveLegacyEditBody(originalMessage, {
  content: '',
  embeds: [],
  components: []
});
assert.equal(explicitClear.content, '');
assert.deepEqual(explicitClear.embeds, []);

const v2Edit = { components: [{ type: 17, components: [{ type: 10, content: 'V2' }] }] };
assert.deepEqual(_preserveLegacyEditBody(originalMessage, v2Edit), v2Edit);
assert.equal(Object.prototype.hasOwnProperty.call(v2Edit, 'content'), false);
assert.equal(Object.prototype.hasOwnProperty.call(v2Edit, 'embeds'), false);

console.log('globalMessageGuard regression tests passed');
