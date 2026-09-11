// server/views/giveaways/giveawayDetailPage.js
'use strict';

const { giveawayLayout } = require('./giveawayLayout');

function renderGiveawayDetailPage({ user, giveaway, tasks = [], userEntry = null, userTasks = [], winners = [], referralCode = '', notificationCount = 0 }) {
  const isActive = giveaway.status === 'ACTIVE';
  const isEnded = giveaway.status === 'ENDED' || giveaway.status === 'COMPLETED';
  const isScheduled = giveaway.status === 'SCHEDULED';
  
  const userTickets = userEntry ? (Number(userEntry.tickets) || 0) : 0;
  
  // Görev durum haritası
  const taskStatusMap = {};
  const taskProofMap = {};
  if (Array.isArray(userTasks)) {
    userTasks.forEach(t => {
      taskStatusMap[t.taskId] = t.status;
      if (t.proof) taskProofMap[t.taskId] = t.proof;
    });
  }

  const daysLeft = Math.max(0, Math.ceil((new Date(giveaway.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const totalMandatory = tasks.filter(t => t.isRequired).length;
  const completedMandatory = tasks.filter(t => t.isRequired && taskStatusMap[t._id || t.id] === 'VERIFIED').length;

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
            <div style="font-size: 1.2rem; font-weight: 900; color: #fff;">👥 ${(giveaway.totalParticipants || 0).toLocaleString('tr-TR')}</div>
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
              <div style="background: var(--gw-primary); color: #fff; padding: 0.5rem 1.25rem; border-radius: 9999px; font-weight: 800; font-size: 0.95rem; box-shadow: 0 4px 14px rgba(168, 85, 247, 0.4);">
                ✅ KATILDIN (${userTickets} Bilet)
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
              <div style="font-size: 0.85rem; color: var(--gw-text-muted);">Kriptografik ağırlıklı rastgele çekiliş motoru ile belirlenen kazanan(lar):</div>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-top: 1rem;">
            ${winners && winners.length > 0 ? winners.map((w, idx) => `
              <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(234, 179, 8, 0.4); border-radius: 0.75rem; padding: 1rem; display: flex; align-items: center; gap: 1rem;">
                <div style="font-size: 1.5rem; font-weight: 900; color: #fbbf24;">${w.isBackup ? 'Yedek' : '#' + (idx + 1)}</div>
                <div>
                  <div style="font-weight: 800; color: #fff; font-size: 1.05rem;">@${w.maskedUsername || w.username || 'Kazanan'}</div>
                  <div style="font-size: 0.8rem; color: var(--gw-text-muted);">Çekiliş Bileti: <span style="color: #a855f7; font-weight:700;">${w.ticketCount || 1} bilet</span></div>
                </div>
              </div>
            `).join('') : `
              <div style="color: var(--gw-text-muted); font-size: 0.9rem;">Kazanan seçimi bekleniyor veya admin tarafından çekiliş yürütülüyor.</div>
            `}
          </div>

          <div style="margin-top: 1.25rem; text-align: right;">
            <a href="/cekilisler/canli/${giveaway._id}" class="gw-btn gw-btn-secondary" style="font-size: 0.85rem; border-color: #eab308; color: #fef08a;">
              📺 Canlı Çekiliş Ekranını Aç
            </a>
          </div>
        </div>
      ` : ''}

      <!-- GIVEAWAY DESCRIPTION & DETAILS -->
      <div class="gw-card" style="padding: 1.75rem; margin-bottom: 2rem;">
        <h3 style="font-size: 1.25rem; font-weight: 800; margin: 0 0 1rem; color: #fff;">Çekiliş Açıklaması & Kuralları</h3>
        <div style="color: var(--gw-text-muted); line-height: 1.7; font-size: 0.95rem;">
          ${giveaway.description ? giveaway.description.replace(/\n/g, '<br>') : 'Eko Yıldız topluluğu için özel olarak hazırlanan bu çekilişe katılarak büyük ödülü kazanma şansı yakala! Görevleri tamamladıkça bilet sayın artar.'}
        </div>
      </div>

      <!-- TASKS SECTION -->
      <div style="margin-bottom: 2.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
          <div>
            <h2 style="font-size: 1.4rem; font-weight: 900; margin: 0; color: #fff;">🎯 Çekiliş Görevleri & Bilet Kazanma</h2>
            <p style="font-size: 0.85rem; color: var(--gw-text-muted); margin: 0.25rem 0 0;">
              Her görev durumuna göre doğrulanır. Sosyal medya linkleri tıklandığında ziyaret kaydedilir, inceleme tamamlanınca biletler tanımlanır.
            </p>
          </div>
          <div style="font-size: 0.85rem; color: #a855f7; font-weight: 700;">
            ${tasks.length} Görev Mevcut
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${tasks && tasks.length > 0 ? tasks.map((task) => {
            const taskId = task._id || task.id;
            const status = taskStatusMap[taskId] || 'NOT_STARTED';
            const isCompleted = status === 'VERIFIED';
            const isVisited = status === 'VISITED';
            const isPending = status === 'PENDING';
            const isRejected = status === 'REJECTED';

            let platformIcon = task.icon || '🎯';
            if (task.platform === 'youtube') platformIcon = '📺';
            if (task.platform === 'discord') platformIcon = '💬';
            if (task.platform === 'instagram') platformIcon = '📸';
            if (task.platform === 'tiktok') platformIcon = '🎵';
            if (task.platform === 'kick') platformIcon = '🟢';
            if (task.platform === 'twitch') platformIcon = '🟣';
            if (task.platform === 'invite') platformIcon = '🤝';

            const strategy = task.strategy || 'VISIT_ONLY';
            const needsProof = strategy === 'PROOF_REQUIRED' || strategy === 'MANUAL';

            return `
              <div class="gw-card" style="padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1.25rem; flex-wrap: wrap; border-left: 4px solid ${isCompleted ? '#22c55e' : (isPending ? '#eab308' : (isVisited ? '#38bdf8' : (isRejected ? '#ef4444' : '#a855f7')))};">
                <div style="display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 250px;">
                  <div style="width: 44px; height: 44px; border-radius: 0.75rem; background: rgba(168, 85, 247, 0.15); display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
                    ${platformIcon}
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                      <span style="font-weight: 800; font-size: 1.05rem; color: #fff;">${task.title}</span>
                      ${task.isRequired ? '<span class="gw-badge" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; font-size: 0.7rem;">ZORUNLU</span>' : ''}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--gw-text-muted); margin-top: 0.2rem;">
                      ${task.description || 'Görevi verilen bağlantı üzerinden tamamlayın.'}
                    </div>
                    ${isVisited ? `
                      <div style="font-size: 0.75rem; color: #38bdf8; margin-top: 0.25rem; font-weight: 600;">
                        ℹ️ Bağlantıyı ziyaret ettin ancak işlem henüz kesin olarak doğrulanmadı.
                      </div>
                    ` : ''}
                    ${isPending ? `
                      <div style="font-size: 0.75rem; color: #fbbf24; margin-top: 0.25rem; font-weight: 600;">
                        ⏳ Görev kontrol bekliyor. Yetkili onayından sonra bilet yüklenecektir.
                      </div>
                    ` : ''}
                    ${isRejected ? `
                      <div style="font-size: 0.75rem; color: #ef4444; margin-top: 0.25rem; font-weight: 600;">
                        ❌ Görev reddedildi. Lütfen geçerli kanıt ile tekrar deneyin.
                      </div>
                    ` : ''}
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 1rem;">
                  <div style="text-align: right;">
                    <div style="font-size: 1.15rem; font-weight: 900; color: #a855f7;">+${task.tickets || 1} Bilet</div>
                    <div style="font-size: 0.75rem; color: var(--gw-text-muted);">Çekiliş Hakkı</div>
                  </div>

                  <div>
                    ${!user ? `
                      <a href="/login?redirect=/cekilisler/${giveaway.slug || giveaway._id}" class="gw-btn gw-btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                        Giriş Yap
                      </a>
                    ` : (isCompleted ? `
                      <span class="gw-badge gw-badge-active" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                        ✅ Doğrulandı (+${task.tickets || 1} Hak)
                      </span>
                    ` : (isPending ? `
                      <span class="gw-badge gw-badge-scheduled" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                        ⏳ Kontrol Bekliyor
                      </span>
                    ` : (isVisited && !needsProof ? `
                      <span class="gw-badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 0.5rem 1rem; font-size: 0.85rem;">
                        👁️ Ziyaret Edildi
                      </span>
                    ` : (needsProof ? `
                      <button onclick="openProofModal('${giveaway._id}', '${taskId}', '${task.title}', '${task.link || ''}')" class="gw-btn gw-btn-primary" style="padding: 0.5rem 1.25rem; font-size: 0.85rem;" ${!isActive ? 'disabled' : ''}>
                        ✍️ Kanıt Gönder
                      </button>
                    ` : `
                      <button onclick="handleTaskAction('${giveaway._id}', '${taskId}', '${task.link || ''}', '${strategy}')" class="gw-btn gw-btn-primary" style="padding: 0.5rem 1.25rem; font-size: 0.85rem;" ${!isActive ? 'disabled' : ''}>
                        🚀 Bağlantıya Git
                      </button>
                    `))))}
                  </div>
                </div>
              </div>
            `;
          }).join('') : `
            <div class="gw-card" style="padding: 2rem; text-align: center; color: var(--gw-text-muted);">
              Bu çekiliş için henüz özel görev tanımlanmadı.
            </div>
          `}
        </div>
      </div>

      <!-- REFERRAL & INVITE SECTION -->
      ${user ? `
        <div id="referral-box" style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%); border: 1px solid var(--gw-border); border-radius: 1.25rem; padding: 1.75rem; margin-bottom: 2.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
            <span style="font-size: 1.75rem;">🤝</span>
            <div>
              <h3 style="font-size: 1.25rem; font-weight: 800; margin: 0; color: #fff;">Arkadaşını Davet Et (+${giveaway.referralTickets || 2} Bilet Kazan)</h3>
              <div style="font-size: 0.85rem; color: var(--gw-text-muted);">
                Özel davet bağlantını paylaş! Arkadaşın çekilişe katılıp ilk görevini tamamladığında bonus biletlerin anında yüklenir.
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem;">
            <input type="text" id="refLinkInput" readonly value="/r/${referralCode || user._id}" style="flex: 1; min-width: 260px; background: rgba(15, 23, 42, 0.8); border: 1px solid var(--gw-border); color: #fff; padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.9rem; font-family: monospace;">
            <button onclick="copyReferralLink()" class="gw-btn gw-btn-primary" style="padding: 0.75rem 1.5rem;">
              📋 Kopyala
            </button>
          </div>
          <div style="font-size: 0.75rem; color: var(--gw-text-muted); margin-top: 0.75rem;">
            🛡️ Adil Katılım Güvencesi: Kendi kendine davet, aynı IP/cihaz ve sahte bot hesaplar otomatik tespit edilir.
          </div>
        </div>
      ` : ''}

      <!-- TRANSPARENCY & AUDIT NOTE -->
      <div style="text-align: center; color: var(--gw-text-muted); font-size: 0.85rem; padding-bottom: 2rem;">
        🔒 Bu çekiliş Eko Yıldız Şeffaflık Standartları ve Kriptografik Rastgele Seçim motoru ile yürütülür.<br>
        Detaylı kurallar ve algoritma için <a href="/cekilisler/seffaflik" style="color: #a855f7; text-decoration: underline;">Şeffaflık & Güvenlik Sayfasını</a> ziyaret edin.
      </div>

    </div>

    <!-- PROOF SUBMIT MODAL -->
    <div id="proofModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); z-index: 99999; align-items: center; justify-content: center; padding: 1rem;">
      <div style="background: #1e293b; border: 1px solid var(--gw-border); border-radius: 1rem; max-width: 480px; width: 100%; padding: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
        <h3 id="modalTaskTitle" style="color: #fff; font-size: 1.2rem; font-weight: 800; margin: 0 0 0.5rem;">Kanıt Gönder</h3>
        <p style="font-size: 0.85rem; color: var(--gw-text-muted); margin: 0 0 1rem;">
          Bu görevin doğrulanması için kullanıcı adınızı, yorum linkinizi veya kanıt bağlantınızı giriniz:
        </p>
        <input type="hidden" id="modalGiveawayId">
        <input type="hidden" id="modalTaskId">
        <input type="hidden" id="modalTargetUrl">
        <textarea id="modalProofInput" rows="3" placeholder="Örn: YouTube kullanıcı adım @ahmet34 veya yorum linkim..." style="width: 100%; background: #0f172a; border: 1px solid var(--gw-border); color: #fff; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.9rem; margin-bottom: 1rem; box-sizing: border-box;"></textarea>
        
        <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
          <button onclick="closeProofModal()" class="gw-btn gw-btn-secondary" style="padding: 0.5rem 1rem;">Vazgeç</button>
          <button onclick="submitProofAction()" class="gw-btn gw-btn-primary" style="padding: 0.5rem 1.25rem;">Gönder & Doğrula</button>
        </div>
      </div>
    </div>

    <!-- Client Script for Tasks & Actions -->
    <script>
      function copyReferralLink() {
        const input = document.getElementById('refLinkInput');
        if (!input) return;
        const fullUrl = window.location.origin + input.value;
        navigator.clipboard.writeText(fullUrl).then(() => {
          showGwToast('✅ Davet bağlantısı kopyalandı!', 'success');
        }).catch(() => {
          input.value = fullUrl;
          input.select();
          showGwToast('Kopyalama başarısız oldu, lütfen manuel kopyalayın.', 'error');
        });
      }

      function openProofModal(giveawayId, taskId, taskTitle, targetUrl) {
        document.getElementById('modalGiveawayId').value = giveawayId;
        document.getElementById('modalTaskId').value = taskId;
        document.getElementById('modalTargetUrl').value = targetUrl;
        document.getElementById('modalTaskTitle').textContent = taskTitle + ' — Kanıt Bildirimi';
        document.getElementById('modalProofInput').value = '';
        document.getElementById('proofModal').style.display = 'flex';

        if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
        }
      }

      function closeProofModal() {
        document.getElementById('proofModal').style.display = 'none';
      }

      async function submitProofAction() {
        const giveawayId = document.getElementById('modalGiveawayId').value;
        const taskId = document.getElementById('modalTaskId').value;
        const proof = document.getElementById('modalProofInput').value.trim();

        if (proof.length < 3) {
          showGwToast('Lütfen geçerli bir kanıt bilgisi girin (en az 3 karakter).', 'error');
          return;
        }

        try {
          const res = await fetch('/api/giveaways/' + giveawayId + '/tasks/' + taskId + '/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proof })
          });
          const data = await res.json();
          closeProofModal();

          if (data.success) {
            showGwToast(data.message || 'Göreviniz incelemeye alındı.', 'info');
            setTimeout(() => window.location.reload(), 1200);
          } else {
            showGwToast(data.message || 'Görev gönderilemedi!', 'error');
          }
        } catch (err) {
          showGwToast('İşlem başarısız: ' + err.message, 'error');
        }
      }

      async function handleTaskAction(giveawayId, taskId, targetUrl, strategy) {
        if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
        }

        try {
          if (strategy === 'AUTO' || strategy === 'API') {
            const res = await fetch('/api/giveaways/' + giveawayId + '/tasks/' + taskId + '/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({})
            });
            const data = await res.json();
            if (data.success) {
              if (data.status === 'VERIFIED') {
                triggerConfetti();
                showGwToast(data.message || '🎉 Görev başarıyla doğrulandı!', 'success');
              } else {
                showGwToast(data.message || '⏳ İncelemeye alındı.', 'info');
              }
              setTimeout(() => window.location.reload(), 1200);
            } else {
              showGwToast(data.message || 'Doğrulama başarısız oldu.', 'error');
            }
          } else {
            // VISIT_ONLY or external
            const res = await fetch('/api/giveaways/' + giveawayId + '/tasks/' + taskId + '/visit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({})
            });
            const data = await res.json();
            if (data.success) {
              showGwToast(data.message || 'Bağlantı ziyaret edildi.', 'info');
              setTimeout(() => window.location.reload(), 1200);
            } else {
              showGwToast(data.message || 'İşlem kaydedilemedi.', 'error');
            }
          }
        } catch (err) {
          showGwToast('Hata: ' + err.message, 'error');
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
