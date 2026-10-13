// server/views/giveaways/giveawaysFeedPage.js
// Çekilişler ana sayfası — sade liste düzeni
const { giveawayLayout, _esc } = require('./giveawayLayout');

// Halka açık sayfada gösterilmeyen durumlar
const HIDDEN_STATUSES = new Set(['DRAFT', 'CANCELLED']);
const ENDED_STATUSES = new Set(['ENDED', 'WINNER_SELECTING', 'COMPLETED']);

function statusInfo(gw) {
  if (gw.status === 'ACTIVE') return { key: 'active', label: 'Aktif', badge: 'gw-badge-active' };
  if (gw.status === 'SCHEDULED') return { key: 'upcoming', label: 'Yakında', badge: 'gw-badge-scheduled' };
  if (gw.status === 'WINNER_SELECTING') return { key: 'ended', label: 'Kazanan seçiliyor', badge: 'gw-badge-ended' };
  return { key: 'ended', label: 'Tamamlandı', badge: 'gw-badge-ended' };
}

function timeLabel(gw) {
  const now = Date.now();
  if (gw.status === 'ACTIVE' && gw.endDate) {
    const ms = new Date(gw.endDate).getTime() - now;
    if (ms <= 0) return 'Bitiyor';
    const hours = Math.floor(ms / 3600000);
    if (hours < 24) return hours < 1 ? 'Son dakikalar' : `${hours} saat kaldı`;
    return `${Math.ceil(hours / 24)} gün kaldı`;
  }
  if (gw.status === 'SCHEDULED' && gw.startDate) {
    return `${new Date(gw.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} başlıyor`;
  }
  if (gw.endDate) {
    return `${new Date(gw.endDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} bitti`;
  }
  return '';
}

function num(n) {
  return (n || 0).toLocaleString('tr-TR');
}

function renderCard(gw) {
  const st = statusInfo(gw);
  const href = `/cekilisler/${encodeURIComponent(gw.slug || gw._id)}`;
  const cta = st.key === 'active' ? 'Katıl' : (st.key === 'upcoming' ? 'Detaylar' : 'Sonuçlar');

  return `
    <a href="${href}" class="gf-card gw-card">
      <div class="gf-card-cover">
        ${gw.coverImage ? `<img src="${_esc(gw.coverImage)}" alt="" loading="lazy">` : '<span class="gf-card-placeholder">🎁</span>'}
        <span class="gw-badge ${st.badge} gf-card-badge">${st.label}</span>
      </div>
      <div class="gf-card-body">
        <h3 class="gf-card-title">${_esc(gw.title)}</h3>
        <div class="gf-card-prize">${_esc(gw.prize)}</div>
        <div class="gf-card-meta">
          <span>${num(gw.totalEntries)} katılımcı</span>
          <span class="gf-dot"></span>
          <span>${timeLabel(gw)}</span>
        </div>
        <span class="gw-btn ${st.key === 'active' ? 'gw-btn-primary' : 'gw-btn-secondary'} gf-card-cta">${cta}</span>
      </div>
    </a>`;
}

function renderGiveawaysFeedPage({ user, giveaways = [], activeCategory = 'all', notificationCount = 0 }) {
  const visible = giveaways.filter(g => !HIDDEN_STATUSES.has(g.status));
  const counts = { all: visible.length, active: 0, upcoming: 0, ended: 0 };
  visible.forEach(g => { counts[statusInfo(g).key] += 1; });

  const category = Object.prototype.hasOwnProperty.call(counts, activeCategory) ? activeCategory : 'all';
  const filtered = category === 'all' ? visible : visible.filter(g => statusInfo(g).key === category);

  // Aktifler önce, sonra yakında, en son bitenler
  const order = { active: 0, upcoming: 1, ended: 2 };
  filtered.sort((a, b) => {
    const diff = order[statusInfo(a).key] - order[statusInfo(b).key];
    if (diff) return diff;
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  const tabs = [
    { key: 'all', label: 'Tümü', href: '/cekilisler' },
    { key: 'active', label: 'Aktif', href: '/cekilisler?kategori=active' },
    { key: 'upcoming', label: 'Yakında', href: '/cekilisler?kategori=upcoming' },
    { key: 'ended', label: 'Tamamlanan', href: '/cekilisler?kategori=ended' }
  ];

  const emptyText = {
    all: 'Henüz yayınlanmış bir çekiliş yok. Yeni çekilişler Discord sunucusunda duyurulur.',
    active: 'Şu an aktif çekiliş yok.',
    upcoming: 'Planlanmış bir çekiliş yok.',
    ended: 'Henüz tamamlanan çekiliş yok.'
  }[category];

  const content = `
    <style>
      .gf-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 2rem; }
      .gf-head h1 { font-size: clamp(1.6rem, 3.5vw, 2rem); font-weight: 700; letter-spacing: -0.025em; line-height: 1.2; }
      .gf-head p { color: var(--gw-text-muted); margin-top: .35rem; font-size: .95rem; }

      .gf-tabs { display: flex; gap: 1.5rem; border-bottom: 1px solid var(--gw-border); margin-bottom: 1.5rem; overflow-x: auto; scrollbar-width: none; }
      .gf-tab { padding: .7rem 0; margin-bottom: -1px; border-bottom: 2px solid transparent; color: var(--gw-text-muted); text-decoration: none; font-weight: 500; font-size: .9rem; white-space: nowrap; transition: color .15s, border-color .15s; }
      .gf-tab:hover { color: var(--gw-text); }
      .gf-tab.active { color: var(--gw-text); border-bottom-color: var(--gw-text); }
      .gf-tab-count { margin-left: .4rem; font-size: .75rem; color: var(--gw-text-muted); background: rgba(255,255,255,.06); padding: .1rem .45rem; border-radius: 999px; }

      .gf-card { display: flex; flex-direction: column; text-decoration: none; color: inherit; }
      .gf-card-cover { position: relative; aspect-ratio: 16 / 9; background: #18181c; border-bottom: 1px solid var(--gw-border); overflow: hidden; display: flex; align-items: center; justify-content: center; }
      .gf-card-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .gf-card-placeholder { font-size: 2.25rem; opacity: .35; filter: grayscale(1); }
      .gf-card-badge { position: absolute; top: .7rem; left: .7rem; backdrop-filter: blur(6px); }
      .gf-card-body { padding: 1rem 1.1rem 1.1rem; display: flex; flex-direction: column; gap: .3rem; flex: 1; }
      .gf-card-title { font-size: 1rem; font-weight: 600; line-height: 1.4; letter-spacing: -0.01em; }
      .gf-card-prize { color: var(--gw-accent-light); font-weight: 500; font-size: .9rem; }
      .gf-card-meta { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; color: var(--gw-text-muted); font-size: .8rem; margin: .2rem 0 1rem; }
      .gf-dot { width: 3px; height: 3px; border-radius: 50%; background: currentColor; opacity: .6; }
      .gf-card-cta { margin-top: auto; width: 100%; }

      .gf-empty { text-align: center; padding: 4rem 1rem; border: 1px dashed var(--gw-border-glow); border-radius: 14px; color: var(--gw-text-muted); font-size: .95rem; }
      .gf-empty-icon { font-size: 2rem; margin-bottom: .75rem; opacity: .4; filter: grayscale(1); }
      .gf-empty a { color: var(--gw-text); }

      .gf-foot { margin-top: 2.5rem; text-align: center; font-size: .85rem; color: var(--gw-text-muted); }
      .gf-foot a { color: var(--gw-text); text-decoration: none; }
      .gf-foot a:hover { text-decoration: underline; }
    </style>

    <div class="gw-container">
      <div class="gf-head">
        <div>
          <h1>Çekilişler</h1>
          <p>Görevleri tamamla, bilet topla, ödül kazan.</p>
        </div>
        <div class="gf-head-links">
          <a href="/cekilisler/kazananlar" class="gw-btn gw-btn-secondary">Kazananlar</a>
        </div>
      </div>

      <nav class="gf-tabs" aria-label="Çekiliş filtresi">
        ${tabs.map(t => `
          <a href="${t.href}" class="gf-tab ${category === t.key ? 'active' : ''}">${t.label}<span class="gf-tab-count">${counts[t.key]}</span></a>
        `).join('')}
      </nav>

      ${filtered.length > 0 ? `
        <div class="gw-grid">
          ${filtered.map(renderCard).join('')}
        </div>
      ` : `
        <div class="gf-empty">
          <div class="gf-empty-icon">🎁</div>
          <p>${emptyText}</p>
          ${category !== 'all' && counts.all > 0 ? '<p style="margin-top:.6rem;"><a href="/cekilisler">Tüm çekilişleri gör</a></p>' : ''}
        </div>
      `}

      <p class="gf-foot">
        Kazananlar rastgele bilet çekimiyle belirlenir. <a href="/cekilisler/seffaflik">Nasıl çalıştığını gör →</a>
      </p>
    </div>
  `;

  return giveawayLayout({
    title: 'Çekilişler',
    description: 'Eko Yıldız resmi çekiliş platformu. Görevleri tamamla, bilet topla, ödül kazan.',
    content,
    user,
    activeTab: 'feed',
    notificationCount
  });
}

module.exports = { renderGiveawaysFeedPage };
