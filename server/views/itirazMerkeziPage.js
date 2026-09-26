'use strict';

function esc(v) {
  return String(v || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderItirazMerkeziPage({ query = {}, user = null }) {
  const incidentId = esc(query.incident || query.id || '');
  const targetUser = esc(query.user || (user ? user.id : ''));
  const userName = user ? esc(user.username || user.tag) : '';

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>⚖️ İtiraz Merkezi — EkoYıldız</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #07080f;
      --card-bg: rgba(18, 20, 36, 0.75);
      --card-border: rgba(139, 92, 246, 0.18);
      --card-hover-border: rgba(168, 85, 247, 0.4);
      --accent: #8b5cf6;
      --accent-glow: rgba(139, 92, 246, 0.25);
      --success: #10b981;
      --danger: #ef4444;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(124, 58, 237, 0.12) 0%, transparent 40%),
        radial-gradient(circle at 85% 85%, rgba(16, 185, 129, 0.08) 0%, transparent 45%);
      color: var(--text);
      font-family: 'Outfit', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .container {
      max-width: 860px;
      margin: 0 auto;
      padding: 40px 20px;
      width: 100%;
      flex: 1;
    }

    /* Navbar */
    .nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .brand {
      font-size: 1.3rem;
      font-weight: 800;
      color: #fff;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand span { color: var(--accent); }
    .nav-links a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 500;
      margin-left: 20px;
      transition: color 0.2s;
    }
    .nav-links a:hover { color: #fff; }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 35px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.3);
      color: #c4b5fd;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 14px;
    }
    .header h1 {
      font-size: clamp(2rem, 5vw, 2.7rem);
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #fff 40%, #c4b5fd 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .header p {
      color: var(--text-muted);
      font-size: 1.05rem;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.6;
    }

    /* Incident Banner */
    .incident-box {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(12px);
      border-radius: 16px;
      padding: 18px 24px;
      margin-bottom: 25px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 15px;
    }
    .incident-meta {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .incident-icon {
      width: 44px;
      height: 44px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }
    .incident-title { font-weight: 700; font-size: 1rem; color: #fff; }
    .incident-sub { font-size: 0.85rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }
    .incident-tag {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* Main Form Card */
    .appeal-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(16px);
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      margin-bottom: 30px;
      transition: border-color 0.3s;
    }
    .form-group {
      margin-bottom: 22px;
    }
    .form-group label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 8px;
      color: #e5e7eb;
    }
    .form-control {
      width: 100%;
      background: rgba(10, 11, 20, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 14px 16px;
      color: #fff;
      font-family: inherit;
      font-size: 0.95rem;
      transition: all 0.2s;
    }
    .form-control:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }
    textarea.form-control {
      min-height: 140px;
      resize: vertical;
      line-height: 1.6;
    }

    .help-text {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-top: 6px;
      line-height: 1.5;
    }

    /* Workflow Cards */
    .flow-steps {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 25px 0;
    }
    .step-item {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 14px;
      font-size: 0.85rem;
    }
    .step-num {
      display: inline-block;
      width: 22px;
      height: 22px;
      line-height: 22px;
      text-align: center;
      background: rgba(139, 92, 246, 0.2);
      color: #c4b5fd;
      border-radius: 50%;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .step-title { font-weight: 600; color: #fff; margin-bottom: 4px; }
    .step-desc { color: var(--text-muted); font-size: 0.78rem; line-height: 1.4; }

    /* Button */
    .btn-submit {
      width: 100%;
      background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
      color: #fff;
      border: none;
      padding: 16px;
      border-radius: 12px;
      font-size: 1.05rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.25s ease;
      box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.5);
    }
    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px -5px rgba(124, 58, 237, 0.6);
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
    }
    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    /* Live Result Container */
    #resultBox {
      display: none;
      margin-top: 25px;
      padding: 24px;
      border-radius: 16px;
      animation: fadeIn 0.4s ease;
    }
    .result-approved {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #6ee7b7;
    }
    .result-pending {
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fcd34d;
    }
    .result-error {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #fca5a5;
    }

    .result-title {
      font-size: 1.15rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .result-desc {
      font-size: 0.95rem;
      line-height: 1.6;
      color: #e5e7eb;
    }
    .result-meta {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255,255,255,.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Footer */
    .footer {
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
      padding: 30px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .footer a { color: #a78bfa; text-decoration: none; }

    @media (max-width: 640px) {
      .flow-steps { grid-template-columns: 1fr; }
      .appeal-card { padding: 20px; }
    }
  </style>
</head>
<body>

  <div class="container">
    <nav class="nav">
      <a href="/" class="brand">✦ EKOYILDIZ <span>· İTİRAZ</span></a>
      <div class="nav-links">
        <a href="/anayasasi">Kurallar</a>
        <a href="/yardim">Yardım</a>
        <a href="/">Ana Sayfa</a>
      </div>
    </nav>

    <header class="header">
      <div class="badge">⚖️ EkoYıldız Güvenlik & Adalet Merkezi</div>
      <h1>Automod İtiraz Portalı</h1>
      <p>Küfür, argo veya sistem filtresine takılan mesajınız için savunmanızı iletin. İlk inceleme doğrudan EKOai Başsavcı tarafından gerçekleştirilir.</p>
    </header>

    ${incidentId ? `
    <div class="incident-box">
      <div class="incident-meta">
        <div class="incident-icon">🛡️</div>
        <div>
          <div class="incident-title">Olay Dosyası #${incidentId.substring(0, 16)}</div>
          <div class="incident-sub">İhlal Türü: Küfür / Argo Kalkanı • Durum: İtiraza Açık</div>
        </div>
      </div>
      <div class="incident-tag">Automod Engeli</div>
    </div>
    ` : ''}

    <div class="appeal-card">
      <form id="appealForm" onsubmit="submitAppeal(event)">
        <div style="display: grid; grid-template-columns: ${incidentId ? '1fr' : '1fr 1fr'}; gap: 15px;">
          <div class="form-group">
            <label for="userIdInput">Discord Kullanıcı ID</label>
            <input type="text" id="userIdInput" class="form-control" placeholder="Örn: 1031620522406072350" value="${targetUser}" required ${targetUser ? 'readonly' : ''}>
            <div class="help-text">Discord hesap ID'niz (${userName ? 'Giriş yapıldı: ' + userName : 'Profilinizden kopyalayabilirsiniz'}).</div>
          </div>

          ${!incidentId ? `
          <div class="form-group">
            <label for="incidentIdInput">Olay / Mesaj ID (Opsiyonel)</label>
            <input type="text" id="incidentIdInput" class="form-control" placeholder="Bilinmiyorsa boş bırakabilirsiniz">
            <div class="help-text">Mesaj engelleme bildirimindeki ID.</div>
          </div>
          ` : `
          <input type="hidden" id="incidentIdInput" value="${incidentId}">
          `}
        </div>

        <div class="form-group">
          <label for="appealMessage">İtiraz Açıklamanız ve Savunmanız</label>
          <textarea id="appealMessage" class="form-control" placeholder="Mesajınız neden engellendi? Kelimenin bağlamı neydi? Bir yanlış anlaşılma veya şakalaşma mı vardı? Lütfen samimi ve saygılı bir dille açıklayınız..." required></textarea>
          <div class="help-text">EKOai savunmanızın samimiyetini, kelimenin hedef gözetip gözetmediğini ve sunucu geçmişinizi inceleyecektir.</div>
        </div>

        <div class="flow-steps">
          <div class="step-item">
            <span class="step-num">1</span>
            <div class="step-title">EKOai İncelemesi</div>
            <div class="step-desc">Yapay zeka savunmanızı ve geçmiş hareketlerinizi anında inceler.</div>
          </div>
          <div class="step-item">
            <span class="step-num">2</span>
            <div class="step-title">Yetkili Onayı</div>
            <div class="step-desc">EKOai onaylamazsa dosyanız doğrudan insan yetkililere sevk edilir.</div>
          </div>
          <div class="step-item">
            <span class="step-num">3</span>
            <div class="step-title">Telegram Takibi</div>
            <div class="step-desc">Yetkililer 15 dk bakmazsa üst yönetime acil Telegram bildirimi gider.</div>
          </div>
        </div>

        <button type="submit" id="submitBtn" class="btn-submit">
          <span>⚖️ İtirazı EkoAI İncelemesine Gönder</span>
        </button>
      </form>

      <div id="resultBox">
        <div class="result-title" id="resTitle"></div>
        <div class="result-desc" id="resDesc"></div>
        <div class="result-meta" id="resMeta"></div>
      </div>
    </div>

    <footer class="footer">
      EkoYıldız® Topluluk Güvenlik Sistemi • <a href="https://discord.gg/ekoyildiz">Discord Sunucumuz</a> • <a href="/anayasasi">Sunucu Anayasası</a>
    </footer>
  </div>

  <script>
    async function submitAppeal(e) {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      const resultBox = document.getElementById('resultBox');
      const resTitle = document.getElementById('resTitle');
      const resDesc = document.getElementById('resDesc');
      const resMeta = document.getElementById('resMeta');

      const userId = document.getElementById('userIdInput').value.trim();
      const incidentId = document.getElementById('incidentIdInput').value.trim();
      const appealMessage = document.getElementById('appealMessage').value.trim();

      if (!userId || !appealMessage) {
        alert('Lütfen kullanıcı ID ve itiraz savunmanızı eksiksiz girin.');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> <span>🤖 EKOai dosyanızı ve sunucu hareketlerinizi inceliyor...</span>';
      resultBox.style.display = 'none';

      try {
        const response = await fetch('/api/automod/appeal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, incidentId, appealMessage })
        });

        const data = await response.json();

        resultBox.style.display = 'block';

        if (data.success) {
          if (data.status === 'approved_by_ai') {
            resultBox.className = 'result-approved';
            resTitle.innerHTML = '🎉 İtirazınız EKOai Tarafından KABUL EDİLDİ!';
            resDesc.innerHTML = '<b>EKOai Gerekçesi:</b> ' + (data.aiReasoning || 'Savunmanız ve genel sunucu siciliniz incelendi, masumiyetiniz kabul edildi.') + '<br><br>✨ Uygulanan susturma veya kısıtlamalar kaldırılmıştır.';
            resMeta.innerHTML = 'Dosya ID: <code>' + data.appealId + '</code> • Karar: Anında Onaylandı';
          } else {
            resultBox.className = 'result-pending';
            resTitle.innerHTML = '⏳ Dosyanız Yetkili İnceleme Kuruluna Sevk Edildi';
            resDesc.innerHTML = '<b>EKOai Ön İncelemesi:</b> ' + (data.aiReasoning || 'İhlal tespiti doğrulandı.') + '<br><br>' +
              '🛡️ İtirazınız <b>#yetkili-onay</b> kanalına canlı olarak iletildi. Yetkililerimiz savunmanızı doğrudan değerlendirecektir.<br>' +
              '📲 <i>15 dakika içerisinde kimse bakmazsa üst yönetime Telegram üzerinden otomatik acil bildirim iletilecektir.</i>';
            resMeta.innerHTML = 'Dosya ID: <code>' + data.appealId + '</code> • Durum: Yetkili Değerlendirmesinde';
          }
        } else {
          resultBox.className = 'result-error';
          resTitle.innerHTML = '❌ İşlem Başarısız';
          resDesc.innerHTML = data.error || 'İtirazınız iletilirken bir hata meydana geldi.';
          resMeta.innerHTML = 'Lütfen bilgilerinizi kontrol edip tekrar deneyiniz.';
        }
      } catch (err) {
        resultBox.style.display = 'block';
        resultBox.className = 'result-error';
        resTitle.innerHTML = '❌ Bağlantı Hatası';
        resDesc.innerHTML = 'Sunucuya bağlanırken bir sorun oluştu: ' + err.message;
        resMeta.innerHTML = 'Lütfen birkaç saniye sonra tekrar deneyin.';
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>⚖️ İtirazı EkoAI İncelemesine Gönder</span>';
      }
    }
  </script>
</body>
</html>`;
}

module.exports = { renderItirazMerkeziPage };
