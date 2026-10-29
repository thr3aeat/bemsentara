'use strict';

/**
 * domainFailoverService.js
 *
 * Alan adı (ekoyildiz.duckdns.org) her zaman LİDER düğümü göstersin diye. Yalnızca HA lideri
 * çalıştırır (haBoot.js liderlik alınınca başlatır); böylece iki makine DNS kaydını kapışmaz.
 *
 * - DuckDNS: lider kendi adresini yazar. Render'da Render'ın sabit A kaydı (216.24.57.1),
 *   diğer yerlerde (VDS) boş `ip=` gönderilir ve DuckDNS isteği yapanın IP'sini kullanır.
 *   Lider düzenli tekrar yazar: VDS geri gelip lider olursa alan adı da kendiliğinden geri döner.
 * - Render: RENDER_API_KEY varsa alan adı servise özel alan adı olarak eklenir (yoksa Render
 *   o alan adına gelen isteklere sertifika vermez). RENDER_SERVICE_ID'yi Render kendisi verir.
 *
 * Ortam değişkenleri: DUCKDNS_TOKEN (zorunlu; yoksa servis kapalı), DUCKDNS_DOMAIN (varsayılan
 * BASE_URL'deki *.duckdns.org alt alanı), DUCKDNS_IP (adresi elle zorla), DUCKDNS_SYNC_MS.
 */

const RENDER_A_RECORD = '216.24.57.1';
const DEFAULT_SYNC_MS = 5 * 60 * 1000;

function duckDnsHost(env = process.env) {
  if (env.DUCKDNS_DOMAIN) {
    const d = env.DUCKDNS_DOMAIN.trim().toLowerCase();
    return d.endsWith('.duckdns.org') ? d : `${d}.duckdns.org`;
  }
  try {
    const host = new URL(env.BASE_URL || '').hostname.toLowerCase();
    return host.endsWith('.duckdns.org') ? host : null;
  } catch (_) {
    return null;
  }
}

function resolveTargetIp(env = process.env) {
  if (env.DUCKDNS_IP) return env.DUCKDNS_IP.trim();
  return env.RENDER ? RENDER_A_RECORD : ''; // boş: DuckDNS isteği yapanın IP'sini yazar
}

async function updateDuckDns({ host, token, ip, fetchImpl = fetch }) {
  const sub = host.replace(/\.duckdns\.org$/, '');
  const url = `https://www.duckdns.org/update?domains=${encodeURIComponent(sub)}&token=${encodeURIComponent(token)}&ip=${encodeURIComponent(ip)}&verbose=true`;
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(15000) });
  const body = (await res.text()).trim();
  if (!body.startsWith('OK')) throw new Error(`DuckDNS reddetti (${body.split('\n')[0] || res.status})`);
  const [, current = ip, , state = ''] = body.split('\n');
  return { ip: current, changed: state === 'UPDATED' };
}

async function ensureRenderCustomDomain({ apiKey, serviceId, host, fetchImpl = fetch }) {
  const base = `https://api.render.com/v1/services/${serviceId}/custom-domains`;
  const headers = { Authorization: `Bearer ${apiKey}`, Accept: 'application/json', 'Content-Type': 'application/json' };
  const list = await fetchImpl(`${base}?name=${encodeURIComponent(host)}`, { headers, signal: AbortSignal.timeout(15000) });
  if (!list.ok) throw new Error(`Render özel alan adları okunamadı (${list.status})`);
  const items = await list.json();
  const existing = (Array.isArray(items) ? items : []).map(i => i.customDomain || i).find(d => d && d.name === host);
  if (existing) return { created: false, id: existing.id };
  const res = await fetchImpl(base, { method: 'POST', headers, body: JSON.stringify({ name: host }), signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Render özel alan adı eklenemedi (${res.status})`);
  const created = await res.json().catch(() => ({}));
  return { created: true, id: (created[0] || created).id };
}

/**
 * Lider düğümde çağrılır. Döndürdüğü `stop()` zamanlayıcıyı durdurur.
 */
function startDomainFailover({ log = console.log, env = process.env, fetchImpl = fetch } = {}) {
  const host = duckDnsHost(env);
  if (!env.DUCKDNS_TOKEN || !host) {
    log('Alan adı devri kapalı (DUCKDNS_TOKEN veya *.duckdns.org BASE_URL yok).');
    return { stop() {}, syncNow: async () => null };
  }
  const ip = resolveTargetIp(env);
  let lastIp = null;

  const syncNow = async () => {
    try {
      const r = await updateDuckDns({ host, token: env.DUCKDNS_TOKEN, ip, fetchImpl });
      if (r.ip !== lastIp) log(`Alan adı ${host} → ${r.ip || 'bu makine'} (${r.changed ? 'güncellendi' : 'zaten doğru'}).`);
      lastIp = r.ip;
      return r;
    } catch (err) {
      log(`DuckDNS güncellenemedi: ${err.message}`);
      return null;
    }
  };

  if (env.RENDER && env.RENDER_API_KEY && env.RENDER_SERVICE_ID) {
    ensureRenderCustomDomain({ apiKey: env.RENDER_API_KEY, serviceId: env.RENDER_SERVICE_ID, host, fetchImpl })
      .then(r => { if (r.created) log(`Render'a özel alan adı eklendi: ${host}`); })
      .catch(err => log(`Render özel alan adı kontrolü başarısız: ${err.message}`));
  }

  syncNow();
  const timer = setInterval(syncNow, Number(env.DUCKDNS_SYNC_MS) || DEFAULT_SYNC_MS);
  timer.unref();
  return { stop: () => clearInterval(timer), syncNow };
}

module.exports = { startDomainFailover, updateDuckDns, ensureRenderCustomDomain, resolveTargetIp, duckDnsHost, RENDER_A_RECORD };
