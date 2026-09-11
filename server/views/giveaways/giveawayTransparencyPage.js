// server/views/giveaways/giveawayTransparencyPage.js
const { giveawayLayout } = require('./giveawayLayout');

function renderGiveawayTransparencyPage({ user, completedGiveaways = [], auditLogs = [], notificationCount = 0 }) {
  const content = `
    <!-- Top Hero Banner -->
    <div style="background: radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.2) 0%, rgba(15, 23, 42, 0.95) 75%); border-bottom: 1px solid var(--gw-border); padding: 3rem 1.5rem 2.5rem; text-align: center;">
      <div style="max-width: 800px; margin: 0 auto;">
        <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); padding: 0.4rem 1rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 800; color: #38bdf8; margin-bottom: 1.25rem;">
          🛡️ GÜVENİLİR VE ADİL
        </div>
        <h1 style="font-size: clamp(2rem, 4.5vw, 3rem); font-weight: 900; margin: 0 0 1rem; color: #fff;">
          Çekiliş <span style="background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Şeffaflığı & Güvenlik</span>
        </h1>
        <p style="font-size: 1.05rem; color: var(--gw-text-muted); margin: 0 auto; max-width: 650px; line-height: 1.6;">
          Eko Yıldız platformunda gerçekleşen tüm çekilişler %100 tarafsız, kriptografik rastgele seçim algoritmaları ve hile korumalı veritabanı logları ile korunur.
        </p>
      </div>
    </div>

    <div class="gw-container" style="padding-top: 2.5rem; max-width: 1000px;">
      
      <!-- Core Principles Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
        <div class="gw-card" style="padding: 1.5rem;">
          <div style="font-size: 2rem; margin-bottom: 0.75rem;">🔐</div>
          <h3 style="font-size: 1.15rem; font-weight: 800; margin: 0 0 0.5rem; color: #fff;">Kriptografik CSPRNG Algoritması</h3>
          <p style="font-size: 0.9rem; color: var(--gw-text-muted); line-height: 1.6; margin: 0;">
            Kazanan seçimleri Node.js <code>crypto.randomBytes</code> tabanlı kriptografik rastgele sayı üreteci (CSPRNG) ile yapılır. Tahmin edilemez ve dış müdahaleye tamamen kapalıdır.
          </p>
        </div>

        <div class="gw-card" style="padding: 1.5rem;">
          <div style="font-size: 2rem; margin-bottom: 0.75rem;">🎟️</div>
          <h3 style="font-size: 1.15rem; font-weight: 800; margin: 0 0 0.5rem; color: #fff;">Ağırlıklı Bilet (Ticket) Havuzu</h3>
          <p style="font-size: 0.9rem; color: var(--gw-text-muted); line-height: 1.6; margin: 0;">
            Kullanıcının kazandığı her bilet, çekiliş torbasına eklenen ayrı bir hak demektir. 5 bileti olan bir üye, 1 bileti olan üyeye kıyasla 5 kat daha yüksek matematiksel şansa sahiptir.
          </p>
        </div>

        <div class="gw-card" style="padding: 1.5rem;">
          <div style="font-size: 2rem; margin-bottom: 0.75rem;">🛡️</div>
          <h3 style="font-size: 1.15rem; font-weight: 800; margin: 0 0 0.5rem; color: #fff;">Anti-Abuse & Bot Koruması</h3>
          <p style="font-size: 0.9rem; color: var(--gw-text-muted); line-height: 1.6; margin: 0;">
            Çoklu hesap, geçici e-postalar, spam davet bağlantıları ve aynı IP/cihazdan yapılan şüpheli katılımlar tespit edilip havuzdan izole edilir.
          </p>
        </div>
      </div>

      <!-- Completed Giveaways Transparency Table -->
      <div class="gw-card" style="padding: 1.75rem; margin-bottom: 3rem;">
        <h2 style="font-size: 1.35rem; font-weight: 900; margin: 0 0 1.25rem; color: #fff;">
          📊 Tamamlanan Çekilişlerin İstatistiksel Kayıtları
        </h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 1px solid var(--gw-border); color: var(--gw-text-muted); font-size: 0.8rem; text-transform: uppercase;">
                <th style="padding: 0.75rem 0.5rem;">Çekiliş Adı</th>
                <th style="padding: 0.75rem 0.5rem;">Ödül</th>
                <th style="padding: 0.75rem 0.5rem;">Geçerli Katılımcı</th>
                <th style="padding: 0.75rem 0.5rem;">Toplam Bilet</th>
                <th style="padding: 0.75rem 0.5rem;">Kazanan Sayısı</th>
                <th style="padding: 0.75rem 0.5rem;">Sonuçlanma Tarihi</th>
              </tr>
            </thead>
            <tbody>
              ${completedGiveaways && completedGiveaways.length > 0 ? completedGiveaways.map(g => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <td style="padding: 0.85rem 0.5rem; font-weight: 700; color: #fff;">${g.title}</td>
                  <td style="padding: 0.85rem 0.5rem; color: #38bdf8;">${g.prize}</td>
                  <td style="padding: 0.85rem 0.5rem;">👥 ${(g.totalEntries || 0).toLocaleString('tr-TR')}</td>
                  <td style="padding: 0.85rem 0.5rem; color: #a855f7; font-weight: 700;">🎟️ ${(g.totalTickets || 0).toLocaleString('tr-TR')}</td>
                  <td style="padding: 0.85rem 0.5rem;">🏆 ${g.winnerCount || 1}</td>
                  <td style="padding: 0.85rem 0.5rem; color: var(--gw-text-muted);">${new Date(g.endDate).toLocaleDateString('tr-TR')}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="6" style="padding: 2rem; text-align: center; color: var(--gw-text-muted);">
                    Henüz tamamlanan çekiliş kaydı bulunmamaktadır.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Public Audit Trails -->
      <div class="gw-card" style="padding: 1.75rem; margin-bottom: 3rem;">
        <h2 style="font-size: 1.35rem; font-weight: 900; margin: 0 0 0.5rem; color: #fff;">
          📝 Çekiliş Süreç & Denetim (Audit) Kayıtları
        </h2>
        <p style="font-size: 0.85rem; color: var(--gw-text-muted); margin: 0 0 1.25rem;">
          Tüm çekiliş sonuçlandırma ve bilet işlemleri sisteme kalıcı olarak mühürlenir. Yeniden çekiliş yapılsa dahi önceki seçimler silinmez, loglara eklenir.
        </p>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${auditLogs && auditLogs.length > 0 ? auditLogs.map(log => `
            <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--gw-border); border-radius: 0.5rem; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; font-size: 0.85rem;">
              <div>
                <span style="font-weight: 800; color: #38bdf8;">[${log.action}]</span>
                <span style="color: #fff; margin-left: 0.5rem;">${log.details ? JSON.stringify(log.details) : 'İşlem kaydı'}</span>
              </div>
              <div style="color: var(--gw-text-muted); font-size: 0.8rem;">
                ${new Date(log.timestamp).toLocaleString('tr-TR')}
              </div>
            </div>
          `).join('') : `
            <div style="color: var(--gw-text-muted); font-size: 0.85rem; text-align: center; padding: 1rem;">
              Sistem yeni başlatıldı, ilk çekiliş sonuçlanmasıyla birlikte denetim kayıtları burada listelenecektir.
            </div>
          `}
        </div>
      </div>

    </div>
  `;

  return giveawayLayout({
    title: 'Şeffaflık & Güvenlik — Eko Yıldız Çekiliş Platformu',
    description: 'Eko Yıldız çekilişlerinin kriptografik tarafsızlığı, denetim kayıtları ve şeffaflık raporu.',
    content,
    user,
    activeTab: 'transparency',
    notificationCount
  });
}

module.exports = { renderGiveawayTransparencyPage };
