// server/views/giveaways/giveawaysFeedPage.js
// Modern social-feed style giveaways main page
const { giveawayLayout } = require('./giveawayLayout');

function renderGiveawaysFeedPage({ user, giveaways = [], activities = [], activeCategory = 'all', notificationCount = 0 }) {
  const featured = giveaways.find(g => g.isFeatured && g.status === 'ACTIVE') || giveaways.find(g => g.status === 'ACTIVE');

  // Filter giveaways by tab
  const filteredGiveaways = giveaways.filter(g => {
    if (activeCategory === 'active') return g.status === 'ACTIVE';
    if (activeCategory === 'upcoming') return g.status === 'SCHEDULED';
    if (activeCategory === 'ended') return g.status === 'ENDED' || g.status === 'COMPLETED';
    return true;
  });

  const content = `
    <!-- Top Hero Banner -->
    <div style="background: radial-gradient(circle at 50% 0%, rgba(168, 85, 247, 0.22) 0%, rgba(15, 23, 42, 0) 70%); border-bottom: 1px solid var(--gw-border); padding: 3.5rem 1.5rem 2.5rem; text-align: center;">
      <div style="max-width: 800px; margin: 0 auto;">
        <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(168, 85, 247, 0.12); border: 1px solid rgba(168, 85, 247, 0.35); padding: 0.4rem 1rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 700; color: var(--gw-primary); margin-bottom: 1.25rem;">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#22c55e; box-shadow:0 0 8px #22c55e;"></span>
          EKO YILDIZ ÇEKİLİŞ PLATFORMU
        </div>
        <h1 style="font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 900; line-height: 1.15; margin: 0 0 1rem; letter-spacing: -0.02em;">
          Katıl. Görevleri Tamamla. <span style="background: linear-gradient(135deg, #c084fc, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Büyük Ödülü Kazan!</span>
        </h1>
        <p style="font-size: 1.1rem; color: var(--gw-text-muted); margin: 0 auto 2rem; max-width: 600px; line-height: 1.6;">
          Eko Yıldız topluluğuna özel Robux, Discord Nitro, oyun içi hediyeler ve sponsor ödülleri seni bekliyor. Görevleri tamamlayarak çekiliş haklarını katla.
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <a href="#giveaways-feed" class="gw-btn gw-btn-primary" style="padding: 0.85rem 2rem; font-size: 1rem;">
            🎁 Aktif Çekilişleri İncele
          </a>
          <a href="/cekilisler/kazananlar" class="gw-btn gw-btn-secondary" style="padding: 0.85rem 1.75rem; font-size: 1rem;">
            🏆 Kazananları Gör
          </a>
        </div>
      </div>
    </div>

    <div class="gw-container" style="padding-top: 2.5rem;">
      <div style="display: grid; grid-template-columns: 1fr; gap: 2rem;">
        
        <!-- Live Activity Ticker -->
        <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid var(--gw-border); border-radius: 1rem; padding: 0.85rem 1.25rem; display: flex; align-items: center; gap: 1rem; overflow: hidden;">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 800; color: var(--gw-accent); text-transform: uppercase; white-space: nowrap;">
            <span style="animation: gwPulse 1.5s infinite;">⚡</span> CANLI AKIŞ:
          </div>
          <div style="display: flex; gap: 2rem; overflow-x: auto; white-space: nowrap; scrollbar-width: none; font-size: 0.9rem; color: var(--gw-text-muted);">
            ${activities && activities.length > 0 ? activities.map(act => `
              <span style="display: inline-flex; align-items: center; gap: 0.4rem;">
                <strong style="color: var(--gw-text);">${act.text}</strong>
                <span style="font-size: 0.75rem; opacity: 0.6;">(${new Date(act.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })})</span>
              </span>
            `).join(' <span style="color:var(--gw-border);">&bull;</span> ') : `
              <span>🎉 Yeni Robux çekilişi başladı! Katıl ve görevleri bitir.</span>
              <span style="color:var(--gw-border);">&bull;</span>
              <span>🔥 Son 24 saatte 1.400+ çekiliş bileti toplandı!</span>
            `}
          </div>
        </div>

        <!-- FEATURED HERO GIVEAWAY CARD -->
        ${featured ? `
          <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%); border: 2px solid rgba(168, 85, 247, 0.4); border-radius: 1.5rem; padding: clamp(1.25rem, 3vw, 2.5rem); position: relative; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(168, 85, 247, 0.25);">
            <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%); pointer-events: none;"></div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; align-items: center;">
              <div>
                <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg, #a855f7, #ec4899); color: #fff; padding: 0.35rem 0.85rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; margin-bottom: 1rem;">
                  ⭐ ÖNE ÇIKAN ÇEKİLİŞ
                </div>
                <h2 style="font-size: clamp(1.75rem, 3.5vw, 2.5rem); font-weight: 900; margin: 0 0 0.75rem; line-height: 1.2;">
                  ${featured.title}
                </h2>
                <div style="font-size: 1.25rem; font-weight: 800; color: #38bdf8; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                  🎁 Ödül: <span style="color: #fff; background: rgba(56, 189, 248, 0.15); padding: 0.2rem 0.6rem; border-radius: 0.5rem; border: 1px solid rgba(56, 189, 248, 0.3);">${featured.prize}</span>
                </div>
                <p style="color: var(--gw-text-muted); font-size: 0.95rem; line-height: 1.6; margin: 0 0 1.5rem; max-width: 500px;">
                  ${featured.description || 'Bu büyük çekilişte verilen basit sosyal medya görevlerini yaparak hemen bilet kazan ve çekiliş hakkını katla!'}
                </p>
                <div style="display: flex; gap: 1.5rem; margin-bottom: 1.75rem; flex-wrap: wrap;">
                  <div>
                    <div style="font-size: 0.8rem; color: var(--gw-text-muted); text-transform: uppercase; font-weight: 700;">Katılımcı</div>
                    <div style="font-size: 1.35rem; font-weight: 900; color: #fff;">👥 ${(featured.totalEntries || 0).toLocaleString('tr-TR')}</div>
                  </div>
                  <div style="width: 1px; background: var(--gw-border);"></div>
                  <div>
                    <div style="font-size: 0.8rem; color: var(--gw-text-muted); text-transform: uppercase; font-weight: 700;">Dağıtılan Bilet</div>
                    <div style="font-size: 1.35rem; font-weight: 900; color: #a855f7;">🎟️ ${(featured.totalTickets || 0).toLocaleString('tr-TR')}</div>
                  </div>
                  <div style="width: 1px; background: var(--gw-border);"></div>
                  <div>
                    <div style="font-size: 0.8rem; color: var(--gw-text-muted); text-transform: uppercase; font-weight: 700;">Sponsor</div>
                    <div style="font-size: 1.1rem; font-weight: 800; color: #fbbf24;">✨ ${featured.sponsor || 'Eko Yıldız'}</div>
                  </div>
                </div>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                  <a href="/cekilisler/${featured.slug || featured._id}" class="gw-btn gw-btn-primary" style="padding: 0.85rem 2rem; font-size: 1.05rem;">
                    🎯 Hemen Görevleri Yap & Katıl
                  </a>
                  <a href="/cekilisler/seffaflik" class="gw-btn gw-btn-secondary">
                    🛡️ Şeffaflık Raporu
                  </a>
                </div>
              </div>
              <div style="text-align: center;">
                <div style="border-radius: 1.25rem; overflow: hidden; border: 2px solid rgba(255, 255, 255, 0.1); box-shadow: 0 15px 30px rgba(0,0,0,0.5); max-height: 320px;">
                  <img src="${featured.coverImage || 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=800&auto=format&fit=crop&q=80'}" alt="${featured.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                </div>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- CATEGORY TABS -->
        <div id="giveaways-feed" style="margin-top: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--gw-border); padding-bottom: 1rem; margin-bottom: 2rem;">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <a href="/cekilisler" class="gw-btn ${activeCategory === 'all' ? 'gw-btn-primary' : 'gw-btn-secondary'}" style="padding: 0.5rem 1.25rem; font-size: 0.9rem;">
                Tümü (${giveaways.length})
              </a>
              <a href="/cekilisler?kategori=active" class="gw-btn ${activeCategory === 'active' ? 'gw-btn-primary' : 'gw-btn-secondary'}" style="padding: 0.5rem 1.25rem; font-size: 0.9rem;">
                🟢 Aktif (${giveaways.filter(g => g.status === 'ACTIVE').length})
              </a>
              <a href="/cekilisler?kategori=upcoming" class="gw-btn ${activeCategory === 'upcoming' ? 'gw-btn-primary' : 'gw-btn-secondary'}" style="padding: 0.5rem 1.25rem; font-size: 0.9rem;">
                ⏳ Yakında (${giveaways.filter(g => g.status === 'SCHEDULED').length})
              </a>
              <a href="/cekilisler?kategori=ended" class="gw-btn ${activeCategory === 'ended' ? 'gw-btn-primary' : 'gw-btn-secondary'}" style="padding: 0.5rem 1.25rem; font-size: 0.9rem;">
                🏁 Tamamlanan (${giveaways.filter(g => g.status === 'ENDED' || g.status === 'COMPLETED').length})
              </a>
            </div>
            <div style="font-size: 0.9rem; color: var(--gw-text-muted);">
              🛡️ Kriptografik Rastgele Seçim & Anti-Cheat Korumalı
            </div>
          </div>

          <!-- GIVEAWAY CARDS GRID -->
          <div class="gw-grid">
            ${filteredGiveaways && filteredGiveaways.length > 0 ? filteredGiveaways.map(gw => {
              const isActive = gw.status === 'ACTIVE';
              const isScheduled = gw.status === 'SCHEDULED';
              const isEnded = gw.status === 'ENDED' || gw.status === 'COMPLETED';
              const daysLeft = Math.max(0, Math.ceil((new Date(gw.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

              return `
                <div class="gw-card" style="display: flex; flex-direction: column;">
                  <div style="position: relative; height: 180px; overflow: hidden; background: #0f172a;">
                    <img src="${gw.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'}" alt="${gw.title}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <div style="position: absolute; top: 0.75rem; left: 0.75rem;">
                      ${isActive ? '<span class="gw-badge gw-badge-active">🟢 AKTİF</span>' : ''}
                      ${isScheduled ? '<span class="gw-badge gw-badge-scheduled">⏳ YAKINDA</span>' : ''}
                      ${isEnded ? '<span class="gw-badge gw-badge-ended">🏁 TAMAMLANDI</span>' : ''}
                    </div>
                    <div style="position: absolute; bottom: 0.75rem; right: 0.75rem; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); padding: 0.25rem 0.6rem; border-radius: 0.5rem; font-size: 0.8rem; font-weight: 700; color: #fff;">
                      ${isActive ? `⏱️ ${daysLeft} Gün Kaldı` : (isScheduled ? 'Başlaması Bekleniyor' : 'Sonuçlandı')}
                    </div>
                  </div>
                  
                  <div style="padding: 1.25rem; display: flex; flex-direction: column; flex: 1;">
                    <div style="font-size: 0.8rem; font-weight: 700; color: #a855f7; text-transform: uppercase; margin-bottom: 0.35rem;">
                      Sponsor: ${gw.sponsor || 'Eko Yıldız'}
                    </div>
                    <h3 style="font-size: 1.2rem; font-weight: 800; margin: 0 0 0.5rem; line-height: 1.3;">
                      <a href="/cekilisler/${gw.slug || gw._id}" style="color: var(--gw-text); text-decoration: none;">
                        ${gw.title}
                      </a>
                    </h3>
                    <div style="font-size: 0.95rem; font-weight: 700; color: #38bdf8; margin-bottom: 1rem;">
                      🎁 Ödül: <span style="color: #fff;">${gw.prize}</span>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; background: rgba(15, 23, 42, 0.6); padding: 0.75rem; border-radius: 0.75rem; margin-bottom: 1.25rem; font-size: 0.85rem;">
                      <div>
                        <div style="color: var(--gw-text-muted);">Katılımcı</div>
                        <div style="font-weight: 800; color: #fff;">👥 ${(gw.totalEntries || 0).toLocaleString('tr-TR')}</div>
                      </div>
                      <div>
                        <div style="color: var(--gw-text-muted);">Toplam Bilet</div>
                        <div style="font-weight: 800; color: #a855f7;">🎟️ ${(gw.totalTickets || 0).toLocaleString('tr-TR')}</div>
                      </div>
                    </div>

                    <div style="margin-top: auto;">
                      ${isActive ? `
                        <a href="/cekilisler/${gw.slug || gw._id}" class="gw-btn gw-btn-primary" style="width: 100%;">
                          🎯 Çekilişe Katıl & Görev Yap
                        </a>
                      ` : (isEnded ? `
                        <a href="/cekilisler/${gw.slug || gw._id}" class="gw-btn gw-btn-secondary" style="width: 100%;">
                          🏆 Kazananları & Detayları Gör
                        </a>
                      ` : `
                        <a href="/cekilisler/${gw.slug || gw._id}" class="gw-btn gw-btn-secondary" style="width: 100%;">
                          🔔 Çekiliş Detayını İncele
                        </a>
                      `)}
                    </div>
                  </div>
                </div>
              `;
            }).join('') : `
              <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: rgba(30, 41, 59, 0.3); border-radius: 1.5rem; border: 1px dashed var(--gw-border);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎁</div>
                <h3 style="font-size: 1.4rem; font-weight: 800; margin: 0 0 0.5rem;">Bu kategoride henüz çekiliş bulunmuyor</h3>
                <p style="color: var(--gw-text-muted); margin: 0 0 1.5rem;">Çok yakında yeni büyük ödüllü çekilişler eklenecektir!</p>
                <a href="/cekilisler" class="gw-btn gw-btn-primary">Tüm Çekilişleri Listele</a>
              </div>
            `}
          </div>
        </div>

        <!-- Social Proof / Platform Stats Banner -->
        <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid var(--gw-border); border-radius: 1.5rem; padding: 2.5rem 1.5rem; text-align: center; margin-top: 1rem;">
          <h3 style="font-size: 1.5rem; font-weight: 800; margin: 0 0 2rem;">Eko Yıldız Çekiliş Güvencesi</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
            <div>
              <div style="font-size: 2.25rem; font-weight: 900; color: #a855f7;">%100</div>
              <div style="font-weight: 700; color: #fff; margin: 0.25rem 0;">Şeffaf & Adil</div>
              <div style="font-size: 0.85rem; color: var(--gw-text-muted);">Tüm çekilişler kriptografik rastgele bilet sistemiyle belirlenir.</div>
            </div>
            <div>
              <div style="font-size: 2.25rem; font-weight: 900; color: #38bdf8;">Anti-Cheat</div>
              <div style="font-weight: 700; color: #fff; margin: 0.25rem 0;">Bot Korumalı</div>
              <div style="font-size: 0.85rem; color: var(--gw-text-muted);">Çift hesap, sahte IP ve bot katılımları anında tespit edilir.</div>
            </div>
            <div>
              <div style="font-size: 2.25rem; font-weight: 900; color: #ec4899;">Görev Sistemi</div>
              <div style="font-weight: 700; color: #fff; margin: 0.25rem 0;">Çoklu Bilet Kazan</div>
              <div style="font-size: 0.85rem; color: var(--gw-text-muted);">Discord, YouTube ve arkadaş davetleriyle şansını 10 katına çıkar.</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  return giveawayLayout({
    title: 'Eko Yıldız Çekilişleri — Katıl, Görevleri Yap, Kazan!',
    description: 'Eko Yıldız resmi çekiliş platformu. Robux, Discord Nitro ve özel hediyeler kazanmak için görevleri tamamla!',
    content,
    user,
    activeTab: 'home',
    notificationCount
  });
}

module.exports = { renderGiveawaysFeedPage };
