// server/views/giveaways/giveawayAdminPage.js
// Çekiliş yönetim paneli — çekilişler, katılımcılar, şüpheli kayıtlar, reklamlar, denetim logları
const { _esc: esc } = require('./giveawayLayout');

const STATUS_META = {
  DRAFT: { label: 'Taslak', tone: 'muted' },
  SCHEDULED: { label: 'Planlandı', tone: 'warn' },
  ACTIVE: { label: 'Aktif', tone: 'ok' },
  ENDED: { label: 'Süre doldu', tone: 'warn' },
  WINNER_SELECTING: { label: 'Kazanan seçiliyor', tone: 'warn' },
  COMPLETED: { label: 'Tamamlandı', tone: 'muted' },
  CANCELLED: { label: 'İptal', tone: 'bad' }
};

// Durum makinesine (giveawayService ALLOWED_STATUS_TRANSITIONS) uygun menü geçişleri
const STATUS_ACTIONS = {
  DRAFT: [['ACTIVE', 'Yayınla'], ['SCHEDULED', 'Planlandı olarak işaretle'], ['CANCELLED', 'İptal et']],
  SCHEDULED: [['ACTIVE', 'Şimdi başlat'], ['CANCELLED', 'İptal et']],
  ACTIVE: [['ENDED', 'Erken bitir'], ['CANCELLED', 'İptal et']],
  ENDED: [['ACTIVE', 'Yeniden aç'], ['CANCELLED', 'İptal et']],
  CANCELLED: [['DRAFT', 'Taslağa geri al']]
};

const fmt = n => (Number(n) || 0).toLocaleString('tr-TR');
const fmtDate = d => (d ? new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const fmtDateTime = d => (d ? new Date(d).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) : '0');

function badge(text, tone) {
  return `<span class="badge badge-${tone}">${esc(text)}</span>`;
}

function statusBadge(status) {
  const meta = STATUS_META[status] || { label: status || '—', tone: 'muted' };
  return badge(meta.label, meta.tone);
}

function primaryAction(g) {
  const id = esc(g._id);
  const title = esc(g.title);
  switch (g.status) {
    case 'DRAFT':
      return `<button class="btn btn-sm btn-primary" data-act="status" data-id="${id}" data-status="ACTIVE" data-title="${title}">Yayınla</button>`;
    case 'SCHEDULED':
      return `<button class="btn btn-sm" data-act="status" data-id="${id}" data-status="ACTIVE" data-title="${title}">Şimdi başlat</button>`;
    case 'ACTIVE':
    case 'ENDED':
      return `<button class="btn btn-sm btn-primary" data-act="draw" data-id="${id}" data-title="${title}">Kazanan seç</button>`;
    case 'COMPLETED':
      return `<a class="btn btn-sm" href="/cekilisler/canli/${encodeURIComponent(g._id)}" target="_blank">Canlı ekran</a>`;
    default:
      return '';
  }
}

function rowMenu(g) {
  const id = esc(g._id);
  const title = esc(g.title);
  const items = [
    `<a href="/cekilisler/${encodeURIComponent(g.slug || g._id)}" target="_blank">Sitede görüntüle</a>`,
    `<button data-act="recalc" data-id="${id}">Sayaçları yeniden hesapla</button>`
  ];
  if (g.status === 'COMPLETED') {
    items.push(`<button data-act="redraw" data-id="${id}" data-title="${title}">Yeniden çek</button>`);
  }
  (STATUS_ACTIONS[g.status] || []).forEach(([to, label]) => {
    // Birincil buton zaten bu geçişi yapıyorsa menüde tekrarlama
    if ((g.status === 'DRAFT' || g.status === 'SCHEDULED') && to === 'ACTIVE') return;
    items.push(`<button data-act="status" data-id="${id}" data-status="${to}" data-title="${title}">${label}</button>`);
  });
  items.push(`<hr><button class="danger" data-act="delete" data-id="${id}" data-title="${title}">Sil</button>`);

  return `
    <details class="menu">
      <summary class="btn btn-sm btn-ghost" aria-label="Diğer işlemler">⋯</summary>
      <div class="menu-list">${items.join('')}</div>
    </details>`;
}

function emptyRow(cols, text) {
  return `<tr><td colspan="${cols}" class="empty">${text}</td></tr>`;
}

function taskRowHtml(task = {}) {
  const t = { title: '', platform: 'youtube', link: '', strategy: 'VISIT_ONLY', tickets: 1, required: false, ...task };
  const opt = (value, label, current) => `<option value="${value}"${value === current ? ' selected' : ''}>${label}</option>`;
  return `
    <div class="task-row">
      <div class="task-main">
        <input type="text" class="input task-title" placeholder="Görev başlığı" value="${esc(t.title)}" required>
        <input type="text" class="input task-link" placeholder="Bağlantı (https://...)" value="${esc(t.link)}">
      </div>
      <div class="task-opts">
        <select class="input task-platform" aria-label="Platform">
          ${[['youtube', 'YouTube'], ['discord', 'Discord'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['kick', 'Kick'], ['twitch', 'Twitch'], ['website', 'Web sitesi']].map(([v, l]) => opt(v, l, t.platform)).join('')}
        </select>
        <select class="input task-strategy" aria-label="Doğrulama">
          ${[['VISIT_ONLY', 'Ziyaret yeterli'], ['AUTO', 'Otomatik onay'], ['API', 'API kontrolü'], ['PROOF_REQUIRED', 'Kanıt iste'], ['MANUAL', 'Admin onayı']].map(([v, l]) => opt(v, l, t.strategy)).join('')}
        </select>
        <label class="inline-field">Bilet <input type="number" class="input task-reward" value="${Number(t.tickets) || 1}" min="1"></label>
        <label class="check"><input type="checkbox" class="task-mandatory"${t.required ? ' checked' : ''}> Zorunlu</label>
        <button type="button" class="icon-btn" data-act="remove-task" title="Görevi kaldır">✕</button>
      </div>
    </div>`;
}

function renderGiveawayAdminPage({ user, stats = {}, giveaways = [], participants = [], fraudFlags = [], ads = [], socialAds = [], socialAnalytics = {}, auditLogs = [], liveUsers = [] }) {
  const titleById = new Map(giveaways.map(g => [String(g._id), g.title]));
  const activeCount = giveaways.filter(g => g.status === 'ACTIVE').length;
  const needsAttention = giveaways.filter(g => g.status === 'ENDED' || g.status === 'DRAFT');

  // ── Çekilişler ──
  const giveawayRows = giveaways.map(g => `
    <tr>
      <td>
        <div class="cell-title">${esc(g.title)}</div>
        <div class="cell-sub">${esc(g.prize)}</div>
      </td>
      <td>${statusBadge(g.status)}</td>
      <td class="num">${fmt(g.totalParticipants || g.totalEntries)}</td>
      <td class="num">${fmt(g.totalTickets)}</td>
      <td class="muted nowrap">${fmtDate(g.endDate)}</td>
      <td>
        <div class="row-actions">
          ${primaryAction(g)}
          ${rowMenu(g)}
        </div>
      </td>
    </tr>`).join('');

  // ── Katılımcılar ──
  const participantRows = participants.map(p => {
    const valid = (p.status || 'VALID') === 'VALID' && !p.isDisqualified;
    const gTitle = p.giveawayTitle || titleById.get(String(p.giveawayId)) || p.giveawayId;
    return `
      <tr data-search="${esc(`${p.username || ''} ${p.ip || ''} ${p.referralCode || ''}`.toLowerCase())}" data-giveaway="${esc(p.giveawayId)}">
        <td><div class="cell-title">${esc(p.username || '—')}</div></td>
        <td class="muted">${esc(gTitle)}</td>
        <td class="num">${fmt(p.tickets ?? p.ticketCount ?? 1)}</td>
        <td class="mono muted">${esc(p.ip || '—')}</td>
        <td>${valid ? badge('Geçerli', 'ok') : badge('Diskalifiye', 'bad')}</td>
        <td>
          ${valid
            ? `<button class="btn btn-sm btn-ghost danger-text" data-act="disqualify" data-id="${esc(p._id)}">Diskalifiye et</button>`
            : `<button class="btn btn-sm btn-ghost" data-act="restore" data-id="${esc(p._id)}">Geri al</button>`}
        </td>
      </tr>`;
  }).join('');

  // ── Şüpheli ──
  const fraudRows = fraudFlags.map(f => `
    <tr>
      <td>
        <div class="cell-title">${esc(f.username || '—')}</div>
        <div class="cell-sub">${esc(f.giveawayTitle || titleById.get(String(f.giveawayId)) || f.giveawayId || '')}</div>
      </td>
      <td>${esc(f.reason || '—')}</td>
      <td class="mono muted">${esc(f.ip || '—')}</td>
      <td class="muted nowrap">${fmtDateTime(f.timestamp)}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-sm btn-ghost danger-text" data-act="fraud-ban" data-id="${esc(f._id)}">Diskalifiye et</button>
          <button class="btn btn-sm btn-ghost" data-act="fraud-ignore" data-id="${esc(f._id)}">Yoksay</button>
        </div>
      </td>
    </tr>`).join('');

  // ── Reklamlar ──
  const adRows = ads.map(ad => `
    <tr>
      <td>
        <div class="cell-title">${esc(ad.title)}</div>
        <div class="cell-sub">${esc(ad.sponsorName || '')} · <a href="${esc(ad.targetUrl)}" target="_blank" rel="noopener">${esc(ad.targetUrl)}</a></div>
      </td>
      <td class="num">${fmt(ad.impressions)}</td>
      <td class="num">${fmt(ad.clicks)}</td>
      <td class="num">%${pct(ad.clicks || 0, ad.impressions)}</td>
      <td>${ad.isActive ? badge('Aktif', 'ok') : badge('Pasif', 'muted')}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-sm btn-ghost" data-act="ad-toggle" data-id="${esc(ad._id)}">${ad.isActive ? 'Durdur' : 'Başlat'}</button>
          <button class="btn btn-sm btn-ghost danger-text" data-act="ad-delete" data-id="${esc(ad._id)}">Sil</button>
        </div>
      </td>
    </tr>`).join('');

  const socialRows = socialAds.map(s => `
    <tr>
      <td>
        <div class="cell-title">${esc(s.accountName || s.title)}${s.isFeatured ? ' <span class="star" title="Öne çıkan">★</span>' : ''}</div>
        <div class="cell-sub">${esc(s.platform || '')}${s.seasonalTag ? ' · ' + esc(s.seasonalTag) : ''}</div>
      </td>
      <td class="num">${fmt(s.views)}</td>
      <td class="num">${fmt(s.interactionsCompleted)}</td>
      <td class="num">${fmt(s.clicks)} <span class="muted">(%${pct(s.clicks || 0, s.views)})</span></td>
      <td>${s.isActive !== false ? badge('Aktif', 'ok') : badge('Pasif', 'muted')}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-sm btn-ghost" data-act="social-edit" data-key="${esc(s.key)}">Düzenle</button>
          <button class="btn btn-sm btn-ghost" data-act="social-toggle" data-key="${esc(s.key)}">${s.isActive !== false ? 'Durdur' : 'Başlat'}</button>
        </div>
      </td>
    </tr>`).join('');

  // ── Kayıtlar ──
  const auditRows = auditLogs.map(log => {
    const details = log.details || {};
    const summary = Object.entries(details)
      .filter(([, v]) => v !== null && v !== undefined && typeof v !== 'object')
      .slice(0, 4)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');
    return `
      <tr>
        <td><code class="tag">${esc(log.action)}</code></td>
        <td>${esc(log.adminUsername || log.performedBy || 'Sistem')}</td>
        <td class="muted small" title="${esc(JSON.stringify(details))}">${esc(summary || '—')}</td>
        <td class="muted nowrap">${fmtDateTime(log.timestamp)}</td>
      </tr>`;
  }).join('');

  const liveRows = liveUsers.slice(0, 15).map(u => `
    <tr>
      <td>${esc(u.username)}</td>
      <td class="mono muted">${esc(u.ip)}</td>
      <td class="muted nowrap">${fmtDateTime(u.time)}</td>
    </tr>`).join('');

  const giveawayOptions = giveaways.map(g => `<option value="${esc(g._id)}">${esc(g.title)}</option>`).join('');
  // </script> kırılmasını engellemek için < karakterini kaçır
  const socialAdsJson = JSON.stringify(socialAds).replace(/</g, '\\u003c');
  const defaultTask = taskRowHtml({ title: 'Eko Yıldız YouTube kanalına abone ol', link: 'https://www.youtube.com/@eko8yildiz', required: true });

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Çekiliş Paneli — EkoYıldız</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      color-scheme: dark;
      --bg: #0a0a0c;
      --surface: #121215;
      --surface-2: #18181c;
      --border: rgba(255, 255, 255, 0.08);
      --border-strong: rgba(255, 255, 255, 0.16);
      --text: #ededef;
      --muted: #8b8b94;
      --accent: #a9a5ff;
      --ok: #4ade80;
      --warn: #fbbf24;
      --bad: #f87171;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font: 400 14px/1.5 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
    a { color: inherit; }
    button { font: inherit; color: inherit; }

    /* Üst bar */
    .topbar { position: sticky; top: 0; z-index: 50; background: rgba(10,10,12,.85); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); }
    .topbar-inner { max-width: 1200px; margin: 0 auto; padding: 0 1.25rem; height: 56px; display: flex; align-items: center; gap: 1rem; }
    .brand { font-weight: 700; font-size: .95rem; text-decoration: none; display: flex; align-items: center; gap: .5rem; }
    .brand-icon { width: 26px; height: 26px; border-radius: 7px; border: 1px solid var(--border); background: var(--surface); display: grid; place-items: center; font-size: .85rem; }
    .topbar-links { margin-left: auto; display: flex; gap: .25rem; }
    .topbar-links a { color: var(--muted); text-decoration: none; font-size: .85rem; padding: .4rem .65rem; border-radius: 7px; }
    .topbar-links a:hover { color: var(--text); }

    .tabs-wrap { border-bottom: 1px solid var(--border); }
    .tabs { max-width: 1200px; margin: 0 auto; padding: 0 1.25rem; display: flex; gap: 1.5rem; overflow-x: auto; scrollbar-width: none; }
    .tab { background: none; border: none; border-bottom: 2px solid transparent; padding: .8rem 0; margin-bottom: -1px; color: var(--muted); font-weight: 500; cursor: pointer; white-space: nowrap; display: inline-flex; gap: .4rem; align-items: center; }
    .tab:hover { color: var(--text); }
    .tab.active { color: var(--text); border-bottom-color: var(--text); }
    .count { font-size: .72rem; padding: 0 .4rem; border-radius: 999px; background: rgba(255,255,255,.07); color: var(--muted); line-height: 1.5; }
    .count.alert { background: rgba(248,113,113,.15); color: var(--bad); }

    main { max-width: 1200px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
    .view { display: none; }
    .view.active { display: block; }

    .head { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
    .head h1 { font-size: 1.35rem; font-weight: 700; letter-spacing: -.02em; }
    .head p { color: var(--muted); margin-top: .2rem; }
    h2 { font-size: 1rem; font-weight: 600; margin: 2rem 0 .75rem; }

    /* Butonlar */
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: .4rem; height: 34px; padding: 0 .9rem; border-radius: 8px; border: 1px solid var(--border-strong); background: transparent; font-weight: 500; font-size: .85rem; text-decoration: none; cursor: pointer; white-space: nowrap; transition: background .12s, opacity .12s; }
    .btn:hover { background: rgba(255,255,255,.05); }
    .btn:disabled { opacity: .5; cursor: wait; }
    .btn-primary { background: var(--text); color: #0a0a0c; border-color: var(--text); }
    .btn-primary:hover { background: var(--text); opacity: .88; }
    .btn-danger { background: var(--bad); color: #0a0a0c; border-color: var(--bad); }
    .btn-danger:hover { background: var(--bad); opacity: .88; }
    .btn-ghost { border-color: transparent; color: var(--muted); }
    .btn-ghost:hover { color: var(--text); }
    .btn-sm { height: 28px; padding: 0 .6rem; font-size: .8rem; }
    .danger-text { color: var(--bad); }
    .icon-btn { background: none; border: none; color: var(--muted); cursor: pointer; padding: .25rem .4rem; border-radius: 6px; }
    .icon-btn:hover { color: var(--bad); background: rgba(248,113,113,.08); }

    /* İstatistikler */
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid var(--border); border-radius: 12px; background: var(--surface); margin-bottom: 1.5rem; }
    .stat { padding: 1rem 1.25rem; }
    .stat + .stat { border-left: 1px solid var(--border); }
    .stat-label { color: var(--muted); font-size: .8rem; }
    .stat-value { font-size: 1.5rem; font-weight: 600; letter-spacing: -.02em; margin-top: .15rem; }

    .notice { display: flex; gap: .75rem; align-items: center; padding: .75rem 1rem; border: 1px solid rgba(251,191,36,.25); background: rgba(251,191,36,.06); border-radius: 10px; margin-bottom: 1.25rem; font-size: .85rem; }

    /* Tablolar */
    .table-wrap { border: 1px solid var(--border); border-radius: 12px; background: var(--surface); overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-weight: 500; font-size: .78rem; color: var(--muted); padding: .65rem 1rem; border-bottom: 1px solid var(--border); white-space: nowrap; }
    td { padding: .7rem 1rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tbody tr:hover td { background: rgba(255,255,255,.015); }
    .cell-title { font-weight: 500; }
    .cell-sub { color: var(--muted); font-size: .8rem; margin-top: .1rem; max-width: 420px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cell-sub a { color: var(--muted); }
    .num { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .muted { color: var(--muted); }
    .small { font-size: .8rem; max-width: 380px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .nowrap { white-space: nowrap; }
    .mono { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: .8rem; }
    .tag { font-family: ui-monospace, Consolas, monospace; font-size: .75rem; padding: .1rem .4rem; border-radius: 5px; background: rgba(255,255,255,.06); }
    .empty { text-align: center; color: var(--muted); padding: 2.5rem 1rem; }
    .star { color: var(--warn); }
    .row-actions { display: flex; gap: .35rem; align-items: center; justify-content: flex-end; }
    th:last-child { text-align: right; }

    .badge { display: inline-flex; align-items: center; gap: .35rem; font-size: .75rem; font-weight: 500; padding: .15rem .55rem; border-radius: 999px; border: 1px solid var(--border); white-space: nowrap; }
    .badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .badge-ok { color: var(--ok); }
    .badge-warn { color: var(--warn); }
    .badge-bad { color: var(--bad); }
    .badge-muted { color: var(--muted); }

    /* Satır menüsü */
    .menu { position: relative; }
    .menu summary { list-style: none; }
    .menu summary::-webkit-details-marker { display: none; }
    .menu-list { position: fixed; z-index: 60; min-width: 210px; background: var(--surface-2); border: 1px solid var(--border-strong); border-radius: 10px; padding: .3rem; box-shadow: 0 12px 32px rgba(0,0,0,.5); }
    .menu-list a, .menu-list button { display: block; width: 100%; text-align: left; background: none; border: none; padding: .45rem .65rem; border-radius: 6px; text-decoration: none; font-size: .85rem; cursor: pointer; }
    .menu-list a:hover, .menu-list button:hover { background: rgba(255,255,255,.06); }
    .menu-list .danger { color: var(--bad); }
    .menu-list hr { border: none; border-top: 1px solid var(--border); margin: .3rem 0; }

    /* Filtre */
    .filters { display: flex; gap: .5rem; margin-bottom: .75rem; flex-wrap: wrap; }
    .filters .input { width: auto; min-width: 220px; }

    /* Formlar */
    .form-card { max-width: 760px; }
    .section { border: 1px solid var(--border); border-radius: 12px; background: var(--surface); padding: 1.25rem; margin-bottom: 1rem; }
    .section-title { font-weight: 600; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; }
    .section-hint { color: var(--muted); font-size: .8rem; font-weight: 400; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .field { margin-bottom: 1rem; }
    .field:last-child { margin-bottom: 0; }
    .grid-2 .field, .grid-3 .field { margin-bottom: 0; }
    .grid-2 + .field, .grid-2 + .grid-2, .field + .grid-2, .grid-3 + .grid-2 { margin-top: 1rem; }
    label.lbl { display: block; font-size: .8rem; font-weight: 500; color: var(--muted); margin-bottom: .35rem; }
    .input { width: 100%; height: 36px; background: var(--bg); border: 1px solid var(--border-strong); border-radius: 8px; color: var(--text); padding: 0 .7rem; font: inherit; font-size: .875rem; }
    textarea.input { height: auto; padding: .55rem .7rem; resize: vertical; }
    .input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(169,165,255,.15); }
    input[type="color"].input { padding: 3px; cursor: pointer; }
    .check { display: inline-flex; align-items: center; gap: .45rem; font-size: .85rem; cursor: pointer; white-space: nowrap; }
    .check input { width: 16px; height: 16px; accent-color: var(--accent); }
    .inline-field { display: inline-flex; align-items: center; gap: .4rem; font-size: .8rem; color: var(--muted); }
    .inline-field .input { width: 64px; }
    details.advanced > summary { cursor: pointer; color: var(--muted); font-weight: 500; list-style: none; }
    details.advanced > summary::before { content: '▸ '; }
    details.advanced[open] > summary::before { content: '▾ '; }
    details.advanced[open] > summary { margin-bottom: 1rem; }
    .form-actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1.25rem; }

    .task-list { display: flex; flex-direction: column; gap: .6rem; }
    .task-row { border: 1px solid var(--border); border-radius: 10px; padding: .75rem; background: var(--bg); display: flex; flex-direction: column; gap: .5rem; }
    .task-main { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
    .task-opts { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; }
    .task-opts select.input { width: auto; }
    .task-opts .icon-btn { margin-left: auto; }

    /* Modal */
    .modal { display: none; position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,.7); backdrop-filter: blur(4px); align-items: center; justify-content: center; padding: 1rem; }
    .modal.open { display: flex; }
    .modal-box { width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; background: var(--surface); border: 1px solid var(--border-strong); border-radius: 14px; padding: 1.5rem; }
    .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .modal-head h3 { font-size: 1.05rem; font-weight: 600; }
    .modal-text { color: var(--muted); font-size: .85rem; margin-bottom: 1rem; }

    /* Toast */
    .toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(20px); opacity: 0; z-index: 200; background: var(--surface-2); border: 1px solid var(--border-strong); border-radius: 10px; padding: .65rem 1rem; font-size: .85rem; transition: opacity .2s, transform .2s; pointer-events: none; }
    .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    .toast.error { border-color: rgba(248,113,113,.5); color: var(--bad); }

    @media (max-width: 760px) {
      .stats { grid-template-columns: 1fr 1fr; }
      .stat:nth-child(3) { border-left: none; }
      .stat:nth-child(n+3) { border-top: 1px solid var(--border); }
      .grid-2, .grid-3, .task-main { grid-template-columns: 1fr; }
      .topbar-links a:first-child { display: none; }
    }
  </style>
</head>
<body>

  <header class="topbar">
    <div class="topbar-inner">
      <a href="/admin/giveaways" class="brand"><span class="brand-icon">🎁</span>Çekiliş Paneli</a>
      <nav class="topbar-links">
        <a href="/cekilisler" target="_blank">Siteyi gör ↗</a>
        <a href="/admin">Ana admin</a>
      </nav>
    </div>
  </header>

  <div class="tabs-wrap">
    <nav class="tabs">
      <button class="tab active" data-tab="giveaways">Çekilişler <span class="count">${giveaways.length}</span></button>
      <button class="tab" data-tab="participants">Katılımcılar <span class="count">${participants.length}</span></button>
      <button class="tab" data-tab="fraud">Şüpheli <span class="count${fraudFlags.length ? ' alert' : ''}">${fraudFlags.length}</span></button>
      <button class="tab" data-tab="ads">Reklamlar</button>
      <button class="tab" data-tab="logs">Kayıtlar</button>
    </nav>
  </div>

  <main>

    <!-- ÇEKİLİŞLER -->
    <section id="view-giveaways" class="view active">
      <div class="head">
        <div>
          <h1>Çekilişler</h1>
          <p>Çekiliş oluştur, yayınla ve kazananları seç.</p>
        </div>
        <button class="btn btn-primary" data-tab-link="new">+ Yeni çekiliş</button>
      </div>

      <div class="stats">
        <div class="stat"><div class="stat-label">Aktif çekiliş</div><div class="stat-value">${fmt(stats.activeGiveaways ?? activeCount)}</div></div>
        <div class="stat"><div class="stat-label">Katılımcı</div><div class="stat-value">${fmt(stats.totalParticipants)}</div></div>
        <div class="stat"><div class="stat-label">Dağıtılan bilet</div><div class="stat-value">${fmt(stats.totalTickets)}</div></div>
        <div class="stat"><div class="stat-label">Şüpheli kayıt</div><div class="stat-value">${fmt(stats.fraudCount ?? fraudFlags.length)}</div></div>
      </div>

      ${needsAttention.length ? `
        <div class="notice">
          <span>⚠️</span>
          <span>${needsAttention.map(g => `<strong>${esc(g.title)}</strong> — ${g.status === 'DRAFT' ? 'taslak, sitede görünmüyor' : 'süresi doldu, kazanan seçilmeyi bekliyor'}`).join('<br>')}</span>
        </div>` : ''}

      <div class="table-wrap">
        <table>
          <thead><tr><th>Çekiliş</th><th>Durum</th><th>Katılımcı</th><th>Bilet</th><th>Bitiş</th><th></th></tr></thead>
          <tbody>${giveawayRows || emptyRow(6, 'Henüz çekiliş yok. <a href="#new" data-tab-link="new">İlk çekilişi oluştur</a>.')}</tbody>
        </table>
      </div>
    </section>

    <!-- YENİ ÇEKİLİŞ -->
    <section id="view-new" class="view">
      <div class="head">
        <div>
          <h1>Yeni çekiliş</h1>
          <p>Zorunlu alanlar: başlık, ödül ve bitiş tarihi.</p>
        </div>
        <button class="btn btn-ghost" data-tab-link="giveaways">← Çekilişlere dön</button>
      </div>

      <form id="createForm" class="form-card">
        <div class="section">
          <div class="section-title">Temel bilgiler</div>
          <div class="field">
            <label class="lbl" for="f-title">Başlık</label>
            <input id="f-title" class="input" name="title" placeholder="Örn: 10.000 Robux topluluk çekilişi" required minlength="3">
          </div>
          <div class="grid-2">
            <div class="field">
              <label class="lbl" for="f-prize">Ödül</label>
              <input id="f-prize" class="input" name="prize" placeholder="Örn: 3 kişiye 3000 Robux" required minlength="2">
            </div>
            <div class="field">
              <label class="lbl" for="f-winners">Kazanan sayısı</label>
              <input id="f-winners" class="input" type="number" name="winnerCount" value="1" min="1" max="50">
            </div>
          </div>
          <div class="field">
            <label class="lbl" for="f-desc">Açıklama</label>
            <textarea id="f-desc" class="input" name="description" rows="3" placeholder="Kurallar, ödül teslimi, katılım şartları..."></textarea>
          </div>
          <div class="grid-2">
            <div class="field">
              <label class="lbl" for="f-start">Başlangıç <span class="section-hint">(boş = hemen)</span></label>
              <input id="f-start" class="input" type="datetime-local" name="startDate">
            </div>
            <div class="field">
              <label class="lbl" for="f-end">Bitiş</label>
              <input id="f-end" class="input" type="datetime-local" name="endDate" required>
            </div>
          </div>
          <div class="field" style="margin-top:1rem">
            <label class="lbl" for="f-cover">Kapak görseli URL <span class="section-hint">(isteğe bağlı)</span></label>
            <input id="f-cover" class="input" type="url" name="coverImage" placeholder="https://...">
          </div>
        </div>

        <div class="section">
          <div class="section-title">
            <span>Görevler <span class="section-hint">— katılımcılar bunları yaparak bilet kazanır</span></span>
            <button type="button" class="btn btn-sm" data-act="add-task">+ Görev ekle</button>
          </div>
          <div id="taskList" class="task-list">${defaultTask}</div>
        </div>

        <div class="section">
          <div class="section-title">Yayın</div>
          <div class="grid-2">
            <div class="field">
              <label class="lbl" for="f-status">Durum</label>
              <select id="f-status" class="input" name="status">
                <option value="ACTIVE" selected>Hemen yayınla</option>
                <option value="SCHEDULED">Başlangıç tarihinde yayınla</option>
                <option value="DRAFT">Taslak olarak kaydet</option>
              </select>
            </div>
            <div class="field" style="display:flex;align-items:flex-end;padding-bottom:.5rem">
              <label class="check"><input type="checkbox" name="isFeatured" checked> Çekilişler sayfasında öne çıkar</label>
            </div>
          </div>
        </div>

        <div class="section">
          <details class="advanced">
            <summary>Gelişmiş ayarlar</summary>
            <div class="grid-3">
              <div class="field">
                <label class="lbl" for="f-backup">Yedek kazanan</label>
                <input id="f-backup" class="input" type="number" name="backupWinnerCount" value="1" min="0" max="20">
              </div>
              <div class="field">
                <label class="lbl" for="f-max">Kişi başı maks. bilet</label>
                <input id="f-max" class="input" type="number" name="maxEntriesPerUser" value="50" min="1" max="500">
              </div>
              <div class="field">
                <label class="lbl" for="f-sponsor">Sponsor</label>
                <input id="f-sponsor" class="input" name="sponsor" value="Eko Yıldız">
              </div>
            </div>
            <div class="grid-2">
              <div class="field">
                <label class="lbl" for="f-refticket">Davet başına bilet</label>
                <input id="f-refticket" class="input" type="number" name="referralTickets" value="2" min="1" max="20">
              </div>
              <div class="field">
                <label class="lbl" for="f-color">Vurgu rengi</label>
                <input id="f-color" class="input" type="color" name="accentColor" value="#8b85ff">
              </div>
            </div>
            <div class="field" style="margin-top:1rem">
              <label class="check"><input type="checkbox" name="referralEnabled" checked> Arkadaş davetiyle bilet kazanılabilsin</label>
            </div>
          </details>
        </div>

        <div class="form-actions">
          <button type="button" class="btn" data-tab-link="giveaways">Vazgeç</button>
          <button type="submit" id="createSubmit" class="btn btn-primary">Çekilişi oluştur</button>
        </div>
      </form>
    </section>

    <!-- KATILIMCILAR -->
    <section id="view-participants" class="view">
      <div class="head">
        <div>
          <h1>Katılımcılar</h1>
          <p>Tüm çekilişlerdeki katılımlar.</p>
        </div>
      </div>
      <div class="filters">
        <input id="pSearch" class="input" type="search" placeholder="Kullanıcı, IP veya davet kodu ara">
        <select id="pGiveaway" class="input"><option value="">Tüm çekilişler</option>${giveawayOptions}</select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Kullanıcı</th><th>Çekiliş</th><th>Bilet</th><th>IP</th><th>Durum</th><th></th></tr></thead>
          <tbody id="pBody">${participantRows || emptyRow(6, 'Henüz katılımcı yok.')}</tbody>
        </table>
      </div>
    </section>

    <!-- ŞÜPHELİ -->
    <section id="view-fraud" class="view">
      <div class="head">
        <div>
          <h1>Şüpheli katılımlar</h1>
          <p>Aynı IP'den çoklu hesap, kendi davetini kullanma veya anormal hızlı görev tamamlama otomatik işaretlenir.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Kullanıcı</th><th>Neden</th><th>IP</th><th>Tarih</th><th></th></tr></thead>
          <tbody>${fraudRows || emptyRow(5, 'Şüpheli katılım yok.')}</tbody>
        </table>
      </div>
    </section>

    <!-- REKLAMLAR -->
    <section id="view-ads" class="view">
      <div class="head">
        <div>
          <h1>Reklamlar</h1>
          <p>Sponsor kartları ve sosyal medya kampanyaları.</p>
        </div>
        <button class="btn btn-primary" data-act="ad-new">+ Sponsor reklamı</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr><th>Sponsor reklamı</th><th>Gösterim</th><th>Tıklama</th><th>CTR</th><th>Durum</th><th></th></tr></thead>
          <tbody>${adRows || emptyRow(6, 'Henüz sponsor reklamı yok.')}</tbody>
        </table>
      </div>

      <h2>Sosyal medya kampanyaları <span class="muted" style="font-weight:400;font-size:.85rem">— ${fmt(socialAnalytics.totalViews)} görüntülenme · ${fmt(socialAnalytics.totalClicks)} tıklama</span></h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Hesap</th><th>Görüntülenme</th><th>Tamamlanan</th><th>Tıklama</th><th>Durum</th><th></th></tr></thead>
          <tbody>${socialRows || emptyRow(6, 'Kampanya yok.')}</tbody>
        </table>
      </div>
    </section>

    <!-- KAYITLAR -->
    <section id="view-logs" class="view">
      <div class="head">
        <div>
          <h1>Kayıtlar</h1>
          <p>Son 30 yönetim işlemi ve son 24 saatte etkin kullanıcılar.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>İşlem</th><th>Yapan</th><th>Detay</th><th>Tarih</th></tr></thead>
          <tbody>${auditRows || emptyRow(4, 'Henüz kayıt yok.')}</tbody>
        </table>
      </div>

      <h2>Son 24 saatte etkin kullanıcılar <span class="muted" style="font-weight:400;font-size:.85rem">— ${liveUsers.length}</span></h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Kullanıcı</th><th>IP</th><th>Son etkinlik</th></tr></thead>
          <tbody>${liveRows || emptyRow(3, 'Son 24 saatte etkinlik yok.')}</tbody>
        </table>
      </div>
    </section>
  </main>

  <!-- KAZANAN SEÇ -->
  <div id="drawModal" class="modal">
    <div class="modal-box">
      <div class="modal-head">
        <h3 id="drawTitle">Kazanan seç</h3>
        <button class="icon-btn" data-close>✕</button>
      </div>
      <p class="modal-text" id="drawText"></p>
      <div id="redrawGroup" class="field" style="display:none">
        <label class="lbl" for="redrawReason">Yeniden çekme gerekçesi</label>
        <input id="redrawReason" class="input" placeholder="Örn: Kazanan 24 saat içinde dönüş yapmadı">
      </div>
      <div class="form-actions">
        <button class="btn" data-close>Vazgeç</button>
        <button class="btn btn-primary" id="drawConfirm">Kazananı seç</button>
      </div>
    </div>
  </div>

  <!-- YENİ SPONSOR REKLAMI -->
  <div id="adModal" class="modal">
    <form class="modal-box" id="adForm">
      <div class="modal-head">
        <h3>Yeni sponsor reklamı</h3>
        <button type="button" class="icon-btn" data-close>✕</button>
      </div>
      <div class="field"><label class="lbl">Başlık</label><input class="input" name="title" required placeholder="Örn: Eko Yıldız Discord sunucusu"></div>
      <div class="grid-2">
        <div class="field"><label class="lbl">Sponsor</label><input class="input" name="sponsorName" required placeholder="Örn: Eko Yıldız"></div>
        <div class="field"><label class="lbl">Buton yazısı</label><input class="input" name="ctaText" value="Hemen katıl"></div>
      </div>
      <div class="field" style="margin-top:1rem"><label class="lbl">Kısa açıklama</label><input class="input" name="description"></div>
      <div class="field"><label class="lbl">Hedef URL</label><input class="input" type="url" name="targetUrl" required placeholder="https://"></div>
      <div class="grid-2">
        <div class="field"><label class="lbl">Görsel URL</label><input class="input" type="url" name="imageUrl" placeholder="https://"></div>
        <div class="field"><label class="lbl">Öncelik (1–10)</label><input class="input" type="number" name="priority" value="5" min="1" max="10"></div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn" data-close>Vazgeç</button>
        <button type="submit" class="btn btn-primary">Kaydet</button>
      </div>
    </form>
  </div>

  <!-- SOSYAL KAMPANYA DÜZENLE -->
  <div id="socialModal" class="modal">
    <form class="modal-box" id="socialForm">
      <div class="modal-head">
        <h3>Kampanyayı düzenle</h3>
        <button type="button" class="icon-btn" data-close>✕</button>
      </div>
      <input type="hidden" id="sKey">
      <div class="field"><label class="lbl">Başlık</label><input class="input" id="sTitle" required></div>
      <div class="field"><label class="lbl">Alt başlık</label><input class="input" id="sSubtitle"></div>
      <div class="grid-2">
        <div class="field"><label class="lbl">Buton yazısı</label><input class="input" id="sCta" required></div>
        <div class="field"><label class="lbl">Rozet metni</label><input class="input" id="sBadge"></div>
      </div>
      <div class="field" style="margin-top:1rem"><label class="lbl">Esprili metin</label><input class="input" id="sQuote"></div>
      <div class="field"><label class="lbl">Hedef URL</label><input class="input" type="url" id="sUrl" required></div>
      <div class="grid-2">
        <div class="field">
          <label class="lbl">Sezonluk etiket</label>
          <select class="input" id="sSeasonal">
            <option value="">Yok</option>
            <option value="🔥 Yeni Video Düştü">🔥 Yeni Video Düştü</option>
            <option value="🟢 Bu Akşam Canlı Yayın">🟢 Bu Akşam Canlı Yayın</option>
            <option value="🎁 Çekiliş Görevi Aktif">🎁 Çekiliş Görevi Aktif</option>
            <option value="✨ Özel Gün Kampanyası">✨ Özel Gün Kampanyası</option>
          </select>
        </div>
        <div class="field"><label class="lbl">Sıra</label><input class="input" type="number" id="sOrder" min="1" max="50"></div>
      </div>
      <div class="field" style="margin-top:1rem"><label class="check"><input type="checkbox" id="sFeatured"> Öne çıkar</label></div>
      <div class="form-actions">
        <button type="button" class="btn" data-close>Vazgeç</button>
        <button type="submit" class="btn btn-primary">Kaydet</button>
      </div>
    </form>
  </div>

  <template id="taskTemplate">${taskRowHtml()}</template>
  <div id="toast" class="toast"></div>

  <script>
    var SOCIAL_ADS = ${socialAdsJson};
    var STATUS_LABELS = { ACTIVE: 'yayına alınacak', SCHEDULED: 'planlandı olarak işaretlenecek', ENDED: 'erken bitirilecek', CANCELLED: 'iptal edilecek', DRAFT: 'taslağa alınacak' };

    // ── Yardımcılar ──
    function $(sel, root) { return (root || document).querySelector(sel); }
    function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

    function toast(msg, isError) {
      var t = $('#toast');
      t.textContent = msg;
      t.className = 'toast show' + (isError ? ' error' : '');
      clearTimeout(t._timer);
      t._timer = setTimeout(function () { t.className = 'toast' + (isError ? ' error' : ''); }, 3200);
    }

    function reloadTo(tab) {
      try { history.replaceState(null, '', '#' + tab); } catch (e) {}
      setTimeout(function () { location.reload(); }, 600);
    }

    async function api(url, method, body) {
      var opts = { method: method || 'POST', headers: { 'Content-Type': 'application/json' } };
      if (body) opts.body = JSON.stringify(body);
      try {
        var res = await fetch(url, opts);
        var data = await res.json().catch(function () { return {}; });
        if (!res.ok || data.success === false) {
          toast(data.message || 'İşlem başarısız.', true);
          return null;
        }
        return data;
      } catch (err) {
        toast('Sunucuya ulaşılamadı: ' + err.message, true);
        return null;
      }
    }

    // ── Sekmeler ──
    function showTab(tab) {
      if (!document.getElementById('view-' + tab)) tab = 'giveaways';
      $all('.view').forEach(function (v) { v.classList.toggle('active', v.id === 'view-' + tab); });
      var navTab = tab === 'new' ? 'giveaways' : tab;
      $all('.tab').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === navTab); });
      try { history.replaceState(null, '', '#' + tab); } catch (e) {}
      window.scrollTo(0, 0);
    }
    $all('.tab').forEach(function (b) { b.addEventListener('click', function () { showTab(b.dataset.tab); }); });
    showTab((location.hash || '').replace('#', '') || 'giveaways');

    // ── Modallar ──
    function openModal(id) { document.getElementById(id).classList.add('open'); }
    function closeModals() { $all('.modal').forEach(function (m) { m.classList.remove('open'); }); }
    $all('.modal').forEach(function (m) {
      m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-close]')) closeModals(); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModals(); });

    // Satır menüleri: tablo kaydırma alanında kesilmesin diye ekrana sabitlenir
    $all('details.menu').forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        $all('details.menu[open]').forEach(function (o) { if (o !== d) o.open = false; });
        var r = d.querySelector('summary').getBoundingClientRect();
        var list = d.querySelector('.menu-list');
        list.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
        var h = list.offsetHeight;
        var below = window.innerHeight - r.bottom;
        if (below < h + 12 && r.top < h + 12) {
          // İki yöne de sığmıyor: ekran içinde kalacak şekilde sıkıştır
          list.style.bottom = '';
          list.style.top = Math.max(8, window.innerHeight - h - 8) + 'px';
        } else if (below < h + 12) {
          list.style.top = '';
          list.style.bottom = (window.innerHeight - r.top + 4) + 'px';
        } else {
          list.style.bottom = '';
          list.style.top = (r.bottom + 4) + 'px';
        }
      });
    });
    function closeMenus(except) {
      $all('details.menu[open]').forEach(function (d) { if (d !== except) d.open = false; });
    }
    document.addEventListener('click', function (e) { closeMenus(e.target.closest('details.menu')); });
    window.addEventListener('scroll', function () { closeMenus(); }, true);

    // ── Kazanan seçimi ──
    var drawState = null;
    function openDraw(id, title, isRedraw) {
      drawState = { id: id, isRedraw: isRedraw };
      $('#drawTitle').textContent = isRedraw ? 'Yeniden çek' : 'Kazanan seç';
      $('#drawText').textContent = '"' + title + '" için geçerli biletlere göre ağırlıklı rastgele seçim yapılacak. ' +
        (isRedraw ? 'Önceki kazanan geçersiz sayılıp arşivlenir.' : 'Sonuç kalıcı olarak kaydedilir.');
      $('#redrawGroup').style.display = isRedraw ? 'block' : 'none';
      $('#redrawReason').value = '';
      $('#drawConfirm').disabled = false;
      openModal('drawModal');
    }
    $('#drawConfirm').addEventListener('click', async function () {
      if (!drawState) return;
      var reason = $('#redrawReason').value.trim();
      if (drawState.isRedraw && reason.length < 5) { toast('Gerekçe en az 5 karakter olmalı.', true); return; }
      this.disabled = true;
      var url = '/api/admin/giveaways/' + drawState.id + (drawState.isRedraw ? '/redraw' : '/draw');
      var data = await api(url, 'POST', { isRedraw: drawState.isRedraw, reason: reason });
      if (data) {
        location.href = '/cekilisler/canli/' + drawState.id;
      } else {
        this.disabled = false;
      }
    });

    // ── Görev satırları ──
    function addTask() {
      var tpl = document.getElementById('taskTemplate');
      $('#taskList').appendChild(tpl.content.cloneNode(true));
    }

    // ── Tek bir tıklama yöneticisi ──
    document.addEventListener('click', async function (e) {
      var link = e.target.closest('[data-tab-link]');
      if (link) { e.preventDefault(); showTab(link.dataset.tabLink); return; }

      var el = e.target.closest('[data-act]');
      if (!el) return;
      var act = el.dataset.act, id = el.dataset.id, title = el.dataset.title || '';
      var menu = el.closest('details.menu');
      if (menu) menu.open = false;

      switch (act) {
        case 'draw': openDraw(id, title, false); break;
        case 'redraw': openDraw(id, title, true); break;

        case 'status': {
          var to = el.dataset.status;
          if (!confirm('"' + title + '" ' + (STATUS_LABELS[to] || to) + '. Devam edilsin mi?')) return;
          if (await api('/api/admin/giveaways/' + id + '/status', 'POST', { status: to })) { toast('Durum güncellendi.'); reloadTo('giveaways'); }
          break;
        }
        case 'recalc': {
          var r = await api('/api/admin/giveaways/' + id + '/recalculate-stats', 'POST');
          if (r) { toast('Sayaçlar güncellendi: ' + (r.totalParticipants || 0) + ' katılımcı, ' + (r.totalTickets || 0) + ' bilet.'); reloadTo('giveaways'); }
          break;
        }
        case 'delete': {
          if (!confirm('"' + title + '" ve bağlı görevleri kalıcı olarak silinecek. Bu geri alınamaz. Emin misin?')) return;
          if (await api('/api/admin/giveaways/' + id, 'DELETE')) { toast('Çekiliş silindi.'); reloadTo('giveaways'); }
          break;
        }

        case 'add-task': addTask(); break;
        case 'remove-task': el.closest('.task-row').remove(); break;

        case 'disqualify': {
          var reason = prompt('Diskalifiye gerekçesi:', 'Şüpheli katılım / çift hesap');
          if (!reason || reason.trim().length < 4) return;
          if (await api('/api/admin/participants/' + id + '/disqualify', 'POST', { reason: reason.trim() })) { toast('Katılımcı diskalifiye edildi.'); reloadTo('participants'); }
          break;
        }
        case 'restore': {
          if (!confirm('Katılımcının engeli kaldırılıp biletleri geri verilsin mi?')) return;
          if (await api('/api/admin/participants/' + id + '/restore', 'POST')) { toast('Katılımcı geri alındı.'); reloadTo('participants'); }
          break;
        }

        case 'fraud-ban': {
          var why = prompt('Diskalifiye gerekçesi:', 'Davet ve çoklu hesap suistimali');
          if (!why) return;
          if (await api('/api/admin/fraud/' + id + '/action', 'POST', { action: 'DISQUALIFY', reason: why })) { toast('Diskalifiye edildi.'); reloadTo('fraud'); }
          break;
        }
        case 'fraud-ignore': {
          if (await api('/api/admin/fraud/' + id + '/action', 'POST', { action: 'IGNORE', reason: '' })) { toast('Kayıt yoksayıldı.'); reloadTo('fraud'); }
          break;
        }

        case 'ad-new': openModal('adModal'); break;
        case 'ad-toggle': {
          if (await api('/api/admin/ads/' + id + '/toggle', 'POST')) reloadTo('ads');
          break;
        }
        case 'ad-delete': {
          if (!confirm('Bu sponsor reklamı kalıcı olarak silinsin mi?')) return;
          if (await api('/api/admin/ads/' + id, 'DELETE')) { toast('Reklam silindi.'); reloadTo('ads'); }
          break;
        }

        case 'social-toggle': {
          if (await api('/api/admin/social-ads/' + el.dataset.key + '/toggle', 'POST')) reloadTo('ads');
          break;
        }
        case 'social-edit': {
          var ad = SOCIAL_ADS.find(function (a) { return a.key === el.dataset.key; }) || {};
          $('#sKey').value = ad.key || '';
          $('#sTitle').value = ad.title || '';
          $('#sSubtitle').value = ad.subtitle || '';
          $('#sCta').value = ad.ctaText || '';
          $('#sQuote').value = ad.wittyQuote || '';
          $('#sUrl').value = ad.targetUrl || '';
          $('#sBadge').value = ad.badgeText || '';
          $('#sSeasonal').value = ad.seasonalTag || '';
          $('#sOrder').value = ad.order || 1;
          $('#sFeatured').checked = Boolean(ad.isFeatured);
          openModal('socialModal');
          break;
        }
      }
    });

    // ── Yeni çekiliş formu ──
    $('#createForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var form = e.target;
      var data = Object.fromEntries(new FormData(form).entries());
      // Checkbox'lar işaretsizken FormData'da yer almaz; eski API string 'true'/'false' bekliyor
      data.isFeatured = form.isFeatured.checked ? 'true' : 'false';
      data.referralEnabled = form.referralEnabled.checked ? 'true' : 'false';
      data.tasks = $all('#taskList .task-row').map(function (row) {
        return {
          title: $('.task-title', row).value.trim(),
          platform: $('.task-platform', row).value,
          link: $('.task-link', row).value.trim(),
          strategy: $('.task-strategy', row).value,
          tickets: parseInt($('.task-reward', row).value, 10) || 1,
          isRequired: $('.task-mandatory', row).checked
        };
      }).filter(function (t) { return t.title; });

      var btn = $('#createSubmit');
      btn.disabled = true;
      btn.textContent = 'Kaydediliyor…';
      var result = await api('/api/admin/giveaways', 'POST', data);
      if (result) {
        toast('Çekiliş oluşturuldu.');
        reloadTo('giveaways');
      } else {
        btn.disabled = false;
        btn.textContent = 'Çekilişi oluştur';
      }
    });

    // ── Sponsor reklamı formu ──
    $('#adForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(e.target).entries());
      if (await api('/api/admin/ads', 'POST', data)) { toast('Reklam eklendi.'); reloadTo('ads'); }
    });

    // ── Sosyal kampanya formu ──
    $('#socialForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var key = $('#sKey').value;
      var data = {
        title: $('#sTitle').value,
        subtitle: $('#sSubtitle').value,
        ctaText: $('#sCta').value,
        wittyQuote: $('#sQuote').value,
        targetUrl: $('#sUrl').value,
        badgeText: $('#sBadge').value,
        seasonalTag: $('#sSeasonal').value,
        order: parseInt($('#sOrder').value, 10) || 1,
        isFeatured: $('#sFeatured').checked
      };
      if (await api('/api/admin/social-ads/' + key + '/update', 'POST', data)) { toast('Kampanya güncellendi.'); reloadTo('ads'); }
    });

    // ── Katılımcı filtresi ──
    function filterParticipants() {
      var q = $('#pSearch').value.trim().toLowerCase();
      var gid = $('#pGiveaway').value;
      $all('#pBody tr[data-search]').forEach(function (tr) {
        var ok = (!q || tr.dataset.search.indexOf(q) !== -1) && (!gid || tr.dataset.giveaway === gid);
        tr.style.display = ok ? '' : 'none';
      });
    }
    $('#pSearch').addEventListener('input', filterParticipants);
    $('#pGiveaway').addEventListener('change', filterParticipants);
  </script>
</body>
</html>`;
}

module.exports = { renderGiveawayAdminPage };
