const {
  renderPlatformHeader,
  renderPlatformFooter,
  renderSearchDialog,
  platformChromeStyles,
  platformChromeScript
} = require('./platformChrome');
const { ORDERED_MAIN_STAGES, STAGE_METADATA } = require('../services/recruitmentStages');

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTimeline(currentStage, history = []) {
  const currentOrder = STAGE_METADATA[currentStage]?.order || 2;
  const isAlternative = !ORDERED_MAIN_STAGES.includes(currentStage);

  const stepsHtml = ORDERED_MAIN_STAGES.map((stageKey) => {
    const meta = STAGE_METADATA[stageKey];
    const isCompleted = meta.order < currentOrder;
    const isCurrent = meta.order === currentOrder && !isAlternative;
    
    let stateClass = 'pending';
    let icon = meta.icon;
    let badge = '';

    if (isCompleted) {
      stateClass = 'completed';
      icon = '✓';
    } else if (isCurrent) {
      stateClass = 'current';
      badge = '<span class="status-pill active-pill">Mevcut Aşama</span>';
    }

    return `
      <div class="timeline-step ${stateClass}">
        <div class="step-indicator">
          <div class="step-icon">${icon}</div>
          <div class="step-line"></div>
        </div>
        <div class="step-content">
          <div class="step-header">
            <span class="step-title">${escapeHtml(meta.label)}</span>
            ${badge}
          </div>
          <p class="step-desc">${escapeHtml(meta.description)}</p>
        </div>
      </div>
    `;
  }).join('');

  let altHtml = '';
  if (isAlternative) {
    const altMeta = STAGE_METADATA[currentStage] || { label: currentStage, description: '' };
    altHtml = `
      <div class="alternative-status-banner">
        <div class="alt-badge">Özel Durum: ${escapeHtml(altMeta.label)}</div>
        <p>${escapeHtml(altMeta.description)}</p>
      </div>
    `;
  }

  return `
    <div class="candidate-timeline">
      <div class="timeline-header">
        <h3>Aday Süreci İlerlemesi</h3>
        <span class="text-muted text-xs">People &amp; Community Workflow</span>
      </div>
      ${altHtml}
      <div class="timeline-steps">
        ${stepsHtml}
      </div>
    </div>
  `;
}

function renderCandidatePortalPage(data = {}, currentUser = null) {
  const {
    reference = 'EKO-APP',
    formTitle = 'Ekip Başvurusu',
    stage = 'APPLICATION_RECEIVED',
    stageInfo = {},
    candidate = {},
    interview = {},
    answers = {},
    operationHistory = [],
    createdAt,
    updatedAt
  } = data;

  const candidateName = candidate.name || 'Aday';
  const discordUser = candidate.discordId ? `@${candidateName}` : 'Bağlı';
  const currentStageMeta = stageInfo.label ? stageInfo : (STAGE_METADATA[stage] || STAGE_METADATA.APPLICATION_RECEIVED);
  const microcopy = currentStageMeta.microcopy || 'Başvurunuz People & Community ekibimiz tarafından titizlikle incelenmektedir.';

  const isInterviewReady = ['INVITED_TO_INTERVIEW', 'INTERVIEW_SCHEDULED', 'TIME_APPROVED'].includes(stage);
  const isCandidateReady = Boolean(interview.candidateReady);

  // Invitation card markup if invited
  let invitationCardHtml = '';
  if (stage === 'INVITED_TO_INTERVIEW' || stage === 'INTERVIEW_SCHEDULED') {
    invitationCardHtml = `
      <div class="invitation-card">
        <div class="invitation-badge">MÜLAKAT BİLGİSİ</div>
        <h3 class="invitation-title">Mülakata Davet Edildiniz</h3>
        <p class="invitation-lead">Başvurunuzun bir sonraki aşamasına geçmek istiyoruz.</p>
        <div class="invitation-details-grid">
          <div class="invitation-detail">
            <span class="label">Pozisyon</span>
            <span class="value">${escapeHtml(formTitle)}</span>
          </div>
          <div class="invitation-detail">
            <span class="label">Yaklaşık Süre</span>
            <span class="value">${escapeHtml(interview.estimatedDuration || '20–30 dakika')}</span>
          </div>
          <div class="invitation-detail">
            <span class="label">Görüşme Ortamı</span>
            <span class="value">Discord</span>
          </div>
          <div class="invitation-detail">
            <span class="label">Planlanan Zaman</span>
            <span class="value highlight">${escapeHtml(interview.scheduledTime || 'Görüşme saati belirleniyor')}</span>
          </div>
        </div>
        <div class="invitation-footer">
          <span class="microcopy-tag">💡 Merak etmeyin, kravat zorunlu değil.</span>
        </div>
      </div>
    `;
  }

  // Check-in markup
  let checkinHtml = '';
  if (isInterviewReady) {
    checkinHtml = `
      <div class="checkin-box ${isCandidateReady ? 'is-ready' : ''}" id="checkin-section">
        <div class="checkin-header">
          <h4>Görüşmeye hazır mısınız?</h4>
          <span class="checkin-subtitle">Mülakat öncesi hazırlık kontrolü</span>
        </div>
        <ul class="checkin-checklist">
          <li><span class="chk-icon">✓</span> Discord hesabınız bağlı (${escapeHtml(discordUser)})</li>
          <li><span class="chk-icon">✓</span> Başvuru dosyanız hazır ve referans numaralandı (${escapeHtml(reference)})</li>
          <li><span class="chk-icon">✓</span> Mülakat görüşme kaydınız bulundu</li>
        </ul>
        <div class="checkin-actions">
          ${isCandidateReady ? `
            <div class="ready-badge">
              <span>🟢 Görüşmeye Hazırsınız</span>
              <small>Ekibimiz planlanan saatte sizinle Discord üzerinden iletişime geçecektir.</small>
            </div>
          ` : `
            <button type="button" class="btn btn-primary" id="btn-candidate-checkin" onclick="performCandidateCheckin('${escapeHtml(reference)}')">
              Görüşmeye Hazırım
            </button>
            <span class="text-xs text-muted">Butona tıkladığınızda People & Community paneline hazır olduğunuz iletilir.</span>
          `}
        </div>
      </div>
    `;
  }

  // Answer preview sections
  let answersHtml = '';
  if (answers && Array.isArray(answers.sections) && answers.sections.length > 0) {
    const sections = answers.sections.map((sec) => {
      const items = (sec.answers || []).map((ans) => `
        <div class="qa-item">
          <div class="qa-label">${escapeHtml(ans.label || ans.id)}</div>
          <div class="qa-value">${escapeHtml(ans.value || '—')}</div>
        </div>
      `).join('');

      return `
        <div class="qa-section">
          <h4 class="qa-section-title">${escapeHtml(sec.title)}</h4>
          <div class="qa-grid">${items}</div>
        </div>
      `;
    }).join('');

    answersHtml = `
      <div class="answers-review-card">
        <h3>Başvuru Yanıtlarınızın Özeti</h3>
        <p class="text-muted text-xs">Gönderilen form yanıtlarınız arşivimizde güvenle saklanmaktadır.</p>
        <div class="qa-sections-container">${sections}</div>
      </div>
    `;
  }

  const dateFormatted = createdAt ? new Date(createdAt).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' }) : 'Kayıtlı';

  const bodyContent = `
    <div class="candidate-portal-wrapper">
      <!-- Mini System Status Bar -->
      <div class="system-status-ribbon">
        <span class="status-indicator-dot online">● Başvuru sistemi çalışıyor</span>
        <span class="status-indicator-dot online">● Discord bağlantısı aktif</span>
        <span class="status-indicator-dot ref">Ref: ${escapeHtml(reference)}</span>
      </div>

      <!-- Main Dossier Header -->
      <header class="candidate-portal-header">
        <div class="header-pre">
          <span class="dept-badge">People &amp; Community · Aday Merkezi</span>
          <span class="discord-account-badge">Discord ${escapeHtml(discordUser)} <strong>Bağlı ✓</strong></span>
        </div>
        <div class="header-main">
          <div>
            <h1 class="portal-title">${escapeHtml(formTitle)}</h1>
            <div class="portal-meta">
              <span class="ref-chip">Referans: <strong>${escapeHtml(reference)}</strong></span>
              <span class="meta-dot">·</span>
              <span class="text-muted">Başvuru Tarihi: ${escapeHtml(dateFormatted)}</span>
            </div>
          </div>
          <div class="stage-badge-large" style="--stage-color: ${currentStageMeta.color || '#38bdf8'};">
            <span class="badge-icon">${currentStageMeta.icon || '📌'}</span>
            <span class="badge-label">${escapeHtml(currentStageMeta.label)}</span>
          </div>
        </div>
      </header>

      <!-- What's Next & Status Card -->
      <section class="whats-next-card">
        <div class="wn-header">
          <div class="wn-icon">✦</div>
          <div>
            <h3>Sırada ne var?</h3>
            <p class="wn-action-text">${escapeHtml(currentStageMeta.nextStepText)}</p>
          </div>
        </div>
        <div class="wn-microcopy">
          <span>“${escapeHtml(microcopy)}”</span>
        </div>
      </section>

      ${invitationCardHtml}
      ${checkinHtml}

      <!-- Timeline & Steps -->
      <div class="portal-content-grid">
        <div class="portal-left-column">
          ${renderTimeline(stage, operationHistory)}
        </div>
        <div class="portal-right-column">
          ${answersHtml}
        </div>
      </div>

      <!-- Footer Sign-off -->
      <footer class="candidate-portal-footer">
        <div class="footer-signoff">
          <strong>EkoYıldız People &amp; Community</strong>
          <span>Aday Deneyimi &amp; Yetenek Operasyonları</span>
        </div>
        <div class="footer-links">
          <a href="/forms">Tüm Formlar</a>
          <a href="/yardim">Yardım Merkezi</a>
          <a href="/ekoyildizda-calis">Ekip Kültürü</a>
        </div>
      </footer>
    </div>

    <style>
      .candidate-portal-wrapper {
        max-width: 1040px;
        margin: 2rem auto 4rem;
        padding: 0 1.25rem;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #f1f5f9;
      }
      .system-status-ribbon {
        display: flex;
        gap: 1.25rem;
        align-items: center;
        margin-bottom: 1.5rem;
        font-size: 0.78rem;
        color: #94a3b8;
        padding: 0.4rem 0.8rem;
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 10px;
      }
      .status-indicator-dot.online { color: #34d399; }
      .status-indicator-dot.ref { margin-left: auto; font-family: monospace; color: #cbd5e1; font-weight: 700; }
      
      .candidate-portal-header {
        background: linear-gradient(145deg, rgba(30,41,59,0.7), rgba(15,23,42,0.85));
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 20px;
        padding: 2rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      }
      .header-pre {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .dept-badge {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #818cf8;
        font-weight: 800;
      }
      .discord-account-badge {
        font-size: 0.82rem;
        color: #cbd5e1;
        background: rgba(88, 101, 242, 0.15);
        border: 1px solid rgba(88, 101, 242, 0.35);
        padding: 0.3rem 0.75rem;
        border-radius: 20px;
      }
      .discord-account-badge strong { color: #34d399; }
      .header-main {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        flex-wrap: wrap;
        gap: 1.25rem;
      }
      .portal-title {
        font-size: 2.1rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: #ffffff;
        margin: 0 0 0.5rem 0;
      }
      .portal-meta {
        font-size: 0.9rem;
        color: #94a3b8;
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }
      .ref-chip {
        font-family: monospace;
        background: rgba(255,255,255,0.06);
        padding: 0.2rem 0.5rem;
        border-radius: 6px;
        color: #e2e8f0;
      }
      .stage-badge-large {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.6rem 1.2rem;
        border-radius: 14px;
        background: rgba(255,255,255,0.04);
        border: 1px solid var(--stage-color);
        box-shadow: 0 0 15px rgba(255,255,255,0.05);
      }
      .stage-badge-large .badge-label {
        font-weight: 800;
        font-size: 1rem;
        color: var(--stage-color);
      }
      
      .whats-next-card {
        background: rgba(15,23,42,0.6);
        border: 1px solid rgba(129,140,248,0.25);
        border-left: 4px solid #818cf8;
        border-radius: 16px;
        padding: 1.4rem 1.8rem;
        margin-bottom: 1.5rem;
      }
      .wn-header {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
      }
      .wn-icon {
        font-size: 1.4rem;
        color: #818cf8;
        margin-top: 0.1rem;
      }
      .wn-header h3 {
        margin: 0 0 0.35rem 0;
        font-size: 1.15rem;
        font-weight: 800;
        color: #fff;
      }
      .wn-action-text {
        margin: 0;
        color: #cbd5e1;
        font-size: 0.95rem;
        line-height: 1.55;
      }
      .wn-microcopy {
        margin-top: 0.85rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(255,255,255,0.06);
        font-size: 0.82rem;
        color: #94a3b8;
        font-style: italic;
      }

      .invitation-card {
        background: linear-gradient(135deg, rgba(52,211,153,0.08), rgba(16,185,129,0.04));
        border: 1px solid rgba(52,211,153,0.3);
        border-radius: 18px;
        padding: 1.6rem 2rem;
        margin-bottom: 1.5rem;
      }
      .invitation-badge {
        font-size: 0.7rem;
        font-weight: 800;
        color: #34d399;
        letter-spacing: 0.1em;
        margin-bottom: 0.4rem;
      }
      .invitation-title {
        font-size: 1.4rem;
        font-weight: 800;
        color: #fff;
        margin: 0 0 0.4rem 0;
      }
      .invitation-lead {
        color: #cbd5e1;
        margin: 0 0 1.25rem 0;
        font-size: 0.95rem;
      }
      .invitation-details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
        gap: 1rem;
        background: rgba(0,0,0,0.25);
        padding: 1rem 1.2rem;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.05);
      }
      .invitation-detail .label {
        display: block;
        font-size: 0.75rem;
        color: #94a3b8;
        margin-bottom: 0.2rem;
      }
      .invitation-detail .value {
        font-size: 0.95rem;
        font-weight: 700;
        color: #f1f5f9;
      }
      .invitation-detail .value.highlight {
        color: #34d399;
      }
      .invitation-footer {
        margin-top: 1rem;
        font-size: 0.8rem;
        color: #a7f3d0;
      }

      .checkin-box {
        background: rgba(30,41,59,0.4);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        padding: 1.4rem 1.8rem;
        margin-bottom: 1.5rem;
      }
      .checkin-box.is-ready {
        border-color: rgba(52,211,153,0.3);
        background: rgba(52,211,153,0.05);
      }
      .checkin-header h4 {
        margin: 0 0 0.2rem 0;
        font-size: 1.1rem;
        font-weight: 800;
        color: #fff;
      }
      .checkin-subtitle {
        font-size: 0.8rem;
        color: #94a3b8;
      }
      .checkin-checklist {
        list-style: none;
        padding: 0;
        margin: 1rem 0;
      }
      .checkin-checklist li {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 0.88rem;
        color: #cbd5e1;
        margin-bottom: 0.5rem;
      }
      .chk-icon {
        color: #34d399;
        font-weight: 800;
        background: rgba(52,211,153,0.15);
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
      }
      .checkin-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-top: 1.2rem;
        flex-wrap: wrap;
      }
      .ready-badge {
        padding: 0.6rem 1rem;
        border-radius: 10px;
        background: rgba(52,211,153,0.15);
        border: 1px solid rgba(52,211,153,0.35);
      }
      .ready-badge span {
        display: block;
        color: #34d399;
        font-weight: 800;
        font-size: 0.92rem;
      }
      .ready-badge small {
        color: #cbd5e1;
        font-size: 0.78rem;
      }

      .portal-content-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }
      @media (max-width: 860px) {
        .portal-content-grid { grid-template-columns: 1fr; }
      }

      .candidate-timeline {
        background: rgba(15,23,42,0.6);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 18px;
        padding: 1.6rem;
      }
      .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 1.5rem;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        padding-bottom: 0.8rem;
      }
      .timeline-header h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 800;
        color: #fff;
      }
      .timeline-steps {
        display: flex;
        flex-direction: column;
      }
      .timeline-step {
        display: flex;
        gap: 1rem;
        position: relative;
      }
      .step-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .step-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
        z-index: 2;
      }
      .timeline-step.completed .step-icon {
        background: rgba(52,211,153,0.15);
        border-color: #34d399;
        color: #34d399;
        font-weight: 800;
      }
      .timeline-step.current .step-icon {
        background: rgba(129,140,248,0.25);
        border-color: #818cf8;
        box-shadow: 0 0 12px rgba(129,140,248,0.5);
      }
      .step-line {
        width: 2px;
        flex: 1;
        background: rgba(255,255,255,0.08);
        min-height: 28px;
      }
      .timeline-step:last-child .step-line {
        display: none;
      }
      .step-content {
        padding-bottom: 1.4rem;
        flex: 1;
      }
      .step-header {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.25rem;
      }
      .step-title {
        font-size: 0.95rem;
        font-weight: 700;
        color: #e2e8f0;
      }
      .timeline-step.current .step-title {
        color: #818cf8;
        font-weight: 800;
      }
      .timeline-step.pending .step-title {
        color: #64748b;
      }
      .status-pill.active-pill {
        font-size: 0.68rem;
        font-weight: 800;
        padding: 0.15rem 0.5rem;
        border-radius: 20px;
        background: rgba(129,140,248,0.2);
        color: #818cf8;
        border: 1px solid rgba(129,140,248,0.4);
      }
      .step-desc {
        margin: 0;
        font-size: 0.82rem;
        color: #94a3b8;
        line-height: 1.5;
      }

      .answers-review-card {
        background: rgba(15,23,42,0.6);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 18px;
        padding: 1.6rem;
      }
      .answers-review-card h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.1rem;
        font-weight: 800;
        color: #fff;
      }
      .qa-sections-container {
        margin-top: 1.25rem;
      }
      .qa-section {
        margin-bottom: 1.25rem;
      }
      .qa-section-title {
        font-size: 0.82rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #818cf8;
        margin: 0 0 0.6rem 0;
        padding-bottom: 0.3rem;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .qa-item {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.04);
        padding: 0.75rem 0.9rem;
        border-radius: 10px;
        margin-bottom: 0.6rem;
      }
      .qa-label {
        font-size: 0.78rem;
        color: #94a3b8;
        margin-bottom: 0.25rem;
      }
      .qa-value {
        font-size: 0.88rem;
        color: #f1f5f9;
        white-space: pre-wrap;
        line-height: 1.5;
      }

      .candidate-portal-footer {
        margin-top: 3rem;
        padding-top: 1.5rem;
        border-top: 1px solid rgba(255,255,255,0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        font-size: 0.82rem;
        color: #64748b;
      }
      .footer-signoff strong { display: block; color: #94a3b8; font-size: 0.88rem; }
      .footer-links { display: flex; gap: 1rem; }
      .footer-links a { color: #94a3b8; text-decoration: none; }
      .footer-links a:hover { color: #818cf8; }

      .btn {
        padding: 0.6rem 1.4rem;
        border-radius: 10px;
        font-weight: 700;
        font-size: 0.88rem;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
      }
      .btn-primary {
        background: linear-gradient(135deg, #10b981, #059669);
        color: #fff;
        box-shadow: 0 4px 14px rgba(16,185,129,0.3);
      }
      .btn-primary:hover {
        opacity: 0.95;
        transform: translateY(-1px);
      }
    </style>

    <script>
      async function performCandidateCheckin(reference) {
        const btn = document.getElementById('btn-candidate-checkin');
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'İşleniyor...';
        }
        try {
          const res = await fetch('/api/applications/' + encodeURIComponent(reference) + '/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          if (!res.ok) {
            alert(data.error || 'Check-in tamamlanamadı.');
            if (btn) {
              btn.disabled = false;
              btn.textContent = 'Görüşmeye Hazırım';
            }
            return;
          }
          // Refresh to display ready state
          window.location.reload();
        } catch (err) {
          alert('Bağlantı hatası: ' + err.message);
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Görüşmeye Hazırım';
          }
        }
      }
    </script>
  `;

  const pageTitle = `${formTitle} · ${reference} · Aday Merkezi`;

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
</head>
<body class="forms-page">
  ${renderPlatformHeader({ user: currentUser, activePath: '/basvuru', theme: 'dark' })}
  <main class="forms-shell">
    ${bodyContent}
  </main>
  ${renderPlatformFooter({ theme: 'dark' })}
  ${renderSearchDialog({ theme: 'dark' })}
  ${platformChromeScript()}
</body>
</html>`;
}

module.exports = {
  renderCandidatePortalPage
};
