const test = require('node:test');
const assert = require('node:assert/strict');
const Ticket = require('../models/Ticket');
const Economy = require('../models/Economy');
const { sendTicketCloseRatingDM } = require('../bot/services/ticketRatingService');

test('Ticket rating properties exist and can be set', async () => {
  const ticket = new Ticket({
    ticketId: 'TEST-RATE-101',
    userId: '1234567890',
    subject: 'Test Reklam ve Destek Ticket',
    category: 'reklam_destek',
    status: 'closed'
  });

  assert.strictEqual(ticket.rated, false);
  assert.strictEqual(ticket.ratingScore, null);

  ticket.rated = true;
  ticket.ratingScore = 5;
  ticket.ratingNote = 'Harika destek ve hızlı hizmet!';

  assert.strictEqual(ticket.rated, true);
  assert.strictEqual(ticket.ratingScore, 5);
  assert.strictEqual(ticket.ratingNote, 'Harika destek ve hızlı hizmet!');
});

test('sendTicketCloseRatingDM handles missing client gracefully', async () => {
  const ticket = {
    ticketId: 'TEST-DM-1',
    userId: '999999999',
    category: 'reklam_destek'
  };

  const result = await sendTicketCloseRatingDM(ticket, 'Admin', 'Test Kapatma', null);
  assert.strictEqual(result, false);
});
