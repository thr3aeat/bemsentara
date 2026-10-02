'use strict';

function esc(v) {
  return String(v || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderOfficialWarningSignPage({ warning, targetUser, isSigned, error }) {
  const caseNo = esc(warning ? warning.caseNo : 'NO.00000');
  const reason = esc(warning ? warning.reason : 'Belirtilmedi');
  const ruleArticle = esc(warning ? (warning.ruleArticle || 'Madde 14 - Topluluk Huzuru Yönergesi') : '');
  const username = esc(targetUser ? (targetUser.username || targetUser.tag || warning.targetUserId) : (warning ? warning.targetUserId : 'Bilinmeyen Kullanıcı'));
  const targetUserId = esc(warning ? warning.targetUserId : '');
  const signToken = esc(warning ? warning.signToken : '');
  const signedDateStr = warning && warning.signedAt ? new Date(warning.signedAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) : '';

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>⚖️ EkoYıldız Mahkemesi — Resmi Uyarı ve E-İmza Portalı (${caseNo})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090a10;
      --card-bg: rgba(18, 20, 32, 0.85);
      --border: rgba(212, 175, 55, 0.25);
      --gold: #d4af37;
      --gold-light: #f7e07c;
      --gold-glow: rgba(212, 175, 55, 0.25);
      --crimson: #c0392b;
      --crimson-glow: rgba(192, 57, 43, 0.35);
      --success: #10b981;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(circle at 50% 0%, rgba(192, 57, 43, 0.18) 0%, transparent 50%),
        radial-gradient(circle at 10% 80%, rgba(212, 175, 55, 0.1) 0%, transparent 40%),
        radial-gradient(circle at 90% 90%, rgba(16, 185, 129, 0.08) 0%, transparent 40%);
      color: var(--text);
      font-family: 'Outfit', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px 15px;
    }

    .container {
      width: 100%;
      max-width: 860px;
      margin: 0 auto;
    }

    /* Header */
    .court-header {
      text-align: center;
      margin-bottom: 28px;
    }
    .court-emblem {
      font-size: 3rem;
      margin-bottom: 8px;
      filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.4));
    }
    .court-title {
      font-family: 'Cinzel', serif;
      font-size: 1.85rem;
      font-weight: 800;
      letter-spacing: 2px;
      background: linear-gradient(135deg, #fff 20%, var(--gold-light) 60%, var(--gold) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 6px;
    }
    .court-subtitle {
      font-size: 0.95rem;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--gold);
      font-weight: 600;
    }

    .case-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 14px;
      background: rgba(192, 57, 43, 0.18);
      border: 1px solid var(--crimson);
      color: #ff7675;
      padding: 6px 18px;
      border-radius: 999px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      font-weight: 600;
      box-shadow: 0 0 20px var(--crimson-glow);
    }

    /* Main Card */
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 32px;
      backdrop-filter: blur(16px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6), 0 0 30px var(--gold-glow);
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, transparent, var(--gold), var(--crimson), transparent);
    }

    /* Detail Rows */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    @media (max-width: 600px) {
      .info-grid { grid-template-columns: 1fr; }
      .card { padding: 20px; }
      .court-title { font-size: 1.4rem; }
    }

    .info-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 12px;
      padding: 14px 16px;
    }
    .info-label {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .info-val {
      font-size: 0.95rem;
      font-weight: 600;
      color: #fff;
    }

    /* Reason & Consequences Banner */
    .reason-banner {
      background: rgba(192, 57, 43, 0.12);
      border-left: 4px solid var(--crimson);
      border-radius: 0 12px 12px 0;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .reason-banner h4 {
      color: #ff7675;
      font-size: 0.95rem;
      font-weight: 700;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .reason-banner p {
      color: #f1f2f6;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .consequences-box {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(212, 175, 55, 0.2);
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 26px;
    }
    .consequences-box h4 {
      color: var(--gold);
      font-size: 0.9rem;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .consequences-box ol {
      padding-left: 20px;
      color: #cbd5e1;
      font-size: 0.9rem;
      line-height: 1.6;
    }
    .consequences-box li {
      margin-bottom: 6px;
    }
    .consequences-box li strong {
      color: #fca5a5;
    }

    /* Commitment Paragraph */
    .commitment-text {
      background: rgba(212, 175, 55, 0.08);
      border: 1px dashed var(--gold);
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 24px;
      font-style: italic;
      color: #fef08a;
      line-height: 1.6;
      font-size: 0.95rem;
    }

    /* Signature Section */
    .sign-section-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .sign-hint {
      font-size: 0.8rem;
      font-weight: 400;
      color: var(--text-muted);
    }

    .canvas-container {
      position: relative;
      background: #06070a;
      border: 2px dashed rgba(212, 175, 55, 0.4);
      border-radius: 14px;
      height: 220px;
      width: 100%;
      overflow: hidden;
      cursor: crosshair;
      touch-action: none;
      box-shadow: inset 0 0 25px rgba(0, 0, 0, 0.8);
      transition: border-color 0.2s;
    }
    .canvas-container:hover, .canvas-container.active {
      border-color: var(--gold);
    }
    #signaturePad {
      width: 100%;
      height: 100%;
      display: block;
    }
    .sign-placeholder {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: rgba(255, 255, 255, 0.2);
      pointer-events: none;
      font-size: 1rem;
      font-weight: 500;
      letter-spacing: 1px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      user-select: none;
    }

    .canvas-tools {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      margin-bottom: 20px;
    }
    .btn-tool {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--text-muted);
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-tool:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
    }

    /* Checkbox */
    .checkbox-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 24px;
      cursor: pointer;
      user-select: none;
    }
    .checkbox-row input {
      margin-top: 4px;
      width: 18px;
      height: 18px;
      accent-color: var(--gold);
      cursor: pointer;
    }
    .checkbox-row span {
      font-size: 0.88rem;
      color: #cbd5e1;
      line-height: 1.45;
    }

    /* Submit Button */
    .btn-submit {
      width: 100%;
      background: linear-gradient(135deg, #b8860b 0%, #d4af37 50%, #f7e07c 100%);
      color: #0c0a09;
      border: none;
      border-radius: 12px;
      padding: 16px 24px;
      font-family: 'Cinzel', serif;
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: 1.5px;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(212, 175, 55, 0.35);
      transition: all 0.25s ease;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
    }
    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 14px 35px rgba(212, 175, 55, 0.5);
      filter: brightness(1.1);
    }
    .btn-submit:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
    }

    /* Already Signed State */
    .signed-card {
      text-align: center;
      padding: 40px 20px;
    }
    .seal-icon {
      font-size: 4rem;
      margin-bottom: 14px;
      filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.4));
    }
    .signed-title {
      font-family: 'Cinzel', serif;
      font-size: 1.6rem;
      color: var(--success);
      margin-bottom: 10px;
    }
    .signed-signature-img {
      max-width: 320px;
      background: #000;
      border: 2px solid var(--gold);
      border-radius: 12px;
      padding: 15px;
      margin: 20px auto;
      display: block;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.7);
    }

    /* Error Message */
    .error-box {
      background: rgba(192, 57, 43, 0.2);
      border: 1px solid var(--crimson);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      color: #ff7675;
      text-align: center;
      font-weight: 600;
    }
    
    .footer-note {
      text-align: center;
      margin-top: 30px;
      color: var(--text-muted);
      font-size: 0.8rem;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="court-header">
      <div class="court-emblem">⚖️</div>
      <h1 class="court-title">EKOYILDIZ YÜKSEK MAHKEMESİ</h1>
      <div class="court-subtitle">Disiplin Kurulu & Resmi Ceza Tebligatı</div>
      <div class="case-badge">DOSYA NO: ${caseNo}</div>
    </div>

    ${error ? `<div class="error-box">⚠️ ${esc(error)}</div>` : ''}

    <div class="card">
      ${isSigned ? `
        <div class="signed-card">
          <div class="seal-icon">🏛️</div>
          <h2 class="signed-title">RESMİ UYARI TUTANAĞI MÜHÜRLENMİŞTİR</h2>
          <p style="color: #cbd5e1; margin-bottom: 12px; font-size: 1rem;">
            Bu dosya <strong style="color: #fff;">${username}</strong> adına 
            <span style="color: var(--gold); font-weight: 600;">${signedDateStr || 'Onaylandı'}</span> 
            tarihinde dijital ıslak e-imza ile yürürlüğe girmiştir.
          </p>
          <div style="display: inline-block; background: rgba(16, 185, 129, 0.15); border: 1px solid var(--success); color: #34d399; padding: 6px 16px; border-radius: 999px; font-size: 0.85rem; font-weight: 700;">
            ✓ SİCİLE VE DİSİPLİN ARŞİVİNE İŞLENDİ
          </div>
          ${warning && warning.signatureImage ? `
            <div style="margin-top: 24px;">
              <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">Kayıtlı Dijital Islak İmza:</div>
              <img src="${warning.signatureImage}" alt="Resmi E-İmza" class="signed-signature-img">
            </div>
          ` : ''}
          <p style="margin-top: 20px; font-size: 0.88rem; color: var(--text-muted);">
            İmzalanan tutanak Discord duruşma kanalına ve yönetim arşivine otomatik iletilmiştir. Tarayıcınızı kapatabilirsiniz.
          </p>
        </div>
      ` : `
        <div class="info-grid">
          <div class="info-box">
            <div class="info-label">Soruşturulan Şahıs</div>
            <div class="info-val">${username} <span style="font-size: 0.8rem; color: var(--text-muted);">(${targetUserId})</span></div>
          </div>
          <div class="info-box">
            <div class="info-label">İlgili Nizam Maddesi</div>
            <div class="info-val">${ruleArticle}</div>
          </div>
        </div>

        <div class="reason-banner">
          <h4>🚨 Resmi İhtar ve Uyarı Gerekçesi</h4>
          <p>"${reason}"</p>
        </div>

        <div class="consequences-box">
          <h4>⚖️ İHLALİN TEKRARI HALİNDE UYGULANACAK KESİN HÜKÜMLER</h4>
          <ol>
            <li><strong>Sunucudan Kalıcı Olarak Uzaklaştırılma (Permanent Ban):</strong> Herhangi bir ön bildirim veya savunma gerekmeksizin derhal uygulanır.</li>
            <li><strong>EkoYıldız Kara Listesine (Blacklist) Alınma:</strong> Hesabınız sabıkalı statüsüne alınır ve tüm ayrıcalıklarınız fesh edilir.</li>
            <li><strong>Bağlı Platformlardan Men Edilme:</strong> EkoYıldız ekosistemindeki tüm iştirak ve oyun sunucularından süresiz men edilirsiniz.</li>
          </ol>
        </div>

        <div class="commitment-text">
          "Ben, yukarıda adı geçen şahıs olarak; hakkımda düzenlenen işbu Resmi Uyarı Tutanak metnini, 
          gerekçesini ve tekrarı halinde uygulanacak süresiz uzaklaştırma hükmünü okudum, anladım. 
          EkoYıldız kurallarına riayet edeceğimi, bu kural ihlalini bir daha asla tekrarlamayacağımı 
          aşağıdaki dijital ıslak e-imzam ile kayıtsız şartsız kabul ve taahhüt ederim."
        </div>

        <div class="sign-section">
          <div class="sign-section-title">
            <span>🖋️ Resmi Dijital Islak İmzanız</span>
            <span class="sign-hint">Fareniz (mouse) veya parmağınızla kutu içerisine imzanızı çizin</span>
          </div>

          <div class="canvas-container" id="canvasContainer">
            <canvas id="signaturePad"></canvas>
            <div class="sign-placeholder" id="signPlaceholder">
              <span>✍️</span>
              <span>Buraya İmzanızı Çizin</span>
            </div>
          </div>

          <div class="canvas-tools">
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn-tool" id="btnClear">
                🗑️ Temizle
              </button>
              <button type="button" class="btn-tool" id="btnUndo">
                ↩️ Geri Al
              </button>
            </div>
            <div style="font-size: 0.8rem; color: var(--gold); font-family: 'JetBrains Mono', monospace;">
              MÜHÜR: NO.${caseNo.replace(/[^0-9]/g, '')}
            </div>
          </div>
        </div>

        <label class="checkbox-row">
          <input type="checkbox" id="chkAccept">
          <span>Yukarıda yer alan resmi uyarı şartlarını ve taahhütnameyi okudum. Tekrarında kalıcı ban uygulanacağını biliyor ve bu dijital imzanın yasal olarak şahsıma ait olduğunu onaylıyorum.</span>
        </label>

        <button type="button" class="btn-submit" id="btnSubmit" disabled>
          🏛️ RESMİ E-İMZAYI MÜHÜRLE VE GÖNDER
        </button>
      `}
    </div>

    <div class="footer-note">
      EkoYıldız Yüksek Mahkemesi & Disiplin Kurulu • Resmi Elektronik İmza ve Adli Bilişim Doğrulama Sistemi
    </div>
  </div>

  ${!isSigned ? `
  <script>
    (function() {
      const token = ${JSON.stringify(signToken)};
      const container = document.getElementById('canvasContainer');
      const canvas = document.getElementById('signaturePad');
      const placeholder = document.getElementById('signPlaceholder');
      const btnClear = document.getElementById('btnClear');
      const btnUndo = document.getElementById('btnUndo');
      const chkAccept = document.getElementById('chkAccept');
      const btnSubmit = document.getElementById('btnSubmit');

      const ctx = canvas.getContext('2d');
      let isDrawing = false;
      let hasDrawn = false;
      let strokeHistory = [];
      let currentPath = [];

      // High DPI resize
      function resizeCanvas() {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        redrawAll();
      }

      window.addEventListener('resize', resizeCanvas);
      setTimeout(resizeCanvas, 50);

      function redrawAll() {
        const rect = container.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#f7e07c'; // Royal gold ink

        strokeHistory.forEach(path => {
          if (!path || path.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(path[0].x, path[0].y);
          for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
          }
          ctx.stroke();
        });

        checkSubmitState();
      }

      function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      }

      function startDraw(e) {
        e.preventDefault();
        isDrawing = true;
        container.classList.add('active');
        placeholder.style.display = 'none';

        const pos = getPos(e);
        currentPath = [pos];

        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#f7e07c';
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      }

      function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        currentPath.push(pos);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        hasDrawn = true;
      }

      function endDraw(e) {
        if (!isDrawing) return;
        isDrawing = false;
        container.classList.remove('active');
        if (currentPath.length > 0) {
          strokeHistory.push([...currentPath]);
        }
        checkSubmitState();
      }

      // Mouse events
      canvas.addEventListener('mousedown', startDraw);
      window.addEventListener('mousemove', draw);
      window.addEventListener('mouseup', endDraw);

      // Touch events (Mobile & Tablet)
      canvas.addEventListener('touchstart', startDraw, { passive: false });
      window.addEventListener('touchmove', draw, { passive: false });
      window.addEventListener('touchend', endDraw);

      btnClear.addEventListener('click', () => {
        strokeHistory = [];
        currentPath = [];
        hasDrawn = false;
        const rect = container.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        placeholder.style.display = 'flex';
        checkSubmitState();
      });

      btnUndo.addEventListener('click', () => {
        if (strokeHistory.length > 0) {
          strokeHistory.pop();
          if (strokeHistory.length === 0) {
            hasDrawn = false;
            placeholder.style.display = 'flex';
          }
          redrawAll();
        }
      });

      chkAccept.addEventListener('change', checkSubmitState);

      function checkSubmitState() {
        const canSubmit = strokeHistory.length > 0 && chkAccept.checked;
        btnSubmit.disabled = !canSubmit;
      }

      // Submit Signature
      btnSubmit.addEventListener('click', async () => {
        if (btnSubmit.disabled || !token) return;

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '⏳ Mühürleniyor ve İletiliyor...';

        try {
          const signatureData = canvas.toDataURL('image/png');

          const res = await fetch('/api/resmi-uyari/imzala', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: token,
              signatureData: signatureData
            })
          });

          const data = await res.json();

          if (data && data.success) {
            window.location.reload();
          } else {
            alert('❌ İmza kaydedilemedi: ' + (data.error || 'Bilinmeyen hata oluştu.'));
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '🏛️ RESMİ E-İMZAYI MÜHÜRLE VE GÖNDER';
          }
        } catch (err) {
          console.error(err);
          alert('❌ Bağlantı hatası oluştu, lütfen sayfayı yenileyip tekrar deneyin.');
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = '🏛️ RESMİ E-İMZAYI MÜHÜRLE VE GÖNDER';
        }
      });
    })();
  </script>
  ` : ''}
</body>
</html>`;
}

module.exports = {
  renderOfficialWarningSignPage
};
