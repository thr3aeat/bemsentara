'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  addScammer,
  loadScammers,
  saveScammers,
  buildScammerPanelPayload
} = require('../bot/services/robloxLandScammerService');

const SCAMMERS_FILE = path.join(__dirname, '../data/robloxland_scammers.json');

test('adds a scammer entry and persists to storage', async () => {
  const originalData = loadScammers();

  const scammer = await addScammer({
    name: 'ScammerTest#9999',
    reason: 'Sahte dekont ileterek Robux teslimatı yapmadı',
    punishment: 'Süresiz Karaliste & Tüm Sunuculardan Yasaklanma',
    addedBy: 'admin_123'
  });

  assert.equal(scammer.name, 'ScammerTest#9999');
  assert.equal(scammer.reason, 'Sahte dekont ileterek Robux teslimatı yapmadı');
  assert.equal(scammer.punishment, 'Süresiz Karaliste & Tüm Sunuculardan Yasaklanma');
  assert.equal(scammer.addedBy, 'admin_123');

  const updatedList = loadScammers();
  assert.ok(updatedList.some(s => s.name === 'ScammerTest#9999'));

  // Clean up
  saveScammers(originalData);
});

test('buildScammerPanelPayload renders clean components V2 with list', () => {
  const mockScammers = [
    {
      id: 'SCAM-01',
      name: 'DolandırıcıAli',
      reason: 'Hesap çalma teşebbüsü',
      punishment: 'Kalıcı Ban',
      addedBy: 'mod',
      addedAt: '2026-08-31T12:00:00.000Z'
    }
  ];

  const payload = buildScammerPanelPayload(mockScammers);
  assert.ok(payload);
  assert.ok(Array.isArray(payload.components));
});
