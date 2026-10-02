'use strict';

const {
  renderPlatformHeader,
  renderPlatformFooter,
  renderSearchDialog,
  platformChromeStyles,
  platformChromeScript
} = require('./platformChrome');

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderApplicationApprovalPage({
  status = 'VALID',
  rawToken = '',
  submission = null,
  user = null,
  error = null,
  completed = false
} = {}) {
  let bodyContent = '';
  const pageTitle = submission ? `${submission.formTitle || 'Başvuru'} · Onay ve İmza` : 'Mülakat Öncesi Onay ve İmza';

  if (completed) {
    const ref = submission?.reference || submission?.id || '';
    bodyContent = `
      <div class="approval-card success-card">
        <div class="icon-circle success">✓</div>
        <h2 class="status-title">Taahhüt ve İmzanız Alındı</h2>
        <p class="status-desc">
          Başvurunuz için gerekli site onayı ve imza kaydı güvenli şekilde işlendi. Ekibimiz planlanan görüşme saatinde Discord üzerinden sizinle iletişime geçecektir.
        </p>
        <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
          ${ref ? `<a href="/applications/${encodeURIComponent(ref)}" class="btn-primary-action" style="max-width: 280px; text-decoration: none; text-align: center;">Aday Merkezine Dön</a>` : ''}
          <a href="/yardim" class="btn-clear-sig" style="text-decoration: none; display: inline-flex; align-items: center;">Yardım Merkezi</a>
        </div>
      </div>
    `;
  } else if (status === 'FORBIDDEN') {
    bodyContent = `
      <div class="approval-card error-card">
        <div class="icon-circle error">⚠️</div>
        <h2 class="status-title">Yetkisiz Hesap Erişimi</h2>
        <p class="status-desc">
          ${escapeHtml(error || 'Bu onay bağlantısı yalnızca ilgili başvuru sahibi Discord hesabı tarafından kullanılabilir.')}
        </p>
        <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
          <a href="/auth/discord" class="btn-primary-action" style="max-width: 260px; text-decoration: none; text-align: center;">Farklı Hesapla Giriş Yap</a>
          <a href="/yardim" class="btn-clear-sig" style="text-decoration: none; display: inline-flex; align-items: center;">Yardım Al</a>
        </div>
      </div>
    `;
  } else if (status === 'INVALID' || !submission) {
    bodyContent = `
      <div class="approval-card error-card">
        <div class="icon-circle error">✕</div>
        <h2 class="status-title">Bağlantı Geçersiz veya Süresi Dolmuş</h2>
        <p class="status-desc">
          ${escapeHtml(error || 'Bu onay bağlantısının süresi dolmuş veya daha önce kullanılmış. Yeni bir bağlantı için People & Community ekibine başvurabilirsiniz.')}
        </p>
        <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
          <a href="/basvuru" class="btn-primary-action" style="max-width: 240px; text-decoration: none; text-align: center;">Başvurularım</a>
          <a href="/yardim" class="btn-clear-sig" style="text-decoration: none; display: inline-flex; align-items: center;">Yardım Merkezi</a>
        </div>
      </div>
    `;
  } else {
    // Active 3-step form
    const ref = submission.reference || submission.id || 'EKO-APP';
    const formTitle = submission.formTitle || 'EkoYıldız Ekip Başvurusu';
    const candidateName = submission.discordUsername || user?.username || 'Aday';
    const scheduledTime = submission.scheduledTime || 'Belirleniyor / Takvim Onayı Bekleniyor';

    bodyContent = `
      <div class="approval-ribbon">
        <span class="badge">EkoYıldız People &amp; Community</span>
        <span>•</span>
        <span>Mülakat Öncesi Taahhüt Doğrulama</span>
      </div>

      <div class="approval-card">
        <header class="approval-header">
          <div class="step-nav-badge">Aşama: Site Onayı &amp; İmza</div>
          <h1 class="approval-title">${escapeHtml(formTitle)}</h1>
          <p class="approval-lead">
            Referans: <strong>${escapeHtml(ref)}</strong> • Mülakat sürecinize başlamadan önce aşağıdaki adımları tamamlayınız.
          </p>
        </header>

        <!-- Steps Progress -->
        <nav class="steps-nav" aria-label="Onay Adımları">
          <div class="step-nav-item active">
            <span class="step-num">1</span>
            <span>Aday Bilgileri</span>
          </div>
          <div class="step-nav-item active">
            <span class="step-num">2</span>
            <span>Taahhütler</span>
          </div>
          <div class="step-nav-item active">
            <span class="step-num">3</span>
            <span>İmza</span>
          </div>
        </nav>

        <form id="approval-form" data-token="${escapeHtml(rawToken)}">
          <!-- Step 1: Overview -->
          <div class="step-section">
            <h3 style="font-size: 1.1rem; margin-bottom: 0.75rem;">1. Başvuru ve Mülakat Özeti</h3>
            <div class="overview-grid">
              <div class="overview-item">
                <span class="label">Aday</span>
                <span class="value">@${escapeHtml(candidateName)}</span>
              </div>
              <div class="overview-item">
                <span class="label">Başvurulan Rol</span>
                <span class="value">${escapeHtml(formTitle)}</span>
              </div>
              <div class="overview-item">
                <span class="label">Görüşme Zamanı</span>
                <span class="value">${escapeHtml(scheduledTime)}</span>
              </div>
              <div class="overview-item">
                <span class="label">Ortam</span>
                <span class="value">Discord Sesli / Metin</span>
              </div>
            </div>
          </div>

          <!-- Step 2: Agreements -->
          <div class="step-section" style="margin-top: 2rem;">
            <h3 style="font-size: 1.1rem; margin-bottom: 0.75rem;">2. Taahhütler ve Koşullar</h3>
            <div class="agreements-box">
              <label class="agreement-item" for="chk-truthful">
                <input type="checkbox" id="chk-truthful" name="truthful" required>
                <div class="agreement-text">
                  <strong>Doğru ve Eksiksiz Bilgi Beyanı</strong>
                  <p>Başvuru formunda beyan ettiğim tüm bilgilerin şahsıma ait olduğunu ve gerçeği yansıttığını kabul ediyorum.</p>
                </div>
              </label>

              <label class="agreement-item" for="chk-guidelines">
                <input type="checkbox" id="chk-guidelines" name="guidelines" required>
                <div class="agreement-text">
                  <strong>Topluluk İlkeleri ve Gizlilik</strong>
                  <p>Mülakat sürecinde edinilen bilgilerin ve iç işleyiş detaylarının gizli tutulacağını kabul ediyorum.</p>
                  <div class="agreement-links">
                    <a href="/yardim" target="_blank" rel="noopener">Topluluk Kuralları</a>
                    <a href="/blog" target="_blank" rel="noopener">EkoYıldız Rehberi</a>
                  </div>
                </div>
              </label>

              <label class="agreement-item" for="chk-commitments">
                <input type="checkbox" id="chk-commitments" name="commitments" required>
                <div class="agreement-text">
                  <strong>Ekip İçi Sorumluluk Taahhüdü</strong>
                  <p>Kabul edildiğim takdirde ekip etik kurallarına uyacağımı ve aktif katılım sağlayacağımı taahhüt ederim.</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Step 3: Signature Canvas -->
          <div class="step-section" style="margin-top: 2rem;">
            <div class="signature-box">
              <div class="signature-label-row">
                <h3 style="font-size: 1.1rem; margin: 0;">3. Dijital İmzanız</h3>
                <button type="button" id="btn-clear-sig" class="btn-clear-sig">Temizle</button>
              </div>
              <p style="font-size: 0.8125rem; color: var(--app-text-muted); margin-bottom: 0.75rem;">
                Fare, dokunmatik ekran veya kaleminizle imzanızı aşağıdaki alana çizin.
              </p>
              <div class="signature-canvas-container">
                <canvas id="signature-canvas"></canvas>
                <div class="signature-placeholder-hint" id="canvas-hint">İmzanızı buraya çizin</div>
              </div>
            </div>
          </div>

          <!-- Submit area -->
          <div class="submit-action-area">
            <button type="submit" id="btn-submit-approval" class="btn-primary-action" disabled>
              Onayla ve İmzayı Gönder
            </button>
            <span style="font-size: 0.75rem; color: var(--app-text-muted); text-align: center;">
              İmzanız SHA-256 özetiyle doğrulanarak başvuru kütüğünüze mühürlenir.
            </span>
          </div>
        </form>
      </div>
    `;
  }

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(pageTitle)} — EkoYıldız</title>
  <meta name="theme-color" content="#06060e">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  ${platformChromeStyles('dark')}
  <link rel="stylesheet" href="/applications/approval.css">
</head>
<body class="forms-page">
  ${renderPlatformHeader({ user, activePath: '/basvuru', theme: 'dark' })}
  <main class="approval-shell">
    ${bodyContent}
  </main>
  ${renderPlatformFooter({ theme: 'dark' })}
  ${renderSearchDialog({ theme: 'dark' })}
  ${platformChromeScript()}
  <script src="/applications/approval.js"></script>
</body>
</html>`;
}

module.exports = {
  renderApplicationApprovalPage
};
