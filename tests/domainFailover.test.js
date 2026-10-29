'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  startDomainFailover, updateDuckDns, ensureRenderCustomDomain, resolveTargetIp, duckDnsHost, RENDER_A_RECORD
} = require('../bot/services/domainFailoverService');

const reply = (status, body) => ({ ok: status < 400, status, text: async () => body, json: async () => JSON.parse(body) });

describe('alan adı devri', () => {
  it('alan adını BASE_URL veya DUCKDNS_DOMAIN içinden bulur', () => {
    assert.equal(duckDnsHost({ BASE_URL: 'https://ekoyildiz.duckdns.org' }), 'ekoyildiz.duckdns.org');
    assert.equal(duckDnsHost({ BASE_URL: 'https://x.onrender.com' }), null);
    assert.equal(duckDnsHost({ DUCKDNS_DOMAIN: 'ekoyildiz' }), 'ekoyildiz.duckdns.org');
  });

  it("Render'da Render A kaydını, VDS'de otomatik IP'yi yazar", () => {
    assert.equal(resolveTargetIp({ RENDER: 'true' }), RENDER_A_RECORD);
    assert.equal(resolveTargetIp({}), '');
    assert.equal(resolveTargetIp({ RENDER: 'true', DUCKDNS_IP: '1.2.3.4' }), '1.2.3.4');
  });

  it('DuckDNS cevabını çözer, KO cevabında hata verir', async () => {
    let url;
    const r = await updateDuckDns({
      host: 'ekoyildiz.duckdns.org', token: 't', ip: RENDER_A_RECORD,
      fetchImpl: async (u) => { url = u; return reply(200, `OK\n${RENDER_A_RECORD}\n\nUPDATED`); }
    });
    assert.match(url, /domains=ekoyildiz&token=t&ip=216\.24\.57\.1/);
    assert.deepEqual(r, { ip: RENDER_A_RECORD, changed: true });
    await assert.rejects(updateDuckDns({ host: 'ekoyildiz.duckdns.org', token: 'bad', ip: '', fetchImpl: async () => reply(200, 'KO') }), /DuckDNS reddetti/);
  });

  it('Render özel alan adı yoksa ekler, varsa dokunmaz', async () => {
    const calls = [];
    const fetchEmpty = async (u, o = {}) => { calls.push(o.method || 'GET'); return o.method === 'POST' ? reply(201, '{"id":"cdm-1"}') : reply(200, '[]'); };
    assert.deepEqual(await ensureRenderCustomDomain({ apiKey: 'k', serviceId: 's', host: 'a.duckdns.org', fetchImpl: fetchEmpty }), { created: true, id: 'cdm-1' });
    assert.deepEqual(calls, ['GET', 'POST']);

    const fetchHas = async () => reply(200, '[{"customDomain":{"id":"cdm-2","name":"a.duckdns.org"}}]');
    assert.deepEqual(await ensureRenderCustomDomain({ apiKey: 'k', serviceId: 's', host: 'a.duckdns.org', fetchImpl: fetchHas }), { created: false, id: 'cdm-2' });
  });

  it('token yoksa hiçbir istek atmaz', async () => {
    let called = false;
    const h = startDomainFailover({ log: () => {}, env: { BASE_URL: 'https://ekoyildiz.duckdns.org' }, fetchImpl: async () => { called = true; } });
    assert.equal(await h.syncNow(), null);
    h.stop();
    assert.equal(called, false);
  });

  it('lider açılınca DuckDNS ve Render alan adını ayarlar', async () => {
    const urls = [];
    const fetchImpl = async (u, o = {}) => {
      urls.push(`${o.method || 'GET'} ${u.split('?')[0]}`);
      if (u.startsWith('https://www.duckdns.org/')) return reply(200, `OK\n${RENDER_A_RECORD}\n\nNOCHANGE`);
      return o.method === 'POST' ? reply(201, '{"id":"x"}') : reply(200, '[]');
    };
    const h = startDomainFailover({
      log: () => {}, fetchImpl,
      env: { BASE_URL: 'https://ekoyildiz.duckdns.org', DUCKDNS_TOKEN: 't', RENDER: 'true', RENDER_API_KEY: 'k', RENDER_SERVICE_ID: 'srv-1' }
    });
    await new Promise(r => setTimeout(r, 20));
    h.stop();
    assert.ok(urls.includes('GET https://www.duckdns.org/update'));
    assert.ok(urls.includes('POST https://api.render.com/v1/services/srv-1/custom-domains'));
  });
});
