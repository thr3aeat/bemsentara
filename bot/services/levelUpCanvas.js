/**
 * levelUpCanvas.js
 * 
 * Seviye atlama ve progress kartları oluşturur
 * Modern, MEE6 ve Statbot tarzı görsel tasarımlar
 */

const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

// Renkler
const COLORS = {
  background: "#1a1d21",
  cardDark: "#2C2F33",
  green: "#43B581",
  greenLight: "#5ddb95",
  blue: "#5865F2",
  cyan: "#00D4FF",
  text: "#FFFFFF",
  subtext: "#99AAB5",
  progress: "#36393F",
};

/**
 * Seviye atlama kartı oluşturur (ilk görsel gibi)
 * @param {Object} userData - {username, avatar, level, userId}
 * @returns {Promise<AttachmentBuilder>}
 */
async function createLevelUpCard(userData) {
  const width = 1024;
  const height = 720;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  
  // Arka plan - koyu yeşil gradient ile tropik yaprak deseni
  const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 1.5);
  bgGradient.addColorStop(0, "#1e3a2f");
  bgGradient.addColorStop(1, "#0a1612");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Yaprak desenleri (arka planda siluet)
  drawTropicalLeaves(ctx, width, height);
  
  // Overlay (karartma)
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillRect(0, 0, width, height);
  
  // "SEVİYE ATLADIN!" yazısı
  ctx.fillStyle = COLORS.green;
  ctx.font = "bold 72px Arial";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(67, 181, 129, 0.5)";
  ctx.shadowBlur = 20;
  ctx.fillText("SEVİYE ATLADIN!", width / 2, 140);
  ctx.shadowBlur = 0;
  
  // Büyük yeşil daire (seviye göstergesi)
  const circleY = height / 2 + 20;
  const circleRadius = 180;
  
  // Dış halka (glow effect)
  const glowGradient = ctx.createRadialGradient(width / 2, circleY, circleRadius - 10, width / 2, circleY, circleRadius + 20);
  glowGradient.addColorStop(0, "rgba(67, 181, 129, 0.3)");
  glowGradient.addColorStop(1, "rgba(67, 181, 129, 0)");
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(width / 2, circleY, circleRadius + 20, 0, Math.PI * 2);
  ctx.fill();
  
  // Ana yeşil daire
  const circleGradient = ctx.createRadialGradient(width / 2, circleY - 30, 0, width / 2, circleY + 30, circleRadius);
  circleGradient.addColorStop(0, COLORS.greenLight);
  circleGradient.addColorStop(1, COLORS.green);
  ctx.fillStyle = circleGradient;
  ctx.beginPath();
  ctx.arc(width / 2, circleY, circleRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Seviye numarası
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 140px Arial";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 10;
  ctx.fillText(userData.level.toString(), width / 2, circleY + 50);
  ctx.shadowBlur = 0;
  
  // Avatar (dairenin alt ortasında küçük)
  if (userData.avatar) {
    try {
      const avatarSize = 80;
      const avatarY = circleY + circleRadius - 40;
      const avatarImg = await loadImage(userData.avatar);
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, avatarY, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, width / 2 - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
      ctx.restore();
      
      // Avatar border
      ctx.strokeStyle = COLORS.text;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(width / 2, avatarY, avatarSize / 2, 0, Math.PI * 2);
      ctx.stroke();
    } catch (err) {
      console.error("[LevelUpCard] Avatar yüklenemedi:", err.message);
    }
  }
  
  // Kullanıcı adı (altta)
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 8;
  ctx.fillText(userData.username, width / 2, height - 80);
  ctx.shadowBlur = 0;
  
  const buffer = canvas.toBuffer("image/png");
  return new AttachmentBuilder(buffer, { name: "levelup.png" });
}

/**
 * Progress kartı oluşturur (ikinci görsel gibi)
 * @param {Object} userData - {username, avatar, level, rank, currentXP, nextLevelXP, percentage}
 * @returns {Promise<AttachmentBuilder>}
 */
async function createLevelProgressCard(userData) {
  const width = 1024;
  const height = 300;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  
  // Arka plan gradient (koyu)
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, "#1e2124");
  bgGradient.addColorStop(1, "#2c2f33");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Ana kart (orta)
  const cardY = 50;
  const cardHeight = 200;
  
  // Kart background (biraz daha koyu)
  ctx.fillStyle = "#23272a";
  roundRect(ctx, 30, cardY, width - 60, cardHeight, 20);
  ctx.fill();
  
  // Avatar (sol taraf, büyük)
  const avatarSize = 140;
  const avatarX = 80;
  const avatarY = cardY + cardHeight / 2;
  
  if (userData.avatar) {
    try {
      const avatarImg = await loadImage(userData.avatar);
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
      ctx.restore();
      
      // Avatar border (altın çerçeve - rank için)
      const borderGradient = ctx.createLinearGradient(avatarX - avatarSize / 2, 0, avatarX + avatarSize / 2, 0);
      borderGradient.addColorStop(0, "#FFD700");
      borderGradient.addColorStop(0.5, "#FFA500");
      borderGradient.addColorStop(1, "#FFD700");
      ctx.strokeStyle = borderGradient;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarSize / 2 + 3, 0, Math.PI * 2);
      ctx.stroke();
      
      // Online indicator (yeşil nokta)
      ctx.fillStyle = COLORS.green;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2 - 10, avatarY + avatarSize / 2 - 10, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#23272a";
      ctx.lineWidth = 3;
      ctx.stroke();
    } catch (err) {
      console.error("[ProgressCard] Avatar yüklenemedi:", err.message);
    }
  }
  
  // Sağ taraf bilgiler
  const infoX = avatarX + avatarSize / 2 + 60;
  const infoY = cardY + 50;
  
  // Rank (sağ üst)
  ctx.fillStyle = COLORS.subtext;
  ctx.font = "28px Arial";
  ctx.textAlign = "left";
  ctx.fillText("SIRA", width - 250, infoY);
  
  ctx.fillStyle = "#b0b3b8";
  ctx.font = "bold 56px Arial";
  ctx.textAlign = "right";
  ctx.fillText(`#${userData.rank}`, width - 60, infoY + 5);
  
  // Seviye (sağ alt taraf)
  ctx.fillStyle = COLORS.cyan;
  ctx.font = "28px Arial";
  ctx.textAlign = "left";
  ctx.fillText("SEVİYE", width - 250, infoY + 100);
  
  ctx.fillStyle = COLORS.cyan;
  ctx.font = "bold 56px Arial";
  ctx.textAlign = "right";
  ctx.fillText(userData.level.toString(), width - 60, infoY + 105);
  
  // Kullanıcı adı (sol üst)
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "left";
  ctx.fillText(userData.username, infoX, infoY + 5);
  
  // XP Progress bar
  const barX = infoX;
  const barY = infoY + 50;
  const barWidth = 450;
  const barHeight = 35;
  
  // Progress bar arka plan (koyu)
  ctx.fillStyle = COLORS.progress;
  roundRect(ctx, barX, barY, barWidth, barHeight, barHeight / 2);
  ctx.fill();
  
  // Progress bar dolgu (mavi gradient)
  const progressWidth = (barWidth * userData.percentage) / 100;
  const progressGradient = ctx.createLinearGradient(barX, barY, barX + progressWidth, barY);
  progressGradient.addColorStop(0, "#5865F2");
  progressGradient.addColorStop(1, "#00D4FF");
  ctx.fillStyle = progressGradient;
  roundRect(ctx, barX, barY, progressWidth, barHeight, barHeight / 2);
  ctx.fill();
  
  // Yüzde yazısı (progress bar içinde)
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 4;
  ctx.fillText(`${Math.round(userData.percentage)}%`, barX + barWidth / 2, barY + barHeight / 2 + 8);
  ctx.shadowBlur = 0;
  
  // XP bilgisi (progress bar altında)
  ctx.fillStyle = COLORS.subtext;
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`${userData.currentXP.toLocaleString()} / ${userData.nextLevelXP.toLocaleString()}`, barX, barY + barHeight + 25);
  
  const buffer = canvas.toBuffer("image/png");
  return new AttachmentBuilder(buffer, { name: "progress.png" });
}

/**
 * Tropik yaprak desenleri çizer (arka plan için)
 */
function drawTropicalLeaves(ctx, width, height) {
  ctx.globalAlpha = 0.15;
  
  // Sol üst yapraklar
  drawLeaf(ctx, 100, 100, 200, -30);
  drawLeaf(ctx, 150, 200, 250, 20);
  
  // Sağ üst yapraklar
  drawLeaf(ctx, width - 150, 80, 220, 150);
  drawLeaf(ctx, width - 100, 180, 200, 200);
  
  // Sol alt yapraklar
  drawLeaf(ctx, 120, height - 150, 180, -60);
  
  // Sağ alt yapraklar
  drawLeaf(ctx, width - 100, height - 100, 240, 130);
  
  ctx.globalAlpha = 1.0;
}

/**
 * Yaprak şekli çizer
 */
function drawLeaf(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  
  ctx.fillStyle = "#2d5a3f";
  ctx.beginPath();
  ctx.moveTo(0, -size / 2);
  ctx.quadraticCurveTo(size / 3, -size / 4, size / 2, 0);
  ctx.quadraticCurveTo(size / 3, size / 4, 0, size / 2);
  ctx.quadraticCurveTo(-size / 3, size / 4, -size / 2, 0);
  ctx.quadraticCurveTo(-size / 3, -size / 4, 0, -size / 2);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

/**
 * Rounded rectangle helper
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

module.exports = {
  createLevelUpCard,
  createLevelProgressCard,
};
