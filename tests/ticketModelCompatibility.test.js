'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Ticket = require('../models/Ticket');
const { tickets } = require('../models/Store');

test('Ticket model exposes countDocuments for staff ticket summaries', async () => {
  assert.equal(typeof Ticket.countDocuments, 'function');

  const marker = `compat-${Date.now()}-${Math.random()}`;
  const created = tickets.create({ ticketId: marker, status: 'compat-test' });
  try {
    assert.equal(await Ticket.countDocuments({ ticketId: marker }), 1);
    assert.equal(await Ticket.countDocuments({ ticketId: `${marker}-missing` }), 0);
  } finally {
    tickets.deleteById(created._id);
  }
});
