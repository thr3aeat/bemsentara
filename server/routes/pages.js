const express = require("express");
const {
  renderMainPage,
  renderDashboard,
  renderTicketsPage,
  renderCreateTicketPage,
  renderNotificationsPage,
  renderStaffPanel,
  renderDebugPage,
  renderProfilePage,
  renderSettingsPage,
  renderLegalPage,
  renderWikiListPage,
  renderWikiArticlePage,
  renderAdminPage,
  renderUserLogsPage,
  renderBriefingOnboardingModal,
  renderLeaderboardPage,
  renderShopPage,
  renderGroupAdminPage,
  renderSocialPage,
  renderTumModlarPage,
  renderEkoYildizAnayasaPage,
} = require("../views");
const { users, tickets, economies, wikiArticles } = require("../../models/Store");
const { isSiteAdmin } = require("../../utils/adminCheck");

const router = express.Router();

router.get("/", (req, res) => {
  res.send(renderMainPage(req.user));
});

router.get("/settings", (req, res) => {
  if (!req.user) return res.redirect("/login");
  res.send(renderSettingsPage(req.user, req.query));
});

router.get("/dashboard", async (req, res) => {
  if (!req.user) return res.redirect("/login");

  let staffProgress = null;
  if (req.user.isStaff || isSiteAdmin(req.user)) {
    try {
      const StaffProgress = require("../../models/StaffProgress");
      staffProgress = await StaffProgress.findOne({ userId: req.user.discordId });
    } catch (err) {
      console.error("Dashboard router staff progress load error:", err.message);
    }
  }

  res.send(renderDashboard(req.user, staffProgress));
});

router.get("/tickets", (req, res) => {
  if (!req.user) return res.redirect("/login");
  res.send(renderTicketsPage(req.user));
});

router.get("/tickets/new", (req, res) => {
  if (!req.user) return res.redirect("/login");
  const { SUPPORT_CATEGORIES } = require("../../config");
  const cats = Object.values(SUPPORT_CATEGORIES).map(c => c.name);
  res.send(renderCreateTicketPage(req.user, cats));
});

router.get("/staff", (req, res) => {
  const { isSiteStaff } = require("../../utils/adminCheck");
  if (!req.user || !isSiteStaff(req.user)) return res.redirect("/");
  res.send(renderStaffPanel(req.user));
});

router.get("/tumodlar", (req, res) => {
  const { isSiteAdmin } = require("../../utils/adminCheck");
  if (!req.user || !isSiteAdmin(req.user)) return res.redirect("/");
  res.send(renderTumModlarPage(req.user));
});

router.get("/debug", (req, res) => {
  if (!req.user || !isSiteAdmin(req.user)) return res.redirect("/");
  const logger = require("../../utils/logger");
  const memory = process.memoryUsage();
  const stats = {
    uptime: process.uptime(),
    memory: {
      rss: Math.round(memory.rss / 1024 / 1024) + "MB",
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + "MB",
    },
    db: {
      users: users.data.size,
      tickets: tickets.data.size,
      economies: economies.data.size,
      wikiArticles: wikiArticles.data.size,
    }
  };
  res.send(renderDebugPage(req.user, stats, logger.getLogs()));
});

// ══════════════════════════════════════════════════════════════════════
// ACCOUNT TRANSFER PAGE - MODERATOR ONLY
// ══════════════════════════════════════════════════════════════════════
router.get("/account-transfer", async (req, res) => {
  if (!req.user) return res.redirect("/login");
  
  try {
    // Moderatör / Yönetici yetkisi kontrolü
    const StaffProgress = require("../../models/StaffProgress");
    const staffProgress = await StaffProgress.findOne({ userId: req.user.discordId });
    const isAuthorized = req.user.isAdmin || req.user.isStaff || (process.env.DISCORD_OWNER_ID && req.user.discordId === process.env.DISCORD_OWNER_ID) || (staffProgress && (staffProgress.adminOverride || (staffProgress.level || 0) >= 2 || staffProgress.status === 'active'));
    
    if (!isAuthorized) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <title>Yetkisiz Erişim</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #0a0a0f; color: #fff; }
            h1 { color: #f43f5e; }
            a { color: #667eea; text-decoration: none; }
          </style>
        </head>
        <body>
          <h1>⛔ Yetkisiz Erişim</h1>
          <p>Bu sayfaya erişmek için Moderatör veya Yönetici yetkisine sahip olmalısınız.</p>
          <a href="/">← Ana Sayfaya Dön</a>
        </body>
        </html>
      `);
    }

    res.render('accountTransfer', {
      user: req.user,
      staffProgress: staffProgress
    });
  } catch (error) {
    console.error('[Pages] Account transfer page error:', error);
    res.status(500).send('Sayfa yüklenirken bir hata oluştu.');
  }
});

router.get("/profile", async (req, res) => {
  if (!req.user) return res.redirect("/login");
  let robloxGroups = [];
  if (req.user.robloxId) {
    try {
      const { fetchUserGroups } = require("../../bot/services/roleSyncService");
      robloxGroups = await fetchUserGroups(req.user.robloxId);
    } catch (err) {
      console.warn("Own profile groups fetch warning:", err.message);
    }
  }
  res.send(renderProfilePage(req.user, req.user, true, robloxGroups));
});

// Herkese açık profil sayfası
router.get("/profile/:discordId", async (req, res) => {
  const targetUser = users.findOne({ discordId: String(req.params.discordId) });
  if (!targetUser) {
    return res.status(404).send(renderLegalPage('Profil Bulunamadı', '<p>Bu kullanıcı bulunamadı veya profilini gizledi.</p>'));
  }
  const isOwn = req.user && String(req.user.discordId) === String(targetUser.discordId);
  let robloxGroups = [];
  if (targetUser.robloxId) {
    try {
      const { fetchUserGroups } = require("../../bot/services/roleSyncService");
      robloxGroups = await fetchUserGroups(targetUser.robloxId);
    } catch (err) {
      console.warn("Public profile groups fetch warning:", err.message);
    }
  }
  res.send(renderProfilePage(req.user, targetUser, isOwn, robloxGroups));
});

router.get("/settings", (req, res) => {
  if (!req.user) return res.redirect("/login");
  res.send(renderSettingsPage(req.user));
});

router.get("/social", (req, res) => {
  if (!req.user) return res.redirect("/login");
  res.send(renderSocialPage(req.user));
});

router.get("/notifications", async (req, res) => {
  if (!req.user) return res.redirect("/login");
  const User = require("../../models/User");
  const freshUser = await User.findById(req.user._id);
  const notifications = freshUser && freshUser.notifications ? freshUser.notifications : [];
  const sorted = [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.send(renderNotificationsPage(req.user, sorted));
});

router.get("/legal/tos", (req, res) => {
  const lang = req.query.lang === 'en' ? 'en' : 'tr';

  const tr = `
    <div style="margin-bottom:2rem;padding:1rem 1.25rem;background:rgba(124,106,247,0.08);border-left:4px solid var(--accent);border-radius:0 12px 12px 0;">
      <p style="color:var(--text);font-size:.92rem;margin:0;font-weight:700;">📌 YASAL UYARI VE HUKUKİ BAĞLAYICILIK BİLDİRİMİ</p>
      <p style="color:var(--muted);font-size:.85rem;margin:.3rem 0 0 0;">Son Güncelleme: 1 Temmuz 2026 | Sürüm: v4.2-Official | Yürürlük Yeri: Türkiye Cumhuriyeti Mevzuatı</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 1 — Taraflar, Yasal Tanımlar ve Sözleşmenin Yürürlüğü</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(124,106,247,0.15);color:var(--accent);font-weight:700;">HUKUKİ ESAS</span>
      </div>
      <p>İşbu Kullanıcı Sözleşmesi ve Hizmet Koşulları ("Sözleşme"), Sentara Bilişim Altyapısı ve EkoYıldız Topluluğu ("Platform", "Sentara", "Biz") ile Platform'a web sitesi, Discord botları, API uçları veya bağlantılı diğer araçlar üzerinden erişim sağlayan gerçek ve tüzel kişi ("Kullanıcı", "Siz") arasında akdedilmiştir. Platforma giriş yapmanız, bot komutlarını tetiklemeniz veya web portalına bağlanmanız işbu koşulları eksiksiz okuduğunuz, anladığınız ve kabul ettiğiniz anlamına gelir.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 2 — Hizmetlerin Kapsamı ve Lisans Koşulları</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(59,130,246,0.15);color:#60a5fa;font-weight:700;">SINIRLI LİSANS</span>
      </div>
      <p>Sentara; Discord ve Roblox hesap doğrulama, bilet/destek yönetim sistemleri, yapay zeka destekli topluluk moderasyonu, sanal ekonomi, wiki bilgi bankası ve topluluk elçisi araçları sunar. Sentara, Kullanıcı'ya platformu yalnızca kişisel, ticari olmayan ve işbu koşullara uygun amaçlarla kullanabilmesi için geri alınabilir, devredilemez ve münhasır olmayan sınırlı bir lisans hakkı tanır.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 3 — Hesap Güvenliği ve Yetkilendirme Yükümlülükleri</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(245,158,11,0.15);color:#fbbf24;font-weight:700;">GÜVENLİK</span>
      </div>
      <p>Platform hizmetlerine erişim için resmi Discord OAuth2 protokolü kullanılır. Roblox hesap eşleştirmesi belirli gelişmiş roller ve oyun içi senkronizasyon için zorunludur. Kullanıcı, hesabına ait oturum bilgilerinin, Discord token güvenliğinin ve bağlantılı hesaplarının güvenliğinden münhasıran sorumludur. Üçüncü taraflarca hesaba yetkisiz erişim sağlanması durumunda derhal platform yönetimine bildirimde bulunulmalıdır.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 4 — 5846 Sayılı FSEK Kapsamında Fikri Mülkiyet ve Telif Hakları</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(239,68,68,0.15);color:#f87171;font-weight:700;">TELİF VE DMCA</span>
      </div>
      <p>Sentara ve EkoYıldız bünyesinde yer alan tüm yazılım kaynak kodları, bot algoritmaları, web arayüz tasarımları, logolar, grafikler, veritabanı yapıları, API mimarisi ve tescilli içerikler 5846 sayılı Fikir ve Sanat Eserleri Kanunu (FSEK), Türk Ticaret Kanunu, Sınai Mülkiyet Kanunu ve uluslararası DMCA telif mevzuatları uyarınca koruma altındadır.</p>
      <ul style="margin:.5rem 0 .5rem 1.5rem;display:flex;flex-direction:column;gap:.3rem;">
        <li>Platform kaynak kodlarının, bot fonksiyonlarının veya arayüzlerinin kopyalanması (cloning), dağıtılması veya satılması kesinlikle yasaktır.</li>
        <li>Tersine mühendislik (reverse engineering), decompile etme veya kaynak kod ayrıştırma girişimlerinde bulunulamaz.</li>
        <li>İzinsiz kopyalama veya fikri mülkiyet ihlallerinde Türk Ceza Kanunu ve FSEK uyarınca maddi ve manevi tazminat davası açılacaktır.</li>
      </ul>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 5 — Kesinlikle Yasaklanmış Faaliyetler ve Siber Güvenlik İhlalleri</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(239,68,68,0.15);color:#f87171;font-weight:700;">YASAKLI EYLEMLER</span>
      </div>
      <p>Kullanıcılar aşağıdaki siber güvenlik ve topluluk ihlallerini gerçekleştirmeyeceğini gayrikabili rücu kabul eder:</p>
      <ul style="margin:.5rem 0 .5rem 1.5rem;display:flex;flex-direction:column;gap:.3rem;">
        <li>DDoS, DoS saldırıları, sunucu kaynaklarını tüketmeye yönelik aşırı istek (rate limit abuse) veya botnet faaliyetleri,</li>
        <li>Veri madenciliği (scraping), otomatik web botları ile kullanıcı veya sunucu verilerinin izinsiz toplanması,</li>
        <li>Güvenlik açıklarının (exploit/bug) kötüye kullanılması veya üçüncü taraflarla paylaşılması (açıklar derhal yönetime rapor edilmelidir),</li>
        <li>Discord Inc. ve Roblox Corporation Kullanım Koşulları ve Topluluk Standartları'na aykırı içerik üretimi veya dağıtımı,</li>
        <li>Dolandırıcılık, hesap çalma, kimlik avı (phishing), sahte fatura veya reklam spam'ı yapmak.</li>
      </ul>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 6 — Sanal Ekonomi, Coinler ve Dijital Ürün Şartları</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(16,185,129,0.15);color:#34d399;font-weight:700;">SANAL EKONOMİ</span>
      </div>
      <p>Platform içerisinde kazanılan veya satın alınan "Sentara Coin", "EkoYıldız Puanı", rütbe, rol veya envanter eşyaları sanal niteliktedir ve herhangi bir yasal para birimine çevrilemez, geri ödenemez ve platform dışı gerçek parayla satılamaz (kara borsa yasağı). Sentara, oyun dengesi veya güvenlik sebepleriyle sanal ekonomi oranlarını ve envanterleri güncelleme yetkisine sahiptir.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 7 — Reklam ve Sponsorluk Masası Koşulları (İtemSatış Güvencesi)</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(245,158,11,0.15);color:#fbbf24;font-weight:700;">TİCARİ KOŞULLAR</span>
      </div>
      <p>EkoYıldız bünyesinde gerçekleştirilen reklam, sponsorluk ve tanıtım siparişleri yalnızca resmi İtemSatış mağazası ve yetkili moderatör masası üzerinden 3D Secure güvencesiyle tahsil edilir. Gayriresmi şahıs hesaplarına gönderilen ödemelerden Sentara sorumlu tutulamaz.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 8 — Moderasyon Yaptırımları, Askıya Alma ve Hesap Feshi</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(239,68,68,0.15);color:#f87171;font-weight:700;">DİSİPLİN</span>
      </div>
      <p>Sözleşme maddelerine veya topluluk ahlakına aykırı davranan kullanıcılar hakkında süreli jail, mute, bilet hakkı engelleme, web oturumu sonlandırma veya kalıcı sunucu yasağı (ban) uygulanabilir. Ağır ihlallerde adli mercilere suç duyurusunda bulunulur.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 9 — Sorumluluğun Sınırlandırılması ve Garanti Reddi (As-Is)</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(124,106,247,0.15);color:var(--accent);font-weight:700;">SORUMLULUK REDDİ</span>
      </div>
      <p>Platform hizmetleri "olduğu gibi" (as-is) ve "mevcut olduğu şekilde" sunulmaktadır. Sentara; üçüncü taraf API kesintilerinden (Discord, Roblox, Groq), internet altyapı arızalarından, donanım kaynaklı veri kayıplarından doğabilecek dolaylı veya doğrudan zararlardan sorumlu tutulamaz.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 10 — Mücbir Sebepler</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(59,130,246,0.15);color:#60a5fa;font-weight:700;">MÜCBİR SEBEP</span>
      </div>
      <p>Doğal afetler, savaş, terör eylemleri, yasal düzenlemeler, elektrik/internet omurga kesintileri, genel siber saldırılar gibi kontrolümüz dışındaki mücbir sebep hallerinde hizmetin aksamasından dolayı Sentara'ya herhangi bir kusur veya tazminat yüklenemez.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 11 — Değişiklikler ve Bildirimler</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(16,185,129,0.15);color:#34d399;font-weight:700;">GÜNCELLEME</span>
      </div>
      <p>Sentara, işbu Hizmet Koşullarını mevzuat değişiklikleri veya platform geliştirmeleri sebebiyle dilediği zaman güncelleme hakkını saklı tutar. Güncellemeler web portalında yayımlandığı andan itibaren bağlayıcıdır.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 12 — Delil Sözleşmesi</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(124,106,247,0.15);color:var(--accent);font-weight:700;">DELİL ESASI</span>
      </div>
      <p>Taraflar arasında çıkabilecek her türlü hukuki uyuşmazlıkta, Sentara'nın sunucu logları, veritabanı kayıtları, Discord mesaj/denetim logları ve elektronik kayıtları Hukuk Muhakemeleri Kanunu (HMK) Madde 193 uyarınca kesin ve münhasır delil teşkil eder.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 13 — Uygulanacak Hukuk ve Yetkili Mahkemeler</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(245,158,11,0.15);color:#fbbf24;font-weight:700;">YARGI YETKİSİ</span>
      </div>
      <p>İşbu Sözleşmenin yorumlanmasında ve uygulanmasında Türkiye Cumhuriyeti Kanunları geçerlidir. Sözleşmeden doğacak tüm ihtilaflarda İstanbul Anadolu Mahkemeleri ve İcra Daireleri münhasıran yetkilidir.</p>
    </div>

    <div class="legal-section" style="margin-bottom:1rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 14 — İletişim, Resmi Başvurular ve Destek Masası</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(16,185,129,0.15);color:#34d399;font-weight:700;">İLETİŞİM</span>
      </div>
      <p>Hizmet koşulları, telif bildirimleri veya destek talepleriniz için resmi Discord sunucumuz üzerinden veya e-posta yoluyla hukuk ve destek birimimizle 7/24 irtibata geçebilirsiniz.</p>
    </div>
  `;

  const en = `
    <div style="margin-bottom:2rem;padding:1rem 1.25rem;background:rgba(124,106,247,0.08);border-left:4px solid var(--accent);border-radius:0 12px 12px 0;">
      <p style="color:var(--text);font-size:.92rem;margin:0;font-weight:700;">📌 OFFICIAL TERMS OF SERVICE & LEGAL NOTICE</p>
      <p style="color:var(--muted);font-size:.85rem;margin:.3rem 0 0 0;">Last Updated: July 1, 2026 | Version: v4.2-Official | Governing Law: Republic of Turkey & International IP Standards</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;">1. Acceptance of Terms & Parties</h2>
      <p>These Terms of Service govern your access to and use of Sentara and EkoYıldız platforms, including web portals, Discord bots, APIs, and associated online services. By logging in or using our services, you agree to be bound by these Terms.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;">2. License Grant & Service Scope</h2>
      <p>Sentara grants you a limited, non-exclusive, non-transferable, revocable license to use the services for personal, non-commercial community purposes in strict compliance with these terms.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;">3. Intellectual Property, Copyright & DMCA Protections</h2>
      <p>All software source code, architecture, UX/UI assets, trademarks, and database schemas are the sole property of Sentara and are protected under Law No. 5846 on Intellectual and Artistic Works, Turkish Commercial Code, and international DMCA frameworks. Reverse engineering, decompiling, cloning, or scraping is strictly prohibited.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;">4. Prohibited Conduct & Cyber Security</h2>
      <p>Users must not engage in DDoS attacks, botnet abuse, exploit sharing, unauthorized scraping, rate-limit exploitation, or violations of Discord or Roblox Community Guidelines.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;">5. Virtual Economy & Goods</h2>
      <p>Virtual items, coins, badges, and roles hold no monetary value outside the platform and cannot be redeemed for real-world currency or transferred via unauthorized external markets.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;">6. Governing Law & Jurisdiction</h2>
      <p>These terms are governed by the laws of the Republic of Turkey. Any disputes shall be settled exclusively in Istanbul Anatolian Courts and Execution Directorates.</p>
    </div>
  `;

  const title = lang === 'en' ? 'Terms of Service (Hizmet Koşulları)' : 'Hizmet Koşulları ve Kullanıcı Sözleşmesi';
  res.send(renderLegalPage(title, lang === 'en' ? en : tr, lang));
});

router.get("/legal/privacy", (req, res) => {
  const lang = req.query.lang === 'en' ? 'en' : 'tr';

  const tr = `
    <div style="margin-bottom:2rem;padding:1rem 1.25rem;background:rgba(16,185,129,0.08);border-left:4px solid #10b981;border-radius:0 12px 12px 0;">
      <p style="color:var(--text);font-size:.92rem;margin:0;font-weight:700;">🛡️ 6698 SAYILI KVKK & GİZLİLİK AYDINLATMA METNİ</p>
      <p style="color:var(--muted);font-size:.85rem;margin:.3rem 0 0 0;">Son Güncelleme: 1 Temmuz 2026 | Sürüm: v4.2-Official | KVKK Madde 10 Uyarınca Hazırlanmıştır</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 1 — Veri Sorumlusu Bilgilendirmesi</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(16,185,129,0.15);color:#34d399;font-weight:700;">KVKK MADDE 10</span>
      </div>
      <p>Sentara Platformu ("Veri Sorumlusu"), 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") ve ilgili mevzuat kapsamında, kullanıcılarımızın kişisel verilerinin güvenliğini, gizliliğini ve hukuka uygun şekilde işlenmesini en üst düzey kurumsal öncelik olarak kabul etmektedir.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 2 — İşlenen Kişisel Veri Kategorileri</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(59,130,246,0.15);color:#60a5fa;font-weight:700;">VERİ ENVANTERİ</span>
      </div>
      <p>Platformumuz tarafından yalnızca hizmetin doğası gereği zorunlu olan sınırlı veriler işlenmektedir:</p>
      <ul style="margin:.5rem 0 .5rem 1.5rem;display:flex;flex-direction:column;gap:.3rem;">
        <li><strong>Kimlik ve Profil Bilgisi:</strong> Discord ID, kullanıcı adı, global ad, avatar URL'si, isteğe bağlı Roblox kullanıcı adı ve ID'si.</li>
        <li><strong>İletişim ve Eşleştirme Verisi:</strong> OAuth2 üzerinden sağlanan e-posta adresi (yalnızca hesap güvenliği ve bildirimler için).</li>
        <li><strong>İşlem ve Destek Verileri:</strong> Bilet (ticket) konu ve mesaj geçmişi, sanal ekonomi hareketleri, rol/izin yetkilendirmeleri.</li>
        <li><strong>Sistem ve Güvenlik Logları:</strong> 5651 sayılı Kanun uyarınca zorunlu IP adresi logları, oturum token'ları, güvenlik ihlal kayıtları.</li>
      </ul>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 3 — Kişisel Verilerin İşlenme Amaçları ve Hukuki Sebepleri</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(124,106,247,0.15);color:var(--accent);font-weight:700;">HUKUKİ SEBEP</span>
      </div>
      <p>Kişisel verileriniz, KVKK'nın 5. maddesinde belirtilen "Sözleşmenin kurulması ve ifası", "Veri sorumlusunun hukuki yükümlülüğü" ve "Meşru menfaat" hukuki sebeplerine dayalı olarak; güvenli oturum açma, bot yetkilendirmeleri, siber saldırıların önlenmesi ve destek hizmetlerinin yürütülmesi amacıyla işlenir.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 4 — Veri Güvenliği ve 256-Bit Kriptografik Önlemler</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(16,185,129,0.15);color:#34d399;font-weight:700;">GÜVENLİK PROTOKOLÜ</span>
      </div>
      <p>Tüm web ve bot haberleşmeleri TLS 1.3 ve 256-bit AES şifreleme ile korunmaktadır. Kullanıcı şifreleri sunucuda asla düz metin (plain-text) olarak saklanmaz. OAuth2 token'ları sunucu tarafında tuzlanmış (salted) hash algoritmaları ile şifrelenir ve istemci tarafına asla sızdırılmaz.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 5 — Üçüncü Taraflara Veri Aktarımı</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(239,68,68,0.15);color:#f87171;font-weight:700;">VERİ SATIŞI YASAĞI</span>
      </div>
      <p>Kişisel verileriniz hiçbir surette ticari, reklam veya pazarlama maksadıyla üçüncü şahıs veya şirketlere satılmaz, kiralanmaz veya devredilmez. Veriler yalnızca resmi yargı makamlarının yasal müzekkereleri doğrultusunda ilgili adli mercilerle paylaşılabilir.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 6 — İlgili Kişinin Hakları (KVKK Madde 11 Kapsamı)</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(124,106,247,0.15);color:var(--accent);font-weight:700;">KULLANICI HAKLARI</span>
      </div>
      <p>KVKK'nın 11. maddesi uyarınca her kullanıcı;</p>
      <ul style="margin:.5rem 0 .5rem 1.5rem;display:flex;flex-direction:column;gap:.3rem;">
        <li>Kişisel verilerinin işlenip işlenmediğini öğrenme,</li>
        <li>Kişisel verileri işlenmişse buna ilişkin bilgi ve döküm talep etme,</li>
        <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
        <li>Eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,</li>
        <li>KVKK 7. maddesi kapsamında verilerinin silinmesini veya yok edilmesini talep etme (Unutulma Hakkı) haklarına sahiptir.</li>
      </ul>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 7 — Veri Saklama Süreleri ve Kalıcı İmha Politikası</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(245,158,11,0.15);color:#fbbf24;font-weight:700;">İMHA POLİTİKASI</span>
      </div>
      <p>Kullanıcı hesabını silme talebinde bulunduğunda, yasal olarak saklanması zorunlu olan 5651 sayılı kanun kapsamındaki erişim logları hariç olmak üzere, profil, bilet ve bağlantılı tüm veriler 30 iş günü içerisinde veritabanından geri döndürülemez biçimde yok edilir.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 8 — Çerezler (Cookies) ve İzleme Tercihleri</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(59,130,246,0.15);color:#60a5fa;font-weight:700;">ÇEREZ POLİTİKASI</span>
      </div>
      <p>Platformumuzda yalnızca oturum güvenliğini sağlayan <code>connect.sid</code> ve kullanıcı arayüz tercihlerini hatırlayan <code>localStorage</code> çerezleri kullanılır. Reklam hedeflemesi veya üçüncü taraf izleme çerezleri kesinlikle kullanılmaz. Tercihlerinizi bu sayfanın altındaki interaktif çerez yöneticisinden anında değiştirebilirsiniz.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 9 — 13 Yaş Altı Çocukların Gizliliği ve COPPA/GDPR Uyumu</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(239,68,68,0.15);color:#f87171;font-weight:700;">ÇOCUK GİZLİLİĞİ</span>
      </div>
      <p>Discord Hizmet Koşulları gereği 13 yaş altındaki bireylerin hesap oluşturması yasaktır. Platformumuz 13 yaş altı çocuklardan bilerek kişisel veri toplamaz. Tespit edilmesi halinde bu hesaplar derhal silinir.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 10 — Güvenlik İhlal Bildirimi (Data Breach Response)</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(124,106,247,0.15);color:var(--accent);font-weight:700;">GÜVENLİK MÜDAHALE</span>
      </div>
      <p>Kişisel verilerin güvenliğini tehdit eden olası bir siber olay veya veri ihlali tespit edildiğinde, durum en geç 72 saat içinde Kişisel Verileri Koruma Kurulu'na (KVKK) ve etkilenen kullanıcılara resmi duyuru kanallarımız üzerinden bildirilir.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 11 — Gizlilik Politikasında Yapılacak Güncellemeler</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(16,185,129,0.15);color:#34d399;font-weight:700;">REVİZYON</span>
      </div>
      <p>İşbu Gizlilik Politikası periyodik olarak mevzuat uyumluluğu doğrultusunda güncellenir. Sayfanın başındaki 'Son Güncelleme' tarihi revizyon zamanını belirtir.</p>
    </div>

    <div class="legal-section" style="margin-bottom:1rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem;">
        <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;margin:0;">Madde 12 — Veri Sorumlusuna Başvuru ve KVKK Talepleri</h2>
        <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:6px;background:rgba(16,185,129,0.15);color:#34d399;font-weight:700;">BAŞVURU KANALI</span>
      </div>
      <p>KVKK kapsamındaki tüm haklarınızı kullanmak, verilerinizi talep etmek veya hesabınızı kalıcı olarak sildirmek için Discord sunucumuzdaki resmi Destek Talebi (Ticket) kanalından başvurabilirsiniz. Başvurularınız en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.</p>
    </div>
  `;

  const en = `
    <div style="margin-bottom:2rem;padding:1rem 1.25rem;background:rgba(16,185,129,0.08);border-left:4px solid #10b981;border-radius:0 12px 12px 0;">
      <p style="color:var(--text);font-size:.92rem;margin:0;font-weight:700;">🛡️ OFFICIAL PRIVACY & DATA PROTECTION NOTICE (KVKK / GDPR COMPLIANT)</p>
      <p style="color:var(--muted);font-size:.85rem;margin:.3rem 0 0 0;">Last Updated: July 1, 2026 | Version: v4.2-Official</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;">1. Data Controller Information</h2>
      <p>Sentara Platform acts as Data Controller and adheres to Law No. 6698 (KVKK) and international data protection standards.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;">2. Categories of Data Processed</h2>
      <p>We only collect strictly necessary identifiers: Discord ID, username, avatar URL, optional Roblox username/ID, session logs, and support ticket interaction history.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;">3. Data Security & 256-bit Encryption</h2>
      <p>All client-server communications use TLS 1.3 and 256-bit AES encryption. Passwords and sensitive tokens are never stored in plaintext.</p>
    </div>

    <div class="legal-section" style="margin-bottom:2rem;">
      <h2 style="color:var(--text);font-size:1.25rem;font-weight:800;">4. Your Rights Under Data Protection Laws</h2>
      <p>You have the full right to access, rectify, port, or permanently delete your stored data by submitting a ticket via our official Discord server.</p>
    </div>
  `;

  const title = lang === 'en' ? 'Privacy Policy & KVKK Notice' : 'Gizlilik ve KVKK Politikası';
  res.send(renderLegalPage(title, lang === 'en' ? en : tr, lang));
});

router.get("/wiki", (req, res) => {
  const articles = wikiArticles.find({}).sort({ createdAt: -1 });
  res.send(renderWikiListPage(req.user, articles, isSiteAdmin(req.user)));
});

router.get("/wiki/:id", (req, res) => {
  const article = wikiArticles.findById(req.params.id);
  if (!article) return res.redirect("/wiki");

  // Görüntülenme sayısını artır (session başına bir kez)
  const viewKey = `wiki_viewed_${req.params.id}`;
  if (!req.session[viewKey]) {
    req.session[viewKey] = true;
    article.views = (article.views || 0) + 1;
    article.save().catch(() => { });
  }

  res.send(renderWikiArticlePage(req.user, article, isSiteAdmin(req.user)));
});

router.get("/admin", (req, res) => {
  if (!req.user || !isSiteAdmin(req.user)) return res.redirect("/");
  res.send(renderAdminPage(req.user));
});

router.get("/user-logs/:userId", async (req, res) => {
  try {
    const userId = String(req.params.userId || '').trim();
    const User = require("../../models/User");
    const UserTrustScore = require("../../models/UserTrustScore");
    const UserActivityLog = require("../../models/UserActivityLog");
    const { tickets, courtCases, investigations } = require("../../models/Store");

    const safeQuery = userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let targetUser = await User.findOne({
      $or: [
        { discordId: userId },
        { _id: userId },
        { robloxId: userId },
        { discordUsername: new RegExp(`^${safeQuery}$`, 'i') },
        { username: new RegExp(`^${safeQuery}$`, 'i') },
        { robloxUsername: new RegExp(`^${safeQuery}$`, 'i') }
      ]
    });

    let resolvedId = targetUser ? (targetUser.discordId || String(targetUser._id)) : userId;
    let trustRecord = await UserTrustScore.findOne({
      $or: [
        { userId: resolvedId },
        { username: new RegExp(`^${safeQuery}$`, 'i') }
      ]
    });

    if (trustRecord && trustRecord.userId) {
      resolvedId = trustRecord.userId;
    }

    // Auto-resolve via Discord Bot if not yet found in local Store
    if (!trustRecord) {
      try {
        const { getDiscordClient } = require("../../bot/discordClient");
        const { ensureUserTrustScore } = require("../../bot/services/security/trustScoreService");
        const botClient = getDiscordClient();
        if (botClient && botClient.isReady()) {
          let fetchedUser = null;
          if (/^\d{17,20}$/.test(userId)) {
            fetchedUser = await botClient.users.fetch(userId).catch(() => null);
          } else {
            for (const guild of botClient.guilds.cache.values()) {
              const members = await guild.members.fetch({ query: userId, limit: 5 }).catch(() => null);
              if (members && members.size > 0) {
                fetchedUser = members.first().user;
                break;
              }
            }
          }

          if (fetchedUser) {
            resolvedId = fetchedUser.id;
            trustRecord = await ensureUserTrustScore(resolvedId, null, botClient, true);
            if (!targetUser) {
              targetUser = {
                discordId: fetchedUser.id,
                discordUsername: fetchedUser.tag,
                discordAvatar: fetchedUser.displayAvatarURL({ dynamic: true })
              };
            }
          }
        }
      } catch (_) {}
    }

    // Fallback if ID is numeric 17-20 digit string
    if (!targetUser && !trustRecord) {
      if (/^\d{17,20}$/.test(userId)) {
        trustRecord = {
          userId: userId,
          username: `Kullanıcı (${userId})`,
          trustScore: 100.0,
          scoreLogs: []
        };
      } else {
        return res.status(404).send(renderLegalPage("Kullanıcı Bulunamadı", "<p>Aramış olduğunuz kullanıcıya ait veri veya log bulunamadı. Lütfen kullanıcı ID veya adını kontrol edin.</p>"));
      }
    }

    const webLogs = UserActivityLog.getByUser(resolvedId, 200) || [];

    let userTickets = [];
    if (tickets) {
      userTickets = tickets.find({ userId: resolvedId }) || [];
    }

    let userCourtCases = [];
    if (courtCases) {
      userCourtCases = courtCases.find({ targetId: resolvedId }) || courtCases.find({ userId: resolvedId }) || [];
    }

    let userInvestigations = [];
    if (investigations) {
      userInvestigations = investigations.find({ targetId: resolvedId }) || investigations.find({ userId: resolvedId }) || [];
    }

    let userLeaves = [];
    try {
      const StaffLeave = require("../../models/StaffLeave");
      userLeaves = await StaffLeave.find({ userId: resolvedId });
    } catch (_) {}

    const extraLogs = {
      tickets: Array.isArray(userTickets) ? userTickets : [],
      courtCases: Array.isArray(userCourtCases) ? userCourtCases : [],
      investigations: Array.isArray(userInvestigations) ? userInvestigations : [],
      leaves: Array.isArray(userLeaves) ? userLeaves : []
    };

    res.send(renderUserLogsPage(req.user, targetUser, trustRecord, webLogs, extraLogs));
  } catch (err) {
    console.error("[user-logs] Error:", err.message);
    res.status(500).send("Sayfa yükleme hatası.");
  }
});

router.get("/group-admin", async (req, res) => {
  if (!req.user) return res.redirect("/login");
  
  const uName = (req.user.discordUsername || req.user.username || "").toLowerCase();
  const isOwner = uName === "ekonqtx";
  const { groupAdmins } = require("../../models/Store");
  const isAdmin = isOwner ||
    req.user.isGroupAdmin ||
    uName === "bugrupyönetimikullaniciadi" ||
    uName === "bugrupyonetimikullaniciadi" ||
    groupAdmins.findOne({ username: uName }) ||
    (req.user.discordUsername && groupAdmins.findOne({ username: req.user.discordUsername.toLowerCase() }));
  
  if (!isAdmin) {
    return res.redirect("/");
  }
  
  res.send(renderGroupAdminPage(req.user, isOwner || uName === "bugrupyönetimikullaniciadi" || uName === "bugrupyonetimikullaniciadi"));
});

router.get("/leaderboard", (req, res) => {
  const { isSiteStaff } = require("../../utils/adminCheck");
  if (!req.user || !isSiteStaff(req.user)) {
    return res.redirect("/");
  }
  const { economies, users } = require("../../models/Store");
  const allEco = economies.find({}).sort({ balance: -1 }).slice(0, 50);
  const topUsers = allEco.map(e => {
    const user = users.findOne({ discordId: e.userId });
    return {
      username: user ? user.discordUsername : "Bilinmiyor",
      avatar: user ? user.discordAvatar : "https://cdn.discordapp.com/embed/avatars/0.png",
      balance: e.balance
    };
  });
  res.send(renderLeaderboardPage(req.user, topUsers));
});

router.get("/shop", (req, res) => {
  const { SHOP_ITEMS } = require("../../bot/config/shopItems");
  res.send(renderShopPage(req.user, SHOP_ITEMS));
});

router.get("/webhook", (req, res) => {
  return res.redirect("/dashboard");
});


// ── Yetkili Formları Dashboard & Etkinlik Yetkilisi Formu ──────────────────────
router.get("/forms", (req, res) => {
  const { renderFormsHubPage } = require("../views");
  res.send(renderFormsHubPage(req.user));
});

router.get("/forms/event-staff", async (req, res) => {
  const { renderEventStaffFormPage } = require("../views");
  const FormSubmission = require("../../models/FormSubmission");
  
  let existingSubmission = null;
  if (req.user) {
    existingSubmission = await FormSubmission.findPendingByUser(req.user.discordId, "event_staff");
  }

  res.send(renderEventStaffFormPage(req.user, existingSubmission));
});

router.get("/forms/community-ambassador", async (req, res) => {
  const { renderCommunityAmbassadorFormPage } = require("../views");
  const FormSubmission = require("../../models/FormSubmission");
  
  let existingSubmission = null;
  if (req.user) {
    existingSubmission = await FormSubmission.findPendingByUser(req.user.discordId, "community_ambassador");
  }

  res.send(renderCommunityAmbassadorFormPage(req.user, existingSubmission));
});

router.get("/forms/topluluk-elcisi", (req, res) => {
  res.redirect("/forms/community-ambassador");
});

router.get("/forms/developer", async (req, res) => {
  const { renderDeveloperFormPage } = require("../views");
  const FormSubmission = require("../../models/FormSubmission");
  
  let existingSubmission = null;
  if (req.user) {
    existingSubmission = await FormSubmission.findPendingByUser(req.user.discordId, "developer");
  }

  res.send(renderDeveloperFormPage(req.user, existingSubmission));
});

router.get("/forms/gelistirici", (req, res) => {
  res.redirect("/forms/developer");
});

router.get("/forms/debug-office", async (req, res) => {
  const { renderDebugOfficeFormPage } = require("../views");
  const FormSubmission = require("../../models/FormSubmission");
  
  let existingSubmission = null;
  if (req.user) {
    existingSubmission = await FormSubmission.findPendingByUser(req.user.discordId, "debug_office");
  }

  res.send(renderDebugOfficeFormPage(req.user, existingSubmission));
});

router.get("/forms/hata-ayiklama", (req, res) => {
  res.redirect("/forms/debug-office");
});

// Briefing Onboarding
router.get("/briefing-form", (req, res) => {
  if (!req.user) return res.redirect("/login");
  
  const BriefingFormCompletion = require("../../models/BriefingFormCompletion");
  const isCompleted = BriefingFormCompletion.isCompleted(req.user.discordId);
  
  if (isCompleted) {
    return res.redirect("/briefing");
  }
  
  res.send(renderBriefingOnboardingModal(req.user));
});

// ── EkoYıldız Topluluğu Anayasası Sayfası ────────────────────────────────────
router.get("/anayasasi", (req, res) => {
  res.send(renderEkoYildizAnayasaPage(req.user));
});

router.get("/anayasa", (req, res) => {
  res.redirect("/anayasasi");
});

router.get("/ekoyildiz/anayasasi", (req, res) => {
  res.redirect("/anayasasi");
});

router.get("/ekoyildiz-anayasasi", (req, res) => {
  res.redirect("/anayasasi");
});

module.exports = router;
