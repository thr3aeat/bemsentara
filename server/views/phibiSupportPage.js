const TOPICS = {
  moderation: ['Moderasyon merkezi', 'Uyarı, susturma ve yasaklama işlemlerinin nasıl yürütüldüğünü öğrenin.'],
  warnings: ['Uyarılar nasıl çalışır?', 'Uyarılar, topluluk kurallarının ihlal edilmesi durumunda kayda alınır.'],
  bans: ['Yasaklama hakkında bilgi', 'Yasaklama kararları vaka kaydı ile birlikte değerlendirilir.'],
  reports: ['Raporlar nasıl değerlendirilir?', '1. Rapor alınır → 2. Kanıt incelenir → 3. Moderatör karar verir → 4. Gerekirse yaptırım uygulanır.'],
  safety: ['Hesap güvenliği', 'Şifrenizi paylaşmayın; sahte bağlantılara ve taklit hesaplara dikkat edin.'],
  appeals: ['İtiraz merkezi', 'Bir kararın yanlış olduğunu düşünüyorsanız vaka numaranızla itiraz başlatabilirsiniz.'],
  verification: ['Doğrulama rehberi', 'Doğrulama işlemleri yalnızca resmi EkoYıldız ve Phibi akışları üzerinden yapılır.']
};

function esc(v) { return String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

function renderPhibiSupportPage({ topic = 'moderation', query = {}, user = null }) {
  const [title, description] = TOPICS[topic] || TOPICS.moderation;
  const source = query.source === 'discord';
  const caseId = String(query.case || '').slice(0, 64);
  const caseBox = caseId ? `<div class="notice"><strong>${esc(caseId)}</strong> vakasıyla ilgili yardım alıyorsunuz. <a href="/cases?case=${encodeURIComponent(caseId)}">Vakayı sorgula →</a></div>` : '';
  const staff = user?.isAdmin || user?.isStaff;
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — EkoYıldız · Phibi</title><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet"><style>body{margin:0;background:#080912;color:#f5f3ff;font:16px Outfit,sans-serif}.wrap{max-width:940px;margin:auto;padding:28px 20px}.nav{display:flex;justify-content:space-between;align-items:center}.nav a{color:#d8b4fe;text-decoration:none}.brand{font-weight:800;color:#fff!important}.hero{padding:70px 0 30px}.kicker{color:#fb8ca2;font-size:.78rem;font-weight:800;letter-spacing:.1em}.hero h1{font-size:clamp(2.2rem,6vw,4rem);margin:10px 0}.hero p{color:#b4bad4;max-width:680px;font-size:1.05rem}.notice,.card{background:#131629;border:1px solid #292e4c;border-radius:16px;padding:18px;margin:16px 0}.notice{border-color:#7c3aed;color:#ddd6fe}.notice a,.actions a{color:#fff}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:28px 0}.card h2{font-size:1rem;margin:0 0 7px}.card p{color:#b4bad4;margin:0;line-height:1.6}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}.actions a{background:linear-gradient(135deg,#e11d48,#7c3aed);border-radius:11px;padding:11px 15px;text-decoration:none;font-weight:700}.actions a.alt{background:#22263d}.footer{color:#9198b5;font-size:.85rem;padding:28px 0}@media(max-width:680px){.grid{grid-template-columns:1fr}.hero{padding-top:42px}}</style></head><body><main class="wrap"><nav class="nav"><a href="/" class="brand">✦ EKOYILDIZ <span style="color:#a78bfa">· PHIBI</span></a><a href="/yardim">Yardım merkezi</a></nav><section class="hero"><div class="kicker">PHIBI DESTEK AKIŞI</div><h1>${esc(title)}</h1><p>${esc(description)}</p>${source ? '<div class="notice">Discord’daki Phibi komutundan geldiniz. İşleme ait açıklama ve sonraki adımlar burada.</div>' : ''}${caseBox}</section><section class="grid"><article class="card"><h2>Kuralları görüntüle</h2><p>İzin verilen ve yasak davranışları ayrıntılarıyla inceleyin.</p></article><article class="card"><h2>Karara itiraz et</h2><p>Vaka numaranızla itiraz sürecini başlatın.</p></article><article class="card"><h2>Yetkiliyle görüş</h2><p>DM yerine resmi destek kanalı ve ticket akışını kullanın.</p></article></section><div class="actions"><a href="/anayasasi">Kural merkezi</a><a class="alt" href="/cases${caseId ? '?case=' + encodeURIComponent(caseId) : ''}">Vaka sorgula</a>${staff ? '<a class="alt" href="/staff">Yetkili rehberi</a>' : ''}</div><footer class="footer">EkoYıldız topluluğu altında çalışan Phibi; Discord’daki hızlı işlemleri webdeki açıklama, takip ve itiraz sürecine bağlar.</footer></main></body></html>`;
}

module.exports = { renderPhibiSupportPage };
