'use strict';

/**
 * 1200x630 bağlantı önizleme kartları (@napi-rs/canvas). /linkler için profil
 * fotoğraflı, platform rozetli özel tasarım; diğer sayfalar ortak şablon.
 * Üretilen PNG'ler bellekte önbelleklenir.
 */

const path = require('path');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { metaFor } = require('./ogMeta');

const W = 1200, H = 630;
const FONT_DIR = path.join(__dirname, '..', 'assets', 'fonts');
const MASCOT = path.join(__dirname, '..', 'public', 'assets', 'mascot.png');
let fontsReady = false;
function ensureFonts() {
  if (fontsReady) return;
  fontsReady = true;
  const reg = (file, family) => { try { GlobalFonts.registerFromPath(path.join(FONT_DIR, file), family); } catch (_) {} };
  reg('Inter-Regular.otf', 'OG Regular');
  reg('Inter-SemiBold.otf', 'OG SemiBold');
  reg('Inter-Bold.otf', 'OG Bold');
  reg('Inter-ExtraBold.otf', 'OG ExtraBold');
  reg('JetBrainsMono-Medium.ttf', 'OG Mono');
}

const BG = '#0a0a0b', TEXT = '#ededef', MUTED = '#8c8c95', LINE = '#232327';
const PLATFORMS = [
  ['Kick', '#53fc18'], ['Twitch', '#a970ff'], ['YouTube', '#ff3b3b'],
  ['TikTok', '#25f4ee'], ['Discord', '#5865f2'], ['Instagram', '#e1306c']
];

const cache = new Map();
const CACHE_MS = 6 * 60 * 60 * 1000;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function wrap(ctx, text, maxW, maxLines) {
  const words = String(text).split(/\s+/); const lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const keep = lines.slice(0, maxLines);
    let last = keep[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxW && last.length) last = last.slice(0, -1);
    keep[maxLines - 1] = `${last.trimEnd()}…`;
    return keep;
  }
  return lines;
}

function backdrop(ctx, color) {
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  // ince ızgara
  ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 48) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke(); }
  // köşe ışıması
  const g = ctx.createRadialGradient(W - 120, 40, 0, W - 120, 40, 620);
  g.addColorStop(0, hexA(color, 0.28)); g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const v = ctx.createLinearGradient(0, H - 260, 0, H);
  v.addColorStop(0, 'rgba(10,10,11,0)'); v.addColorStop(1, 'rgba(10,10,11,0.9)');
  ctx.fillStyle = v; ctx.fillRect(0, H - 260, W, 260);
}

function hexA(hex, a) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

async function fetchImage(url) {
  if (!url) return null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    return await loadImage(Buffer.from(await r.arrayBuffer()));
  } catch (_) { return null; }
}

function avatarCircle(ctx, img, x, y, size, ring) {
  ctx.save();
  ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2 + 6, 0, Math.PI * 2);
  ctx.fillStyle = ring; ctx.fill();
  ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2 + 2, 0, Math.PI * 2);
  ctx.fillStyle = BG; ctx.fill();
  ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2 - 2, 0, Math.PI * 2); ctx.clip();
  if (img) ctx.drawImage(img, x, y, size, size);
  else { ctx.fillStyle = '#17171a'; ctx.fillRect(x, y, size, size); }
  ctx.restore();
}

function footer(ctx, host, pathLabel, color) {
  ctx.fillStyle = LINE; ctx.fillRect(72, H - 92, W - 144, 1);
  ctx.font = '24px "OG Mono"'; ctx.fillStyle = MUTED; ctx.textBaseline = 'middle';
  const left = `${host}${pathLabel}`;
  ctx.fillText(left, 72, H - 52);
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(W - 84, H - 52, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = MUTED; ctx.textAlign = 'right'; ctx.fillText('EkoYıldız', W - 102, H - 52); ctx.textAlign = 'left';
}

function linksCard(ctx, m, avatar, host) {
  const color = m.color;
  backdrop(ctx, color);
  avatarCircle(ctx, avatar, 72, 84, 148, color);

  ctx.textBaseline = 'alphabetic';
  ctx.font = '26px "OG Mono"'; ctx.fillStyle = color; ctx.fillText('@ekoyildiz', 262, 128);
  ctx.font = '92px "OG ExtraBold"'; ctx.fillStyle = TEXT; ctx.fillText('EkoYıldız', 256, 212);
  const tw = ctx.measureText('EkoYıldız').width;
  // doğrulama rozeti
  const bx = 256 + tw + 34, by = 180;
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(bx, by, 20, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = BG; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(bx - 9, by + 1); ctx.lineTo(bx - 2, by + 8); ctx.lineTo(bx + 10, by - 7); ctx.stroke();

  ctx.font = '34px "OG Regular"'; ctx.fillStyle = MUTED;
  ctx.fillText('Yayınlar, videolar ve topluluk. Hepsi tek sayfada.', 72, 310);

  // platform rozetleri
  let x = 72, y = 360;
  ctx.font = '28px "OG SemiBold"';
  for (const [name, c] of PLATFORMS) {
    const w = ctx.measureText(name).width + 70;
    if (x + w > W - 72) { x = 72; y += 76; }
    rr(ctx, x, y, w, 58, 29); ctx.fillStyle = '#121214'; ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 28, y + 29, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = TEXT; ctx.textBaseline = 'middle'; ctx.fillText(name, x + 46, y + 30); ctx.textBaseline = 'alphabetic';
    x += w + 14;
  }
  footer(ctx, host, '/linkler', color);
}

function pageCard(ctx, m, avatar, host) {
  backdrop(ctx, m.color);
  // marka satırı
  avatarCircle(ctx, avatar, 72, 64, 56, hexA(m.color, 0.9));
  ctx.textBaseline = 'middle';
  ctx.font = '30px "OG Bold"'; ctx.fillStyle = TEXT; ctx.fillText('EkoYıldız', 150, 94);
  ctx.font = '22px "OG Mono"';
  const label = m.eyebrow;
  const lw = ctx.measureText(label).width + 36;
  rr(ctx, W - 72 - lw, 74, lw, 42, 21); ctx.fillStyle = hexA(m.color, 0.14); ctx.fill();
  ctx.strokeStyle = hexA(m.color, 0.5); ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = m.color; ctx.fillText(label, W - 72 - lw + 18, 96);

  ctx.textBaseline = 'alphabetic';
  let size = 88; ctx.font = `${size}px "OG ExtraBold"`;
  let lines = wrap(ctx, m.title, W - 144, 2);
  if (lines.length > 1) { size = 72; ctx.font = `${size}px "OG ExtraBold"`; lines = wrap(ctx, m.title, W - 144, 2); }
  let y = 270;
  ctx.fillStyle = m.color; rr(ctx, 72, y - size - 18, 64, 6, 3); ctx.fill();
  ctx.fillStyle = TEXT;
  for (const l of lines) { ctx.fillText(l, 72, y); y += size * 1.1; }
  ctx.font = '34px "OG Regular"'; ctx.fillStyle = MUTED;
  for (const l of wrap(ctx, m.desc, W - 144, 2)) { y += 6; ctx.fillText(l, 72, y + 18); y += 46; }
  footer(ctx, host, m.key === '/' ? '' : m.key, m.color);
}

/** PNG Buffer üretir. */
async function renderOgCard(pathname, { host = 'ekoyildiz', html = '' } = {}) {
  ensureFonts();
  const m = metaFor(pathname, html);
  const hit = cache.get(m.key + host);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.buf;

  let avatarUrl = null;
  try { avatarUrl = await require('./linksAvatarService').getLinksAvatar(1500); } catch (_) {}
  const avatar = (await fetchImage(avatarUrl)) || (await loadImage(MASCOT).catch(() => null));

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  if (m.key === '/linkler') linksCard(ctx, m, avatar, host); else pageCard(ctx, m, avatar, host);
  const buf = await canvas.encode('png');
  cache.set(m.key + host, { buf, at: Date.now() });
  return buf;
}

module.exports = { renderOgCard };
