const test = require('node:test');
const assert = require('node:assert/strict');

const { renderStatusPage } = require('../server/views');
const { getSystemTelemetry } = require('../server/services/systemStatusService');

test('status page connects to live system telemetry and does not claim fake invented uptime', () => {
  const html = renderStatusPage(null);

  // Fake hardcoded statistics must not be present
  assert.doesNotMatch(html, /99\.98/);

  // Live telemetry features
  assert.match(html, /Canlı Sistem Durumu/);
  assert.match(html, /btnRefreshStatus/);
  assert.match(html, /\/api\/status/);
  assert.match(html, /valWebUptime/);
});

test('status page lists all known core and auxiliary services with live status', () => {
  const html = renderStatusPage(null);

  assert.match(html, /Web sitesi/);
  assert.match(html, /Authentication/);
  assert.match(html, /Discord Bot/);
  assert.match(html, /Ticket sistemi/);
  assert.match(html, /Moderasyon/);
  assert.match(html, /API/);
});

test('getSystemTelemetry returns real-time node process and services telemetry', () => {
  const telemetry = getSystemTelemetry();

  assert.ok(telemetry.timestamp > 0);
  assert.ok(telemetry.process.uptimeSeconds >= 0);
  assert.ok(telemetry.process.uptimeFormatted);
  assert.ok(Array.isArray(telemetry.services));
  assert.ok(telemetry.services.length >= 6);

  const serviceNames = telemetry.services.map(s => s.name);
  assert.ok(serviceNames.includes('Web sitesi'));
  assert.ok(serviceNames.includes('Discord Bot'));
  assert.ok(serviceNames.includes('Ticket sistemi'));
});
