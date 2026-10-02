(function () {
  'use strict';
  const root = document.querySelector('[data-admin-workspace="submissions"]');
  if (!root) return;
  const queue = root.querySelector('[data-application-queue]');
  const state = root.querySelector('[data-application-state]');
  const retry = root.querySelector('[data-application-retry]');
  const count = root.querySelector('[data-application-count]');
  const search = root.querySelector('[data-application-search]');
  const status = root.querySelector('[data-application-status]');
  const form = root.querySelector('[data-application-form]');
  const detailArticle = root.querySelector('[data-application-detail]');
  const emptyDetail = root.querySelector('[data-application-empty-detail]');
  const detailBody = root.querySelector('[data-application-detail-body]');
  let selectedId = null;
  let selectedDetail = null;
  let activeTab = 0;
  let requestSequence = 0;
  let debounceTimer;

  function element(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = String(value);
    return node;
  }

  function setState(name, message) {
    state.dataset.state = name;
    state.textContent = message;
    retry.hidden = name !== 'error';
  }

  async function request(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal, headers: { Accept: 'application/json', ...(options.headers || {}) } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'İstek tamamlanamadı.');
      return payload.data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Sunucu 12 saniye içinde yanıt vermedi.');
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  function formatDate(value) {
    if (!value) return 'Tarih yok';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Tarih yok' : new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  function renderQueue(items) {
    queue.replaceChildren();
    count.textContent = `${items.length} aday`;
    if (!items.length) {
      setState('empty', 'Bu filtrelerle eşleşen başvuru bulunamadı.');
      return;
    }
    setState('ready', 'Başvurular hazır.');
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const button = element('button', 'appops-card');
      button.type = 'button';
      button.dataset.applicationId = item.id;
      button.setAttribute('aria-current', item.id === selectedId ? 'true' : 'false');
      const avatar = element('span', 'appops-card-avatar', (item.candidate?.name || '?').slice(0, 1).toLocaleUpperCase('tr-TR'));
      const main = element('span', 'appops-card-main');
      main.append(element('strong', '', item.candidate?.name || 'Aday'), element('span', '', item.formTitle || item.formType || 'Başvuru'));
      const time = element('time', '', formatDate(item.updatedAt));
      button.append(avatar, main, time);
      button.addEventListener('click', () => selectApplication(item.id));
      fragment.append(button);
    });
    queue.append(fragment);
  }

  async function loadList() {
    const sequence = ++requestSequence;
    setState('loading', 'Başvurular yükleniyor…');
    const params = new URLSearchParams();
    if (search.value.trim()) params.set('search', search.value.trim());
    if (status.value) params.set('status', status.value);
    if (form.value) params.set('formType', form.value);
    try {
      const data = await request(`/api/admin/applications?${params.toString()}`);
      if (sequence !== requestSequence) return;
      renderQueue(data.items || []);
    } catch (error) {
      if (sequence !== requestSequence) return;
      setState('error', error.message);
    }
  }

  function answerValue(value) {
    if (value === null || value === undefined || value === '') return 'Yanıt verilmedi';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return Object.entries(value).map(([key, item]) => `${key}: ${answerValue(item)}`).join('\n');
    if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır';
    return String(value);
  }

  function infoBlock(title, rows) {
    const section = element('section', 'appops-section');
    section.append(element('h3', '', title));
    rows.forEach(([label, value]) => {
      const block = element('div', 'appops-answer');
      block.append(element('strong', '', label), element('p', '', answerValue(value)));
      section.append(block);
    });
    return section;
  }

  function renderDetailTab() {
    detailBody.replaceChildren();
    if (!selectedDetail) return;
    if (activeTab === 0) {
      detailBody.append(infoBlock('Aday özeti', [
        ['Durum', selectedDetail.status], ['Süreç aşaması', selectedDetail.stage], ['Form', selectedDetail.formTitle],
        ['Discord', selectedDetail.candidate?.discordId || 'Bağlı değil'], ['Gönderim', formatDate(selectedDetail.createdAt)], ['Son güncelleme', formatDate(selectedDetail.updatedAt)]
      ]));
    } else if (activeTab === 1) {
      const sections = selectedDetail.answers?.sections || [];
      if (!sections.length) detailBody.append(infoBlock('Form yanıtları', [['Durum', 'Bu başvuruda kayıtlı yanıt bulunamadı.']]));
      sections.forEach((section) => detailBody.append(infoBlock(section.title || 'Form bölümü', (section.answers || []).map((answer) => [answer.label, answer.value]))));
    } else if (activeTab === 2) {
      detailBody.append(infoBlock('Mülakat', [['Durum', selectedDetail.interview?.state], ['Planlanan saat', selectedDetail.interview?.scheduledTime], ['Saat onayı', selectedDetail.interview?.timeApproved], ['Oyun bağlantısı', selectedDetail.interview?.gameLink]]));
    } else if (activeTab === 3) {
      detailBody.append(infoBlock('İmza ve onay', selectedDetail.signature ? [['İmzalayan', selectedDetail.signature.signerName], ['İmzalanma', formatDate(selectedDetail.signature.signedAt)]] : [['Durum', 'Aday henüz dijital imza vermedi.']]));
    } else {
      const history = selectedDetail.operationHistory || [];
      detailBody.append(infoBlock('İşlem geçmişi', history.length ? history.map((item) => [item.action, `${item.actor?.name || 'Sistem'} · ${formatDate(item.createdAt)}`]) : [['Durum', 'Henüz yönetim işlemi yapılmadı.']]));
    }
  }

  async function selectApplication(id) {
    selectedId = id;
    const sequence = ++requestSequence;
    root.dataset.mobileDetail = 'true';
    try {
      const data = await request(`/api/admin/applications/${encodeURIComponent(id)}`);
      if (sequence !== requestSequence || selectedId !== id) return;
      selectedDetail = data;
      detailArticle.hidden = false;
      emptyDetail.hidden = true;
      root.querySelector('[data-application-avatar]').textContent = (data.candidate?.name || '?').slice(0, 1).toLocaleUpperCase('tr-TR');
      root.querySelector('[data-application-candidate]').textContent = data.candidate?.name || 'Aday';
      root.querySelector('[data-application-form-title]').textContent = data.formTitle || data.formType || 'Başvuru';
      root.querySelector('[data-application-meta]').textContent = `${data.candidate?.discordId || 'Discord yok'} · ${formatDate(data.createdAt)}`;
      root.querySelector('[data-application-detail-status]').textContent = data.status || 'PENDING';
      queue.querySelectorAll('[data-application-id]').forEach((node) => node.setAttribute('aria-current', node.dataset.applicationId === id ? 'true' : 'false'));
      renderDetailTab();
    } catch (error) {
      if (sequence === requestSequence) setState('error', error.message);
    }
  }

  function actionPayload(action) {
    if (action === 'ask-question') {
      const questionText = window.prompt('Adaya iletilecek soruyu yazın:');
      return questionText ? { questionText } : null;
    }
    if (action === 'schedule-interview') {
      const scheduledTime = window.prompt('Mülakat tarih ve saatini yazın:');
      return scheduledTime ? { scheduledTime } : null;
    }
    if (action === 'reject-interview') {
      const reason = window.prompt('Ret nedenini yazın:');
      return reason ? { reason } : null;
    }
    return {};
  }

  async function performAction(button) {
    if (!selectedId || button.disabled) return;
    const action = button.dataset.applicationAction;
    const payload = actionPayload(action);
    if (payload === null) return;
    const idempotencyKey = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    button.disabled = true;
    try {
      await request(`/api/admin/applications/${encodeURIComponent(selectedId)}/actions/${encodeURIComponent(action)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(payload)
      });
      await selectApplication(selectedId);
      await loadList();
      if (window.setGlobalNotice) window.setGlobalNotice('Başvuru işlemi kaydedildi.', 'success');
    } catch (error) {
      if (window.setGlobalNotice) window.setGlobalNotice(error.message, 'error');
    } finally {
      button.disabled = false;
    }
  }

  root.querySelectorAll('[data-application-tab]').forEach((button) => button.addEventListener('click', () => {
    activeTab = Number(button.dataset.applicationTab);
    root.querySelectorAll('[data-application-tab]').forEach((tab) => tab.setAttribute('aria-selected', tab === button ? 'true' : 'false'));
    renderDetailTab();
  }));
  root.querySelectorAll('[data-application-action]').forEach((button) => button.addEventListener('click', () => performAction(button)));
  root.querySelector('[data-application-back]').addEventListener('click', () => { root.dataset.mobileDetail = 'false'; });
  root.querySelector('[data-application-refresh]').addEventListener('click', loadList);
  retry.addEventListener('click', loadList);
  status.addEventListener('change', loadList);
  form.addEventListener('change', loadList);
  search.addEventListener('input', () => { clearTimeout(debounceTimer); debounceTimer = setTimeout(loadList, 280); });
  document.addEventListener('admin:workspace-activated', (event) => { if (event.detail?.workspace === 'submissions') loadList(); });
  if (location.hash.replace(/^#(?:adm-)?/, '') === 'submissions') loadList();
})();
