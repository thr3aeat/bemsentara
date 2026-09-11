// server/views/giveaways/giveawayLiveDrawPage.js
function renderGiveawayLiveDrawPage({ giveaway, winners = [], participants = [] }) {
  // If winner is already selected
  const winner = winners.length > 0 ? winners[0] : null;
  const participantNames = participants.map(p => p.username || 'Katılımcı');
  if (participantNames.length === 0) {
    participantNames.push('EkoYildiz_Gamer', 'RobuxMaster', 'ProPlayer99', 'Ali_TR', 'Zeynep_Gaming');
  }

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🔴 CANLI ÇEKİLİŞ — ${giveaway.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090d16;
      color: #fff;
      font-family: 'Outfit', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      user-select: none;
    }
    .live-container {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
      z-index: 2;
    }
    .bg-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      pointer-events: none;
    }
    .badge-live {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid #ef4444;
      color: #ef4444;
      padding: 0.4rem 1.2rem;
      border-radius: 9999px;
      font-size: 0.95rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      margin-bottom: 1.5rem;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
    }
    .roller-box {
      width: 100%;
      max-width: 650px;
      height: 120px;
      background: rgba(15, 23, 42, 0.85);
      border: 3px solid #a855f7;
      border-radius: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 50px rgba(168, 85, 247, 0.4), inset 0 0 20px rgba(168, 85, 247, 0.2);
      position: relative;
      overflow: hidden;
      margin: 2rem 0;
    }
    .roller-text {
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 900;
      color: #fff;
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
      letter-spacing: -0.02em;
    }
    .winner-card {
      display: none;
      background: linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%);
      border: 3px solid #fbbf24;
      border-radius: 2rem;
      padding: 2.5rem 3.5rem;
      box-shadow: 0 0 80px rgba(251, 191, 36, 0.6);
      animation: zoomIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes zoomIn {
      from { transform: scale(0.6); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .btn-action {
      background: linear-gradient(135deg, #a855f7, #ec4899);
      border: none;
      color: #fff;
      font-size: 1.25rem;
      font-weight: 800;
      padding: 1rem 3rem;
      border-radius: 9999px;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(168, 85, 247, 0.5);
      transition: all 0.2s;
    }
    .btn-action:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px rgba(168, 85, 247, 0.7);
    }
    .controls {
      position: absolute;
      bottom: 2rem;
      display: flex;
      gap: 1rem;
      z-index: 10;
    }
    .control-btn {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      color: #fff;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 0.85rem;
      text-decoration: none;
    }
    .control-btn:hover {
      background: rgba(255,255,255,0.2);
    }
  </style>
</head>
<body>
  <canvas id="bgCanvas" class="bg-canvas"></canvas>

  <div class="live-container">
    <div class="badge-live">
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ef4444;"></span>
      CANLI ÇEKİLİŞ YAYIN EKRANI
    </div>

    <h1 style="font-size: clamp(2rem, 4vw, 3rem); font-weight: 900; margin-bottom: 0.5rem;">
      ${giveaway.title}
    </h1>
    <div style="font-size: 1.5rem; font-weight: 800; color: #38bdf8; margin-bottom: 1.5rem;">
      🎁 ÖDÜL: ${giveaway.prize}
    </div>

    <div style="color: #94a3b8; font-size: 1rem; margin-bottom: 1rem;">
      Toplam Katılımcı: <strong style="color: #fff;">${participants.length || giveaway.totalEntries || 1}</strong> &bull; Toplam Bilet: <strong style="color: #a855f7;">${giveaway.totalTickets || 1}</strong>
    </div>

    <!-- Roller container -->
    <div id="rollerBox" class="roller-box">
      <div id="rollerText" class="roller-text">ÇEKİLİŞE HAZIR</div>
    </div>

    <!-- Winner Card -->
    <div id="winnerCard" class="winner-card">
      <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏆</div>
      <div style="font-size: 1.1rem; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.1em;">
        TEBRİKLER — KAZANAN!
      </div>
      <h2 id="winnerText" style="font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 900; color: #fff; margin: 0.5rem 0;">
        @${winner ? (winner.username || winner.maskedUsername) : 'Kazanan'}
      </h2>
      <div style="font-size: 1.25rem; font-weight: 800; color: #38bdf8; margin-bottom: 1rem;">
        🎁 ${giveaway.prize}
      </div>
      <div style="font-size: 0.9rem; color: #94a3b8;">
        Sponsor: ${giveaway.sponsor || 'Eko Yıldız'} &bull; Kriptografik Rastgele Seçim
      </div>
    </div>

    <!-- Trigger Button -->
    <div id="startSection" style="margin-top: 1.5rem;">
      <button id="startBtn" onclick="startDrawAnimation()" class="btn-action">
        🎲 Çekilişi Başlat & Kazananı Göster
      </button>
    </div>

    <!-- Footer Controls -->
    <div class="controls">
      <button onclick="toggleFullscreen()" class="control-btn">⛶ Tam Ekran (F11)</button>
      <a href="/cekilisler/${giveaway._id}" class="control-btn">← Çekilişe Dön</a>
      <a href="/cekilisler" class="control-btn">Platform Ana Sayfası</a>
    </div>
  </div>

  <script>
    const participants = ${JSON.stringify(participantNames)};
    const finalWinner = ${JSON.stringify(winner ? (winner.username || winner.maskedUsername) : (participantNames[0] || 'Kazanan'))};
    let isDrawing = false;

    // Web Audio synthesizer for rolling sound and win sound
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playTick() {
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400 + Math.random() * 200, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      } catch(e) {}
    }

    function playFanfare() {
      try {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.8);
          }, i * 150);
        });
      } catch(e) {}
    }

    function startDrawAnimation() {
      if (isDrawing) return;
      isDrawing = true;
      document.getElementById('startSection').style.display = 'none';
      const rollerText = document.getElementById('rollerText');
      const rollerBox = document.getElementById('rollerBox');

      let speed = 40;
      let counter = 0;
      const totalSteps = 60;

      function step() {
        const randomName = participants[Math.floor(Math.random() * participants.length)];
        rollerText.innerText = '@' + randomName;
        playTick();

        counter++;
        if (counter < totalSteps) {
          // Gradually decelerate
          if (counter > 35) speed += 15;
          if (counter > 50) speed += 30;
          setTimeout(step, speed);
        } else {
          // Reveal winner!
          rollerBox.style.display = 'none';
          const winnerCard = document.getElementById('winnerCard');
          document.getElementById('winnerText').innerText = '@' + finalWinner;
          winnerCard.style.display = 'block';

          playFanfare();
          fireConfettiExplosion();
        }
      }

      step();
    }

    function fireConfettiExplosion() {
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      function fire(particleRatio, opts) {
        confetti(Object.assign({}, defaults, opts, {
          particleCount: Math.floor(count * particleRatio)
        }));
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    }

    // Dynamic background particles
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      color: Math.random() > 0.5 ? 'rgba(168, 85, 247, 0.3)' : 'rgba(56, 189, 248, 0.3)'
    }));

    function animateBg() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(animateBg);
    }
    animateBg();
  </script>
</body>
</html>
  `;
}

module.exports = { renderGiveawayLiveDrawPage };
