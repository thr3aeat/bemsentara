/**
 * leaderboardCanvas.js (v2 — modern/şık versiyon)
 *
 * Canvas ile Statbot tarzı görsel leaderboard ve stat kartları oluşturur.
 * @napi-rs/canvas kullanır.
 */

const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

// ---------------------------------------------------------------------------
// Tema / Renk paleti (Statbot referans görseline yakın koyu tema)
// ---------------------------------------------------------------------------
const THEME = {
  bg: "#15171c",          // en dış arka plan
  panel: "#1e2128",       // kart panelleri
  panelAlt: "#22252c",    // alternatif satır rengi
  border: "rgba(255,255,255,0.06)",
  text: "#f2f3f5",
  subtext: "#8b8f98",
  accent: "#5865f2",      // discord blurple
  accentSoft: "rgba(88,101,242,0.15)",
  gold: "#ffd166",
  silver: "#c9ccd1",
  bronze: "#d98e4c",
  green: "#3ecf8e",
  pink: "#ff5d9e",
  purple: "#9b59f6",
  orange: "#ff9f43",
};

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

/** Yuvarlatılmış dikdörtgen path'i çizer */
function roundRect(ctx, x, y, w, h, r) {
  if (typeof r === "number") r = { tl: r, tr: r, br: r, bl: r };
  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + w - r.tr, y);
  ctx.arcTo(x + w, y, x + w, y + r.tr, r.tr);
  ctx.lineTo(x + w, y + h - r.br);
  ctx.arcTo(x + w, y + h, x + w - r.br, y + h, r.br);
  ctx.lineTo(x + r.bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - r.bl, r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.arcTo(x, y, x + r.tl, y, r.tl);
  ctx.closePath();
}

/** Düz panel çizer (arka plan dolgusu ile) */
function drawPanel(ctx, x, y, w, h, r = 16, fill = THEME.panel) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = THEME.border;
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, r);
  ctx.stroke();
  ctx.restore();
}

/** Dairesel avatar çizer, hata olursa baş harf rozeti çizer */
async function drawAvatar(ctx, url, cx, cy, radius, fallbackChar = "?", ringColor = THEME.accent) {
  try {
    const img = await loadImage(url);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.restore();
  } catch {
    ctx.save();
    ctx.fillStyle = THEME.panelAlt;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = THEME.subtext;
    ctx.font = `bold ${Math.floor(radius)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(fallbackChar.toUpperCase(), cx, cy);
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }
  // İnce ring
  ctx.save();
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = Math.max(2, radius * 0.06);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function rankColor(rank) {
  if (rank === 1) return THEME.gold;
  if (rank === 2) return THEME.silver;
  if (rank === 3) return THEME.bronze;
  return THEME.subtext;
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function fitText(ctx, text, maxWidth, baseFont, minFont = 14) {
  let size = baseFont;
  ctx.font = `bold ${size}px Arial`;
  while (ctx.measureText(text).width > maxWidth && size > minFont) {
    size -= 1;
    ctx.font = `bold ${size}px Arial`;
  }
  return size;
}

// ---------------------------------------------------------------------------
// 1) Tam Leaderboard Kartı
// ---------------------------------------------------------------------------
async function createLeaderboardCard(leaderboardData, userRank, category = "Puan") {
  const width = 1200;
  const headerHeight = 140;
  const itemHeight = 96;
  const itemGap = 10;
  const padding = 24;
  const items = leaderboardData.slice(0, 10);
  const footerHeight = userRank ? 116 : 0;
  const height =
    headerHeight +
    items.length * (itemHeight + itemGap) +
    (footerHeight ? footerHeight + 24 : 0) +
    padding;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Arka plan
  ctx.fillStyle = THEME.bg;
  ctx.fillRect(0, 0, width, height);

  // Header
  drawHeader(ctx, width, headerHeight, category);

  // Liste
  let y = headerHeight + 16;
  for (const item of items) {
    drawLeaderboardItem(ctx, item, padding, y, width - padding * 2, itemHeight);
    y += itemHeight + itemGap;
  }

  // Kullanıcının kendi sırası
  if (userRank) {
    y += 8;
    drawUserRankFooter(ctx, userRank, padding, y, width - padding * 2, footerHeight);
  }

  const buffer = canvas.toBuffer("image/png");
  return new AttachmentBuilder(buffer, { name: "leaderboard.png" });
}

function drawHeader(ctx, width, headerHeight, category) {
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, THEME.accent);
  gradient.addColorStop(0.5, THEME.purple);
  gradient.addColorStop(1, "#3b82f6");

  ctx.save();
  roundRect(ctx, 0, 0, width, headerHeight, { tl: 0, tr: 0, br: 0, bl: 0 });
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();

  // Header vector star badge
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
  ctx.beginPath();
  ctx.arc(50, 60, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("★", 50, 61);
  ctx.restore();

  // Başlık
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.font = "bold 38px Arial";
  ctx.fillText("Leaderboard Sıralaması", 88, 65);

  // Kategori pill
  ctx.font = "bold 15px Arial";
  const label = `KATEGORİ: ${category.toUpperCase()}`;
  const pillW = ctx.measureText(label).width + 32;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  roundRect(ctx, 88, 88, pillW, 32, 16);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, 104, 109);
}

function drawLeaderboardItem(ctx, item, x, y, w, h) {
  const isTop3 = item.rank <= 3;
  const rc = rankColor(item.rank);

  // Top 3 için özel parıltılı metalik zemin
  if (isTop3) {
    ctx.save();
    ctx.shadowColor = rc;
    ctx.shadowBlur = 10;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = rc;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  } else {
    drawPanel(ctx, x, y, w, h, 16, THEME.panel);
  }

  const cx = x + 24;
  const centerY = y + h / 2;

  // Rank kapsülü (Daire / Yuvarlatılmış Kutu)
  ctx.save();
  if (isTop3) {
    const grad = ctx.createLinearGradient(cx, y, cx + 52, y + h);
    grad.addColorStop(0, rc);
    grad.addColorStop(1, "#1a1a1a");
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.06)";
  }
  roundRect(ctx, cx, centerY - 22, 52, 44, 12);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = isTop3 ? "#ffffff" : THEME.text;
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`#${item.rank}`, cx + 26, centerY + 7);

  // Avatar
  const avatarCx = cx + 100;
  drawAvatar(ctx, item.avatar, avatarCx, centerY, 26, item.username[0] || "?", isTop3 ? rc : THEME.accent);

  // Kullanıcı adı + premium
  ctx.textAlign = "left";
  const nameX = avatarCx + 44;
  ctx.fillStyle = THEME.text;
  const nameFont = fitText(ctx, item.username, 280, 24, 16);
  ctx.font = `bold ${nameFont}px Arial`;
  ctx.fillText(truncate(item.username, 22), nameX, centerY - (item.isPremium ? 6 : -6));

  if (item.isPremium) {
    ctx.fillStyle = THEME.gold;
    ctx.font = "600 14px Arial";
    ctx.fillText("★ Premium VIP", nameX, centerY + 16);
  }

  // İstatistik sütunları (sağa hizalı, eşit aralıklı)
  const stats = [
    { value: item.points?.toLocaleString?.() ?? item.points, label: "Puan", color: THEME.green },
    { value: `Lv ${item.xpLevel}`, label: "Seviye", color: THEME.purple },
    { value: `${item.tickets}`, label: "Ticket", color: THEME.orange },
  ];
  if (item.badges > 0) stats.push({ value: `${item.badges}`, label: "Rozet", color: THEME.gold });

  const statsAreaX = x + w - 24;
  const colWidth = 130;
  stats.forEach((s, i) => {
    const sx = statsAreaX - colWidth * (stats.length - i - 1);
    ctx.textAlign = "left";
    ctx.fillStyle = s.color;
    ctx.font = "bold 22px Arial";
    ctx.fillText(String(s.value), sx - colWidth + 20, centerY - 2);
    ctx.fillStyle = THEME.subtext;
    ctx.font = "14px Arial";
    ctx.fillText(s.label, sx - colWidth + 20, centerY + 18);
  });

  // İnce alt ilerleme çubuğu (Progress line)
  if (item.points && typeof item.points === 'number') {
    const maxPts = 5000;
    const pct = Math.min(1, item.points / maxPts);
    ctx.save();
    ctx.fillStyle = rc;
    roundRect(ctx, x + 16, y + h - 4, (w - 32) * pct, 3, 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawUserRankFooter(ctx, userRank, x, y, w, h) {
  ctx.save();
  const gradient = ctx.createLinearGradient(x, y, x + w, y);
  gradient.addColorStop(0, THEME.accentSoft);
  gradient.addColorStop(1, "rgba(155,89,246,0.15)");
  ctx.fillStyle = gradient;
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = THEME.accent;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 16);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = THEME.accent;
  ctx.font = "bold 15px Arial";
  ctx.textAlign = "left";
  ctx.fillText("SENİN POZİSYONUN", x + 24, y + 30);

  ctx.fillStyle = THEME.text;
  ctx.font = "bold 30px Arial";
  ctx.fillText(`#${userRank.rank}`, x + 24, y + 72);

  const name = truncate(userRank.username, 22);
  ctx.font = "bold 22px Arial";
  ctx.fillText(name, x + 100, y + 70);

  const statsX = x + w - 300;
  ctx.fillStyle = THEME.green;
  ctx.font = "bold 18px Arial";
  ctx.fillText(`Puan: ${userRank.points?.toLocaleString?.() ?? userRank.points}`, statsX, y + 45);

  ctx.fillStyle = THEME.purple;
  ctx.fillText(`Level: ${userRank.xpLevel}`, statsX, y + 75);

  ctx.fillStyle = THEME.orange;
  ctx.fillText(`Ticket: ${userRank.tickets}`, statsX + 180, y + 45);

  if (userRank.badges > 0) {
    ctx.fillStyle = THEME.gold;
    ctx.fillText(`Rozet: ${userRank.badges}`, statsX + 180, y + 75);
  }
}

// ---------------------------------------------------------------------------
// 2) Top 3 Podyum Kartı
// ---------------------------------------------------------------------------
async function createMiniLeaderboardCard(top3) {
  const width = 800;
  const height = 420;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = THEME.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = THEME.text;
  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Top 3", width / 2, 50);

  const positions = [
    { rank: 2, x: 190, baseY: 340, h: 130, color: THEME.silver },
    { rank: 1, x: 400, baseY: 340, h: 180, color: THEME.gold },
    { rank: 3, x: 610, baseY: 340, h: 95, color: THEME.bronze },
  ];

  for (const pos of positions) {
    const user = top3.find((u) => u.rank === pos.rank);
    if (!user) continue;

    const podiumY = pos.baseY - pos.h;

    // Podyum bloğu (yuvarlatılmış üst köşeler)
    ctx.save();
    const grad = ctx.createLinearGradient(0, podiumY, 0, pos.baseY);
    grad.addColorStop(0, pos.color);
    grad.addColorStop(1, "rgba(0,0,0,0.15)");
    ctx.fillStyle = grad;
    roundRect(ctx, pos.x - 80, podiumY, 160, pos.h, { tl: 14, tr: 14, br: 0, bl: 0 });
    ctx.fill();
    ctx.restore();

    // Rank sayısı podyum içinde
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${pos.rank}`, pos.x, podiumY + pos.h / 2 + 14);

    // Avatar podyumun üstünde
    await drawAvatar(ctx, user.avatar, pos.x, podiumY - 46, 42, user.username[0] || "?", pos.color);

    // Kullanıcı adı
    ctx.fillStyle = THEME.text;
    ctx.font = "bold 18px Arial";
    ctx.fillText(truncate(user.username, 12), pos.x, podiumY - 76);

    // Puan
    ctx.fillStyle = THEME.green;
    ctx.font = "600 15px Arial";
    ctx.fillText(`${user.points?.toLocaleString?.() ?? user.points} puan`, pos.x, podiumY - 56);
  }

  const buffer = canvas.toBuffer("image/png");
  return new AttachmentBuilder(buffer, { name: "top3.png" });
}

// ---------------------------------------------------------------------------
// 3) Bireysel Kullanıcı Stat Kartı
// ---------------------------------------------------------------------------
async function createUserStatCard(userData) {
  const width = 820;
  const height = 480;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Dış gradient zemin
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, THEME.accent);
  bgGrad.addColorStop(1, THEME.purple);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // İç panel
  drawPanel(ctx, 20, 20, width - 40, height - 40, 24, "rgba(15,17,21,0.82)");

  // Avatar
  await drawAvatar(ctx, userData.avatar, 130, 130, 70, userData.username[0] || "?", THEME.gold);

  // İsim + rank
  ctx.textAlign = "left";
  ctx.fillStyle = THEME.text;
  ctx.font = "bold 34px Arial";
  ctx.fillText(truncate(userData.username, 18), 230, 118);

  ctx.fillStyle = THEME.gold;
  ctx.font = "600 22px Arial";
  ctx.fillText(`Sıralama #${userData.rank}`, 230, 152);

  // İstatistik grid (2x2 yuvarlatılmış kutular)
  const stats = [
    { label: "Puan", value: userData.points?.toLocaleString?.() ?? userData.points, color: THEME.green },
    { label: "Seviye", value: `Lv ${userData.xpLevel}`, color: THEME.purple },
    { label: "Ticket", value: `${userData.tickets}`, color: THEME.orange },
    { label: "Rozet", value: `${userData.badges}`, color: THEME.gold },
  ];

  const gridX = 60;
  const gridY = 240;
  const gap = 20;
  const cellW = (width - 40 - gridX * 2 - gap) / 2;
  const cellH = 90;

  stats.forEach((stat, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = gridX + col * (cellW + gap);
    const y = gridY + row * (cellH + gap);

    drawPanel(ctx, x, y, cellW, cellH, 16, "rgba(255,255,255,0.05)");

    ctx.textAlign = "center";
    ctx.fillStyle = stat.color;
    ctx.font = "bold 28px Arial";
    ctx.fillText(String(stat.value), x + cellW / 2, y + 40);

    ctx.fillStyle = THEME.subtext;
    ctx.font = "16px Arial";
    ctx.fillText(stat.label, x + cellW / 2, y + 66);
  });

  const buffer = canvas.toBuffer("image/png");
  return new AttachmentBuilder(buffer, { name: "stats.png" });
}

module.exports = {
  createLeaderboardCard,
  createMiniLeaderboardCard,
  createUserStatCard,
};