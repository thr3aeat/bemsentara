'use strict';

const {
  renderPlatformHeader,
  renderPlatformFooter,
  renderSearchDialog,
  platformChromeStyles,
  platformChromeScript,
} = require('./platformChrome');

const LINKS_DATA = [
  {
    id: 'kick',
    category: 'stream',
    categoryLabel: 'Canlı Yayın',
    title: 'Kick',
    handle: 'kick.com/ekoyildiz',
    description: 'Yüksek bitrate canlı yayınlar, oyunlar, sohbet ve interaktif etkinlikler.',
    badge: 'CANLI YAYIN',
    url: 'https://kick.com/ekoyildiz',
    brandColor: '#53fc18',
    glowColor: 'rgba(83, 252, 24, 0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(83,252,24,0.08) 0%, rgba(10,12,22,0.94) 100%)',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19.333 12L14.667 7.333V9.667L17 12L14.667 14.333V16.667L19.333 12ZM4.667 4H9.333V10.333L13.333 4H18.667L13.333 12L19.333 20H14L9.333 13.667V20H4.667V4Z"/></svg>`,
    external: true,
  },
  {
    id: 'twitch',
    category: 'stream',
    categoryLabel: 'Canlı Yayın',
    title: 'Twitch',
    handle: 'twitch.tv/ekoyildiz',
    description: 'Topluluk geceleri, ortak yayınlar, özel turnuvalar ve sohbet.',
    badge: 'CANLI YAYIN',
    url: 'https://www.twitch.tv/ekoyildiz',
    brandColor: '#9146ff',
    glowColor: 'rgba(145, 70, 255, 0.38)',
    bgGradient: 'linear-gradient(135deg, rgba(145,70,255,0.09) 0%, rgba(10,12,22,0.94) 100%)',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0h1.714v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>`,
    external: true,
  },
  {
    id: 'youtube-main',
    category: 'video',
    categoryLabel: 'YouTube & Video',
    title: 'YouTube (Ana Kanal)',
    handle: '@eko8yildiz',
    description: 'En yeni videolar, özel kurgular, eğlenceli seriler ve haftalık ana içerikler.',
    badge: 'ANA KANAL',
    url: 'https://www.youtube.com/@eko8yildiz',
    brandColor: '#ff0033',
    glowColor: 'rgba(255, 0, 51, 0.38)',
    bgGradient: 'linear-gradient(135deg, rgba(255,0,51,0.09) 0%, rgba(10,12,22,0.94) 100%)',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    external: true,
  },
  {
    id: 'youtube-secondary',
    category: 'video',
    categoryLabel: 'YouTube & Video',
    title: 'YouTube (Yedek / Yan Kanal)',
    handle: '@eko8yildiz2',
    description: 'Kamera arkası anlar, vloglar, kesitler ve alternatif video serileri.',
    badge: '2. KANAL',
    url: 'https://www.youtube.com/@eko8yildiz2',
    brandColor: '#ff5757',
    glowColor: 'rgba(255, 87, 87, 0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(255,87,87,0.08) 0%, rgba(10,12,22,0.94) 100%)',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>`,
    external: true,
  },
  {
    id: 'tiktok',
    category: 'video',
    categoryLabel: 'Kısa Video & Viral',
    title: 'TikTok',
    handle: '@kimdirbueko',
    description: 'Hızlı viral videolar, komik kesitler, trendler ve günlük eğlenceli anlar.',
    badge: 'SHORTS & VIRAL',
    url: 'https://www.tiktok.com/@kimdirbueko',
    brandColor: '#00f2fe',
    glowColor: 'rgba(0, 242, 254, 0.38)',
    bgGradient: 'linear-gradient(135deg, rgba(0,242,254,0.08) 0%, rgba(10,12,22,0.94) 100%)',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.73 1.4-.07 2.64-.99 3.09-2.31.2-.55.24-1.15.24-1.73l.02-17.15z"/></svg>`,
    external: true,
  },
  {
    id: 'discord',
    category: 'community',
    categoryLabel: 'Resmi Topluluk',
    title: 'Discord Sunucumuz',
    handle: 'discord.gg/XJWnqx9DQC',
    description: 'Resmi EkoYıldız Discord topluluğu: Aktif sohbet, ses odaları, çekilişler ve anlık duyurular.',
    badge: 'RESMİ TOPLULUK',
    url: 'https://discord.gg/XJWnqx9DQC',
    brandColor: '#5865f2',
    glowColor: 'rgba(88, 101, 242, 0.38)',
    bgGradient: 'linear-gradient(135deg, rgba(88,101,242,0.09) 0%, rgba(10,12,22,0.94) 100%)',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
    external: true,
  },
  {
    id: 'yt-join',
    category: 'support',
    categoryLabel: 'Destek & Katıl',
    title: 'EkoYıldız YouTube Katıl',
    handle: 'Üyelik Satın Al',
    description: 'Kanala özel rozetler, emojiler, üyelere özel canlı yayınlar ve ayrıcalıklı videolar.',
    badge: 'KATIL & ÜYE OL',
    url: 'https://www.youtube.com/channel/UCNSZYtuDQYsZYYQVJvErDVw/join',
    brandColor: '#ffd700',
    glowColor: 'rgba(255, 215, 0, 0.38)',
    bgGradient: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(10,12,22,0.94) 100%)',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
    external: true,
  },
  {
    id: 'itemsatis',
    category: 'support',
    categoryLabel: 'Destek & Katıl',
    title: 'İtemsatış ile Destekle',
    handle: 'itemsatis.com/destekle/ekoyildiz',
    description: '3D Secure güvencesiyle doğrudan destek, bağış ve resmi destekçi mağazası.',
    badge: 'GÜVENLİ DESTEK',
    url: 'https://www.itemsatis.com/destekle/ekoyildiz',
    brandColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(10,12,22,0.94) 100%)',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>`,
    external: true,
  },
  {
    id: 'insta-eko',
    category: 'instagram',
    categoryLabel: 'Instagram',
    title: 'Eko (Ana Hesap)',
    handle: '@ekonqt',
    description: 'Resmi ana profil: Hikayeler, günlük paylaşımlar, duyurular ve doğrudan iletişim.',
    badge: 'ANA PROFİL',
    url: 'https://www.instagram.com/ekonqt/',
    brandColor: '#e1306c',
    glowColor: 'rgba(225, 48, 108, 0.38)',
    bgGradient: 'linear-gradient(135deg, rgba(225,48,108,0.09) 0%, rgba(10,12,22,0.94) 100%)',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
    external: true,
  },
  {
    id: 'insta-ege',
    category: 'instagram',
    categoryLabel: 'Instagram',
    title: 'Ege (Kişisel / Yan Hesap)',
    handle: '@egee7dino',
    description: 'Kişisel yaşam, özel anlar, günlük fotoğraflar ve yan hesap.',
    badge: 'KİŞİSEL HESAP',
    url: 'https://www.instagram.com/egee7dino/',
    brandColor: '#c13584',
    glowColor: 'rgba(193, 53, 132, 0.38)',
    bgGradient: 'linear-gradient(135deg, rgba(193,53,132,0.09) 0%, rgba(10,12,22,0.94) 100%)',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
    external: true,
  },
];

const GROUPS = [
  { key: 'stream', label: 'Canlı yayın' },
  { key: 'video', label: 'Video' },
  { key: 'community', label: 'Topluluk' },
  { key: 'support', label: 'Destek ol' },
  { key: 'instagram', label: 'Instagram' }
];

// Sayfada çalan şarkı: Spotify'ın resmi gömme oynatıcısı (telifli dosya barındırılmaz).
const NOW_PLAYING = {
  title: 'TRALALA',
  artist: 'manifest',
  uri: 'spotify:track:6hPPwiXH4Y4kmc121v9Fdg',
  embedUrl: 'https://open.spotify.com/embed/track/6hPPwiXH4Y4kmc121v9Fdg?theme=0',
  cover: 'https://i.scdn.co/image/ab67616d00004851dae056def422ee617c5ad0d8'
};

const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function renderRow(item, index) {
  return `
        <li class="row" style="--i:${index};--brand:${esc(item.brandColor)}">
          <a class="row-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" data-id="${esc(item.id)}">
            <span class="row-icon" aria-hidden="true">${item.iconSvg}</span>
            <span class="row-text">
              <span class="row-title">${esc(item.title)}</span>
              <span class="row-handle">${esc(item.handle)}</span>
            </span>
            <svg class="row-arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
          <button type="button" class="row-copy" data-copy="${esc(item.url)}" aria-label="${esc(item.title)} bağlantısını kopyala" title="Bağlantıyı kopyala">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 15V6a2 2 0 0 1 2-2h9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
        </li>`;
}

function renderLinksHubPage(user = null) {
  const headerHtml = renderPlatformHeader({ user, activePath: '/linkler' });
  const footerHtml = renderPlatformFooter();
  const searchDialogHtml = renderSearchDialog();

  let index = 0;
  const groupsHtml = GROUPS.map((g) => {
    const items = LINKS_DATA.filter((l) => l.category === g.key);
    if (!items.length) return '';
    return `
      <section class="group" aria-labelledby="g-${g.key}">
        <h2 class="group-title" id="g-${g.key}">${g.label}</h2>
        <ul class="rows">${items.map((it) => renderRow(it, index++)).join('')}
        </ul>
      </section>`;
  }).join('');

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#0a0a0b">
  <meta name="description" content="EkoYıldız resmi bağlantılar: Kick ve Twitch yayınları, YouTube kanalları, TikTok, Discord topluluğu ve Instagram.">
  <meta property="og:title" content="EkoYıldız — Bağlantılar">
  <meta property="og:description" content="Yayınlar, videolar ve topluluk tek sayfada.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://ekoyildiz.com/linkler">
  <meta property="og:image" content="https://i.imgur.com/PFcAc6q.png">
  <title>EkoYıldız — Bağlantılar</title>
  ${platformChromeStyles('dark')}
  <style>
    .lh {
      --bg: #0a0a0b; --surface: #111113; --surface-2: #17171a; --line: #222226; --line-2: #2e2e33;
      --text: #ededef; --muted: #8c8c95; --accent: #f43f5e;
      --sans: ui-sans-serif, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --mono: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace;
    }
    body.lh { background: var(--bg); color: var(--text); font-family: var(--sans); -webkit-font-smoothing: antialiased; }
    .lh-main { width: 100%; max-width: 560px; margin: 0 auto; padding: 40px 16px 64px; }

    /* Profil */
    .profile { display: flex; align-items: center; gap: 16px; }
    .avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--surface-2); flex: 0 0 auto; outline: 1px solid var(--line-2); outline-offset: 3px; }
    .profile h1 { margin: 0; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; display: flex; align-items: center; gap: 6px; }
    .verified { width: 16px; height: 16px; color: var(--accent); }
    .profile p { margin: 4px 0 0; color: var(--muted); font-size: 0.95rem; line-height: 1.45; }
    .profile-actions { display: flex; gap: 8px; margin-top: 20px; }
    .btn { appearance: none; border: 1px solid var(--line-2); background: var(--surface); color: var(--text); font: 600 0.875rem/1 var(--sans);
      height: 40px; padding: 0 14px; border-radius: 10px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; text-decoration: none;
      transition: background .15s ease, border-color .15s ease, transform .1s ease; }
    .btn:hover { background: var(--surface-2); border-color: #3a3a40; }
    .btn:active { transform: scale(.98); }
    .btn svg { width: 16px; height: 16px; }

    /* Şu an çalıyor */
    .np { margin-top: 28px; border: 1px solid var(--line); background: var(--surface); border-radius: 14px; overflow: hidden; }
    .np-bar { display: flex; align-items: center; gap: 12px; padding: 10px; }
    .np-cover { width: 44px; height: 44px; border-radius: 8px; flex: 0 0 auto; background: var(--surface-2); }
    .np-meta { min-width: 0; flex: 1 1 auto; }
    .np-label { font: 600 0.7rem/1 var(--mono); color: var(--muted); text-transform: uppercase; letter-spacing: .08em; display: flex; align-items: center; gap: 6px; }
    .np-title { margin-top: 5px; font-weight: 600; font-size: .95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .np-title span { color: var(--muted); font-weight: 500; }
    .eq { display: inline-flex; align-items: flex-end; gap: 2px; height: 10px; }
    .eq i { width: 2px; height: 6px; background: var(--muted); border-radius: 1px; }
    .eq i:nth-child(2) { height: 10px; } .eq i:nth-child(3) { height: 4px; }
    .np.is-playing .eq i { background: var(--accent); animation: eq 0.9s ease-in-out infinite; }
    .np.is-playing .eq i:nth-child(2) { animation-delay: -.3s; } .np.is-playing .eq i:nth-child(3) { animation-delay: -.6s; }
    @keyframes eq { 0%, 100% { height: 3px; } 50% { height: 10px; } }
    .np-toggle { width: 40px; height: 40px; border-radius: 50%; border: 0; background: var(--text); color: var(--bg); display: grid; place-items: center; cursor: pointer; flex: 0 0 auto; transition: transform .12s ease; }
    .np-toggle:hover { transform: scale(1.05); } .np-toggle:active { transform: scale(.95); }
    .np-toggle svg { width: 16px; height: 16px; }
    .np-embed { height: 0; transition: height .25s ease; }
    .np.is-open .np-embed { height: 80px; border-top: 1px solid var(--line); }
    .np-embed iframe { display: block; width: 100%; height: 80px; border: 0; }

    /* Bağlantılar */
    .group { margin-top: 32px; }
    .group-title { margin: 0 0 10px 2px; font: 600 0.72rem/1 var(--mono); color: var(--muted); text-transform: uppercase; letter-spacing: .1em; }
    .rows { list-style: none; margin: 0; padding: 0; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); overflow: hidden; }
    .row { position: relative; display: flex; align-items: center; border-top: 1px solid var(--line);
      opacity: 0; transform: translateY(6px); animation: rowIn .4s cubic-bezier(.2,.7,.2,1) forwards; animation-delay: calc(var(--i) * 35ms + 80ms); }
    .row:first-child { border-top: 0; }
    @keyframes rowIn { to { opacity: 1; transform: none; } }
    .row-link { flex: 1 1 auto; min-width: 0; display: flex; align-items: center; gap: 14px; padding: 12px 8px 12px 14px; min-height: 64px; color: inherit; text-decoration: none; outline: none; transition: background .15s ease; }
    .row-link:hover, .row-link:focus-visible { background: var(--surface-2); }
    .row-link:focus-visible { box-shadow: inset 0 0 0 2px var(--accent); }
    .row-icon { width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; flex: 0 0 auto; color: var(--muted); background: var(--bg); border: 1px solid var(--line); transition: color .2s ease, border-color .2s ease; }
    .row-icon svg { width: 20px; height: 20px; }
    .row-link:hover .row-icon, .row-link:focus-visible .row-icon { color: var(--brand); border-color: color-mix(in srgb, var(--brand) 45%, var(--line)); }
    .row-text { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .row-title { font-weight: 600; font-size: .98rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .row-handle { font: 0.8rem/1.2 var(--mono); color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .row-arrow { margin-left: auto; color: var(--muted); flex: 0 0 auto; transition: transform .18s ease, color .18s ease; }
    .row-link:hover .row-arrow { transform: translate(2px, -2px); color: var(--text); }
    .row-copy { flex: 0 0 auto; width: 44px; height: 44px; margin-right: 8px; border-radius: 10px; border: 0; background: transparent; color: var(--muted); display: grid; place-items: center; cursor: pointer; transition: background .15s ease, color .15s ease; }
    .row-copy:hover { background: var(--surface-2); color: var(--text); }
    .row-copy.done { color: #4ade80; }
    .row-copy { opacity: .6; } .row:hover .row-copy, .row-copy:focus-visible, .row-copy.done { opacity: 1; }

    .toast { position: fixed; left: 50%; bottom: 24px; transform: translate(-50%, 12px); opacity: 0; pointer-events: none;
      background: var(--text); color: var(--bg); font: 600 .85rem/1 var(--sans); padding: 10px 14px; border-radius: 10px; transition: opacity .2s ease, transform .2s ease; z-index: 50; }
    .toast.show { opacity: 1; transform: translate(-50%, 0); }
    .lh-foot { margin-top: 40px; color: var(--muted); font-size: .8rem; text-align: center; }
    .lh-foot kbd { font: 0.75rem var(--mono); border: 1px solid var(--line-2); border-bottom-width: 2px; border-radius: 4px; padding: 1px 5px; }

    @media (max-width: 480px) { .lh-main { padding-top: 24px; } .profile h1 { font-size: 1.3rem; } }
    @media (prefers-reduced-motion: reduce) { .row { animation: none; opacity: 1; transform: none; } .np.is-playing .eq i { animation: none; height: 8px; } * { transition: none !important; } }
  </style>
</head>
<body class="platform-chrome lh" data-theme="dark">
  ${headerHtml}

  <main class="lh-main" id="main-content">
    <header class="profile">
      <img class="avatar" src="https://i.imgur.com/PFcAc6q.png" alt="" width="64" height="64">
      <div>
        <h1>EkoYıldız <svg class="verified" viewBox="0 0 24 24" aria-label="Resmi hesap" role="img"><path fill="currentColor" d="M12 1.5l2.6 2 3.3-.2.9 3.2 2.8 1.8-1.2 3.1 1.2 3.1-2.8 1.8-.9 3.2-3.3-.2-2.6 2-2.6-2-3.3.2-.9-3.2-2.8-1.8 1.2-3.1-1.2-3.1 2.8-1.8.9-3.2 3.3.2z"/><path d="M8 12.2l2.6 2.6L16.2 9" fill="none" stroke="#0a0a0b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></h1>
        <p>Yayınlar, videolar ve topluluk. Hepsi burada.</p>
      </div>
    </header>
    <div class="profile-actions">
      <button type="button" class="btn" id="shareBtn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Paylaş</button>
      <a class="btn" href="/yardim"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Destek</a>
    </div>

    <section class="np" id="np" aria-label="Şu an çalıyor">
      <div class="np-bar">
        <img class="np-cover" src="${NOW_PLAYING.cover}" alt="" width="44" height="44" loading="lazy">
        <div class="np-meta">
          <div class="np-label"><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span><span id="npState">Şarkı</span></div>
          <div class="np-title">${esc(NOW_PLAYING.title)} <span>· ${esc(NOW_PLAYING.artist)}</span></div>
        </div>
        <button type="button" class="np-toggle" id="npToggle" aria-label="Şarkıyı çal" aria-pressed="false">
          <svg viewBox="0 0 24 24" id="npIcon" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
        </button>
      </div>
      <div class="np-embed" id="npEmbed"></div>
    </section>

    ${groupsHtml}

    <p class="lh-foot">Bağlantıyı kopyalamak için satırın sağındaki simgeye dokun · Arama <kbd>Ctrl</kbd> <kbd>K</kbd></p>
  </main>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>

  ${searchDialogHtml}
  ${footerHtml}
  ${platformChromeScript()}
  <script>
    (function () {
      var toastEl = document.getElementById('toast'); var toastTimer;
      function toast(msg) {
        toastEl.textContent = msg; toastEl.classList.add('show');
        clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1600);
      }
      function copy(text) {
        if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
        return new Promise(function (resolve, reject) {
          var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); } finally { document.body.removeChild(ta); }
        });
      }
      document.querySelectorAll('.row-copy').forEach(function (btn) {
        btn.addEventListener('click', function () {
          copy(btn.getAttribute('data-copy')).then(function () {
            btn.classList.add('done'); toast('Bağlantı kopyalandı');
            setTimeout(function () { btn.classList.remove('done'); }, 1400);
          }).catch(function () { toast('Kopyalanamadı'); });
        });
      });

      var shareBtn = document.getElementById('shareBtn');
      shareBtn.addEventListener('click', function () {
        var url = location.origin + '/linkler';
        if (navigator.share) { navigator.share({ title: 'EkoYıldız', url: url }).catch(function () {}); return; }
        copy(url).then(function () { toast('Sayfa bağlantısı kopyalandı'); });
      });

      // Şu an çalıyor: oynatıcı yalnızca dokununca yüklenir (Spotify Embed API; olmazsa düz gömme)
      var np = document.getElementById('np'), embed = document.getElementById('npEmbed'), toggle = document.getElementById('npToggle');
      var icon = document.getElementById('npIcon'), stateEl = document.getElementById('npState');
      var URI = '${NOW_PLAYING.uri}', EMBED = '${NOW_PLAYING.embedUrl}';
      var controller = null, loading = false, fallback = false;
      var PLAY = '<path d="M8 5v14l11-7z" fill="currentColor"/>', PAUSE = '<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/>';
      function setPlaying(on) {
        np.classList.toggle('is-playing', on); icon.innerHTML = on ? PAUSE : PLAY;
        toggle.setAttribute('aria-pressed', on ? 'true' : 'false'); toggle.setAttribute('aria-label', on ? 'Duraklat' : 'Şarkıyı çal');
        stateEl.textContent = on ? 'Çalıyor' : 'Şarkı';
      }
      function useFallback() {
        if (fallback) return; fallback = true; loading = false;
        embed.innerHTML = '<iframe src="' + EMBED + '" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Spotify oynatıcı"></iframe>';
        np.classList.add('is-open'); stateEl.textContent = 'Oynatıcıdan başlat';
      }
      function create(api) {
        var host = document.createElement('div'); embed.appendChild(host); np.classList.add('is-open');
        api.createController(host, { uri: URI, width: '100%', height: 80, theme: 'dark' }, function (c) {
          controller = c; loading = false;
          c.addListener('ready', function () { c.play(); });
          c.addListener('playback_update', function (e) { setPlaying(!!(e && e.data && !e.data.isPaused)); });
        });
      }
      toggle.addEventListener('click', function () {
        if (controller) { controller.togglePlay(); return; }
        if (fallback) { np.classList.toggle('is-open'); return; }
        if (loading) return;
        loading = true; stateEl.textContent = 'Yükleniyor…';
        var timer = setTimeout(useFallback, 6000);
        window.onSpotifyIframeApiReady = function (api) { clearTimeout(timer); if (!fallback) create(api); };
        var s = document.createElement('script'); s.src = 'https://open.spotify.com/embed/iframe-api/v1'; s.async = true;
        s.onerror = function () { clearTimeout(timer); useFallback(); };
        document.head.appendChild(s);
      });
    })();
  </script>
</body>
</html>`;
}

module.exports = {
  renderLinksHubPage,
  LINKS_DATA,
};
