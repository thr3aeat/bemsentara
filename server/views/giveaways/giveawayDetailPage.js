// server/views/giveaways/giveawayDetailPage.js
const { giveawayLayout } = require('./giveawayLayout');

function renderGiveawayDetailPage({ user, giveaway, tasks = [], userEntry = null, winners = [], referralCode = '', notificationCount = 0 }) {
  const isActive = giveaway.status === 'ACTIVE';
  const isEnded = giveaway.status === 'ENDED' || giveaway.status === 'COMPLETED';
  const isScheduled = giveaway.status === 'SCHEDULED';
  
  const userTickets = userEntry ? userEntry.ticketCount : 0;
  const userCompletedTaskIds = new Set(userEntry && userEntry.completedTasks ? userEntry.completedTasks.map(t => t.taskId) : []);
  const taskStatusMap = {};
  if (userEntry && userEntry.completedTasks) {
    userEntry.completedTasks.forEach(t => {
      taskStatusMap[t.taskId] = t.status;
    });
  }

  const daysLeft = Math.max(0, Math.ceil((new Date(giveaway.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const totalMandatory = tasks.filter(t => t.isMandatory).length;
  const completedMandatory = tasks.filter(t => t.isMandatory && userCompletedTaskIds.has(t.id || t._id)).length;
  const canEnter = !userEntry && (!totalMandatory || completedMandatory >= totalMandatory);

  const content = `
    <!-- Top Hero Section -->
    <div style="background: radial-gradient(circle at 50% 0%, rgba(168, 85, 247, 0.25) 0%, rgba(15, 23, 42, 0.95) 75%); border-bottom: 1px solid var(--gw-border); padding: 3rem 1.5rem 2.5rem;">
      <div style="max-width: 900px; margin: 0 auto;">
        
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap;">
          <a href="/cekilisler" style="color: var(--gw-text-muted); text-decoration: none; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.35rem;">
            ← Tüm Çekilişlere Dön
          </a>
          <span style="color: var(--gw-border);">&bull;</span>
          ${isActive ? '<span class="gw-badge gw-badge-active">🟢 AKTİF ÇEKİLİŞ</span>' : ''}
          ${isScheduled ? '<span class="gw-badge gw-badge-scheduled">⏳ YAKINDA BAŞLIYOR</span>' : ''}
          ${isEnded ? '<span class="gw-badge gw-badge-ended">🏁 TAMAMLANDI</span>' : ''}
          <span class="gw-badge" style="background: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3);">
            ✨ Sponsor: ${giveaway.sponsor || 'Eko Yıldız'}
          </span>
        </div>

        <h1 style="font-size: clamp(1.85rem, 4.5vw, 3rem); font-weight: 900; line-height: 1.2; margin: 0 0 1rem; color: #fff;">
          🎁 ${giveaway.title}
        </h1>

        <!-- Quick Summary Bar -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(8px); border: 1px solid var(--gw-border); border-radius: 1rem; padding: 1.25rem; margin: 1.5rem 0 2rem;">
          <div>
            <div style="font-size: 0.8rem; color: var(--gw-text-muted); text-transform: uppercase; font-weight: 700;">Büyük Ödül</div>
            <div style="font-size: 1.2rem; font-weight: 900; color: #38bdf8;">${giveaway.prize}</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--gw-text-muted); text-transform: uppercase; font-weight: 700;">Katılımcı Sayısı</div>
            <div style="font-size: 1.2rem; font-weight: 900; color: #fff;">👥 ${(giveaway.totalEntries || 0).toLocaleString('tr-TR')}</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--gw-text-muted); text-transform: uppercase; font-weight: 700;">Toplam Bilet (Hak)</div>
            <div style="font-size: 1.2rem; font-weight: 900; color: #a855f7;">🎟️ ${(giveaway.totalTickets || 0).toLocaleString('tr-TR')}</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--gw-text-muted); text-transform: uppercase; font-weight: 700;">Kalan Süre</div>
            <div style="font-size: 1.2rem; font-weight: 900; color: ${daysLeft <= 1 ? '#ef4444' : '#22c55e'};">
              ${isActive ? `⏱️ ${daysLeft} Gün` : (isScheduled ? 'Başlamadı' : 'Sona Erdi')}
            </div>
          </div>
        </div>

        <!-- USER TICKET STATUS BOX -->
        ${user ? `
          <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(56, 189, 248, 0.15) 100%); border: 1px solid rgba(168, 85, 247, 0.4); border-radius: 1rem; padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
            <div>
              <div style="font-size: 0.85rem; color: var(--gw-text-muted); font-weight: 700; text-transform: uppercase;">Senin Çekiliş Durumun</div>
              <div style="font-size: 1.3rem; font-weight: 900; color: #fff; margin-top: 0.25rem;">
                ${userTickets > 0 ? `🎟️ Toplam <strong>${userTickets}</strong> çekiliş biletin bulunuyor!` : 'Henüz bu çekiliş için bilet kazanmadın.'}
              </div>
              <div style="font-size: 0.85rem; color: var(--gw-text-muted); margin-top: 0.2rem;">
                ${userTickets > 0 ? 'Daha fazla görev yaparak ve arkadaşlarını davet ederek kazanma şansını artırabilirsin.' : 'Aşağıdaki görevleri tamamlayarak anında bilet kazanmaya başla!'}
              </div>
            </div>
            ${userTickets > 0 ? `
              <div style="background: var(--gw-primary); color: #fff; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 800; font-size: 0.9rem; box-shadow: 0 4px 14px rgba(168, 85, 247, 0.4);">
                ✅ KATILDIN (${userTickets} Hak)
              </div>
            ` : ''}
          </div>
        ` : `
          <div style="background: rgba(30, 41, 59, 0.8); border: 1px solid var(--gw-border); border-radius: 1rem; padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
            <div>
              <div style="font-weight: 800; color: #fff; font-size: 1.05rem;">Çekilişe katılmak ve hak kazanmak için giriş yapmalısın.</div>
              <div style="font-size: 0.85rem; color: var(--gw-text-muted);">Mevcut Eko Yıldız veya Discord hesabınla tek tıkla giriş yapabilirsin.</div>
            </div>
            <a href="/login?redirect=/cekilisler/${giveaway.slug || giveaway._id}" class="gw-btn gw-btn-primary">
              🔑 Giriş Yap & Bilet Kazan
            </a>
          </div>
        `}

      </div>
    </div>

    <!-- Main Content Area -->
    <div class="gw-container" style="padding-top: 2.5rem; max-width: 900px;">
      
      <!-- WINNERS SECTION (IF ENDED) -->
      ${isEnded ? `
        <div style="background: linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(30, 41, 59, 0.9) 100%); border: 2px solid #eab308; border-radius: 1.25rem; padding: 1.75rem; margin-bottom: 2.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
            <span style="font-size: 2rem;">🏆</span>
            <div>
              <h2 style="font-size: 1.4rem; font-weight: 900; margin: 0; color: #fef08a;">Bu Çekiliş Sonuçlandı!</h2>
              <div style="font-size: 0.85rem; color: var(--gw-text-muted);">Kriptografik ağırlıklı çekiliş algoritmasıyla belirlenen kazanan(lar):</div>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-top: 1rem;">
            ${winners && winners.length > 0 ? winners.map((w, idx) => `
              <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(234, 179, 8, 0.4); border-radius: 0.75rem; padding: 1rem; display: flex; align-items: center; gap: 1rem;">
                <div style="font-size: 1.5rem; font-weight: 900; color: #fbbf24;">#${idx + 1}</div>
                <div>
                  <div style="font-weight: 800; color: #fff; font-size: 1.05rem;">@${w.maskedUsername || w.username || 'Kazanan'}</div>
                  <div style="font-size: 0.8rem; color: var(--gw-text-muted);">Sahip olduğu bilet: <span style="color: #a855f7; font-weight:700;">${w.ticketCount || 1} bilet</span></div>
                </div>
              </div>
            `).join('') : `
              <div style="color: var(--gw-text-muted); font-size: 0.9rem;">Kazanan seçimi bekleniyor veya admin tarafından çekiliş yürütülüyor.</div>
            `}
          </div>

          <div style="margin-top: 1.25rem; text-align: right;">
            <a href="/cekilisler/canli/${giveaway._id}" class="gw-btn gw-btn-secondary" style="font-size: 0.85rem; border-color: #eab308; color: #fef08a;">
              📺 Çekiliş Canlı Kaydını / Simülasyonunu Aç
            </a>
          </div>
        </div>
      ` : ''}

      <!-- GIVEAWAY DESCRIPTION & DETAILS -->
      <div class="gw-card" style="padding: 1.75rem; margin-bottom: 2rem;">
        <h3 style="font-size: 1.25rem; font-weight: 800; margin: 0 0 1rem; color: #fff;">Çekiliş Açıklaması & Detayları</h3>
        <div style="color: var(--gw-text-muted); line-height: 1.7; font-size: 0.95rem;">
          ${giveaway.description ? giveaway.description.replace(/\n/g, '<br>') : 'Eko Yıldız topluluğu için özel olarak hazırlanan bu çekilişe katılarak büyük ödülü kazanma şansı yakala! Görevleri tamamladıkça bilet sayın artar.'}
        </div>
      </div>

      <!-- TASKS / HOW TO ENTER SECTION -->
      <div style="margin-bottom: 2.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
          <div>
            <h2 style="font-size: 1.4rem; font-weight: 900; margin: 0; color: #fff;">🎯 Çekiliş Görevleri & Bilet Kazanma</h2>
            <p style="font-size: 0.85rem; color: var(--gw-text-muted); margin: 0.25rem 0 0;">
              Her tamamladığın görev sana ekstra çekiliş biletleri kazandırır.
            </p>
          </div>
          <div style="font-size: 0.85rem; color: #a855f7; font-weight: 700;">
            ${tasks.length} Görev Mevcut
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${tasks && tasks.length > 0 ? tasks.map((task, idx) => {
            const taskId = task.id || task._id;
            const status = taskStatusMap[taskId] || 'NOT_COMPLETED';
            const isCompleted = status === 'VERIFIED';
            const isPending = status === 'PENDING';
            const isRejected = status === 'REJECTED';

            let platformIcon = '🎯';
            if (task.platform === 'youtube') platformIcon = '📺';
            if (task.platform === 'discord') platformIcon = '💬';
            if (task.platform === 'instagram') platformIcon = '📸';
            if (task.platform === 'referral') platformIcon = '🤝';
            if (task.platform === 'site') platformIcon = '⭐';

            return `
              <div class="gw-card" style="padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1.25rem; flex-wrap: wrap; border-left: 4px solid ${isCompleted ? '#22c55e' : (isPending ? '#eab308' : '#a855f7')};">
                <div style="display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 250px;">
                  <div style="width: 44px; height: 44px; border-radius: 0.75rem; background: rgba(168, 85, 247, 0.15); display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
                    ${platformIcon}
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                      <span style="font-weight: 800; font-size: 1.05rem; color: #fff;">${task.title}</span>
                      ${task.isMandatory ? '<span class="gw-badge" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; font-size: 0.7rem;">ZORUNLU</span>' : ''}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--gw-text-muted); margin-top: 0.2rem;">
                      ${task.description || 'Görevi verilen bağlantı üzerinden tamamla ve doğrula.'}
                    </div>
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 1rem;">
                  <div style="text-align: right;">
                    <div style="font-size: 1.15rem; font-weight: 900; color: #a855f7;">+${task.ticketReward || 1} Bilet</div>
                    <div style="font-size: 0.75rem; color: var(--gw-text-muted);">Çekiliş Hakkı</div>
                  </div>

                  <div>
                    ${!user ? `
                      <a href="/login?redirect=/cekilisler/${giveaway.slug || giveaway._id}" class="gw-btn gw-btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                        Giriş Yap
                      </a>
                    ` : (isCompleted ? `
                      <span class="gw-badge gw-badge-active" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                        ✅ Doğrulandı
                      </span>
                    ` : (isPending ? `
                      <span class="gw-badge gw-badge-scheduled" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                        ⏳ İnceleniyor
                      </span>
                    ` : (isRejected ? `
                      <button onclick="handleTaskSubmit('${giveaway._id}', '${taskId}', '${task.targetUrl || ''}')" class="gw-btn gw-btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem; border-color: #ef4444; color: #ef4444;">
                        ❌ Yeniden Dene
                      </button>
                    ` : `
                      <button onclick="handleTaskSubmit('${giveaway._id}', '${taskId}', '${task.targetUrl || ''}')" class="gw-btn gw-btn-primary" style="padding: 0.5rem 1.25rem; font-size: 0.85rem;" ${!isActive ? 'disabled' : ''}>
                        🚀 Tamamla & Doğrula
                      </button>
                    `)))}
                  </div>
                </div>
              </div>
            `;
          }).join('') : `
            <div class="gw-card" style="padding: 2rem; text-align: center; color: var(--gw-text-muted);">
              Bu çekiliş için özel görev tanımlanmadı. Katıl butonuna basarak doğrudan giriş yapabilirsin.
            </div>
          `}
        </div>
      </div>

      <!-- REFERRAL & INVITE SECTION -->
      ${user ? `
        <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%); border: 1px solid var(--gw-border); border-radius: 1.25rem; padding: 1.75rem; margin-bottom: 2.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
            <span style="font-size: 1.75rem;">🤝</span>
            <div>
              <h3 style="font-size: 1.25rem; font-weight: 800; margin: 0; color: #fff;">Arkadaşını Davet Et (+2 Bilet Kazan)</h3>
              <div style="font-size: 0.85rem; color: var(--gw-text-muted);">Özel davet bağlantını paylaş, her geçerli arkadaş katılımında fazladan bilet kazan!</div>
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem;">
            <input type="text" id="refLinkInput" readonly value="http://localhost:3000/r/${referralCode || user._id}" style="flex: 1; min-width: 260px; background: rgba(15, 23, 42, 0.8); border: 1px solid var(--gw-border); color: #fff; padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.9rem; font-family: monospace;">
            <button onclick="copyReferralLink()" class="gw-btn gw-btn-primary" style="padding: 0.75rem 1.5rem;">
              📋 Kopyala
            </button>
          </div>
          <div style="font-size: 0.75rem; color: var(--gw-text-muted); margin-top: 0.75rem;">
            🛡️ Anti-Cheat: Kendi kendine davet, aynı IP/cihaz veya sahte hesaplar tespit edilir ve diskalifiye nedeni sayılır.
          </div>
        </div>
      ` : ''}

      <!-- TRANSPARENCY & AUDIT NOTE -->
      <div style="text-align: center; color: var(--gw-text-muted); font-size: 0.85rem; padding-bottom: 2rem;">
        🔒 Bu çekiliş Eko Yıldız Şeffaflık Standartları ve Kriptografik Rastgele Seçim motoru ile yürütülür.<br>
        Detaylı kurallar ve algoritma için <a href="/cekilisler/seffaflik" style="color: #a855f7; text-decoration: underline;">Şeffaflık & Güvenlik Sayfasını</a> ziyaret edin.
      </div>

    </div>

    <!-- Client Script for Tasks & Actions -->
    <script>
      function copyReferralLink() {
        const input = document.getElementById('refLinkInput');
        if (!input) return;
        input.select();
        navigator.clipboard.writeText(input.value).then(() => {
          showGwToast('✅ Davet bağlantısı kopyalandı!', 'success');
        }).catch(() => {
          showGwToast('Kopyalama başarısız oldu, lütfen manuel kopyalayın.', 'error');
        });
      }

      async function handleTaskSubmit(giveawayId, taskId, targetUrl) {
        if (targetUrl && targetUrl.startsWith('http')) {
          // Open target URL in new tab for user to do task
          window.open(targetUrl, '_blank');
        }

        showGwToast('Görev kontrol ediliyor...', 'info');

        try {
          const res = await fetch('/api/giveaways/' + giveawayId + '/tasks/' + taskId + '/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          if (data.success) {
            triggerConfetti();
            showGwToast('🎉 Tebrikler! Görev doğrulandı, bilet hesabına eklendi!', 'success');
            setTimeout(() => {
              window.location.reload();
            }, 1200);
          } else if (data.status === 'PENDING') {
            showGwToast('⏳ Göreviniz incelemeye alındı. Onaylandığında bildirim alacaksınız.', 'info');
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            showGwToast(data.message || 'Görev doğrulanamadı!', 'error');
          }
        } catch (err) {
          showGwToast('Bir hata oluştu: ' + err.message, 'error');
        }
      }
    </script>
  `;

  return giveawayLayout({
    title: `${giveaway.title} — Eko Yıldız Çekilişleri`,
    description: giveaway.description || 'Eko Yıldız ödüllü çekiliş.',
    content,
    user,
    activeTab: 'home',
    notificationCount
  });
}

module.exports = { renderGiveawayDetailPage };
