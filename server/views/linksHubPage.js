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
    description: 'Yüksek kaliteli canlı yayınlar, oyunlar ve kesintisiz sohbet.',
    badge: 'CANLI YAYIN',
    url: 'https://kick.com/ekoyildiz',
    brandColor: '#53fc18',
    glowColor: 'rgba(83, 252, 24, 0.35)',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19.333 12L14.667 7.333V9.667L17 12L14.667 14.333V16.667L19.333 12ZM4.667 4H9.333V10.333L13.333 4H18.667L13.333 12L19.333 20H14L9.333 13.667V20H4.667V4Z"/></svg>`,
    external: true,
  },
  {
    id: 'twitch',
    category: 'stream',
    categoryLabel: 'Canlı Yayın',
    title: 'Twitch',
    handle: 'twitch.tv/ekoyildiz',
    description: 'Etkinlik yayınları, topluluk geceleri ve interaktif oyunlar.',
    badge: 'CANLI YAYIN',
    url: 'https://www.twitch.tv/ekoyildiz',
    brandColor: '#9146ff',
    glowColor: 'rgba(145, 70, 255, 0.35)',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0h1.714v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>`,
    external: true,
  },
  {
    id: 'youtube-main',
    category: 'video',
    categoryLabel: 'YouTube & Sosyal',
    title: 'YouTube (Ana Kanal)',
    handle: '@eko8yildiz',
    description: 'Ana YouTube kanalı: En yeni videolar, eğlenceli kurgular ve özel içerikler.',
    badge: 'ANA KANAL',
    url: 'https://www.youtube.com/@eko8yildiz',
    brandColor: '#ff0033',
    glowColor: 'rgba(255, 0, 51, 0.35)',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    external: true,
  },
  {
    id: 'youtube-secondary',
    category: 'video',
    categoryLabel: 'YouTube & Sosyal',
    title: 'YouTube (Yedek / Yan Kanal)',
    handle: '@eko8yildiz2',
    description: 'Vloglar, kamera arkası anlar ve alternatif oyun serileri.',
    badge: '2. KANAL',
    url: 'https://www.youtube.com/@eko8yildiz2',
    brandColor: '#ff4d4d',
    glowColor: 'rgba(255, 77, 77, 0.32)',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>`,
    external: true,
  },
  {
    id: 'tiktok',
    category: 'video',
    categoryLabel: 'YouTube & Sosyal',
    title: 'TikTok',
    handle: '@kimdirbueko',
    description: 'Hızlı viral videolar, komik kesitler ve günlük Shorts/TikTok paylaşımları.',
    badge: 'KISA VİDEO',
    url: 'https://www.tiktok.com/@kimdirbueko',
    brandColor: '#00f2fe',
    glowColor: 'rgba(0, 242, 254, 0.35)',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.73 1.4-.07 2.64-.99 3.09-2.31.2-.55.24-1.15.24-1.73l.02-17.15z"/></svg>`,
    external: true,
  },
  {
    id: 'discord',
    category: 'video',
    categoryLabel: 'YouTube & Sosyal',
    title: 'Discord Sunucumuz',
    handle: 'discord.gg/XJWnqx9DQC',
    description: 'Resmi EkoYıldız Discord topluluğu: Sohbet, oyun odaları, çekilişler ve duyurular.',
    badge: 'RESMİ TOPLULUK',
    url: 'https://discord.gg/XJWnqx9DQC',
    brandColor: '#5865f2',
    glowColor: 'rgba(88, 101, 242, 0.38)',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
    external: true,
  },
  {
    id: 'yt-join',
    category: 'support',
    categoryLabel: 'Destek & Katıl',
    title: 'EkoYıldız YouTube Katıl',
    handle: 'Üyelik Satın Al',
    description: 'Ayrıcalıklı rozetler, kanala özel emojiler, üyelere özel canlı yayınlar ve videolar.',
    badge: 'KATIL & ÜYE OL',
    url: 'https://www.youtube.com/channel/UCNSZYtuDQYsZYYQVJvErDVw/join',
    brandColor: '#ffd700',
    glowColor: 'rgba(255, 215, 0, 0.38)',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
    external: true,
  },
  {
    id: 'itemsatis',
    category: 'support',
    categoryLabel: 'Destek & Katıl',
    title: 'İtemsatış ile Destekle',
    handle: 'itemsatis.com/destekle/ekoyildiz',
    description: '3D Secure güvencesiyle doğrudan bağış ve resmi destek mağazası.',
    badge: 'GÜVENLİ DESTEK',
    url: 'https://www.itemsatis.com/destekle/ekoyildiz',
    brandColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.35)',
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
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
    external: true,
  },
];

function renderLinksHubPage(user = null) {
  const headerHtml = renderPlatformHeader({ user, activePath: '/linkler' });
  const footerHtml = renderPlatformFooter();
  const searchDialogHtml = renderSearchDialog();

  const cardsHtml = LINKS_DATA.map((item, index) => `
    <article class="bio-link-card" data-category="${item.category}" style="--item-color:${item.brandColor};--item-glow:${item.glowColor};animation-delay:${index * 0.05}s">
      <div class="bio-card-glow" aria-hidden="true"></div>
      <div class="bio-card-inner">
        <div class="bio-card-left">
          <div class="bio-card-icon" aria-hidden="true" style="color:${item.brandColor}">
            ${item.iconSvg}
          </div>
          <div class="bio-card-details">
            <div class="bio-card-tags">
              <span class="bio-badge" style="border-color:${item.brandColor};color:${item.brandColor}">${item.badge}</span>
              <span class="bio-category-label">${item.categoryLabel}</span>
            </div>
            <h3 class="bio-card-title">${item.title}</h3>
            <div class="bio-card-handle">${item.handle}</div>
            <p class="bio-card-desc">${item.description}</p>
          </div>
        </div>
        <div class="bio-card-actions">
          <button type="button" class="bio-btn-copy" data-copy-url="${item.url}" aria-label="${item.title} bağlantısını kopyala" title="Bağlantıyı Kopyala">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2H10a2 2 0 0 0-2 2z"/><path d="M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"/></svg>
            <span>Kopyala</span>
          </button>
          <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="bio-btn-visit" aria-label="${item.title} sayfasına git">
            <span>Ziyaret Et</span>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
          </a>
        </div>
      </div>
    </article>
  `).join('');

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#0a0a12">
  <meta name="description" content="EkoYıldız resmi bağlantılar: Kick ve Twitch canlı yayınları, YouTube ana ve yan kanalları, Discord topluluğu, İtemsatış ve Instagram profilleri.">
  <meta property="og:title" content="EkoYıldız Resmi Bağlantılar & Linkler">
  <meta property="og:description" content="Canlı yayınlar, YouTube kanalları, Discord topluluğu ve sosyal medya hesapları tek bir yerde.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://ekoyildiz.com/linkler">
  <meta property="og:image" content="https://i.imgur.com/PFcAc6q.png">
  <title>EkoYıldız — Resmi Bağlantılar & Linkler</title>
  ${platformChromeStyles('dark')}
  <style>
    :root {
      --bio-bg: #090a10;
      --bio-card-bg: rgba(18, 20, 32, 0.72);
      --bio-card-hover: rgba(26, 29, 46, 0.85);
      --bio-line: rgba(255, 255, 255, 0.12);
      --bio-text: #f5f6fa;
      --bio-muted: #9fa2b4;
      --bio-accent: #7c6af7;
      --bio-radius: 20px;
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bio-bg);
      color: var(--bio-text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
      position: relative;
    }

    /* Ambient Optical Caustic Mesh */
    .bio-ambient {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: -1;
      overflow: hidden;
    }
    .bio-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.22;
      animation: floatBreath 12s ease-in-out infinite alternate;
    }
    .bio-orb-1 { width: 560px; height: 560px; background: #6366f1; left: -140px; top: -100px; }
    .bio-orb-2 { width: 500px; height: 500px; background: #ec4899; right: -120px; top: 220px; animation-duration: 15s; }
    .bio-orb-3 { width: 440px; height: 440px; background: #10b981; left: 35%; bottom: -80px; animation-duration: 18s; }
    @keyframes floatBreath {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(30px, -25px) scale(1.08); }
      100% { transform: translate(-20px, 35px) scale(0.95); }
    }

    /* Container Shell */
    .bio-shell {
      width: min(840px, calc(100% - 32px));
      margin: 28px auto 60px;
      position: relative;
      z-index: 10;
    }

    /* Profile Hero Card - Liquid Glass */
    .bio-profile-card {
      position: relative;
      background: radial-gradient(130% 120% at 50% -15%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.05) 40%, rgba(124,106,247,0.12) 75%, rgba(16,17,28,0.78) 100%), linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(20,22,35,0.75) 100%);
      border: 1px solid rgba(255, 255, 255, 0.24);
      border-radius: 28px;
      padding: 36px 28px;
      text-align: center;
      box-shadow: 0 28px 64px -16px rgba(0,0,0,0.65), inset 0 1.5px 1px rgba(255,255,255,0.85), inset 0 -1.5px 2px rgba(124,106,247,0.35);
      backdrop-filter: blur(28px) saturate(210%);
      -webkit-backdrop-filter: blur(28px) saturate(210%);
      overflow: hidden;
      margin-bottom: 24px;
      transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1);
    }
    .bio-profile-card::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1px;
      background: linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(168,85,247,0.6) 35%, rgba(56,189,248,0.6) 65%, rgba(255,255,255,0.5) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      opacity: 0.85;
    }

    .bio-avatar-wrap {
      position: relative;
      width: 104px;
      height: 104px;
      margin: 0 auto 16px;
    }
    .bio-avatar-ring {
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7c6af7, #ec4899, #10b981);
      animation: rotateRing 8s linear infinite;
      filter: blur(2px);
      opacity: 0.8;
    }
    @keyframes rotateRing {
      to { transform: rotate(360deg); }
    }
    .bio-avatar {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #0e1017;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      background: #181a26;
      display: block;
    }
    .bio-verified-badge {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #3b82f6;
      color: #fff;
      display: grid;
      place-items: center;
      border: 2px solid #0e1017;
      box-shadow: 0 2px 8px rgba(59,130,246,0.5);
    }

    .bio-title-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .bio-name {
      margin: 0;
      font-size: clamp(1.6rem, 3.8vw, 2.2rem);
      font-weight: 850;
      letter-spacing: -0.04em;
      background: linear-gradient(110deg, #ffffff 30%, #c7d2fe 70%, #f472b6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .bio-live-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 11px;
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.14);
      border: 1px solid rgba(16, 185, 129, 0.38);
      color: #34d399;
      font-size: 0.74rem;
      font-weight: 750;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .bio-live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: pulseDot 2s ease-in-out infinite;
    }
    @keyframes pulseDot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    .bio-desc {
      margin: 0 auto 20px;
      max-width: 580px;
      color: var(--bio-muted);
      font-size: clamp(0.88rem, 1.4vw, 0.98rem);
      line-height: 1.55;
    }

    .bio-profile-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .bio-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 18px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.20);
      color: var(--bio-text);
      font-size: 0.82rem;
      font-weight: 750;
      cursor: pointer;
      text-decoration: none;
      box-shadow: inset 0 1px 1px rgba(255,255,255,0.4), 0 4px 12px rgba(0,0,0,0.2);
      transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      user-select: none;
    }
    .bio-action-btn:hover {
      background: rgba(255, 255, 255, 0.16);
      border-color: rgba(255, 255, 255, 0.35);
      transform: translateY(-2px);
    }
    .bio-action-btn:active {
      transform: scale(0.94) translateY(1.5px) !important;
      box-shadow: inset 0 2.5px 6px rgba(0,0,0,0.5), 0 0 16px rgba(124,106,247,0.45) !important;
    }

    /* Filter Pills Nav */
    .bio-filters {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      padding: 4px 2px 14px;
      margin-bottom: 12px;
      scrollbar-width: none;
    }
    .bio-filters::-webkit-scrollbar { display: none; }
    .bio-filter-pill {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: var(--bio-muted);
      font-size: 0.8rem;
      font-weight: 750;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
    }
    .bio-filter-pill:hover {
      background: rgba(255, 255, 255, 0.12);
      color: var(--bio-text);
      border-color: rgba(255, 255, 255, 0.28);
      transform: translateY(-1px);
    }
    .bio-filter-pill.active {
      background: var(--liquid-pill-active, rgba(255, 255, 255, 0.22));
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.45);
      box-shadow: 0 4px 16px rgba(124, 106, 247, 0.35), inset 0 1px 1px rgba(255,255,255,0.7);
    }
    .bio-filter-pill:active {
      transform: scale(0.93) translateY(1.5px) !important;
    }

    /* Link Cards List */
    .bio-cards-grid {
      display: grid;
      gap: 12px;
    }

    /* Individual Bento Card - Liquid Glass */
    .bio-link-card {
      position: relative;
      border-radius: var(--bio-radius);
      background: radial-gradient(120% 110% at 50% -20%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 45%, rgba(18,20,32,0.78) 100%), linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(18,20,32,0.74) 100%);
      border: 1px solid rgba(255, 255, 255, 0.18);
      box-shadow: 0 16px 36px -12px rgba(0,0,0,0.55), inset 0 1.5px 1px rgba(255,255,255,0.7), inset 0 -1.5px 2px rgba(255,255,255,0.08);
      backdrop-filter: blur(24px) saturate(200%);
      -webkit-backdrop-filter: blur(24px) saturate(200%);
      overflow: hidden;
      transition: transform 0.24s cubic-bezier(0.34,1.56,0.64,1), border-color 0.24s ease, box-shadow 0.24s ease;
      animation: cardFadeIn 0.45s ease backwards;
    }
    @keyframes cardFadeIn {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .bio-link-card::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1px;
      background: linear-gradient(120deg, rgba(255,255,255,0.6) 0%, var(--item-color, #7c6af7) 50%, rgba(255,255,255,0.2) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      opacity: 0.45;
      transition: opacity 0.3s ease;
    }
    .bio-card-glow {
      position: absolute;
      width: 220px;
      height: 220px;
      border-radius: 50%;
      background: var(--item-color, #7c6af7);
      filter: blur(70px);
      opacity: 0;
      top: -60px;
      right: -50px;
      pointer-events: none;
      transition: opacity 0.35s ease;
    }
    .bio-link-card:hover {
      transform: translateY(-3px) scale(1.008);
      border-color: rgba(255, 255, 255, 0.35);
      box-shadow: 0 24px 50px -14px rgba(0,0,0,0.65), 0 0 28px var(--item-glow, rgba(124,106,247,0.2)), inset 0 1.5px 1px rgba(255,255,255,0.9);
    }
    .bio-link-card:hover::before { opacity: 0.9; }
    .bio-link-card:hover .bio-card-glow { opacity: 0.24; }

    /* Card Inner Content */
    .bio-card-inner {
      position: relative;
      z-index: 2;
      padding: 20px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
    }
    .bio-card-left {
      display: flex;
      align-items: center;
      gap: 16px;
      min-width: 0;
      flex: 1 1 auto;
    }
    .bio-card-icon {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.18);
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      box-shadow: inset 0 1px 1px rgba(255,255,255,0.4), 0 6px 16px rgba(0,0,0,0.25);
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
    }
    .bio-link-card:hover .bio-card-icon {
      transform: scale(1.08) rotate(-3deg);
    }
    .bio-card-details {
      min-width: 0;
      flex: 1 1 auto;
    }
    .bio-card-tags {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }
    .bio-badge {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 2px 7px;
      border-radius: 6px;
      border: 1px solid;
      background: rgba(255, 255, 255, 0.04);
    }
    .bio-category-label {
      font-size: 0.72rem;
      color: var(--bio-muted);
    }
    .bio-card-title {
      margin: 0;
      font-size: 1.12rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: var(--bio-text);
      line-height: 1.25;
    }
    .bio-card-handle {
      font-size: 0.78rem;
      color: var(--bio-muted);
      margin-top: 2px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .bio-card-desc {
      margin: 4px 0 0;
      font-size: 0.84rem;
      color: #a4a8bc;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Card Actions (Buttons) */
    .bio-card-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 0 0 auto;
    }
    .bio-btn-copy {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 12px;
      border-radius: 11px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.16);
      color: var(--bio-muted);
      font-size: 0.76rem;
      font-weight: 750;
      cursor: pointer;
      box-shadow: inset 0 1px 1px rgba(255,255,255,0.3);
      user-select: none;
      transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
    }
    .bio-btn-copy:hover {
      background: rgba(255, 255, 255, 0.14);
      color: var(--bio-text);
      border-color: rgba(255, 255, 255, 0.32);
      transform: translateY(-1.5px);
    }
    .bio-btn-copy:active {
      transform: scale(0.92) translateY(1.5px) !important;
    }

    .bio-btn-visit {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 16px;
      border-radius: 11px;
      background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(220,225,250,0.88) 100%);
      color: #0c0d14;
      font-size: 0.8rem;
      font-weight: 850;
      text-decoration: none;
      box-shadow: 0 6px 18px rgba(0,0,0,0.25), inset 0 1.5px 1px #ffffff;
      user-select: none;
      transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
    }
    .bio-btn-visit:hover {
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 10px 24px rgba(0,0,0,0.35), inset 0 1.5px 1px #ffffff;
      background: #ffffff;
    }
    .bio-btn-visit:active {
      transform: scale(0.93) translateY(2px) !important;
      box-shadow: inset 0 2px 5px rgba(0,0,0,0.3) !important;
    }

    /* Toast Notification */
    .bio-toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(30px);
      opacity: 0;
      visibility: hidden;
      background: rgba(18, 20, 32, 0.94);
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 999px;
      padding: 10px 22px;
      color: #fff;
      font-size: 0.84rem;
      font-weight: 750;
      box-shadow: 0 16px 40px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.6);
      backdrop-filter: blur(16px);
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 2000;
      transition: all 0.28s cubic-bezier(0.34,1.56,0.64,1);
      pointer-events: none;
    }
    .bio-toast.show {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
    }
    .bio-toast-icon { color: #10b981; }

    /* Responsive */
    @media (max-width: 680px) {
      .bio-shell { margin-top: 16px; }
      .bio-profile-card { padding: 26px 18px; border-radius: 22px; }
      .bio-card-inner { flex-direction: column; align-items: stretch; gap: 14px; padding: 16px; }
      .bio-card-actions { justify-content: stretch; width: 100%; }
      .bio-btn-copy, .bio-btn-visit { flex: 1 1 0; justify-content: center; }
      .bio-card-left { gap: 12px; }
      .bio-card-icon { width: 44px; height: 44px; border-radius: 12px; }
      .bio-card-desc { font-size: 0.8rem; }
    }
  </style>
</head>
<body class="platform-chrome" data-theme="dark">
  <div class="bio-ambient" aria-hidden="true">
    <div class="bio-orb bio-orb-1"></div>
    <div class="bio-orb bio-orb-2"></div>
    <div class="bio-orb bio-orb-3"></div>
  </div>

  ${headerHtml}

  <main class="bio-shell" id="main-content">
    <!-- Profile Hero Card -->
    <section class="bio-profile-card">
      <div class="bio-avatar-wrap">
        <div class="bio-avatar-ring" aria-hidden="true"></div>
        <img class="bio-avatar" src="https://i.imgur.com/PFcAc6q.png" alt="EkoYıldız Avatar" width="104" height="104">
        <div class="bio-verified-badge" title="Doğrulanmış Resmi Hesap" aria-label="Doğrulanmış Hesap">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
        </div>
      </div>

      <div class="bio-title-wrap">
        <h1 class="bio-name">EkoYıldız</h1>
      </div>

      <div>
        <span class="bio-live-pill">
          <span class="bio-live-dot" aria-hidden="true"></span>
          Resmi Bağlantı &amp; Sosyal Hub
        </span>
      </div>

      <p class="bio-desc">
        EkoYıldız canlı yayınları (Kick, Twitch), YouTube kanalları, TikTok, Discord topluluğu, üyelik/destek mağazası ve Instagram hesaplarının tamamına buradan hızlıca ulaşabilirsiniz.
      </p>

      <div class="bio-profile-actions">
        <button type="button" class="bio-action-btn" id="btnShareProfile">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          <span>Sayfa Linkini Paylaş</span>
        </button>
        <a href="/yardim" class="bio-action-btn">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>Yardım &amp; Destek</span>
        </a>
      </div>
    </section>

    <!-- Category Filter Pills -->
    <nav class="bio-filters" aria-label="Kategori filtreleri">
      <button type="button" class="bio-filter-pill active" data-filter="all">Tümü (10)</button>
      <button type="button" class="bio-filter-pill" data-filter="stream">🎮 Canlı Yayınlar</button>
      <button type="button" class="bio-filter-pill" data-filter="video">📺 YouTube &amp; Topluluk</button>
      <button type="button" class="bio-filter-pill" data-filter="support">💎 Destek &amp; Katıl</button>
      <button type="button" class="bio-filter-pill" data-filter="instagram">📸 Instagram</button>
    </nav>

    <!-- Links Bento Grid -->
    <div class="bio-cards-grid" id="bioCardsContainer">
      ${cardsHtml}
    </div>
  </main>

  <div class="bio-toast" id="bioToast" role="status" aria-live="polite">
    <span class="bio-toast-icon">✓</span>
    <span id="bioToastMsg">Bağlantı kopyalandı!</span>
  </div>

  ${footerHtml}
  ${searchDialogHtml}
  ${platformChromeScript()}

  <script>
    (function() {
      // Toast notification helper
      var toast = document.getElementById('bioToast');
      var toastMsg = document.getElementById('bioToastMsg');
      var toastTimeout = null;
      function showToast(msg) {
        if (!toast || !toastMsg) return;
        toastMsg.textContent = msg || 'Bağlantı kopyalandı!';
        toast.classList.add('show');
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(function() {
          toast.classList.remove('show');
        }, 2400);
      }

      // Copy buttons handler
      document.querySelectorAll('[data-copy-url]').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          var url = btn.getAttribute('data-copy-url');
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function() {
              showToast('Bağlantı panoya kopyalandı!');
            }).catch(function() {
              fallbackCopy(url);
            });
          } else {
            fallbackCopy(url);
          }
        });
      });

      function fallbackCopy(text) {
        var temp = document.createElement('textarea');
        temp.value = text;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.focus();
        temp.select();
        try {
          document.execCommand('copy');
          showToast('Bağlantı panoya kopyalandı!');
        } catch (_) {
          showToast('Kopyalanamadı.');
        }
        document.body.removeChild(temp);
      }

      // Share profile button
      var btnShare = document.getElementById('btnShareProfile');
      if (btnShare) {
        btnShare.addEventListener('click', function() {
          var shareUrl = window.location.origin + '/linkler';
          if (navigator.share) {
            navigator.share({
              title: 'EkoYıldız Resmi Bağlantılar',
              text: 'EkoYıldız canlı yayınlar, YouTube ve sosyal medya bağlantıları',
              url: shareUrl
            }).catch(function() {});
          } else if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl).then(function() {
              showToast('Profil bağlantısı kopyalandı!');
            });
          } else {
            fallbackCopy(shareUrl);
          }
        });
      }

      // Filter tabs handler
      var filterPills = document.querySelectorAll('.bio-filter-pill');
      var cards = document.querySelectorAll('.bio-link-card');
      filterPills.forEach(function(pill) {
        pill.addEventListener('click', function() {
          var filter = pill.getAttribute('data-filter');
          filterPills.forEach(function(p) { p.classList.remove('active'); });
          pill.classList.add('active');

          cards.forEach(function(card) {
            var cat = card.getAttribute('data-category');
            if (filter === 'all' || cat === filter) {
              card.style.display = '';
            } else {
              card.style.display = 'none';
            }
          });
        });
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
