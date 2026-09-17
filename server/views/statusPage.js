'use strict';

const services = [
  ['🌐', 'Web sitesi', 'Ana sayfa, Help, Safety, blog ve kullanıcı paneli'],
  ['🔐', 'Authentication', 'Oturum, Discord OAuth ve hesap doğrulama akışları'],
  ['🤖', 'Discord Bot', 'Komutlar, otomasyonlar ve topluluk etkileşimleri'],
  ['🎫', 'Ticket sistemi', 'Web talepleri, Discord teslimi ve destek kayıtları'],
  ['🛡️', 'Moderasyon', 'Topluluk güvenliği ve personel araçları'],
  ['🔌', 'API', 'Web ve bot servisleri arasındaki veri uç noktaları'],
];

function renderStatusPage(user = null, _layout) {
  const serviceCards = services.map(([icon, name, description]) => `<article class="status-service"><div class="status-service-icon" aria-hidden="true">${icon}</div><div><h2>${name}</h2><p>${description}</p></div><span class="status-unknown">İzleme bağlı değil</span></article>`).join('');
  const content = `<style>
    .status-wrap{max-width:1040px;margin:0 auto}.status-hero{padding:48px 0 34px;border-bottom:1px solid var(--border)}.status-eyebrow{font-size:.72rem;letter-spacing:.13em;font-weight:800;color:#fda4af}.status-hero h1{font-size:clamp(2.5rem,6vw,5rem);line-height:1;letter-spacing:-.065em;margin:14px 0 18px}.status-hero p{max-width:680px;color:var(--muted);font-size:1.04rem;line-height:1.65}.status-notice{display:grid;grid-template-columns:auto 1fr;gap:16px;margin:28px 0;padding:20px;border:1px solid rgba(251,191,36,.3);border-radius:14px;background:rgba(251,191,36,.07)}.status-notice b{display:block;color:#fcd34d;margin-bottom:5px}.status-notice p{margin:0;color:var(--muted);line-height:1.5;font-size:.88rem}.status-list{display:grid;gap:10px;margin:28px 0}.status-service{display:grid;grid-template-columns:44px 1fr auto;gap:14px;align-items:center;padding:18px;border:1px solid var(--border);border-radius:13px;background:#101014}.status-service-icon{width:44px;height:44px;display:grid;place-items:center;border-radius:11px;background:rgba(255,255,255,.04)}.status-service h2{font-size:1rem;margin:0 0 4px}.status-service p{color:var(--muted);font-size:.82rem;margin:0;line-height:1.4}.status-unknown{padding:7px 9px;border:1px solid rgba(251,191,36,.25);border-radius:999px;color:#fcd34d;font-size:.72rem;font-weight:800}.status-empty{margin:36px 0;padding:26px;border:1px dashed rgba(255,255,255,.16);border-radius:14px;text-align:center}.status-empty h2{font-size:1.12rem;margin:0 0 7px}.status-empty p{max-width:600px;margin:0 auto;color:var(--muted);line-height:1.55}.status-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:18px}.status-actions a{padding:9px 12px;border:1px solid var(--border);border-radius:8px;color:#fff;text-decoration:none;font-size:.8rem;font-weight:750}@media(max-width:680px){.status-service{grid-template-columns:44px 1fr}.status-unknown{grid-column:1/-1;width:max-content}}
  </style><div class="status-wrap"><section class="status-hero"><div class="status-eyebrow">EKOYILDIZ SERVİSLERİ</div><h1>Durum bilgisi, tahmin değil.</h1><p>Servislerimizi burada listeliyoruz. Ancak doğrulanmış bir heartbeat veya harici monitoring kaynağı bağlanana kadar sistemlerin çalıştığını varsayan yeşil durumlar ve hayali uptime değerleri yayımlamıyoruz.</p></section><aside class="status-notice"><span aria-hidden="true">🟡</span><div><b>Canlı izleme bağlı değil</b><p>Şu anda bu sayfaya doğrulanmış bir durum verisi yok. Aşağıdaki etiketler servis sağlığını değil, monitoring bağlantısının durumunu gösterir.</p></div></aside><section class="status-list" aria-label="EkoYıldız servisleri">${serviceCards}</section><section class="status-empty"><h2>Henüz yayımlanmış olay geçmişi yok</h2><p>Gerçek bir incident veya bakım kaydı bağlandığında tarih, etkilenen servis ve çözüm zaman çizelgesi burada gösterilecek.</p><div class="status-actions"><a href="/help">Help Center</a><a href="/tickets/new">Sorun bildir</a><a href="/blog">Güncellemeler</a></div></section></div>`;
  return _layout('Sistem Durumu', user, content, '', '/status');
}

module.exports = { renderStatusPage, services };
