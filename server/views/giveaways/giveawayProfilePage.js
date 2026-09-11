// server/views/giveaways/giveawayProfilePage.js
const { giveawayLayout } = require('./giveawayLayout');

function renderGiveawayProfilePage({ user, stats = {}, entries = [], wonGiveaways = [], badges = [], referralCode = '', notificationCount = 0 }) {
  const content = `
    <div class="gw-container" style="padding-top: 3rem; max-width: 950px;">
      
      <!-- Profile Header Card (Social media style) -->
      <div class="gw-card" style="padding: 0; overflow: hidden; margin-bottom: 2.5rem; position: relative;">
        <!-- Banner -->
        <div style="height: 140px; background: linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #0284c7 100%);"></div>
        
        <div style="padding: 0 2rem 2rem; position: relative;">
          <!-- Avatar -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: -50px; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
            <div style="display: flex; align-items: flex-end; gap: 1.25rem;">
              <div style="width: 100px; height: 100px; border-radius: 1.5rem; border: 4px solid #1e293b; background: #0f172a; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                <img src="${user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="${user.username}" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
              <div style="margin-bottom: 0.5rem;">
                <h1 style="font-size: 1.6rem; font-weight: 900; margin: 0; color: #fff;">
                  ${user.username || 'Kullanıcı'}
                </h1>
                <div style="font-size: 0.85rem; color: var(--gw-text-muted);">
                  ${user.discriminator && user.discriminator !== '0' ? `#${user.discriminator}` : '@' + (user.username || 'uye')} &bull; Eko Yıldız Üyesi
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
              <a href="/cekilisler" class="gw-btn gw-btn-primary" style="font-size: 0.85rem;">
                🎁 Çekilişlere Katıl
              </a>
              <a href="/logout" class="gw-btn gw-btn-secondary" style="font-size: 0.85rem;">
                Çıkış Yap
              </a>
            </div>
          </div>

          <!-- Quick Stats Row -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; background: rgba(15, 23, 42, 0.7); border: 1px solid var(--gw-border); border-radius: 1rem; padding: 1.25rem; margin-top: 1rem;">
            <div>
              <div style="font-size: 0.8rem; color: var(--gw-text-muted); font-weight: 700; text-transform: uppercase;">Katılınan Çekiliş</div>
              <div style="font-size: 1.4rem; font-weight: 900; color: #fff;">${stats.totalEntries || 0}</div>
            </div>
            <div>
              <div style="font-size: 0.8rem; color: var(--gw-text-muted); font-weight: 700; text-transform: uppercase;">Toplam Bilet</div>
              <div style="font-size: 1.4rem; font-weight: 900; color: #a855f7;">🎟️ ${stats.totalTickets || 0}</div>
            </div>
            <div>
              <div style="font-size: 0.8rem; color: var(--gw-text-muted); font-weight: 700; text-transform: uppercase;">Bitirilen Görev</div>
              <div style="font-size: 1.4rem; font-weight: 900; color: #38bdf8;">✅ ${stats.completedTasksCount || 0}</div>
            </div>
            <div>
              <div style="font-size: 0.8rem; color: var(--gw-text-muted); font-weight: 700; text-transform: uppercase;">Kazanılan Çekiliş</div>
              <div style="font-size: 1.4rem; font-weight: 900; color: #fbbf24;">🏆 ${wonGiveaways.length || 0}</div>
            </div>
            <div>
              <div style="font-size: 0.8rem; color: var(--gw-text-muted); font-weight: 700; text-transform: uppercase;">Davet Edilen</div>
              <div style="font-size: 1.4rem; font-weight: 900; color: #ec4899;">👥 ${stats.referralsCount || 0}</div>
            </div>
          </div>

        </div>
      </div>

      <!-- BADGES SECTION -->
      <div class="gw-card" style="padding: 1.75rem; margin-bottom: 2.5rem;">
        <h2 style="font-size: 1.25rem; font-weight: 800; margin: 0 0 0.5rem; color: #fff;">
          🎖️ Çekiliş Rozetlerin & Başarıların
        </h2>
        <p style="font-size: 0.85rem; color: var(--gw-text-muted); margin: 0 0 1.5rem;">
          Platformdaki etkinliklerin ve görev tamamlamaların ile kazandığın özel profil rozetleri.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          ${badges && badges.length > 0 ? badges.map(b => `
            <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid ${b.unlocked ? 'rgba(168, 85, 247, 0.5)' : 'var(--gw-border)'}; opacity: ${b.unlocked ? '1' : '0.45'}; border-radius: 0.75rem; padding: 1rem; display: flex; align-items: center; gap: 0.75rem;">
              <div style="font-size: 2rem;">${b.icon || '🎖️'}</div>
              <div>
                <div style="font-weight: 800; color: #fff; font-size: 0.95rem;">${b.title}</div>
                <div style="font-size: 0.75rem; color: var(--gw-text-muted);">${b.description}</div>
                ${b.unlocked ? '<div style="font-size: 0.7rem; color: #22c55e; font-weight: 700; margin-top: 0.2rem;">Kazanıldı ✓</div>' : '<div style="font-size: 0.7rem; color: var(--gw-text-muted); margin-top: 0.2rem;">Kilitli 🔒</div>'}
              </div>
            </div>
          `).join('') : ''}
        </div>
      </div>

      <!-- REFERRAL CARD -->
      <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%); border: 1px solid var(--gw-border); border-radius: 1.25rem; padding: 1.75rem; margin-bottom: 2.5rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
          <span style="font-size: 1.5rem;">🔗</span>
          <h3 style="font-size: 1.2rem; font-weight: 800; margin: 0; color: #fff;">Kişisel Davet Bağlantın</h3>
        </div>
        <p style="font-size: 0.85rem; color: var(--gw-text-muted); margin: 0 0 1rem;">
          Bu bağlantıyı arkadaşlarına gönder. Katılan her kişi için hesabına +2 bilet tanımlanır!
        </p>
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <input type="text" id="userRefLink" readonly value="http://localhost:3000/r/${referralCode || user._id}" style="flex: 1; min-width: 250px; background: rgba(15, 23, 42, 0.8); border: 1px solid var(--gw-border); color: #fff; padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.9rem; font-family: monospace;">
          <button onclick="copyProfileRef()" class="gw-btn gw-btn-primary" style="padding: 0.75rem 1.5rem;">
            📋 Kopyala
          </button>
        </div>
      </div>

      <!-- ACTIVE PARTICIPATIONS -->
      <div class="gw-card" style="padding: 1.75rem; margin-bottom: 2.5rem;">
        <h2 style="font-size: 1.25rem; font-weight: 800; margin: 0 0 1.25rem; color: #fff;">
          🎯 Katıldığın Çekilişler
        </h2>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${entries && entries.length > 0 ? entries.map(ent => `
            <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--gw-border); border-radius: 0.75rem; padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div>
                <div style="font-weight: 800; color: #fff; font-size: 1.05rem;">${ent.giveawayTitle || 'Çekiliş'}</div>
                <div style="font-size: 0.8rem; color: var(--gw-text-muted); margin-top: 0.2rem;">
                  Katılım Tarihi: ${new Date(ent.createdAt).toLocaleDateString('tr-TR')}
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="font-size: 1.1rem; font-weight: 900; color: #a855f7;">
                  🎟️ ${ent.ticketCount || 1} Bilet
                </div>
                <a href="/cekilisler/${ent.giveawayId}" class="gw-btn gw-btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
                  Detay
                </a>
              </div>
            </div>
          `).join('') : `
            <div style="text-align: center; color: var(--gw-text-muted); padding: 2rem 0;">
              Henüz hiçbir çekilişe katılmadın. <a href="/cekilisler" style="color: #a855f7; text-decoration: underline;">Aktif çekilişleri incele!</a>
            </div>
          `}
        </div>
      </div>

    </div>

    <script>
      function copyProfileRef() {
        const input = document.getElementById('userRefLink');
        if (!input) return;
        input.select();
        navigator.clipboard.writeText(input.value).then(() => {
          showGwToast('✅ Davet bağlantın panoya kopyalandı!', 'success');
        });
      }
    </script>
  `;

  return giveawayLayout({
    title: `${user.username} Profili — Eko Yıldız Çekilişleri`,
    description: 'Kişisel çekiliş profilin, biletlerin ve başarıların.',
    content,
    user,
    activeTab: 'profile',
    notificationCount
  });
}

module.exports = { renderGiveawayProfilePage };
