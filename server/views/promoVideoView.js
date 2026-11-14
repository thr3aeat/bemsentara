'use strict';

function renderPromoVideoPage() {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EKO YILDIZ TANITIM VİDEOSU — Reklam Şartları</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: 'Segoe UI', Inter, system-ui, -apple-system, sans-serif;
      background: radial-gradient(circle at 18% 12%, rgba(124,58,237,0.34), transparent 44%),
                  radial-gradient(circle at 82% 80%, rgba(16,185,129,0.24), transparent 46%),
                  #060913;
      color: #f8fafc;
      padding: 1.5rem 1rem 3rem;
    }
    .wrap {
      max-width: 1040px;
      margin: 0 auto;
    }
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      background: rgba(124,58,237,0.2);
      border: 1px solid rgba(167,139,250,0.45);
      color: #e9d5ff;
      padding: 0.45rem 0.95rem;
      border-radius: 999px;
      font-weight: 900;
      font-size: 0.84rem;
      letter-spacing: 0.05em;
    }
    .top-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .btn {
      border: none;
      border-radius: 10px;
      padding: 0.6rem 1rem;
      font-weight: 800;
      font-size: 0.84rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }
    .btn:hover { transform: translateY(-1px); }
    .btn-primary { background: linear-gradient(135deg, #7c3aed, #10b981); color: #fff; }
    .btn-ghost { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); color: #e2e8f0; }
    .btn-amber { background: rgba(251,191,36,0.16); border: 1px solid rgba(251,191,36,0.45); color: #fde68a; }

    /* Sinematik Video Sahnesi */
    .stage-shell {
      position: relative;
      background: #0a0f1f;
      border: 2px solid rgba(139,92,246,0.48);
      border-radius: 22px;
      overflow: hidden;
      box-shadow: 0 28px 80px rgba(0,0,0,0.72), 0 0 60px rgba(124,58,237,0.18);
      margin-bottom: 1.5rem;
    }
    .stage-viewport {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      min-height: 360px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      overflow: hidden;
      background:
        radial-gradient(circle at 20% 25%, rgba(124,58,237,0.28), transparent 45%),
        radial-gradient(circle at 80% 75%, rgba(16,185,129,0.22), transparent 45%),
        linear-gradient(135deg, #070b17 0%, #111936 55%, #091521 100%);
    }
    .stage-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 42px 42px;
      pointer-events: none;
    }
    .stage-hud-top {
      position: absolute;
      top: 1rem;
      left: 1.25rem;
      right: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 3;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #a5b4fc;
    }
    .live-rec {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(244,63,94,0.2);
      border: 1px solid rgba(244,63,94,0.45);
      color: #fda4af;
      padding: 0.25rem 0.7rem;
      border-radius: 999px;
    }
    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #fb7185;
      animation: pulseDot 1s infinite;
    }
    @keyframes pulseDot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.35; transform: scale(0.8); } }

    .scene-content {
      position: relative;
      z-index: 2;
      max-width: 820px;
      width: 100%;
      text-align: center;
      animation: sceneIn 0.45s cubic-bezier(0.22,1,0.36,1);
    }
    @keyframes sceneIn {
      from { opacity: 0; transform: translateY(18px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .scene-kicker {
      display: inline-block;
      padding: 0.35rem 0.9rem;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: rgba(52,211,153,0.16);
      border: 1px solid rgba(52,211,153,0.42);
      color: #6ee7b7;
      margin-bottom: 0.9rem;
    }
    .scene-title {
      font-size: clamp(1.45rem, 3.2vw, 2.45rem);
      font-weight: 900;
      margin: 0 0 0.85rem;
      line-height: 1.2;
      background: linear-gradient(90deg, #ffffff, #c4b5fd, #6ee7b7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .scene-cards {
      display: grid;
      gap: 0.65rem;
      text-align: left;
      max-width: 720px;
      margin: 0 auto;
    }
    .scene-card {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.14);
      border-left: 4px solid #34d399;
      border-radius: 14px;
      padding: 0.85rem 1.1rem;
      font-size: clamp(0.92rem, 1.5vw, 1.08rem);
      font-weight: 700;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 0.7rem;
      backdrop-filter: blur(8px);
    }
    .scene-card.warn { border-left-color: #fbbf24; background: rgba(251,191,36,0.1); }
    .scene-card.purple { border-left-color: #a78bfa; background: rgba(124,58,237,0.14); }

    .video-controls {
      background: rgba(6,9,19,0.94);
      border-top: 1px solid rgba(255,255,255,0.1);
      padding: 0.85rem 1.2rem;
    }
    .timeline-bar {
      width: 100%;
      height: 7px;
      background: rgba(255,255,255,0.12);
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 0.75rem;
      cursor: pointer;
    }
    .timeline-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #7c3aed, #10b981, #fbbf24);
      transition: width 0.25s linear;
    }
    .controls-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.65rem;
    }

    /* Tüm Şartlar Özet Kartı */
    .summary-box {
      background: rgba(15,23,42,0.88);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 18px;
      padding: 1.5rem;
    }
    .copy-phrase-box {
      margin-top: 1.25rem;
      background: linear-gradient(135deg, rgba(251,191,36,0.16), rgba(124,58,237,0.16));
      border: 1px solid rgba(251,191,36,0.45);
      border-radius: 14px;
      padding: 1rem 1.2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="topbar">
      <div class="brand-pill">🎬 EKO YILDIZ TANITIM VİDEOSU • REKLAM ŞARTLARI</div>
      <div class="top-actions">
        <button type="button" class="btn btn-primary" onclick="downloadPromoWebm()" id="btn-dl-video">⬇️ Video Olarak İndir (.webm)</button>
        <button type="button" class="btn btn-ghost" onclick="copyPageLink()">🔗 Linki Kopyala</button>
      </div>
    </div>

    <div class="stage-shell">
      <div class="stage-viewport" id="stage-viewport">
        <div class="stage-grid"></div>
        <div class="stage-hud-top">
          <span class="live-rec"><span class="live-dot"></span> EKO YILDIZ TANITIM VİDEOSU</span>
          <span id="hud-scene-label">SAHNE HAZIR</span>
        </div>
        <div id="scene-mount" class="scene-content"></div>
      </div>

      <div class="video-controls">
        <div class="timeline-bar" onclick="jumpTimeline(event)">
          <div class="timeline-fill" id="timeline-fill"></div>
        </div>
        <div class="controls-row">
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <button type="button" class="btn btn-primary" id="btn-play-toggle" onclick="togglePlay()">⏸️ Duraklat</button>
            <button type="button" class="btn btn-ghost" onclick="prevScene()">⏮️ Önceki Sahne</button>
            <button type="button" class="btn btn-ghost" onclick="nextScene()">⏭️ Sonraki Sahne</button>
            <button type="button" class="btn btn-amber" onclick="restartVideo()">🔄 Başa Sar</button>
          </div>
          <div id="dl-status" style="font-size:0.8rem;color:#94a3b8;font-weight:700;">Otomatik oynatılıyor...</div>
        </div>
      </div>
    </div>

    <div class="summary-box">
      <h2 style="margin:0 0 0.35rem;font-size:1.25rem;font-weight:900;">📋 Tüm Reklam &amp; Tanıtım Şartları</h2>
      <p style="margin:0 0 1rem;color:#94a3b8;font-size:0.88rem;">Sunucu bilgilerinizi aldık. Reklamınızın hazırlanabilmesi için aşağıdaki şartların tamamını tek seferde düzenli şekilde iletmeniz gerekmektedir:</p>

      <div style="display:grid;gap:0.55rem;font-size:0.92rem;color:#e2e8f0;">
        <div>✅ Kampınızın açık olması gerekir.</div>
        <div>✅ Kampınızın oyununun açık olması gerekir.</div>
        <div>📸 Kampınızın oyunundan <strong>25 adet görsel</strong> zorunludur.</div>
        <div>🛡️ Kampınızın yönetimi hakkında <strong>en az 5, en çok 10 adet görsel</strong> gereklidir.</div>
        <div>📝 Kampınızı tanıtan <strong>10 satırlık</strong> bir mesaj gerekmektedir.</div>
        <div>🔄 Kampınızda bizden gelenlere kaç daha fazla <strong>x transfer</strong> vereceğinizi belirtmeniz gerekmektedir.</div>
        <div>📧 Bir <strong>kamp emaili</strong> ve bir de <strong>kişisel email</strong> gerekmektedir.</div>
        <div>🔗 <strong>Discord</strong>, <strong>Roblox</strong> ve <strong>Transfer sunucusu</strong> linkleri lazımdır.</div>
        <div>👥 Kampınızdan gönüllü <strong>3 kişinin</strong> bir gruba eklenmesi gerekmektedir (Oyuncu, üst rütbeli fark etmez).</div>
        <div>🎭 Kampınızın sunucusunda <strong>İçerik Üreticisi</strong> adlı rol olması gerekmektedir.</div>
        <div>🎥 Oyununuzdan veya sunucunuzdan <strong>en az 5 dakikalık freecam'li çekim</strong> gereklidir.</div>
        <div>📦 Yukarıdaki şartları tamamladıktan sonra <strong>tek seferde</strong> (yazılar ve fotoğraflar düzenli şekilde) iletmeniz gerekmektedir.</div>
        <div>🔔 Video yapımı sırasında gelişmeler durumunda aktif olmanız ve grubun bildirimlerini açık tutmanız gerekir.</div>
        <div>📅 Şartlar tamamlandıktan sonra bir tane video atılacak; bunda reklamınız yayınlanmayacak, <strong>ondan bir sonraki videoda</strong> yayınlanacak (çünkü bundan bir sonrakinde başka bir family'nin reklamı gelecek).</div>
      </div>

      <div class="copy-phrase-box">
        <div>
          <div style="font-size:0.75rem;color:#fde68a;font-weight:900;text-transform:uppercase;">⚡️ ZORUNLU ONAY MESAJI (YAZILMAZSA DEVAM EDİLMEZ)</div>
          <div style="font-size:1.05rem;font-weight:900;color:#fff;margin-top:0.2rem;">Tüm şartlar sağlandı. Bir sonraki aşamaya geçebiliriz</div>
        </div>
        <button type="button" class="btn btn-amber" onclick="copyConfirmPhrase()">📋 Mesajı Kopyala</button>
      </div>
    </div>
  </div>

  <!-- Gizli Video Kayıt Tuvali (WebM İndirme için) -->
  <canvas id="export-canvas" width="1280" height="720" style="display:none;"></canvas>

  <script>
    (function() {
      const SCENES = [
        {
          kicker: 'EKO YILDIZ TANITIM VİDEOSU',
          title: 'SUNUCU BİLGİLERİNİZİ ALDIK!',
          duration: 4200,
          cards: [
            { icon: '🎬', text: 'Grafik reklam ve tanıtım süreciniz başlıyor.', style: 'purple' },
            { icon: '⚡', text: 'Şimdi sırada mutlaka sağlanması gereken Reklam Şartları var.', style: '' }
          ]
        },
        {
          kicker: 'BÖLÜM 1 • AÇIKLIK ŞARTLARI',
          title: 'KAMP VE OYUN AKTİF OLMALI',
          duration: 4800,
          cards: [
            { icon: '🏕️', text: 'Kampınızın açık olması gerekir.', style: '' },
            { icon: '🎮', text: 'Kampınızın oyununun açık olması gerekir.', style: '' }
          ]
        },
        {
          kicker: 'BÖLÜM 2 • GÖRSEL VE TANITIM METNİ',
          title: 'GÖRSEL & 10 SATIR MESAJ',
          duration: 5600,
          cards: [
            { icon: '📸', text: 'Kampınızın oyunundan 25 adet görsel zorunludur.', style: 'purple' },
            { icon: '🛡️', text: 'Kampınızın yönetimi hakkında en az 5, en çok 10 adet görsel gereklidir.', style: '' },
            { icon: '📝', text: 'Kampınızı tanıtan 10 satırlık bir mesaj gerekmektedir.', style: '' }
          ]
        },
        {
          kicker: 'BÖLÜM 3 • TRANSFER, EMAİL VE LİNKLER',
          title: 'İLETİŞİM VE BAĞLANTI BİLGİLERİ',
          duration: 5600,
          cards: [
            { icon: '🔄', text: 'Bizden gelenlere kaç daha fazla x transfer vereceğinizi belirtmeniz gerekmektedir.', style: 'purple' },
            { icon: '📧', text: 'Bir kamp emaili ve bir de kişisel email gerekmektedir.', style: '' },
            { icon: '🔗', text: 'Discord, Roblox ve Transfer sunucusu linkleri lazımdır.', style: '' }
          ]
        },
        {
          kicker: 'BÖLÜM 4 • EKİP, ROL VE FREECAM ÇEKİM',
          title: 'GÖNÜLLÜ EKİP & 5 DK FREECAM',
          duration: 5800,
          cards: [
            { icon: '👥', text: 'Kampınızdan gönüllü 3 kişinin bir gruba eklenmesi gerekir (Oyuncu / üst rütbeli fark etmez).', style: '' },
            { icon: '🎭', text: 'Kampınızın sunucusunda "İçerik Üreticisi" adlı rol olması gerekmektedir.', style: 'purple' },
            { icon: '🎥', text: 'Oyununuzdan veya sunucunuzdan en az 5 dakikalık freecamli çekim gereklidir.', style: 'warn' }
          ]
        },
        {
          kicker: 'BÖLÜM 5 • TESLİMAT VE ONAY KURALI',
          title: 'TEK SEFERDE VE DÜZENLİ İLETİM',
          duration: 6000,
          cards: [
            { icon: '📦', text: 'YUKARIDAKİ ŞARTLARI TAMAMLADIKTAN SONRA TEK SEFERDE İLETMENİZ GEREKMEKTEDİR (Yazılar ve fotoğraflar düzenli şekilde).', style: 'warn' },
            { icon: '⚡️', text: 'Şartlar sağlandıktan sonra mesaj olarak "Tüm şartlar sağlandı. Bir sonraki aşamaya geçebiliriz" yazılmazsa devam edilmez.', style: 'purple' }
          ]
        },
        {
          kicker: 'BÖLÜM 6 • AKTİFLİK VE YAYIN SIRASI',
          title: 'BİLDİRİMLER & YAYIN TAKVİMİ',
          duration: 6200,
          cards: [
            { icon: '🔔', text: 'Video yapımı sırasında gelişmeler durumunda aktif olmanız ve grubun bildirimlerini açık tutmanız gerekir.', style: '' },
            { icon: '📅', text: 'Şartlar tamamlandıktan sonra 1 video atılacak; bunda reklamınız yayınlanmayacak, ondan bir sonraki videoda yayınlanacak (çünkü sıradaki videoda başka bir familynin reklamı gelecek).', style: 'warn' }
          ]
        },
        {
          kicker: 'EKO YILDIZ & SENTARA',
          title: 'HAZIRSANIZ BAŞLAYALIM! ⚡️',
          duration: 4500,
          cards: [
            { icon: '✅', text: 'Tüm şartları tek seferde ilettikten sonra: "Tüm şartlar sağlandı. Bir sonraki aşamaya geçebiliriz" yazmayı unutmayın.', style: 'purple' }
          ]
        }
      ];

      let currentIdx = 0;
      let isPlaying = true;
      let sceneTimer = null;

      const mount = document.getElementById('scene-mount');
      const hudLabel = document.getElementById('hud-scene-label');
      const timelineFill = document.getElementById('timeline-fill');
      const btnPlay = document.getElementById('btn-play-toggle');

      function renderScene(idx) {
        currentIdx = (idx + SCENES.length) % SCENES.length;
        const s = SCENES[currentIdx];
        if (hudLabel) hudLabel.textContent = s.kicker;
        if (timelineFill) {
          const pct = Math.round(((currentIdx + 1) / SCENES.length) * 100);
          timelineFill.style.width = pct + '%';
        }
        if (!mount) return;
        mount.innerHTML = '';
        mount.style.animation = 'none';
        void mount.offsetWidth;
        mount.style.animation = 'sceneIn 0.45s cubic-bezier(0.22,1,0.36,1)';

        const kEl = document.createElement('div');
        kEl.className = 'scene-kicker';
        kEl.textContent = s.kicker;

        const tEl = document.createElement('h2');
        tEl.className = 'scene-title';
        tEl.textContent = s.title;

        const cardsWrap = document.createElement('div');
        cardsWrap.className = 'scene-cards';
        s.cards.forEach(c => {
          const card = document.createElement('div');
          card.className = 'scene-card ' + (c.style || '');
          const ic = document.createElement('span');
          ic.style.fontSize = '1.35rem';
          ic.textContent = c.icon;
          const tx = document.createElement('span');
          tx.textContent = c.text;
          card.appendChild(ic);
          card.appendChild(tx);
          cardsWrap.appendChild(card);
        });

        mount.appendChild(kEl);
        mount.appendChild(tEl);
        mount.appendChild(cardsWrap);

        scheduleNext();
      }

      function scheduleNext() {
        if (sceneTimer) clearTimeout(sceneTimer);
        if (!isPlaying) return;
        const s = SCENES[currentIdx];
        sceneTimer = setTimeout(() => {
          renderScene(currentIdx + 1);
        }, s.duration || 4800);
      }

      window.togglePlay = function() {
        isPlaying = !isPlaying;
        if (btnPlay) btnPlay.textContent = isPlaying ? '⏸️ Duraklat' : '▶️ Oynat';
        if (isPlaying) scheduleNext();
        else if (sceneTimer) clearTimeout(sceneTimer);
      };

      window.nextScene = function() { renderScene(currentIdx + 1); };
      window.prevScene = function() { renderScene(currentIdx - 1); };
      window.restartVideo = function() { isPlaying = true; if (btnPlay) btnPlay.textContent = '⏸️ Duraklat'; renderScene(0); };

      window.jumpTimeline = function(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(0.999, (e.clientX - rect.left) / rect.width));
        renderScene(Math.floor(ratio * SCENES.length));
      };

      window.copyPageLink = function() {
        navigator.clipboard.writeText(window.location.href).then(() => {
          alert('🔗 Tanıtım videosu linki kopyalandı!');
        });
      };

      window.copyConfirmPhrase = function() {
        const phrase = 'Tüm şartlar sağlandı. Bir sonraki aşamaya geçebiliriz';
        navigator.clipboard.writeText(phrase).then(() => {
          alert('✅ Onay mesajı kopyalandı:\\n' + phrase);
        });
      };

      function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = String(text || '').split(' ');
        let line = '';
        let curY = y;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          if (ctx.measureText(testLine).width > maxWidth && n > 0) {
            ctx.fillText(line.trim(), x, curY);
            line = words[n] + ' ';
            curY += lineHeight;
          } else {
            line = testLine;
          }
        }
        if (line.trim()) ctx.fillText(line.trim(), x, curY);
        return curY + lineHeight;
      }

      window.downloadPromoWebm = async function() {
        const btn = document.getElementById('btn-dl-video');
        const st = document.getElementById('dl-status');
        const canvas = document.getElementById('export-canvas');
        if (!canvas || typeof MediaRecorder === 'undefined') {
          alert('Tarayıcınız doğrudan video kaydını desteklemiyor.');
          return;
        }
        btn.disabled = true;
        btn.textContent = '⏳ Video Oluşturuluyor...';
        const ctx = canvas.getContext('2d');
        const stream = canvas.captureStream(30);
        const chunks = [];
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        recorder.ondataavailable = (ev) => { if (ev.data && ev.data.size > 0) chunks.push(ev.data); };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'EKO_YILDIZ_TANITIM_VIDEOSU.webm';
          a.click();
          URL.revokeObjectURL(url);
          btn.disabled = false;
          btn.textContent = '⬇️ Video Olarak İndir (.webm)';
          if (st) st.textContent = '✅ Video indirildi!';
        };

        recorder.start();
        for (let i = 0; i < SCENES.length; i++) {
          const s = SCENES[i];
          if (st) st.textContent = '🎬 Video işleniyor: ' + (i + 1) + ' / ' + SCENES.length;
          const frames = 55;
          for (let f = 0; f < frames; f++) {
            const grad = ctx.createLinearGradient(0, 0, 1280, 720);
            grad.addColorStop(0, '#070b17');
            grad.addColorStop(0.55, '#121b38');
            grad.addColorStop(1, '#081722');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1280, 720);

            ctx.fillStyle = '#34d399';
            ctx.font = 'bold 24px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(s.kicker, 640, 105);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 44px Segoe UI, sans-serif';
            ctx.fillText(s.title, 640, 168);

            let cardY = 230;
            ctx.textAlign = 'left';
            s.cards.forEach(c => {
              ctx.fillStyle = 'rgba(255,255,255,0.08)';
              ctx.fillRect(140, cardY, 1000, 110);
              ctx.fillStyle = c.style === 'warn' ? '#fbbf24' : (c.style === 'purple' ? '#a78bfa' : '#34d399');
              ctx.fillRect(140, cardY, 8, 110);
              ctx.fillStyle = '#f8fafc';
              ctx.font = 'bold 26px Segoe UI, sans-serif';
              drawWrappedText(ctx, c.icon + '  ' + c.text, 172, cardY + 46, 940, 34);
              cardY += 130;
            });

            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(140, 665, 1000, 8);
            ctx.fillStyle = '#34d399';
            ctx.fillRect(140, 665, Math.round(1000 * ((i + (f / frames)) / SCENES.length)), 8);

            await new Promise(r => setTimeout(r, 33));
          }
        }
        recorder.stop();
      };

      renderScene(0);
    })();
  </script>
</body>
</html>`;
}

module.exports = { renderPromoVideoPage };
