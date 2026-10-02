'use strict';

/**
 * Modern, calm, staged Connection Recovery and Maintenance system.
 * Designed to reassure users during temporary network or server sync interruptions.
 */

function connectionRecoveryStyles() {
  return `
    /* ── EkoYıldız Connection Recovery System Styles ── */
    :root {
      --cr-bg: #090a11;
      --cr-card-bg: rgba(17, 20, 31, 0.94);
      --cr-border: rgba(255, 255, 255, 0.1);
      --cr-border-hover: rgba(167, 139, 250, 0.4);
      --cr-text: #f8fafc;
      --cr-muted: #94a3b8;
      --cr-accent: #7165e7;
      --cr-accent-light: #a5b4fc;
      --cr-amber: #f59e0b;
      --cr-emerald: #10b981;
      --cr-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
    }

    @media (prefers-color-scheme: light) {
      :root:not(.dark) {
        --cr-bg: #f8fafc;
        --cr-card-bg: rgba(255, 255, 255, 0.96);
        --cr-border: rgba(0, 0, 0, 0.1);
        --cr-border-hover: rgba(113, 101, 231, 0.4);
        --cr-text: #0f172a;
        --cr-muted: #64748b;
        --cr-shadow: 0 20px 50px rgba(0, 0, 0, 0.12);
      }
    }

    #crRecoveryRoot {
      position: fixed;
      inset: 0;
      z-index: 999999;
      pointer-events: none;
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: var(--cr-text);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: background-color 0.4s ease;
    }

    #crRecoveryRoot.active-backdrop {
      background-color: rgba(6, 8, 14, 0.72);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      pointer-events: auto;
    }

    /* ── 1) STAGE 1: Minimal Floating Banner (0 - 3s) ── */
    #crStatusBanner {
      position: fixed;
      top: 18px;
      left: 50%;
      transform: translateX(-50%) translateY(-100px);
      background: var(--cr-card-bg);
      border: 1px solid var(--cr-border);
      border-radius: 999px;
      padding: 8px 18px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.86rem;
      font-weight: 500;
      pointer-events: auto;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
      opacity: 0;
      z-index: 1000000;
    }

    #crStatusBanner.visible {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    .cr-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--cr-amber);
      box-shadow: 0 0 10px var(--cr-amber);
      animation: crPulse 1.6s infinite ease-in-out;
      flex-shrink: 0;
    }

    .cr-dot.recovered {
      background: var(--cr-emerald);
      box-shadow: 0 0 10px var(--cr-emerald);
      animation: none;
    }

    @keyframes crPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.35; transform: scale(0.85); }
    }

    .cr-banner-pill {
      font-size: 0.76rem;
      background: rgba(245, 158, 11, 0.12);
      color: var(--cr-amber);
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    /* ── 2) STAGE 2: Compact Reconnect Panel (3 - 10s) ── */
    #crReconnectPanel {
      display: none;
      background: var(--cr-card-bg);
      border: 1px solid var(--cr-border);
      border-radius: 18px;
      padding: 24px 28px;
      width: min(440px, calc(100vw - 32px));
      text-align: center;
      box-shadow: var(--cr-shadow);
      pointer-events: auto;
      animation: crFadeUp 0.3s ease-out;
    }

    #crReconnectPanel.visible {
      display: block;
    }

    .cr-panel-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 6px;
      letter-spacing: -0.01em;
    }

    .cr-panel-desc {
      font-size: 0.9rem;
      color: var(--cr-muted);
      line-height: 1.5;
      margin-bottom: 18px;
    }

    .cr-inline-loader {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: var(--cr-accent-light);
      font-weight: 500;
    }

    .cr-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(165, 180, 252, 0.25);
      border-top-color: var(--cr-accent-light);
      border-radius: 50%;
      animation: crSpin 0.75s linear infinite;
    }

    @keyframes crSpin {
      to { transform: rotate(360deg); }
    }

    @keyframes crFadeUp {
      from { opacity: 0; transform: translateY(14px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* ── 3) STAGE 3: Full Recovery Screen & Game (10s+) ── */
    #crRecoveryScreen {
      display: none;
      background: var(--cr-card-bg);
      border: 1px solid var(--cr-border);
      border-radius: 24px;
      padding: 32px 30px;
      width: min(540px, calc(100vw - 32px));
      text-align: center;
      box-shadow: var(--cr-shadow);
      pointer-events: auto;
      max-height: 92vh;
      overflow-y: auto;
      overscroll-behavior: contain;
      animation: crFadeUp 0.35s ease-out;
    }

    #crRecoveryScreen.visible {
      display: block;
    }

    .cr-header-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: rgba(113, 101, 231, 0.12);
      border: 1px solid rgba(113, 101, 231, 0.25);
      color: var(--cr-accent-light);
      padding: 5px 14px;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      margin-bottom: 14px;
    }

    .cr-screen-title {
      font-size: 1.45rem;
      font-weight: 800;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
      color: var(--cr-text);
    }

    .cr-screen-desc {
      font-size: 0.92rem;
      color: var(--cr-muted);
      line-height: 1.55;
      margin-bottom: 22px;
    }

    /* Reconnection notification pill on screen */
    .cr-reconnect-notice {
      display: none;
      background: rgba(16, 185, 129, 0.14);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34d399;
      padding: 8px 16px;
      border-radius: 12px;
      font-size: 0.88rem;
      font-weight: 600;
      margin-bottom: 18px;
      align-items: center;
      justify-content: center;
      gap: 8px;
      animation: crFadeUp 0.25s ease-out;
    }
    .cr-reconnect-notice.visible {
      display: flex;
    }

    /* Actions */
    .cr-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
      margin-bottom: 22px;
    }

    .cr-btn {
      appearance: none;
      border: 1px solid transparent;
      border-radius: 12px;
      padding: 10px 20px;
      font-size: 0.88rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-decoration: none;
      transition: all 0.2s ease;
      color: var(--cr-text);
    }

    .cr-btn:focus-visible {
      outline: 2px solid var(--cr-accent);
      outline-offset: 2px;
    }

    .cr-btn-primary {
      background: var(--cr-accent);
      color: #fff;
      box-shadow: 0 4px 14px rgba(113, 101, 231, 0.35);
    }
    .cr-btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(113, 101, 231, 0.5);
      filter: brightness(1.08);
    }
    .cr-btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .cr-btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--cr-border);
      color: var(--cr-muted);
    }
    .cr-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--cr-text);
    }

    /* ── Mini Runner Game Section ── */
    .cr-game-box {
      background: rgba(0, 0, 0, 0.28);
      border: 1px solid var(--cr-border);
      border-radius: 16px;
      padding: 14px;
      text-align: left;
      position: relative;
    }

    .cr-game-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding: 0 4px;
    }

    .cr-game-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--cr-muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .cr-score-display {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--cr-accent-light);
      display: flex;
      gap: 12px;
    }

    .cr-canvas-wrap {
      position: relative;
      width: 100%;
      height: 130px;
      background: #05070c;
      border-radius: 10px;
      overflow: hidden;
      cursor: pointer;
      user-select: none;
      touch-action: manipulation;
    }

    #crGameCanvas {
      width: 100%;
      height: 100%;
      display: block;
    }

    .cr-game-overlay {
      position: absolute;
      inset: 0;
      background: rgba(5, 7, 12, 0.72);
      backdrop-filter: blur(2px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #fff;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .cr-game-overlay.hidden {
      display: none;
    }

    .cr-key-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 2px 7px;
      border-radius: 6px;
      color: var(--cr-accent-light);
    }

    .cr-footer-note {
      margin-top: 14px;
      font-size: 0.78rem;
      color: var(--cr-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    /* Accessibility / reduced motion */
    @media (prefers-reduced-motion: reduce) {
      #crStatusBanner, #crReconnectPanel, #crRecoveryScreen, .cr-dot {
        animation: none !important;
        transition: none !important;
      }
    }
  `;
}

function renderConnectionRecoveryMarkup() {
  return `
    <div id="crRecoveryRoot" aria-live="polite">
      <!-- Stage 1: Floating Status Banner (0-3s) -->
      <div id="crStatusBanner" role="status" aria-atomic="true">
        <span class="cr-dot" id="crBannerDot"></span>
        <span id="crBannerText">Bağlantı yenileniyor…</span>
        <span class="cr-banner-pill">İşleminiz korunuyor</span>
      </div>

      <!-- Stage 2: Reconnect Panel (3-10s) -->
      <div id="crReconnectPanel" role="alert">
        <div style="font-size: 1.8rem; margin-bottom: 10px;">⚡</div>
        <h3 class="cr-panel-title">Kısa bir bağlantı sorunu oluştu</h3>
        <p class="cr-panel-desc">
          Bazı servisler yeniden bağlanıyor. İşleminiz korunuyor, sayfayı kapatmanıza gerek yok.
        </p>
        <div class="cr-inline-loader">
          <div class="cr-spinner"></div>
          <span id="crPanelStatus">Tekrar bağlanılıyor…</span>
        </div>
      </div>

      <!-- Stage 3: Full Recovery Screen with Dino Runner (10s+) -->
      <div id="crRecoveryScreen" role="dialog" aria-modal="true" aria-labelledby="crScreenTitle">
        <div class="cr-header-badge">
          <span class="cr-dot" id="crScreenDot"></span>
          <span>Sistem Yeniden Senkronize Oluyor</span>
        </div>

        <h2 class="cr-screen-title" id="crScreenTitle">Bağlantı beklenenden uzun sürüyor</h2>
        <p class="cr-screen-desc">
          Servisleri yeniden bağlamaya devam ediyoruz. İsterseniz tekrar deneyebilir ya da beklerken küçük oyunu oynayabilirsiniz.
        </p>

        <!-- Recovery notice when connection is back -->
        <div class="cr-reconnect-notice" id="crRecoveredNotice">
          <span>✅</span>
          <span>Bağlantı yeniden kuruldu — devam edebilirsiniz!</span>
        </div>

        <div class="cr-actions">
          <button type="button" class="cr-btn cr-btn-primary" id="crBtnRetry">
            <span id="crRetryIcon">🔄</span>
            <span id="crRetryText">Tekrar Dene</span>
          </button>
          <a href="/" class="cr-btn cr-btn-secondary">
            🏠 Ana Sayfa
          </a>
          <a href="/tickets/new?category=technical" class="cr-btn cr-btn-secondary" id="crBtnSupport">
            💬 Destek Talebi
          </a>
        </div>

        <!-- Mini Runner Game -->
        <div class="cr-game-box">
          <div class="cr-game-header">
            <span class="cr-game-label">
              🎮 Beklerken küçük bir oyun oynayabilirsiniz
            </span>
            <div class="cr-score-display">
              <span>SKOR: <b id="crGameScore">0000</b></span>
              <span>EN İYİ: <b id="crGameBest">0000</b></span>
            </div>
          </div>

          <div class="cr-canvas-wrap" id="crGameWrap" tabindex="0" role="application" aria-label="EkoYıldız Mini Zıplama Oyunu">
            <canvas id="crGameCanvas" width="480" height="130"></canvas>
            <div class="cr-game-overlay" id="crGameOverlay">
              <span id="crOverlayTitle">▶️ Başlamak için Zıpla</span>
              <span style="font-size: 0.78rem; color: var(--cr-muted);">
                <kbd class="cr-key-pill">Space</kbd> veya <kbd class="cr-key-pill">Tıkla / Dokun</kbd>
              </span>
            </div>
          </div>
        </div>

        <div class="cr-footer-note">
          <span>🔒 Form ve metin taslaklarınız tarayıcınızda güvence altındadır.</span>
        </div>
      </div>
    </div>
  `;
}

function connectionRecoveryScript() {
  return `
    (function() {
      // Avoid duplicate initialization
      if (window.__ekoyildizRecoveryInitialized) return;
      window.__ekoyildizRecoveryInitialized = true;

      // DOM Elements
      var root = document.getElementById('crRecoveryRoot');
      var banner = document.getElementById('crStatusBanner');
      var bannerText = document.getElementById('crBannerText');
      var bannerDot = document.getElementById('crBannerDot');
      var panel = document.getElementById('crReconnectPanel');
      var screen = document.getElementById('crRecoveryScreen');
      var recoveredNotice = document.getElementById('crRecoveredNotice');
      var btnRetry = document.getElementById('crBtnRetry');
      var retryText = document.getElementById('crRetryText');
      var retryIcon = document.getElementById('crRetryIcon');

      // State
      var isOffline = false;
      var failStartTime = 0;
      var stageTimer = null;
      var healthCheckInterval = null;
      var retryCooldown = 0;
      var currentStage = 'idle'; // idle | short | medium | long | recovered

      // ── 1. Draft Preservation (Text inputs & textareas) ──
      var DRAFT_PREFIX = 'ekoyildiz_draft_';
      function saveDraft(target) {
        if (!target || !target.name) return;
        var type = (target.type || '').toLowerCase();
        if (type === 'password' || type === 'file' || type === 'hidden' || target.name.includes('cvv') || target.name.includes('card')) return;
        try {
          var key = DRAFT_PREFIX + window.location.pathname + '_' + target.name;
          sessionStorage.setItem(key, target.value);
        } catch (_) {}
      }

      function restoreDrafts() {
        try {
          var prefix = DRAFT_PREFIX + window.location.pathname + '_';
          document.querySelectorAll('input[type="text"], input[type="email"], textarea').forEach(function(el) {
            if (el.value || !el.name) return;
            var saved = sessionStorage.getItem(prefix + el.name);
            if (saved !== null && saved !== undefined) {
              el.value = saved;
            }
          });
        } catch (_) {}
      }

      document.addEventListener('input', function(e) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
          saveDraft(e.target);
        }
      }, { passive: true });

      // Clean draft upon successful form submission
      document.addEventListener('submit', function(e) {
        try {
          var prefix = DRAFT_PREFIX + window.location.pathname + '_';
          Object.keys(sessionStorage).forEach(function(k) {
            if (k.indexOf(prefix) === 0) sessionStorage.removeItem(k);
          });
        } catch (_) {}
      });

      // ── 2. Staged Display Manager ──
      function showStage(stage) {
        currentStage = stage;

        if (stage === 'idle') {
          root.classList.remove('active-backdrop');
          banner.classList.remove('visible');
          panel.classList.remove('visible');
          screen.classList.remove('visible');
          return;
        }

        if (stage === 'short') {
          // 0-3s: Floating subtle banner only
          root.classList.remove('active-backdrop');
          panel.classList.remove('visible');
          screen.classList.remove('visible');
          bannerText.textContent = 'Bağlantı yenileniyor…';
          bannerDot.className = 'cr-dot';
          banner.classList.add('visible');
          return;
        }

        if (stage === 'medium') {
          // 3-10s: Soft centered panel
          banner.classList.remove('visible');
          screen.classList.remove('visible');
          root.classList.add('active-backdrop');
          panel.classList.add('visible');
          return;
        }

        if (stage === 'long') {
          // 10s+: Full screen with mini game
          banner.classList.remove('visible');
          panel.classList.remove('visible');
          root.classList.add('active-backdrop');
          screen.classList.add('visible');
          initGameIfNeeded();
          return;
        }

        if (stage === 'recovered') {
          bannerDot.className = 'cr-dot recovered';
          bannerText.textContent = 'Bağlantı yeniden kuruldu!';
          recoveredNotice.classList.add('visible');

          setTimeout(function() {
            showStage('idle');
            restoreDrafts();
          }, 2400);
        }
      }

      function handleConnectionIssue() {
        if (isOffline) return;
        isOffline = true;
        failStartTime = Date.now();

        // Stage 1 immediately
        showStage('short');

        // Stage 2 at 3 seconds
        clearTimeout(stageTimer);
        stageTimer = setTimeout(function() {
          if (!isOffline) return;
          showStage('medium');

          // Stage 3 at 10 seconds
          stageTimer = setTimeout(function() {
            if (!isOffline) return;
            showStage('long');
          }, 7000);
        }, 3000);

        startHealthProbes();
      }

      function handleConnectionRestored() {
        if (!isOffline) return;
        isOffline = false;
        clearTimeout(stageTimer);
        stopHealthProbes();
        showStage('recovered');
      }

      // ── 3. Health Probes (Exponential backoff) ──
      var backoffDelay = 2000;
      function probeHealth() {
        fetch('/api/health?_t=' + Date.now(), { method: 'GET', cache: 'no-store' })
          .then(function(res) {
            if (res.status === 200 || res.status === 304) {
              handleConnectionRestored();
              backoffDelay = 2000;
            } else {
              scheduleNextProbe();
            }
          })
          .catch(function() {
            scheduleNextProbe();
          });
      }

      function scheduleNextProbe() {
        if (!isOffline) return;
        backoffDelay = Math.min(10000, backoffDelay * 1.35) + Math.random() * 400;
        clearTimeout(healthCheckInterval);
        healthCheckInterval = setTimeout(probeHealth, backoffDelay);
      }

      function startHealthProbes() {
        stopHealthProbes();
        backoffDelay = 2000;
        probeHealth();
      }

      function stopHealthProbes() {
        clearTimeout(healthCheckInterval);
      }

      // Online/Offline Browser Listeners
      window.addEventListener('offline', function() {
        handleConnectionIssue();
      });

      window.addEventListener('online', function() {
        probeHealth();
      });

      // Intercept Global Fetch & XHR errors
      var origFetch = window.fetch;
      if (origFetch) {
        window.fetch = function() {
          return origFetch.apply(this, arguments).catch(function(err) {
            // Check if network error
            if (!navigator.onLine || err.name === 'TypeError' || (err.message && err.message.toLowerCase().includes('failed to fetch'))) {
              handleConnectionIssue();
            }
            throw err;
          });
        };
      }

      // ── 4. Retry Button Handler (with cooldown) ──
      if (btnRetry) {
        btnRetry.addEventListener('click', function() {
          if (retryCooldown > 0) return;

          btnRetry.disabled = true;
          retryIcon.textContent = '⏳';
          retryText.textContent = 'Bağlanılıyor…';

          probeHealth();

          retryCooldown = 5;
          var cdTimer = setInterval(function() {
            retryCooldown--;
            if (retryCooldown <= 0) {
              clearInterval(cdTimer);
              btnRetry.disabled = false;
              retryIcon.textContent = '🔄';
              retryText.textContent = 'Tekrar Dene';
            } else {
              retryText.textContent = 'Bekleyin (' + retryCooldown + 's)';
            }
          }, 1000);
        });
      }

      // Restore drafts on startup
      restoreDrafts();

      // Expose manual test trigger for developers or debug
      window.__ekoyildizTriggerRecovery = function(durationMs) {
        handleConnectionIssue();
        if (durationMs) {
          setTimeout(handleConnectionRestored, durationMs);
        }
      };

      // ── 5. EkoYıldız Mini Runner Game (Chrome Dino inspired) ──
      var gameInitialized = false;
      function initGameIfNeeded() {
        if (gameInitialized) return;
        gameInitialized = true;

        var canvas = document.getElementById('crGameCanvas');
        var wrap = document.getElementById('crGameWrap');
        var overlay = document.getElementById('crGameOverlay');
        var overlayTitle = document.getElementById('crOverlayTitle');
        var scoreEl = document.getElementById('crGameScore');
        var bestEl = document.getElementById('crGameBest');
        if (!canvas) return;

        var ctx = canvas.getContext('2d');
        var bestScore = 0;
        try {
          bestScore = parseInt(localStorage.getItem('ekoyildiz_runner_best') || '0', 10) || 0;
          bestEl.textContent = String(bestScore).padStart(4, '0');
        } catch (_) {}

        var state = 'ready'; // ready | running | dead
        var score = 0;
        var gameSpeed = 3.6;
        var gravity = 0.58;
        var groundY = 110;

        // Player (Cute stylized Star / Bot)
        var player = {
          x: 42,
          y: groundY - 24,
          w: 22,
          h: 22,
          vy: 0,
          isGrounded: true,
          jump: function() {
            if (this.isGrounded) {
              this.vy = -9.2;
              this.isGrounded = false;
            }
          },
          update: function() {
            this.vy += gravity;
            this.y += this.vy;
            if (this.y >= groundY - this.h) {
              this.y = groundY - this.h;
              this.vy = 0;
              this.isGrounded = true;
            }
          },
          draw: function() {
            // Draw Star / Diamond Character
            ctx.save();
            ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
            if (!this.isGrounded) {
              ctx.rotate(this.vy * 0.05);
            }

            // Glow body
            ctx.fillStyle = '#a5b4fc';
            ctx.beginPath();
            var r = this.w / 2;
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = '#7165e7';
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
            ctx.fill();

            // Eye / Visor
            ctx.fillStyle = '#fff';
            ctx.fillRect(r * 0.1, -3, 5, 4);

            ctx.restore();
          }
        };

        // Obstacles
        var obstacles = [];
        var spawnTimer = 0;

        function spawnObstacle() {
          var h = 18 + Math.floor(Math.random() * 16);
          var w = 14 + Math.floor(Math.random() * 8);
          obstacles.push({
            x: canvas.width + 10,
            y: groundY - h,
            w: w,
            h: h
          });
        }

        // Ground particles
        var groundOffset = 0;

        function resetGame() {
          score = 0;
          gameSpeed = 3.6;
          obstacles = [];
          spawnTimer = 0;
          player.y = groundY - player.h;
          player.vy = 0;
          player.isGrounded = true;
          state = 'running';
          overlay.classList.add('hidden');
        }

        function triggerAction() {
          if (state === 'ready' || state === 'dead') {
            resetGame();
          } else if (state === 'running') {
            player.jump();
          }
        }

        // Controls
        window.addEventListener('keydown', function(e) {
          if (currentStage !== 'long') return;
          if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            triggerAction();
          }
        });

        wrap.addEventListener('pointerdown', function(e) {
          e.preventDefault();
          triggerAction();
        });

        // Game Loop
        var animId = null;
        function loop() {
          if (document.hidden) {
            animId = requestAnimationFrame(loop);
            return;
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw Ground Line
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, groundY);
          ctx.lineTo(canvas.width, groundY);
          ctx.stroke();

          // Ground dots moving
          if (state === 'running') {
            groundOffset = (groundOffset + gameSpeed) % 24;
          }
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          for (var gx = -groundOffset; gx < canvas.width; gx += 24) {
            ctx.fillRect(gx, groundY + 4, 8, 2);
          }

          if (state === 'running') {
            player.update();
            score++;
            scoreEl.textContent = String(score).padStart(4, '0');

            if (score > bestScore) {
              bestScore = score;
              bestEl.textContent = String(bestScore).padStart(4, '0');
              try { localStorage.setItem('ekoyildiz_runner_best', String(bestScore)); } catch(_) {}
            }

            // Gradually increase speed
            if (score % 250 === 0 && gameSpeed < 7.5) {
              gameSpeed += 0.25;
            }

            // Spawn obstacles
            spawnTimer++;
            if (spawnTimer > 65 + Math.random() * 50) {
              spawnObstacle();
              spawnTimer = 0;
            }

            // Update & check obstacles
            for (var i = obstacles.length - 1; i >= 0; i--) {
              var obs = obstacles[i];
              obs.x -= gameSpeed;

              // Draw Obstacle (Digital Crystal / Barrier)
              ctx.fillStyle = '#f59e0b';
              ctx.beginPath();
              ctx.moveTo(obs.x + obs.w / 2, obs.y);
              ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
              ctx.lineTo(obs.x, obs.y + obs.h);
              ctx.closePath();
              ctx.fill();

              // Collision check
              var pad = 4;
              if (
                player.x + pad < obs.x + obs.w &&
                player.x + player.w - pad > obs.x &&
                player.y + pad < obs.y + obs.h &&
                player.y + player.h - pad > obs.y
              ) {
                state = 'dead';
                overlayTitle.textContent = '💥 Tekrar Oyna';
                overlay.classList.remove('hidden');
              }

              if (obs.x + obs.w < -10) {
                obstacles.splice(i, 1);
              }
            }
          }

          player.draw();

          animId = requestAnimationFrame(loop);
        }

        animId = requestAnimationFrame(loop);
      }
    })();
  `;
}

module.exports = {
  connectionRecoveryStyles,
  renderConnectionRecoveryMarkup,
  connectionRecoveryScript
};
