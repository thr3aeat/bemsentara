'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createAdminControlCenterService } = require('../server/services/adminControlCenterService');

test('control center returns real summary counts and sorted queue items', async () => {
  const service = createAdminControlCenterService({
    listUsers: async () => [{ discordId: '1', username: 'Eko', isBanned: true }],
    listTickets: async () => [{ ticketId: 'T-1', subject: 'Yanıt bekliyor', updatedAt: new Date('2026-09-20T09:00:00Z'), status: 'open' }],
    listSubmissions: async () => [{ _id: 'F-1', status: 'PENDING', createdAt: new Date('2026-09-20T10:00:00Z') }],
    listStaff: async () => [{ userId: '1', status: 'active' }],
    listActivityLogs: async () => [{ id: 'L-1', discordId: '1', activityType: 'login', timestamp: new Date('2026-09-20T11:00:00Z') }],
    getLiveUsers: () => [{ userId: '1', username: 'Eko', url: '/dashboard', lastSeen: Date.parse('2026-09-20T11:59:55Z') }],
    getSystemTelemetry: () => ({ services: [{ id: 'web', name: 'Web sitesi', status: 'online', statusLabel: 'Operasyonel' }] }),
    now: () => new Date('2026-09-20T12:00:00Z'),
  });

  const snapshot = await service.getSnapshot();
  assert.equal(snapshot.summary.activeUsers24h, 1);
  assert.equal(snapshot.summary.liveUsersNow, 1);
  assert.equal(snapshot.summary.openTickets, 1);
  assert.equal(snapshot.summary.pendingSubmissions, 1);
  assert.equal(snapshot.summary.activeBans, 1);
  assert.equal(snapshot.summary.activeStaff, 1);
  assert.equal(snapshot.queue[0].type, 'ticket');
  assert.equal(snapshot.liveUsers[0].username, 'Eko');
  assert.equal(snapshot.services[0].id, 'web');
  assert.deepEqual(snapshot.errors, []);
});

test('control center isolates failed model queries and returns null for unknown metrics', async () => {
  const broken = async () => { throw new Error('store unavailable'); };
  const service = createAdminControlCenterService({
    listUsers: broken,
    listTickets: async () => [{ ticketId: 'T-1', status: 'open' }],
    listSubmissions: async () => [],
    listStaff: async () => [],
    listActivityLogs: async () => [],
    getLiveUsers: () => [],
    getSystemTelemetry: () => ({ services: [] }),
    now: () => new Date('2026-09-20T12:00:00Z'),
  });
  const snapshot = await service.getSnapshot();
  assert.equal(snapshot.summary.activeBans, null);
  assert.equal(snapshot.summary.openTickets, 1);
  assert.deepEqual(snapshot.errors, [{ section: 'users', message: 'Veri alınamadı' }]);
});
