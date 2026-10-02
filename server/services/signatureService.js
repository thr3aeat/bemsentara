const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createCanvas } = require('@napi-rs/canvas');

function validateStrokes(strokes) {
  if (!Array.isArray(strokes) || strokes.length === 0) {
    throw new Error('İmza çizgileri boş olamaz.');
  }

  if (strokes.length > 150) {
    throw new Error('İmza çok fazla çizgi içeriyor (maksimum 150 çizgi).');
  }

  let totalPoints = 0;
  let hasValidMovement = false;

  for (let sIdx = 0; sIdx < strokes.length; sIdx++) {
    const stroke = strokes[sIdx];
    if (!Array.isArray(stroke) || stroke.length === 0) {
      throw new Error(`Çizgi #${sIdx + 1} geçerli nokta içermiyor.`);
    }

    if (stroke.length > 1000) {
      throw new Error(`Çizgi #${sIdx + 1} çok fazla nokta içeriyor.`);
    }

    totalPoints += stroke.length;
    if (totalPoints > 5000) {
      throw new Error('İmza toplam nokta sınırı aşıldı (maksimum 5000 nokta).');
    }

    for (let pIdx = 0; pIdx < stroke.length; pIdx++) {
      const p = stroke[pIdx];
      if (!p || typeof p !== 'object') {
        throw new Error(`Geçersiz nokta verisi (çizgi #${sIdx + 1}, nokta #${pIdx + 1}).`);
      }

      const x = Number(p.x);
      const y = Number(p.y);

      if (!Number.isFinite(x) || Number.isNaN(x) || !Number.isFinite(y) || Number.isNaN(y)) {
        throw new Error(`Koordinatlar geçerli sayı olmalıdır (çizgi #${sIdx + 1}, nokta #${pIdx + 1}).`);
      }

      if (x < 0 || x > 2000 || y < 0 || y > 1200) {
        throw new Error(`Koordinatlar tuval sınırları dışında (çizgi #${sIdx + 1}, nokta #${pIdx + 1}).`);
      }

      if (pIdx > 0) {
        const prev = stroke[pIdx - 1];
        if (Math.abs(x - prev.x) > 0.01 || Math.abs(y - prev.y) > 0.01) {
          hasValidMovement = true;
        }
      }
    }
  }

  if (totalPoints < 2 && !hasValidMovement) {
    throw new Error('İmza geçerli bir çizim hareketi içermelidir.');
  }

  return { valid: true, strokeCount: strokes.length, pointCount: totalPoints };
}

function createSignatureService({ rootDir } = {}) {
  const targetDir = rootDir || path.resolve(__dirname, '../../data/application-signatures');

  return {
    validateStrokes(strokes) {
      return validateStrokes(strokes);
    },

    async renderPng(submissionId, strokes, options = {}) {
      if (!submissionId) {
        throw new Error('submissionId gereklidir.');
      }

      validateStrokes(strokes);

      const width = Number(options.width) || 600;
      const height = Number(options.height) || 240;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Transparent or specified background
      if (options.background) {
        ctx.fillStyle = options.background;
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.clearRect(0, 0, width, height);
      }

      ctx.strokeStyle = options.strokeColor || '#0f172a';
      ctx.lineWidth = Number(options.lineWidth) || 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const stroke of strokes) {
        if (!stroke || stroke.length === 0) continue;
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.stroke();
      }

      const buffer = canvas.toBuffer('image/png');
      const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

      fs.mkdirSync(targetDir, { recursive: true });

      const safeSubId = String(submissionId).replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `sig_${safeSubId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.png`;
      const fullPath = path.join(targetDir, fileName);

      fs.writeFileSync(fullPath, buffer);

      const rootBase = path.resolve(__dirname, '../..');
      const relativePath = path.relative(rootBase, fullPath).replace(/\\/g, '/');

      return {
        fileName,
        fullPath,
        relativePath,
        sha256,
        byteLength: buffer.length
      };
    },

    getSignaturePath(fileName) {
      if (!fileName || typeof fileName !== 'string') return null;
      const safe = path.basename(fileName);
      const fullPath = path.join(targetDir, safe);
      if (!fs.existsSync(fullPath)) return null;
      return fullPath;
    }
  };
}

module.exports = {
  validateStrokes,
  createSignatureService
};
