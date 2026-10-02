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

  // Countdown & Excitement banner markup if scheduled
  let countdownHtml = '';
  if (interview.scheduledTime) {
    const focusChips = (interview.focusAreas || ['İletişim & Diksiyon', 'Kriz Çözme', 'Rol ve Kural Hakimiyeti'])
      .map(f => `<span class="focus-chip">${escapeHtml(f)}</span>`).join('');

    countdownHtml = `
      <div class="interview-countdown-card" id="interview-countdown-box" data-scheduled-time="${escapeHtml(interview.scheduledTime)}">
        <div class="countdown-card-header">
          <div class="countdown-badge-wrapper">
            <span class="live-dot pulse"></span>
            <span class="countdown-badge-title">CANLI MÜLAKAT GERİ SAYIMI</span>
          </div>
          <span class="countdown-track-tag">${escapeHtml(interview.interviewTrackLabel || 'Birebir Sesli Mülakat')}</span>
        </div>

        <!-- Clock Digits Grid -->
        <div class="countdown-clock">
          <div class="clock-segment">
            <span class="clock-num" id="cd-days">00</span>
            <span class="clock-label">GÜN</span>
          </div>
          <div class="clock-divider">:</div>
          <div class="clock-segment">
            <span class="clock-num" id="cd-hours">00</span>
            <span class="clock-label">SAAT</span>
          </div>
          <div class="clock-divider">:</div>
          <div class="clock-segment">
            <span class="clock-num" id="cd-mins">00</span>
            <span class="clock-label">DAKİKA</span>
          </div>
          <div class="clock-divider">:</div>
          <div class="clock-segment clock-seconds">
            <span class="clock-num" id="cd-secs">00</span>
            <span class="clock-label">SANİYE</span>
          </div>
        </div>

        <!-- Dynamic Excitement Hype Banner -->
        <div class="hype-status-panel" id="hype-panel">
          <div class="hype-icon-bubble" id="hype-icon">⏱️</div>
          <div class="hype-text-area">
            <h4 class="hype-title" id="hype-title">Mülakat Hazırlığı Başladı</h4>
            <p class="hype-desc" id="hype-desc">Görüşme saatinize geri sayım devam ediyor. Lütfen Discord üzerinde hazır bulununuz.</p>
          </div>
        </div>

        <!-- Pre-interview options details -->
        <div class="interview-options-preview">
          <div class="opt-preview-item">
            <span class="opt-label">Mülakat Parkuru</span>
            <span class="opt-val">🎯 ${escapeHtml(interview.interviewTrackLabel || 'Birebir Sesli')}</span>
          </div>
          <div class="opt-preview-item">
            <span class="opt-label">Zorluk Derecesi</span>
            <span class="opt-val">⚡ ${escapeHtml(interview.difficulty || 'Standart')}</span>
          </div>
          <div class="opt-preview-item full-width">
            <span class="opt-label">Değerlendirme Odakları</span>
            <div class="focus-chips-row">${focusChips}</div>
          </div>
          ${interview.candidateInstructions ? `
            <div class="opt-preview-item full-width candidate-notes-block">
              <span class="opt-label">📌 Adaya Özel Hazırlık Direktifi:</span>
              <p class="candidate-notes-text">${escapeHtml(interview.candidateInstructions)}</p>
            </div>
          ` : ''}
          ${interview.gameLink ? `
            <div class="opt-preview-item full-width">
              <a href="${escapeHtml(interview.gameLink)}" target="_blank" rel="noopener" class="btn btn-game-link">🎮 Roblox Mülakat Oyun Alanına Git</a>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // AI Warmup simulator card
  let aiWarmupHtml = '';
  if (isInterviewReady) {
    aiWarmupHtml = `
      <div class="ai-warmup-card" id="ai-warmup-card">
        <div class="ai-warmup-header">
          <div class="ai-badge">🤖 YAPAY ZEKA MÜLAKAT PROVASI</div>
          <h3>Mülakat Öncesi Isınma &amp; Kriz Simülasyonu</h3>
          <p class="ai-warmup-sub">Heyecanınızı yatıştırın ve canlı mülakata en yüksek özgüvenle girin. Yapay zeka koçunuz pozisyonunuza özel gerçekçi bir kriz sorusu üretecek ve yanıtınızı anında puanlayıp tüyo verecektir.</p>
        </div>

        <div class="ai-warmup-content" id="ai-warmup-content">
          <button type="button" class="btn btn-ai-warmup" id="btn-start-warmup" onclick="startAiWarmup('${escapeHtml(reference)}')">
            ✦ AI Simülasyon Sorusunu Başlat
          </button>
        </div>
      </div>
    `;
  }

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

      ${countdownHtml}
      ${invitationCardHtml}
      ${checkinHtml}
      ${aiWarmupHtml}

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

      /* Live Countdown & Excitement Hype Styles */
      .interview-countdown-card {
        background: linear-gradient(145deg, rgba(20, 24, 40, 0.95), rgba(10, 13, 24, 0.98));
        border: 1px solid rgba(129, 140, 248, 0.35);
        border-radius: 20px;
        padding: 2rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45), 0 0 24px rgba(129, 140, 248, 0.15);
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
      }
      .interview-countdown-card.pulse-urgent {
        border-color: #ef4444;
        box-shadow: 0 0 35px rgba(239, 68, 68, 0.4), inset 0 0 15px rgba(239, 68, 68, 0.2);
        animation: urgentPulse 1.2s infinite alternate;
      }
      .interview-countdown-card.pulse-warning {
        border-color: #f97316;
        box-shadow: 0 0 30px rgba(249, 115, 22, 0.35);
        animation: urgentPulse 1.8s infinite alternate;
      }
      @keyframes urgentPulse {
        0% { transform: scale(1); }
        100% { transform: scale(1.008); }
      }
      .countdown-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 0.8rem;
      }
      .countdown-badge-wrapper {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(129, 140, 248, 0.12);
        border: 1px solid rgba(129, 140, 248, 0.3);
        padding: 0.35rem 0.85rem;
        border-radius: 999px;
      }
      .live-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #34d399;
      }
      .live-dot.pulse {
        animation: blinkDot 1s infinite;
      }
      @keyframes blinkDot {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(1.3); }
      }
      .countdown-badge-title {
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        color: #c7d2fe;
      }
      .countdown-track-tag {
        font-size: 0.82rem;
        font-weight: 700;
        color: #38bdf8;
        background: rgba(56, 189, 248, 0.1);
        border: 1px solid rgba(56, 189, 248, 0.25);
        padding: 0.3rem 0.75rem;
        border-radius: 8px;
      }
      .countdown-clock {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin: 1.5rem 0 2rem;
        flex-wrap: wrap;
      }
      .clock-segment {
        background: rgba(0, 0, 0, 0.55);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        padding: 1rem 1.25rem;
        min-width: 85px;
        text-align: center;
        box-shadow: inset 0 2px 6px rgba(0,0,0,0.6);
      }
      .clock-num {
        display: block;
        font-family: 'Outfit', -apple-system, sans-serif;
        font-size: 2.4rem;
        font-weight: 800;
        color: #ffffff;
        line-height: 1;
        letter-spacing: -0.02em;
      }
      .clock-label {
        display: block;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: #94a3b8;
        margin-top: 0.4rem;
      }
      .clock-divider {
        font-size: 2rem;
        font-weight: 800;
        color: rgba(255, 255, 255, 0.25);
        margin-top: -0.5rem;
      }
      .clock-segment.clock-seconds .clock-num {
        color: #f43f5e;
      }
      .hype-status-panel {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8));
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 1rem 1.25rem;
        margin-bottom: 1.5rem;
        transition: all 0.3s ease;
      }
      .hype-status-panel.hype-15m {
        background: linear-gradient(135deg, rgba(30, 58, 138, 0.35), rgba(15, 23, 42, 0.8));
        border-color: rgba(56, 189, 248, 0.4);
      }
      .hype-status-panel.hype-5m {
        background: linear-gradient(135deg, rgba(120, 53, 15, 0.4), rgba(15, 23, 42, 0.8));
        border-color: rgba(245, 158, 11, 0.5);
      }
      .hype-status-panel.hype-2m {
        background: linear-gradient(135deg, rgba(124, 45, 18, 0.45), rgba(15, 23, 42, 0.8));
        border-color: rgba(249, 115, 22, 0.6);
      }
      .hype-status-panel.hype-1m {
        background: linear-gradient(135deg, rgba(153, 27, 27, 0.55), rgba(15, 23, 42, 0.85));
        border-color: rgba(239, 68, 68, 0.7);
      }
      .hype-icon-bubble {
        font-size: 2rem;
        flex-shrink: 0;
      }
      .hype-title {
        margin: 0 0 0.25rem 0;
        font-size: 1.05rem;
        font-weight: 800;
        color: #ffffff;
      }
      .hype-desc {
        margin: 0;
        font-size: 0.86rem;
        color: #cbd5e1;
        line-height: 1.45;
      }
      .interview-options-preview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.8rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      .opt-preview-item {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 0.75rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .opt-preview-item.full-width {
        grid-column: 1 / -1;
      }
      .opt-label {
        font-size: 0.75rem;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .opt-val {
        font-size: 0.92rem;
        font-weight: 700;
        color: #f1f5f9;
      }
      .focus-chips-row {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
        margin-top: 0.2rem;
      }
      .focus-chip {
        font-size: 0.78rem;
        font-weight: 600;
        background: rgba(129, 140, 248, 0.15);
        color: #c7d2fe;
        border: 1px solid rgba(129, 140, 248, 0.3);
        padding: 0.2rem 0.6rem;
        border-radius: 6px;
      }
      .candidate-notes-block {
        background: rgba(245, 158, 11, 0.08);
        border-color: rgba(245, 158, 11, 0.25);
      }
      .candidate-notes-text {
        margin: 0;
        font-size: 0.88rem;
        color: #fde68a;
        line-height: 1.5;
      }
      .btn-game-link {
        background: linear-gradient(135deg, #0284c7, #0369a1);
        color: #fff;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        padding: 0.7rem 1.2rem;
        border-radius: 10px;
        font-weight: 800;
        box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3);
      }

      /* AI Warmup Card */
      .ai-warmup-card {
        background: linear-gradient(145deg, rgba(23, 27, 44, 0.95), rgba(12, 15, 28, 0.98));
        border: 1px solid rgba(168, 85, 247, 0.35);
        border-radius: 20px;
        padding: 2rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35), 0 0 20px rgba(168, 85, 247, 0.12);
      }
      .ai-warmup-header {
        margin-bottom: 1.5rem;
      }
      .ai-badge {
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        color: #c084fc;
        display: inline-block;
        margin-bottom: 0.5rem;
      }
      .ai-warmup-header h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.35rem;
        color: #ffffff;
        font-weight: 800;
      }
      .ai-warmup-sub {
        margin: 0;
        color: #94a3b8;
        font-size: 0.88rem;
        line-height: 1.55;
      }
      .btn-ai-warmup {
        background: linear-gradient(135deg, #a855f7, #7c3aed);
        color: #ffffff;
        padding: 0.75rem 1.6rem;
        border-radius: 10px;
        font-weight: 800;
        font-size: 0.92rem;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(168, 85, 247, 0.35);
        transition: all 0.2s ease;
      }
      .btn-ai-warmup:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(168, 85, 247, 0.45);
      }
      .warmup-box {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 1.25rem;
        margin-top: 1rem;
      }
      .warmup-scenario-title {
        font-size: 0.8rem;
        font-weight: 800;
        text-transform: uppercase;
        color: #f59e0b;
        letter-spacing: 0.06em;
        margin-bottom: 0.5rem;
      }
      .warmup-scenario-text {
        font-size: 0.95rem;
        color: #f8fafc;
        line-height: 1.6;
        margin-bottom: 1rem;
      }
      .warmup-textarea {
        width: 100%;
        min-height: 90px;
        background: rgba(0, 0, 0, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #ffffff;
        padding: 0.8rem;
        border-radius: 10px;
        font-size: 0.88rem;
        font-family: inherit;
        resize: vertical;
        box-sizing: border-box;
        margin-bottom: 0.8rem;
      }
      .warmup-textarea:focus {
        outline: none;
        border-color: #a855f7;
      }
      .warmup-feedback-card {
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(16, 185, 129, 0.35);
        border-radius: 12px;
        padding: 1.25rem;
        margin-top: 1rem;
      }
      .feedback-score-badge {
        display: inline-block;
        background: linear-gradient(135deg, #10b981, #059669);
        color: #fff;
        font-weight: 800;
        font-size: 1.1rem;
        padding: 0.3rem 0.8rem;
        border-radius: 8px;
        margin-bottom: 0.8rem;
      }
      .confidence-boost-box {
        background: rgba(245, 158, 11, 0.1);
        border-left: 3px solid #f59e0b;
        padding: 0.8rem 1rem;
        border-radius: 0 8px 8px 0;
        margin-top: 0.8rem;
        font-weight: 600;
        color: #fef3c7;
        font-size: 0.9rem;
      }
    </style>

    <script>
      function parseInterviewScheduledDate(str) {
        if (!str) return null;
        const s = String(str).trim();
        const months = {
          ocak: 0, subat: 1, şubat: 1, mart: 2, nisan: 3, mayis: 4, mayıs: 4, haziran: 5,
          temmuz: 6, agustos: 7, ağustos: 7, eylul: 8, eylül: 8, ekim: 9, kasim: 10, kasım: 10, aralik: 11, aralık: 11
        };
        // Format: "3 Ekim 2026, 20:00" or "3 Ekim 2026 20:00"
        let match = s.match(/(\d{1,2})\s+([a-zA-ZçğıöşüÇĞİÖŞÜ]+)\s+(\d{4})[,\s]+(\d{1,2})[:.](\d{2})/i);
        if (match) {
          const day = parseInt(match[1], 10);
          const mName = match[2].toLowerCase();
          const month = months[mName] !== undefined ? months[mName] : 9;
          const year = parseInt(match[3], 10);
          const hours = parseInt(match[4], 10);
          const minutes = parseInt(match[5], 10);
          return new Date(Date.UTC(year, month, day, hours - 3, minutes, 0));
        }
        // Format: "10.08.2026 - 20:00" or "10/08/2026 20:00"
        match = s.match(/(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{4}).*?(\d{1,2})[:.](\d{2})/);
        if (match) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const year = parseInt(match[3], 10);
          const hours = parseInt(match[4], 10);
          const minutes = parseInt(match[5], 10);
          return new Date(Date.UTC(year, month, day, hours - 3, minutes, 0));
        }
        // Format: "2026-08-10 20:00"
        match = s.match(/(\d{4})[\.\/\-](\d{1,2})[\.\/\-](\d{1,2}).*?(\d{1,2})[:.](\d{2})/);
        if (match) {
          const year = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const day = parseInt(match[3], 10);
          const hours = parseInt(match[4], 10);
          const minutes = parseInt(match[5], 10);
          return new Date(Date.UTC(year, month, day, hours - 3, minutes, 0));
        }
        const d = new Date(s);
        if (!isNaN(d.getTime())) return d;
        return null;
      }

      function initInterviewCountdown() {
        const box = document.getElementById('interview-countdown-box');
        if (!box) return;
        const scheduledStr = box.dataset.scheduledTime;
        const targetDate = parseInterviewScheduledDate(scheduledStr);
        if (!targetDate) return;

        const elDays = document.getElementById('cd-days');
        const elHours = document.getElementById('cd-hours');
        const elMins = document.getElementById('cd-mins');
        const elSecs = document.getElementById('cd-secs');
        const hypePanel = document.getElementById('hype-panel');
        const hypeIcon = document.getElementById('hype-icon');
        const hypeTitle = document.getElementById('hype-title');
        const hypeDesc = document.getElementById('hype-desc');

        function updateClock() {
          const now = new Date();
          const diffMs = targetDate.getTime() - now.getTime();

          if (diffMs <= 0) {
            if (elDays) elDays.textContent = '00';
            if (elHours) elHours.textContent = '00';
            if (elMins) elMins.textContent = '00';
            if (elSecs) elSecs.textContent = '00';

            box.className = 'interview-countdown-card pulse-urgent';
            if (hypePanel) hypePanel.className = 'hype-status-panel hype-1m';
            if (hypeIcon) hypeIcon.textContent = '🔴';
            if (hypeTitle) hypeTitle.textContent = 'CANLI MÜLAKAT DEVAM EDİYOR!';
            if (hypeDesc) hypeDesc.textContent = 'Mülakat saatiniz geldi! Lütfen Discord ses kanalında veya Roblox oyun sunucusunda yerinizi alınız.';
            return;
          }

          const totalSecs = Math.floor(diffMs / 1000);
          const days = Math.floor(totalSecs / 86400);
          const hours = Math.floor((totalSecs % 86400) / 3600);
          const mins = Math.floor((totalSecs % 3600) / 60);
          const secs = totalSecs % 60;
          const diffMin = Math.floor(diffMs / 60000);

          if (elDays) elDays.textContent = String(days).padStart(2, '0');
          if (elHours) elHours.textContent = String(hours).padStart(2, '0');
          if (elMins) elMins.textContent = String(mins).padStart(2, '0');
          if (elSecs) elSecs.textContent = String(secs).padStart(2, '0');

          // Excitement & Alert Levels
          if (diffMin <= 1) {
            box.className = 'interview-countdown-card pulse-urgent';
            if (hypePanel) hypePanel.className = 'hype-status-panel hype-1m';
            if (hypeIcon) hypeIcon.textContent = '🚨';
            if (hypeTitle) hypeTitle.textContent = 'SON 60 SANİYE! Kapılar Açılıyor!';
            if (hypeDesc) hypeDesc.textContent = 'Mülakat heyeti odaya giriş yaptı! Lütfen ses kanalında veya Roblox oyununda yerinizi alın!';
          } else if (diffMin <= 2) {
            box.className = 'interview-countdown-card pulse-warning';
            if (hypePanel) hypePanel.className = 'hype-status-panel hype-2m';
            if (hypeIcon) hypeIcon.textContent = '🔥';
            if (hypeTitle) hypeTitle.textContent = 'SON 2 DAKİKA! Bekleme Odasına Geçiniz!';
            if (hypeDesc) hypeDesc.textContent = 'Görüşme kapıları aralanıyor! Bağlantınız ve mikrofonunuz hazır olsun, heyecan dorukta!';
          } else if (diffMin <= 5) {
            box.className = 'interview-countdown-card';
            if (hypePanel) hypePanel.className = 'hype-status-panel hype-5m';
            if (hypeIcon) hypeIcon.textContent = '⚡';
            if (hypeTitle) hypeTitle.textContent = 'HEYECAN DORUKTA — Son 5 Dakika!';
            if (hypeDesc) hypeDesc.textContent = 'Mülakat yetkilileri dosyanızı masaya aldı. Odaklanın, derin bir nefes alın ve hazır olun!';
          } else if (diffMin <= 10) {
            box.className = 'interview-countdown-card';
            if (hypePanel) hypePanel.className = 'hype-status-panel hype-15m';
            if (hypeIcon) hypeIcon.textContent = '🎙️';
            if (hypeTitle) hypeTitle.textContent = 'Ses ve Donanım Kontrolü (Son 10 Dakika)';
            if (hypeDesc) hypeDesc.textContent = 'Mikrofonunuzu test edin, arka plan gürültüsünü izole edin ve son hazırlıklarınızı tamamlayın.';
          } else if (diffMin <= 15) {
            box.className = 'interview-countdown-card';
            if (hypePanel) hypePanel.className = 'hype-status-panel hype-15m';
            if (hypeIcon) hypeIcon.textContent = '⏱️';
            if (hypeTitle) hypeTitle.textContent = 'Mülakat Odanız Hazırlanıyor (Son 15 Dakika)';
            if (hypeDesc) hypeDesc.textContent = 'Görüşme salonunuz ve yetkili heyetiniz rezerve edildi, geri sayım sürüyor.';
          } else {
            box.className = 'interview-countdown-card';
            if (hypePanel) hypePanel.className = 'hype-status-panel';
            if (hypeIcon) hypeIcon.textContent = '⏱️';
            if (hypeTitle) hypeTitle.textContent = 'Mülakat Hazırlığı Başladı';
            if (hypeDesc) hypeDesc.textContent = 'Görüşme saatinize geri sayım devam ediyor. Lütfen belirtilen saatte Discord üzerinde hazır bulununuz.';
          }
        }

        updateClock();
        setInterval(updateClock, 1000);
      }

      async function startAiWarmup(reference) {
        const content = document.getElementById('ai-warmup-content');
        if (!content) return;
        content.textContent = '🤖 Yapay zeka koçunuz pozisyonunuza özel senaryo üretiyor…';

        try {
          const res = await fetch('/api/applications/' + encodeURIComponent(reference) + '/ai-warmup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
          const json = await res.json();
          if (!res.ok || !json.data) throw new Error(json.error || 'Simülasyon başlatılamadı.');

          const data = json.data;
          content.replaceChildren();

          const box = document.createElement('div');
          box.className = 'warmup-box';

          const title = document.createElement('div');
          title.className = 'warmup-scenario-title';
          title.textContent = '📌 KRİZ / VAKA SENARYOSU:';

          const text = document.createElement('p');
          text.className = 'warmup-scenario-text';
          text.textContent = data.scenarioQuestion || 'Senaryo sorusu yüklendi.';

          const area = document.createElement('textarea');
          area.className = 'warmup-textarea';
          area.id = 'warmup-answer-input';
          area.placeholder = 'Bu kriz durumunda ne yapardınız? Yanıtınızı buraya yazıp yapay zekadan anında tüyo ve puan alın…';

          const submitBtn = document.createElement('button');
          submitBtn.type = 'button';
          submitBtn.className = 'btn btn-ai-warmup';
          submitBtn.textContent = '✦ Yanıtımı Analiz Et & Puanla';
          submitBtn.onclick = function() {
            submitAiWarmupAnswer(reference, area.value);
          };

          box.append(title, text, area, submitBtn);
          content.append(box);
        } catch (err) {
          content.textContent = 'Bağlantı hatası: ' + err.message;
        }
      }

      async function submitAiWarmupAnswer(reference, answer) {
        const content = document.getElementById('ai-warmup-content');
        if (!content) return;
        const textVal = (answer || '').trim();
        if (!textVal) {
          alert('Lütfen önce bir deneme cevabı yazınız.');
          return;
        }

        const loadingNote = document.createElement('p');
        loadingNote.textContent = '🤖 Yapay zeka cevabınızı analiz ediyor ve canlı mülakat tüyoları hazırlıyor…';
        content.append(loadingNote);

        try {
          const res = await fetch('/api/applications/' + encodeURIComponent(reference) + '/ai-warmup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer: textVal })
          });
          const json = await res.json();
          if (!res.ok || !json.data) throw new Error(json.error || 'Değerlendirme alınamadı.');

          loadingNote.remove();
          const fb = json.data;

          const card = document.createElement('div');
          card.className = 'warmup-feedback-card';

          const scoreBadge = document.createElement('div');
          scoreBadge.className = 'feedback-score-badge';
          scoreBadge.textContent = '🌟 Simülasyon Puanı: ' + (fb.score || 85) + ' / 100';

          const fbText = document.createElement('p');
          fbText.style.color = '#e2e8f0';
          fbText.style.lineHeight = '1.5';
          fbText.textContent = fb.feedback || '';

          const boost = document.createElement('div');
          boost.className = 'confidence-boost-box';
          boost.textContent = fb.confidenceBoost || 'Canlı mülakatta başarılar!';

          const retryBtn = document.createElement('button');
          retryBtn.type = 'button';
          retryBtn.className = 'btn';
          retryBtn.style.background = 'rgba(255,255,255,0.08)';
          retryBtn.style.color = '#fff';
          retryBtn.style.marginTop = '1rem';
          retryBtn.textContent = '🔄 Başka Bir Senaryo Sorusunu Dene';
          retryBtn.onclick = function() {
            startAiWarmup(reference);
          };

          card.append(scoreBadge, fbText, boost, retryBtn);
          content.append(card);
        } catch (err) {
          loadingNote.textContent = 'Değerlendirme hatası: ' + err.message;
        }
      }

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
          window.location.reload();
        } catch (err) {
          alert('Bağlantı hatası: ' + err.message);
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Görüşmeye Hazırım';
          }
        }
      }

      document.addEventListener('DOMContentLoaded', () => {
        initInterviewCountdown();
      });
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
