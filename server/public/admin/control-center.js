/**
 * EkoYıldız Admin Control Center — Core Client Controller
 * Handles workspace switching, snapshot loading, command palette, and safe action confirmation.
 */
(function () {
  'use strict';

  const shell = document.querySelector('[data-admin-shell]');
  if (!shell) return;

  // ── 1. Hash Routing & Workspace Navigation ────────────────────────────────
  const aliases = {
    stats: 'overview',
    'adm-stats': 'overview',
    'adm-users': 'users',
    'adm-bans': 'bans',
    'adm-submissions': 'submissions',
    'adm-coins': 'coins',
    'adm-forms': 'forms',
    'adm-automation': 'automation',
    'adm-group-logs': 'group-logs',
    'adm-operations': 'operations',
    'adm-staff': 'staff',
    'adm-tickets': 'tickets',
    'adm-content': 'content',
    'adm-system': 'system',
  };

  function normalize(value) {
    const clean = String(value || '').replace(/^#/, '');
    if (aliases[clean]) return aliases[clean];
    const stripped = clean.replace(/^adm-/, '');
    return aliases[stripped] || (stripped || 'overview');
  }

  function activate(name, writeHash = true) {
    const target = normalize(name);

    // Toggle workspaces
    const workspaces = document.querySelectorAll('[data-admin-workspace]');
    workspaces.forEach(node => {
      const match = node.dataset.adminWorkspace === target;
      node.hidden = !match;
      node.style.display = match ? '' : 'none';
    });

    // Toggle navigation highlights
    const navButtons = document.querySelectorAll('[data-admin-nav]');
    navButtons.forEach(button => {
      const match = button.dataset.adminNav === target;
      button.setAttribute('aria-current', match ? 'page' : 'false');
    });

    // Close mobile drawer on item selection
    shell.dataset.sidebarOpen = 'false';

    if (writeHash) {
      const hashId = target === 'overview' ? 'stats' : target;
      history.replaceState(null, '', `#adm-${hashId}`);
    }
  }

  // Bind nav clicks
  document.querySelectorAll('[data-admin-nav]').forEach(button => {
    button.addEventListener('click', () => activate(button.dataset.adminNav, true));
  });

  // Mobile sidebar toggle and close
  const sidebarToggle = document.querySelector('[data-admin-sidebar-toggle]');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      shell.dataset.sidebarOpen = shell.dataset.sidebarOpen === 'true' ? 'false' : 'true';
    });
  }

  const sidebarClose = document.querySelector('[data-admin-sidebar-close]');
  if (sidebarClose) {
    sidebarClose.addEventListener('click', () => {
      shell.dataset.sidebarOpen = 'false';
    });
  }

  window.addEventListener('hashchange', () => activate(location.hash, false));

  // ── 2. Notification Helper ────────────────────────────────────────────────
  function setGlobalNotice(message, tone = 'info') {
    const existing = document.getElementById('acc-toast-notice');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'acc-toast-notice';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.zIndex = '99999';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '12px';
    toast.style.boxShadow = '0 12px 36px rgba(0,0,0,0.5)';
    toast.style.fontSize = '0.9rem';
    toast.style.fontWeight = '500';
    toast.style.backdropFilter = 'blur(16px)';
    toast.style.transition = 'all 0.25s ease';

    if (tone === 'error') {
      toast.style.background = 'rgba(239, 68, 68, 0.9)';
      toast.style.color = '#fff';
      toast.style.border = '1px solid rgba(255,255,255,0.2)';
    } else if (tone === 'success') {
      toast.style.background = 'rgba(16, 185, 129, 0.9)';
      toast.style.color = '#fff';
      toast.style.border = '1px solid rgba(255,255,255,0.2)';
    } else {
      toast.style.background = 'rgba(30, 41, 59, 0.9)';
      toast.style.color = '#f1f5f9';
      toast.style.border = '1px solid rgba(255,255,255,0.1)';
    }

    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // ── 3. State Management for Sections ──────────────────────────────────────
  function setAdminSectionState(element, state, message) {
    if (!element) return;
    element.dataset.state = state;
    element.textContent = message;
  }

  // ── 4. Snapshot Loader & Safe DOM Rendering ───────────────────────────────
  let isFetchingSnapshot = false;

  async function loadAdminSnapshot() {
    if (isFetchingSnapshot) return;
    const refreshBtn = document.querySelector('[data-admin-refresh]');
    if (refreshBtn) refreshBtn.disabled = true;
    isFetchingSnapshot = true;

    try {
      const response = await fetch('/api/admin/control-center', {
        headers: { Accept: 'application/json' },
      });

      if (response.status === 401 || response.status === 403) {
        setGlobalNotice('Yönetici oturumun sona erdi. Yeniden giriş yapmalısın.', 'error');
        return;
      }

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Kontrol merkezi verileri alınamadı.');
      }

      renderAdminSnapshot(data);
    } catch (error) {
      console.error('[AdminControlCenter] snapshot fetch error:', error);
      document.querySelectorAll('.acc-state').forEach(node => {
        setAdminSectionState(node, 'error', 'Bu bölüm şu anda yüklenemedi.');
      });
    } finally {
      isFetchingSnapshot = false;
      if (refreshBtn) refreshBtn.disabled = false;
    }
  }

  function renderAdminSnapshot(data) {
    // 4.1 Update Metric Counters safely using textContent
    if (data.summary && typeof data.summary === 'object') {
      const metricMap = {
        activeUsers24h: data.summary.activeUsers24h,
        liveUsersNow: data.summary.liveUsersNow,
        openTickets: data.summary.openTickets,
        pendingSubmissions: data.summary.pendingSubmissions,
        activeBans: data.summary.activeBans,
        activeStaff: data.summary.activeStaff,
      };

      for (const [key, val] of Object.entries(metricMap)) {
        const metricEl = document.querySelector(`[data-admin-metric="${key}"] .acc-metric-val`);
        if (metricEl) {
          metricEl.textContent = val === null || val === undefined ? 'Veri alınamadı' : String(val);
        }
      }
    }

    // 4.2 Render Queue Items safely
    const queueContainer = document.querySelector('[data-admin-queue]');
    const queueBadge = document.querySelector('[data-queue-count]');
    if (queueContainer) {
      queueContainer.replaceChildren();
      const items = Array.isArray(data.queue) ? data.queue : [];
      if (queueBadge) queueBadge.textContent = String(items.length);

      if (items.length === 0) {
        setAdminSectionState(queueContainer, 'empty', 'Bekleyen operasyon işlemi bulunmuyor.');
      } else {
        const ul = document.createElement('ul');
        ul.className = 'acc-item-list';

        items.forEach(item => {
          const li = document.createElement('li');
          li.className = 'acc-list-item';

          const main = document.createElement('div');
          main.className = 'acc-item-main';

          const icon = document.createElement('span');
          icon.textContent = item.type === 'ticket' ? '🎫' : '📥';
          main.appendChild(icon);

          const title = document.createElement('a');
          title.className = 'acc-item-title';
          title.textContent = item.title;
          title.href = item.href || '#';
          title.style.color = '#e2e8f0';
          title.style.textDecoration = 'none';
          main.appendChild(title);

          const meta = document.createElement('span');
          meta.className = 'acc-item-meta';
          if (item.createdAt) {
            const date = new Date(item.createdAt);
            meta.textContent = isNaN(date.getTime()) ? '' : date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
          }
          li.appendChild(main);
          li.appendChild(meta);
          ul.appendChild(li);
        });
        queueContainer.appendChild(ul);
        queueContainer.removeAttribute('data-state');
      }
    }

    // 4.3 Render Live Users safely
    const liveContainer = document.querySelector('[data-admin-live-users]');
    const liveContainerFull = document.querySelector('[data-admin-live-users-full]');
    const liveBadge = document.querySelector('[data-live-count]');
    const liveList = Array.isArray(data.liveUsers) ? data.liveUsers : [];

    if (liveBadge) liveBadge.textContent = String(liveList.length);

    [liveContainer, liveContainerFull].forEach(container => {
      if (!container) return;
      container.replaceChildren();

      if (liveList.length === 0) {
        setAdminSectionState(container, 'empty', 'Şu anda sitede aktif kullanıcı bulunmuyor.');
      } else {
        const ul = document.createElement('ul');
        ul.className = 'acc-item-list';

        liveList.slice(0, container === liveContainer ? 8 : 40).forEach(u => {
          const li = document.createElement('li');
          li.className = 'acc-list-item';

          const main = document.createElement('div');
          main.className = 'acc-item-main';

          const avatar = document.createElement('span');
          avatar.textContent = '👤';
          main.appendChild(avatar);

          const name = document.createElement('strong');
          name.className = 'acc-item-title';
          name.textContent = u.username;
          main.appendChild(name);

          const path = document.createElement('span');
          path.className = 'acc-item-meta';
          path.textContent = u.url || '/';

          li.appendChild(main);
          li.appendChild(path);
          ul.appendChild(li);
        });

        container.appendChild(ul);
        container.removeAttribute('data-state');
      }
    });

    // 4.4 Render Service Telemetry safely
    const servicesContainer = document.querySelector('[data-admin-services]');
    if (servicesContainer) {
      servicesContainer.replaceChildren();
      const services = Array.isArray(data.services) ? data.services : [];

      if (services.length === 0) {
        setAdminSectionState(servicesContainer, 'empty', 'Servis telemetrisi bulunmuyor.');
      } else {
        const ul = document.createElement('ul');
        ul.className = 'acc-item-list';

        services.forEach(svc => {
          const li = document.createElement('li');
          li.className = 'acc-service-item';

          const name = document.createElement('span');
          name.style.color = '#e2e8f0';
          name.style.fontWeight = '500';
          name.textContent = svc.name;

          const tag = document.createElement('span');
          tag.className = 'acc-status-tag';
          tag.dataset.status = svc.status || 'unknown';
          tag.textContent = svc.statusLabel || svc.status || 'Bilinmiyor';

          li.appendChild(name);
          li.appendChild(tag);
          ul.appendChild(li);
        });

        servicesContainer.appendChild(ul);
        servicesContainer.removeAttribute('data-state');
      }
    }

    // 4.5 Render Recent Actions safely
    const recentContainer = document.querySelector('[data-admin-recent-actions]');
    if (recentContainer) {
      recentContainer.replaceChildren();
      const actions = Array.isArray(data.recentActions) ? data.recentActions : [];

      if (actions.length === 0) {
        setAdminSectionState(recentContainer, 'empty', 'Kayıtlı son işlem bulunmuyor.');
      } else {
        const ul = document.createElement('ul');
        ul.className = 'acc-item-list';

        actions.slice(0, 8).forEach(act => {
          const li = document.createElement('li');
          li.className = 'acc-list-item';

          const label = document.createElement('span');
          label.className = 'acc-item-title';
          label.textContent = `${act.type}: ${act.discordId}`;

          const meta = document.createElement('span');
          meta.className = 'acc-item-meta';
          if (act.timestamp) {
            const date = new Date(act.timestamp);
            meta.textContent = isNaN(date.getTime()) ? '' : date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
          }

          li.appendChild(label);
          li.appendChild(meta);
          ul.appendChild(li);
        });

        recentContainer.appendChild(ul);
        recentContainer.removeAttribute('data-state');
      }
    }
  }

  // Bind refresh button
  document.querySelector('[data-admin-refresh]')?.addEventListener('click', loadAdminSnapshot);

  // ── 5. Command Palette ────────────────────────────────────────────────────
  const commandDialog = document.querySelector('[data-admin-command-dialog]');
  const commandInput = document.querySelector('[data-admin-command-input]');
  const commandResults = document.querySelector('[data-admin-command-results]');

  const commandCatalog = [
    { id: 'overview', label: 'Genel Bakış', keywords: 'dashboard istatistik ozet ana sayfa', target: 'overview' },
    { id: 'operations', label: 'Canlı Operasyon', keywords: 'canli online realtime trafik users', target: 'operations' },
    { id: 'users', label: 'Kullanıcı Yönetimi', keywords: 'kullanici ara ban yetki rol ara search', target: 'users', action: 'focus_user_search' },
    { id: 'staff', label: 'Personel & Kadro', keywords: 'personel yetkili staff kadro terfi', target: 'staff' },
    { id: 'bans', label: 'Banlar ve Güvenlik', keywords: 'yasak ban ceza guvenlik log', target: 'bans' },
    { id: 'coins', label: 'Ekonomi ve Coin İşlemleri', keywords: 'para coin ekonomi bakiye transfer', target: 'coins' },
    { id: 'tickets', label: 'Destek Biletleri (Tickets)', keywords: 'ticket destek talep yardim bilet', target: 'tickets' },
    { id: 'submissions', label: 'Doldurulan Başvuru Formları', keywords: 'basvuru form aday mulakat', target: 'submissions' },
    { id: 'forms', label: 'Panel Formları Yapılandırma', keywords: 'form yapilandirma ayar basvuru', target: 'forms' },
    { id: 'automation', label: 'Otomasyon ve Görevler', keywords: 'otomasyon cron bot gorev', target: 'automation' },
    { id: 'group-logs', label: 'Grup Değişiklikleri & Rollback', keywords: 'roblox grup log geri al rollback rütbe', target: 'group-logs' },
    { id: 'content', label: 'İçerik ve Topluluk Merkezi', keywords: 'cekilis blog video reklam ortaklik bio linkler', target: 'content' },
    { id: 'system', label: 'Sistem ve Audit Masası', keywords: 'status debug ayarlar settings roblox grup', target: 'system' },
  ];

  let selectedCommandIndex = 0;

  function openCommandPalette() {
    if (!commandDialog) return;
    commandDialog.hidden = false;
    if (commandInput) {
      commandInput.value = '';
      commandInput.focus();
    }
    renderCommandResults('');
  }

  function closeCommandPalette() {
    if (!commandDialog) return;
    commandDialog.hidden = true;
  }

  function renderCommandResults(query) {
    if (!commandResults) return;
    commandResults.replaceChildren();

    const q = String(query || '').trim().toLowerCase();
    const matches = commandCatalog.filter(item => {
      if (!q) return true;
      return item.label.toLowerCase().includes(q) || item.keywords.toLowerCase().includes(q);
    });

    selectedCommandIndex = 0;

    if (matches.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'acc-state';
      empty.textContent = 'Eşleşen komut bulunamadı.';
      commandResults.appendChild(empty);
      return;
    }

    matches.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'acc-cmd-item';
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', index === selectedCommandIndex ? 'true' : 'false');

      const label = document.createElement('span');
      label.textContent = item.label;

      const badge = document.createElement('span');
      badge.className = 'acc-badge';
      badge.textContent = 'Git';

      row.appendChild(label);
      row.appendChild(badge);

      row.addEventListener('click', () => executeCommand(item));
      commandResults.appendChild(row);
    });
  }

  function executeCommand(cmd) {
    closeCommandPalette();
    if (cmd.target) {
      activate(cmd.target, true);
    }
    if (cmd.action === 'focus_user_search') {
      setTimeout(() => {
        const searchInput = document.getElementById('admin-search') || document.querySelector('input[placeholder*="Kullanıcı"]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select?.();
        }
      }, 100);
    }
  }

  // Trigger button
  document.querySelectorAll('[data-admin-command-trigger]').forEach(btn => {
    btn.addEventListener('click', openCommandPalette);
  });

  // Close triggers
  document.querySelectorAll('[data-admin-command-close]').forEach(btn => {
    btn.addEventListener('click', closeCommandPalette);
  });

  if (commandDialog) {
    commandDialog.addEventListener('click', (e) => {
      if (e.target === commandDialog) closeCommandPalette();
    });
  }

  // Keyboard shortcut Ctrl/Cmd + K
  window.addEventListener('keydown', (e) => {
    const isModifier = e.ctrlKey || e.metaKey;
    if (isModifier && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (commandDialog && !commandDialog.hidden) {
        closeCommandPalette();
      } else {
        openCommandPalette();
      }
    } else if (e.key === 'Escape') {
      closeCommandPalette();
    }
  });

  // Filter input typing and navigation
  if (commandInput) {
    commandInput.addEventListener('input', (e) => {
      renderCommandResults(e.target.value);
    });

    commandInput.addEventListener('keydown', (e) => {
      const items = commandResults ? commandResults.querySelectorAll('.acc-cmd-item') : [];
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedCommandIndex = (selectedCommandIndex + 1) % items.length;
        items.forEach((it, idx) => it.setAttribute('aria-selected', idx === selectedCommandIndex ? 'true' : 'false'));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedCommandIndex = (selectedCommandIndex - 1 + items.length) % items.length;
        items.forEach((it, idx) => it.setAttribute('aria-selected', idx === selectedCommandIndex ? 'true' : 'false'));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedEl = items[selectedCommandIndex];
        if (selectedEl) selectedEl.click();
      }
    });
  }

  // ── 6. Reusable Destructive Action Confirmation ───────────────────────────
  function confirmAdminAction({ title, summary, tone = 'danger', execute }) {
    const dialog = document.querySelector('[data-admin-confirm-dialog]');
    if (!dialog) {
      // Fallback
      if (window.confirm(`${title}\n\n${summary}`)) {
        return execute();
      }
      return Promise.resolve(false);
    }

    const titleEl = dialog.querySelector('[data-admin-confirm-title]');
    const summaryEl = dialog.querySelector('[data-admin-confirm-summary]');
    const submitBtn = dialog.querySelector('[data-admin-confirm-submit]');
    const cancelBtn = dialog.querySelector('[data-admin-confirm-cancel]');

    if (titleEl) titleEl.textContent = title;
    if (summaryEl) summaryEl.textContent = summary;
    dialog.dataset.tone = tone;

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    return new Promise(resolve => {
      const cleanup = () => {
        if (typeof dialog.close === 'function') {
          dialog.close();
        } else {
          dialog.removeAttribute('open');
        }
      };

      if (cancelBtn) {
        cancelBtn.onclick = () => {
          cleanup();
          resolve(false);
        };
      }

      if (submitBtn) {
        submitBtn.onclick = async () => {
          submitBtn.disabled = true;
          try {
            await execute();
            cleanup();
            resolve(true);
          } catch (err) {
            setGlobalNotice(err.message || 'İşlem tamamlanamadı.', 'error');
            resolve(false);
          } finally {
            submitBtn.disabled = false;
          }
        };
      }
    });
  }

  // Export to window for admin action functions
  window.confirmAdminAction = confirmAdminAction;
  window.setGlobalNotice = setGlobalNotice;

  // ── 7. Automatic Polling (every 30s when tab is visible) ──────────────────
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      loadAdminSnapshot();
    }
  }, 30000);

  // Initial setup
  activate(location.hash || 'overview', false);
  loadAdminSnapshot();
})();
