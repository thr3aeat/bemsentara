'use strict';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { EmbedBuilder } = require('discord.js');
const ComponentsV2Factory = require('../utils/componentsV2Factory');
const logger = require('../../utils/logger');

const ANNOUNCE_CHANNEL_ID = '1553530701926629539';
const SHORT_ANNOUNCE_CHANNEL_ID = '1518705723184386198';
const LAST_RESTART_STATE_FILE = path.join(__dirname, '../../data/last_restart_state.json');

/**
 * Git repository bilgilerini güvenli bir şekilde toplar.
 */
function getGitMetadata() {
  const meta = {
    version: '1.0.0',
    commitHash: 'unknown',
    fullHash: '',
    author: 'Geliştirici',
    date: 'Bilinmiyor',
    commitMessage: 'Genel sistem güncellemesi ve iyileştirmeler.',
    changedFiles: [],
    recentCommits: '',
    diffStat: ''
  };

  try {
    const pkg = require('../../package.json');
    if (pkg.version) meta.version = pkg.version;
  } catch (_) {}

  try {
    meta.commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8', timeout: 4000 }).trim();
    meta.fullHash = execSync('git rev-parse HEAD', { encoding: 'utf8', timeout: 4000 }).trim();
    
    const logDetails = execSync('git log -1 --pretty=format:"%s|%an|%cr"', { encoding: 'utf8', timeout: 4000 }).trim();
    const parts = logDetails.split('|');
    if (parts[0]) meta.commitMessage = parts[0].trim();
    if (parts[1]) meta.author = parts[1].trim();
    if (parts[2]) meta.date = parts[2].trim();

    const recent = execSync('git log -3 --pretty=format:"• %h: %s (%cr)"', { encoding: 'utf8', timeout: 4000 }).trim();
    meta.recentCommits = recent;

    const diffOutput = execSync('git diff-tree --no-commit-id --name-status -r HEAD', { encoding: 'utf8', timeout: 4000 }).trim();
    if (diffOutput) {
      meta.changedFiles = diffOutput.split('\n').map(l => l.trim()).filter(Boolean);
    }

    meta.diffStat = execSync('git show --stat --oneline -s HEAD', { encoding: 'utf8', timeout: 4000 }).trim();
  } catch (err) {
    logger.warn(`[StartupAnnounce] Git bilgisi alınırken fallback kullanılıyor: ${err.message}`);
  }

  return meta;
}

/**
 * aiService kullanarak yapılan değişikliklerin neden ve nasıl yapıldığını analiz eder.
 */
async function generateAiChangelog(gitMeta) {
  try {
    const { chatWithAI } = require('./aiService');

    const prompt = `
Aşağıdaki git commit bilgileri ve dosya değişikliklerini incele. EkoYıldız Discord botu ve web platformu yeniden başlatıldı.
Versiyon: v${gitMeta.version} (${gitMeta.commitHash})
Son Commit Mesajı: ${gitMeta.commitMessage}
Yazar: ${gitMeta.author}
Tarih: ${gitMeta.date}

Son Değişen Dosyalar:
${gitMeta.changedFiles.slice(0, 15).join('\n') || 'Belirtilmedi'}

Son Commit Geçmişi:
${gitMeta.recentCommits || 'Yok'}

Görev:
Discord duyuru kanalına paylaşılmak üzere, bu güncellemenin:
1) Neden yapıldığını ve amacını (Örn: hata düzeltmesi, yeni özellik, performans, sponsorluk sayfası revizyonu vb.)
2) Hangi modüllerde / dosyalarda ne gibi değişiklikler ve geliştirmeler yapıldığını
3) Kullanıcılara veya sunucu yönetimine sağlanan faydaları
madde madde, Türkçe, son derece net, profesyonel, modern ve emojilerle zenginleştirilmiş bir şekilde özetle.
Yalnızca özeti yaz; ekstra selamlama veya gevezelik ekleme.
`;

    const aiResponse = await chatWithAI(prompt, 'Sen EkoYıldız sistemlerinin baş mimarısın. Her bot yeniden başladığında yapılan teknik değişiklikleri ve nedenlerini Discord kanalına raporlarsın.');
    if (aiResponse && aiResponse.trim().length > 20) {
      return aiResponse.trim();
    }
  } catch (err) {
    logger.warn(`[StartupAnnounce] AI changelog üretilemedi, standart özet kullanılıyor: ${err.message}`);
  }

  // Fallback özet
  return `🎯 **Güncelleme Amacı:** ${gitMeta.commitMessage}\n` +
         `⚡ **Durum:** Son commit başarıyla derlendi ve sistem yeniden başlatıldı.\n` +
         `📁 **Değişen Dosyalar:** ${gitMeta.changedFiles.length} dosya güncellendi.\n` +
         `🛡️ **Sistem:** Tüm servisler ve 7/24 Discord bağlantısı aktif.`;
}

/**
 * Aynı commit için yalnızca bir kez duyuru: aynı makinedeki birden fazla süreç (PM2 kopyaları,
 * deploy sırasında üst üste binen eski/yeni süreç) atomik kilit dosyasıyla elenir; farklı
 * makine veya silinmiş kilit durumunda kanal geçmişindeki commit etiketine bakılır.
 */
function claimAnnouncement(commitHash) {
  const lockFile = path.join(os.tmpdir(), `sentara-announce-${commitHash}.lock`);
  try {
    fs.writeFileSync(lockFile, String(process.pid), { flag: 'wx' });
    return true;
  } catch (err) {
    return err.code !== 'EEXIST'; // kilit dosyası yazılamıyorsa kanal geçmişi kontrolüne güven
  }
}

async function alreadyAnnouncedInChannel(channel, commitHash, botId) {
  try {
    const messages = await channel.messages.fetch({ limit: 30 });
    return messages.some(m => {
      if (!m.author || m.author.id !== botId) return false;
      if (JSON.stringify(m.components || []).includes(commitHash)) return true; // V2 kısa not
      return (m.embeds || []).some(e => (e.title || '').includes(`[${commitHash}]`)); // sürüm raporu
    });
  } catch (_) {
    return false;
  }
}

/**
 * Bot başladığında hedef kanala versiyon, değişiklikler ve AI analizi gönderir.
 */
async function announceBotStartup(discordClient) {
  if (!discordClient || !discordClient.isReady()) {
    logger.warn('[StartupAnnounce] Discord client hazır değil, bekleniyor...');
    return;
  }

  try {
    const channel = await discordClient.channels.fetch(ANNOUNCE_CHANNEL_ID).catch(() => null);
    if (!channel || typeof channel.send !== 'function') {
      logger.warn(`[StartupAnnounce] Hedef duyuru kanalı bulunamadı (${ANNOUNCE_CHANNEL_ID}).`);
      return;
    }

    const gitMeta = getGitMetadata();

    // Her yeniden başlatmada değil, yalnızca yeni bir commit yayına alındığında duyur.
    if (gitMeta.commitHash && gitMeta.commitHash !== 'unknown') {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 4000)); // eşzamanlı süreçleri dağıt
      if (!claimAnnouncement(gitMeta.commitHash)) {
        logger.info(`[StartupAnnounce] ${gitMeta.commitHash} başka bir süreç tarafından duyuruldu, atlanıyor.`);
        return;
      }
      const botId = discordClient.user && discordClient.user.id;
      const [dup1, dup2] = await Promise.all([
        alreadyAnnouncedInChannel(channel, gitMeta.commitHash, botId),
        discordClient.channels.fetch(SHORT_ANNOUNCE_CHANNEL_ID).catch(() => null)
          .then(ch => (ch ? alreadyAnnouncedInChannel(ch, gitMeta.commitHash, botId) : false))
      ]);
      if (dup1 && dup2) {
        logger.info(`[StartupAnnounce] ${gitMeta.commitHash} kanallarda zaten duyurulmuş, atlanıyor.`);
        return;
      }
    }

    // Prevent duplicate spam on rapid gateway reconnects without new process start
    const restartTimestamp = new Date().toISOString();
    const pid = process.pid;

    logger.info(`[StartupAnnounce] Sürüm analizi yapılıyor (v${gitMeta.version} - ${gitMeta.commitHash})...`);
    const aiAnalysis = await generateAiChangelog(gitMeta);

    const changedFilesText = gitMeta.changedFiles.length > 0
      ? '```diff\n' + gitMeta.changedFiles.slice(0, 10).map(f => {
          if (f.startsWith('A')) return '+ ' + f.slice(2);
          if (f.startsWith('M')) return '! ' + f.slice(2);
          if (f.startsWith('D')) return '- ' + f.slice(2);
          return '• ' + f;
        }).join('\n') + (gitMeta.changedFiles.length > 10 ? `\n... (+${gitMeta.changedFiles.length - 10} dosya daha)` : '') + '\n```'
      : '`Değişiklik listesi derlenemedi`';

    const memoryMb = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const nodeVer = process.version;

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setAuthor({
        name: 'EkoYıldız Bot · Canlıya Alma & Sürüm Raporu',
        iconURL: discordClient.user.displayAvatarURL()
      })
      .setTitle(`🚀 Bot Yeniden Başlatıldı · v${gitMeta.version} [${gitMeta.commitHash}]`)
      .setDescription(aiAnalysis.length > 4000 ? aiAnalysis.slice(0, 3950) + '...' : aiAnalysis)
      .addFields(
        {
          name: '📌 Son Değişiklik / Commit (Neden Yapıldı)',
          value: `**${gitMeta.commitMessage}**\n*Geliştirici:* ${gitMeta.author} • *Zaman:* ${gitMeta.date}`,
          inline: false
        },
        {
          name: `📂 Etkilenen Dosyalar (${gitMeta.changedFiles.length})`,
          value: changedFilesText,
          inline: false
        },
        {
          name: '⚙️ Çalışma Ortamı & Sistem Durumu',
          value: `🟢 **PID:** \`${pid}\` • 🧠 **Bellek (RAM):** \`${memoryMb} MB\` • ⚡ **Node:** \`${nodeVer}\` • 🖥️ **Platform:** \`${process.platform}\``,
          inline: false
        }
      )
      .setFooter({
        text: `EkoYıldız Otomatik Sürüm Denetleyicisi & AI Service • ${new Date().toLocaleTimeString('tr-TR')}`
      })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    logger.success(`[StartupAnnounce] ✅ Başlatma sürüm raporu ${ANNOUNCE_CHANNEL_ID} kanalına başarıyla gönderildi.`);

    // ── 2. KANAL (1518705723184386198): Çok kısa, zarif, Components V2 (accent colorsuz) güncelleme notu ──
    try {
      const shortChannel = await discordClient.channels.fetch(SHORT_ANNOUNCE_CHANNEL_ID).catch(() => null);
      if (shortChannel && typeof shortChannel.send === 'function') {
        const shortNote = await generateShortUpdateNote(gitMeta);
        const unix = Math.floor(Date.now() / 1000);

        const v2MessagePayload = {
          flags: ComponentsV2Factory.FLAGS,
          components: [
            ComponentsV2Factory.container([
              ComponentsV2Factory.text('### 🔄 Sentara güncellendi'),
              ComponentsV2Factory.text(shortNote),
              ComponentsV2Factory.separator(true),
              ComponentsV2Factory.text(`-# v${gitMeta.version} • \`${gitMeta.commitHash}\` • <t:${unix}:R> • EkoYıldız Resmî Altyapı Servisi`)
            ])
          ]
        };

        await shortChannel.send(v2MessagePayload).catch(async (v2Err) => {
          logger.warn(`[StartupAnnounce] Components V2 gönderilemedi, text fallback deneniyor: ${v2Err.message}`);
          await shortChannel.send({ content: `🔄 **Sentara güncellendi**\n${shortNote}\n-# v${gitMeta.version} • \`${gitMeta.commitHash}\`` });
        });

        logger.success(`[StartupAnnounce] ✅ Kısa güncelleme notu ${SHORT_ANNOUNCE_CHANNEL_ID} kanalına başarıyla gönderildi.`);
      }
    } catch (shortErr) {
      logger.warn(`[StartupAnnounce] Kısa güncelleme kanalı gönderim hatası: ${shortErr.message}`);
    }

    try {
      fs.writeFileSync(LAST_RESTART_STATE_FILE, JSON.stringify({
        lastReportedAt: restartTimestamp,
        commit: gitMeta.commitHash,
        version: gitMeta.version,
        pid
      }, null, 2), 'utf8');
    } catch (_) {}

  } catch (err) {
    logger.error(`[StartupAnnounce] Sürüm raporu gönderilirken hata: ${err.message}`);
  }
}

const CORPORATE_SHORT_NOTES = [
  'Çekirdek sistem kararlılığı ve altyapı optimizasyonları tamamlandı.',
  'Periyodik servis bakımı ve operasyonel iyileştirmeler devreye alındı.',
  'Altyapı kararlılığı ve servis güvenilirlik standartları güncellendi.',
  'Sistem mimarisi optimizasyonları ve performans güncellemeleri uygulandı.',
  'Rutin servis optimizasyonları ve altyapı iyileştirmeleri gerçekleştirildi.',
  'Platform kararlılığı ve kesintisiz servis idamesi sağlandı.'
];

/**
 * Teknik detay içermeyen, commit'e göre sabit seçilen kısa kurumsal güncelleme cümlesi.
 * (Yapay zeka çıktısı tutarsız ve anlamsız cümleler ürettiği için kullanılmıyor.)
 */
async function generateShortUpdateNote(gitMeta = {}) {
  // Deterministic selection based on commit hash
  let hashNum = 0;
  const hash = String(gitMeta.commitHash || gitMeta.fullHash || 'ekoyildiz');
  for (let i = 0; i < hash.length; i++) {
    hashNum = (hashNum + hash.charCodeAt(i)) % CORPORATE_SHORT_NOTES.length;
  }
  let selectedNote = CORPORATE_SHORT_NOTES[hashNum];

  if (!selectedNote.endsWith('.')) {
    selectedNote += '.';
  }
  return selectedNote;
}

module.exports = {
  announceBotStartup,
  getGitMetadata,
  generateAiChangelog,
  generateShortUpdateNote,
  ANNOUNCE_CHANNEL_ID,
  SHORT_ANNOUNCE_CHANNEL_ID
};
