// server/views/giveaways/giveawayWinnersPage.js
const { giveawayLayout } = require('./giveawayLayout');

function renderGiveawayWinnersPage({ user, winners = [], notificationCount = 0 }) {
  const content = `
    <!-- Top Hero Banner -->
    <div style="background: radial-gradient(circle at 50% 0%, rgba(234, 179, 8, 0.2) 0%, rgba(15, 23, 42, 0.95) 75%); border-bottom: 1px solid var(--gw-border); padding: 3rem 1.5rem 2.5rem; text-align: center;">
      <div style="max-width: 800px; margin: 0 auto;">
        <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.4); padding: 0.4rem 1rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 800; color: #fbbf24; margin-bottom: 1.25rem;">
          🏆 RESMİ KAZANANLAR KÜRSÜSÜ
        </div>
        <h1 style="font-size: clamp(2rem, 4.5vw, 3rem); font-weight: 900; margin: 0 0 1rem; color: #fff;">
          Eko Yıldız <span style="background: linear-gradient(135deg, #fbbf24, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Şanslı Kazananları</span>
        </h1>
        <p style="font-size: 1.05rem; color: var(--gw-text-muted); margin: 0 auto; max-width: 600px; line-height: 1.6;">
          Geçmiş çekilişlerimizde ödüllerine kavuşan topluluk üyelerimiz. Tüm kazananlar kriptografik rastgele çekiliş sistemiyle belirlenir ve kaydedilir.
        </p>
      </div>
    </div>

    <div class="gw-container" style="padding-top: 2.5rem; max-width: 1000px;">
      
      <!-- Stats highlight -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2.5rem;">
        <div class="gw-card" style="padding: 1.25rem; text-align: center;">
          <div style="font-size: 2rem; font-weight: 900; color: #fbbf24;">${winners.length}</div>
          <div style="font-size: 0.85rem; color: var(--gw-text-muted); font-weight: 700; text-transform: uppercase;">Toplam Kazanan</div>
        </div>
        <div class="gw-card" style="padding: 1.25rem; text-align: center;">
          <div style="font-size: 2rem; font-weight: 900; color: #22c55e;">%100</div>
          <div style="font-size: 0.85rem; color: var(--gw-text-muted); font-weight: 700; text-transform: uppercase;">Teslim Edilen Ödüller</div>
        </div>
        <div class="gw-card" style="padding: 1.25rem; text-align: center;">
          <div style="font-size: 2rem; font-weight: 900; color: #38bdf8;">0</div>
          <div style="font-size: 0.85rem; color: var(--gw-text-muted); font-weight: 700; text-transform: uppercase;">İptal / Şikayet</div>
        </div>
      </div>

      <!-- Winners List -->
      <div style="display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 3rem;">
        ${winners && winners.length > 0 ? winners.map((w, idx) => {
          const dateStr = w.selectedAt ? new Date(w.selectedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belirtilmedi';

          return `
            <div class="gw-card" style="padding: 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; border-left: 5px solid #fbbf24;">
              <div style="display: flex; align-items: center; gap: 1.25rem; flex: 1; min-width: 260px;">
                <div style="width: 52px; height: 52px; border-radius: 1rem; background: linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(245, 158, 11, 0.1)); border: 1px solid rgba(234, 179, 8, 0.4); display: flex; align-items: center; justify-content: center; font-size: 1.75rem;">
                  🏆
                </div>
                <div>
                  <div style="font-size: 0.8rem; font-weight: 700; color: #a855f7; text-transform: uppercase;">
                    ${w.giveawayTitle || 'Ödüllü Çekiliş'}
                  </div>
                  <div style="font-size: 1.2rem; font-weight: 900; color: #fff; margin: 0.2rem 0;">
                    🎁 Ödül: <span style="color: #38bdf8;">${w.prize || 'Özel Hediye'}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: var(--gw-text-muted); flex-wrap: wrap;">
                    <span>Kazanan: <strong style="color: #fbbf24;">@${w.maskedUsername || w.username || 'Kazanan'}</strong></span>
                    <span>&bull;</span>
                    <span>Tarih: ${dateStr}</span>
                    <span>&bull;</span>
                    <span>Bilet Sayısı: ${w.ticketCount || 1} hak</span>
                  </div>
                </div>
              </div>

              <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                ${w.giveawayId ? `
                  <a href="/cekilisler/${w.giveawayId}" class="gw-btn gw-btn-secondary" style="font-size: 0.85rem; padding: 0.5rem 1rem;">
                    🔍 Çekilişi Görüntüle
                  </a>
                  <a href="/cekilisler/canli/${w.giveawayId}" class="gw-btn gw-btn-secondary" style="font-size: 0.85rem; padding: 0.5rem 1rem; border-color: #fbbf24; color: #fbbf24;">
                    📺 Canlı Kaydı İzle
                  </a>
                ` : ''}
              </div>
            </div>
          `;
        }).join('') : `
          <div class="gw-card" style="padding: 4rem 1.5rem; text-align: center; color: var(--gw-text-muted);">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🏆</div>
            <h3 style="font-size: 1.3rem; font-weight: 800; margin: 0 0 0.5rem; color: #fff;">Henüz Tamamlanan Çekiliş Bulunmuyor</h3>
            <p style="margin: 0 0 1.5rem;">Aktif çekilişler sonuçlandığında kazananlar bu alanda şeffaf bir şekilde sergilenecektir.</p>
            <a href="/cekilisler" class="gw-btn gw-btn-primary">Aktif Çekilişlere Katıl</a>
          </div>
        `}
      </div>

    </div>
  `;

  return giveawayLayout({
    title: 'Kazananlar — Eko Yıldız Çekiliş Platformu',
    description: 'Eko Yıldız çekilişlerinin şanslı kazananları ve ödül teslimatları.',
    content,
    user,
    activeTab: 'winners',
    notificationCount
  });
}

module.exports = { renderGiveawayWinnersPage };
