'use strict';

function renderStaffAcademyPage(user, algorithm = false) {
  const title = algorithm ? 'Personel Algoritmasını Anla' : 'EkoYıldız Personel Akademisi';
  const intro = algorithm
    ? 'Bu sistem personelleri gizlice cezalandırmak için değil, moderasyon kalitesini artırmak ve gelişim alanlarını görünür kılmak için kullanılır.'
    : 'Daha iyi moderasyon yapmayı, toplulukla doğru iletişim kurmayı ve EkoYıldız sistemlerini daha verimli kullanmayı öğren.';
  const cards = algorithm ? [
    ['🎫', 'Ticket çözme kalitesi', 'Hızlı kapatmak yerine kullanıcının sorusunu tamamen çözmeye, doğru rehbere yönlendirmeye ve anlaşılır not bırakmaya odaklan.'],
    ['⏱️', 'Yanıt ritmi', 'Ortalama cevap süresi önemlidir; yetişemediğinde ticketı üstlenmek yerine ekipten destek iste ve kullanıcıyı habersiz bırakma.'],
    ['🛡️', 'Moderasyon doğruluğu', 'Kanıtsız işlem yapma. Kararsız kaldığın warning, mute veya ban kararlarında üst personele danış.'],
    ['🤝', 'Topluluk katkısı', 'Yardımcı cevaplar, doğru raporlar, ekip içi iletişim ve güvenli yönlendirmeler gelişim puanına katkı sağlar.'],
    ['📣', 'Geri bildirim ve disiplin', 'Uyarılar gelişim alanını göstermek içindir. Tekrarlanan sorunları saklamak yerine çözüm planı oluştur.'],
    ['📈', 'Performansını artır', 'Ticketları düzenli takip et, kanıtları kaydet, Safety Center rehberlerini kullan ve haftalık olarak kendi işlemlerini gözden geçir.']
  ] : [
    ['🎫', 'Ticket yönetimi', 'İlk mesajı sakin ve net yaz, gerekli bilgileri iste, doğru dokümana bağla ve çözülmeden ticketı kapatma.'],
    ['💬', 'Kullanıcı iletişimi', 'Sinirli kullanıcıyı susturmaya değil, sorunu anlaşılır biçimde çözmeye odaklan. Samimi ol; gereksiz otorite gösterme.'],
    ['🛡️', 'Güvenlik', 'Phishing, sahte kanıt ve sosyal mühendislik işaretlerini tanı. Parola, token veya doğrulama kodu isteme.'],
    ['⚖️', 'Moderasyon', 'Ceza vermeden önce kuralı ve kanıtı kontrol et. Orantılı işlem uygula, belirsizlikte üst personele danış.'],
    ['🌱', 'Personel gelişimi', 'Düzenli aktiflik, kaliteli notlar, ekip çalışması ve geri bildirime açıklık terfi yolunu güçlendirir.'],
    ['🧭', 'Senaryo pratiği', 'Her vakada şu üç soruyu sor: Ne oldu, hangi kanıt var, kullanıcı için en adil sonraki adım ne?']
  ];
  const cardsHtml = cards.map(([icon, heading, text]) => `<article class="academy-card"><span>${icon}</span><h2>${heading}</h2><p>${text}</p></article>`).join('');
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — EkoYıldız</title><style>body{margin:0;background:#0f1016;color:#f7f7fb;font:16px Inter,system-ui,sans-serif}.wrap{width:min(1100px,calc(100% - 32px));margin:auto}.nav{padding:24px 0;display:flex;justify-content:space-between}.nav a{color:#bfc2d1;text-decoration:none}.hero{padding:70px 0 38px}.eyebrow{color:#a99cff;font-size:.75rem;font-weight:800;letter-spacing:.14em}.hero h1{font-size:clamp(2.5rem,6vw,5rem);line-height:1;letter-spacing:-.07em;max-width:760px;margin:14px 0}.hero p{max-width:720px;color:#bfc2d1;line-height:1.7;font-size:1.08rem}.notice{border:1px solid #363848;background:#171925;border-radius:16px;padding:18px 20px;color:#dfe1ea;margin:24px 0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:30px 0 70px}.academy-card{border:1px solid #2e3140;background:#151722;border-radius:16px;padding:22px;transition:transform .2s,border-color .2s}.academy-card:hover{transform:translateY(-3px);border-color:#8175ff}.academy-card span{font-size:1.5rem}.academy-card h2{font-size:1.15rem;margin:16px 0 8px}.academy-card p{color:#bfc2d1;line-height:1.65;margin:0}.back{display:inline-block;color:#b5adff;text-decoration:none;margin-top:12px}@media(max-width:760px){.grid{grid-template-columns:1fr}.hero{padding-top:42px}}</style></head><body><main class="wrap"><nav class="nav"><a href="/staff">← Mod Merkezi</a><a href="/yardim">Safety Center</a></nav><section class="hero"><div class="eyebrow">EKOYILDIZ PERSONEL GELİŞİMİ</div><h1>${title}</h1><p>${intro}</p><div class="notice">ⓘ Şeffaflık notu: Performans verileri gelişim konuşmaları için kullanılır; kullanıcı güvenliği ve ekip kalitesi her zaman hızdan önce gelir.</div></section><section class="grid">${cardsHtml}</section><a class="back" href="/staff">Mod Merkezine dön →</a></main></body></html>`;
}

module.exports = { renderStaffAcademyPage };
