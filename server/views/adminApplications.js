'use strict';

function renderAdminApplicationsWorkspace() {
  const tabs = ['Özet', 'Form Yanıtları', 'Mülakat', 'İmza ve Onay', 'İşlem Geçmişi'];
  return `<section id="adm-submissions" class="acc-workspace-panel appops" data-admin-workspace="submissions" hidden>
    <header class="acc-page-head appops-head">
      <div><span class="acc-eyebrow">ADAY OPERASYONLARI</span><h1>Başvuru Merkezi</h1><p>Başvuruları tek kuyruktan inceleyin, görüşmeleri yönetin ve tüm karar geçmişini takip edin.</p></div>
      <button type="button" class="acc-btn acc-btn-refresh" data-application-refresh>Yenile</button>
    </header>
    <div class="appops-toolbar" aria-label="Başvuru filtreleri">
      <label class="appops-search"><span class="sr-only">Aday ara</span><input type="search" data-application-search placeholder="Aday, Discord ID veya form ara…" autocomplete="off"></label>
      <label><span class="sr-only">Durum</span><select data-application-status><option value="">Tüm durumlar</option><option value="PENDING">Bekliyor</option><option value="APPROVED">Onaylandı</option><option value="REJECTED">Reddedildi</option><option value="AI_DETECTED">İnceleme gerekli</option></select></label>
      <label><span class="sr-only">Form türü</span><select data-application-form><option value="">Tüm ekipler</option><option value="event_staff">Etkinlik ekibi</option><option value="developer">Geliştirici</option><option value="community_ambassador">Topluluk</option><option value="game_moderation">Oyun moderasyonu</option></select></label>
    </div>
    <div class="appops-layout">
      <aside class="appops-queue-panel" aria-label="Aday kuyruğu">
        <div class="appops-panel-title"><div><span>BAŞVURU KUYRUĞU</span><strong data-application-count>0 aday</strong></div><span class="appops-live">CANLI</span></div>
        <div class="appops-state" data-application-state data-state="idle" aria-live="polite">Başvurular açıldığında yüklenecek.</div>
        <button type="button" class="appops-retry" data-application-retry hidden>Tekrar dene</button>
        <div class="appops-queue" data-application-queue></div>
      </aside>
      <main class="appops-dossier" data-application-dossier>
        <button type="button" class="appops-back" data-application-back>← Başvuru kuyruğuna dön</button>
        <div class="appops-empty-detail" data-application-empty-detail><span>◎</span><h2>Bir aday seçin</h2><p>Form yanıtları, mülakat notları, imza ve işlem geçmişi burada görüntülenir.</p></div>
        <article data-application-detail hidden>
          <header class="appops-candidate-head"><div class="appops-avatar" data-application-avatar>?</div><div><span class="appops-kicker" data-application-form-title>BAŞVURU</span><h2 data-application-candidate>Aday</h2><p data-application-meta></p></div><span class="appops-status" data-application-detail-status></span></header>
          <nav class="appops-tabs" aria-label="Aday dosyası">${tabs.map((tab, index) => `<button type="button" data-application-tab="${index}" aria-selected="${index === 0}">${tab}</button>`).join('')}</nav>
          <div class="appops-detail-body" data-application-detail-body></div>
          <footer class="appops-actions" data-application-actions>
            <button type="button" data-application-action="start-review">İncelemeyi başlat</button>
            <button type="button" data-application-action="ask-question">Soru sor</button>
            <button type="button" data-application-action="invite-interview">Mülakata davet et</button>
            <button type="button" data-application-action="schedule-interview">Mülakat planla</button>
            <button type="button" data-application-action="accept-interview" class="is-positive">Adayı onayla</button>
            <button type="button" data-application-action="reject-interview" class="is-danger">Reddet</button>
          </footer>
        </article>
      </main>
    </div>
  </section>`;
}

function adminApplicationsAssets() {
  return '<link rel="stylesheet" href="/public/admin/applications.css">\n<script defer src="/public/admin/applications.js"></script>';
}

module.exports = { renderAdminApplicationsWorkspace, adminApplicationsAssets };
