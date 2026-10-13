'use strict';

/**
 * dailyUpdateNoteService.js
 *
 * #güncelleme-notları kanalındaki kısa, samimi not.
 *  - GÜNDE EN FAZLA BİR KEZ atılır (kaç deploy/yeniden başlatma olursa olsun).
 *  - Metin her seferinde yapay zekayla (aiService) yeniden yazılır; önceki notlara benzemesin diye
 *    kanalın son notları modele "tekrar etme" diye verilir.
 *  - Güncellemeyi anlatmaz. Küçük güncellemede yalnızca sıcak, genel bir cümle; yalnızca ÇOK BÜYÜK
 *    bir güncelleme varsa "sneak peek" tadında, ayrıntı vermeyen küçük bir ipucu.
 *  - Model çıktısı güvenlik filtresinden geçer (kod, bağlantı, komut adı, teknik/gizli kelimeler yok);
 *    geçmezse veya model yanıt vermezse hazır samimi cümlelerden biri kullanılır.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { MessageFlags } = require('discord.js');
const ComponentsV2Factory = require('../utils/componentsV2Factory');
const logger = require('../../utils/logger');

const BIG_MIN_FILES = Number(process.env.BIG_UPDATE_MIN_FILES) || 10;
const BIG_MIN_LINES = Number(process.env.BIG_UPDATE_MIN_LINES) || 500;
const HISTORY_LIMIT = 40;
const MAX_NOTE_LENGTH = 200;

// Kullanıcıya görünmemesi gereken şeyler: kod parçası, bağlantı, komut, hash, dosya adı, teknik/gizli kelimeler.
// Türkçe harfler için \b çalışmaz; harf/rakam komşuluğuna bakan unicode eşleşme kullanılır.
const word = (list) => new RegExp(`(?<![\\p{L}\\d])(?:${list})(?![\\p{L}\\d])`, 'iu');
const FORBIDDEN = [
  /`/, /https?:\/\//i, /(?<![\p{L}\d])e!/iu, /[@#]\p{L}/u, /(?<![\p{L}\d])[0-9a-f]{7,40}(?![\p{L}\d])/iu, /\.(js|json|md|ts)(?![\p{L}\d])/i,
  word('commit|merge|deploy|git|hotfix|bug|patch|yama|changelog|sürüm|versiyon|v\\d+\\.\\d+'),
  word('admin|ticket|itiraf|token|şifre|parola|api|key|mongo|mongodb|sunucu|vds|render|webhook|database|veritabanı'),
  // Olmayan bir zaman sözü verme (ne zaman açıklanacağını bilmiyoruz)
  word('bu gece|gece yarısı|bu akşam|yarın|haftaya|saat \\d+|\\d+ gün sonra|birazdan')
];

// Yalnızca büyük günde serbest olan "bir şey geliyor" ipuçları
const TEASER = word('yakında|yakın zamanda|sürpriz|geliyor|pişiyor|perde|sır|ipucu|hazır ol|merak');

const FALLBACK_SMALL = [
  'Sentara bugün biraz daha pürüzsüz çalışıyor ✨',
  'Arka planda küçük cilalar yaptık, fark edersen ne mutlu 🌿',
  'Ufak tefek dokunuşlarla her şey biraz daha yerine oturdu ☕',
  'Bugün Sentara biraz daha keyifli, bir bak istersen 🙂',
  'Köşe bucak süpürdük, ortalık pırıl pırıl ✨',
  'Küçük ince ayarlar tamam, sohbet devam 💬'
];
const FALLBACK_BIG = [
  'Bir şeyler pişiyor 👀 Yakında fark edeceksin.',
  'Perde arkasında güzel bir şey var… şimdilik sır 🤫',
  'Bugün kapının ardına küçük bir bakış: yakında hoşuna gidecek bir şey geliyor 👀',
  'Uzun süredir üzerinde çalıştığımız bir şey var, ipucu: merak etmeye değer 🎁',
  'Gözünü açık tut, yakında ortalık biraz değişebilir 👀'
];

const trDateKey = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });

function dayHash(dateKey) {
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) h = (h * 31 + dateKey.charCodeAt(i)) >>> 0;
  return h;
}

function pickFallbackNote(big, dateKey) {
  const pool = big ? FALLBACK_BIG : FALLBACK_SMALL;
  return pool[dayHash(dateKey) % pool.length];
}

// ── Güncellemenin büyüklüğü ──────────────────────────────────────────────────

function sh(cmd, cwd) {
  return execSync(cmd, { cwd, encoding: 'utf8', timeout: 6000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

// Kullanıcıya görünür olmayan değişiklikler (veri, test, belge, dağıtım şablonu, kilit dosyası) büyüklüğe sayılmaz.
const PATHSPEC = '-- . ":(exclude)data" ":(exclude)tests" ":(exclude)test" ":(exclude)docs" ":(exclude)deploy" ":(exclude)package-lock.json"';

/**
 * Son duyurudan (yoksa yalnızca son commit'ten) bu yana değişikliğin kapsamı.
 * @returns {{files:number, lines:number, subjects:string[], hasFeat:boolean, since:string|null}}
 */
function getUpdateScope({ prevHash = null, cwd = process.cwd() } = {}) {
  const scope = { files: 0, lines: 0, subjects: [], hasFeat: false, since: null };
  try {
    let range = null;
    if (prevHash && /^[0-9a-f]{7,40}$/i.test(prevHash)) {
      try { sh(`git cat-file -e ${prevHash}^{commit}`, cwd); range = `${prevHash}..HEAD`; scope.since = prevHash; } catch (_) { /* tanınmayan commit */ }
    }
    const numstat = range
      ? sh(`git diff --numstat ${range} ${PATHSPEC}`, cwd)
      : sh(`git show --numstat --format= HEAD ${PATHSPEC}`, cwd);
    for (const line of numstat.split('\n').filter(Boolean)) {
      const [add, del] = line.split('\t');
      scope.files++;
      scope.lines += (Number(add) || 0) + (Number(del) || 0); // ikili dosyada "-" => 0
    }
    const subjects = range ? sh(`git log --format=%s -n 30 ${range}`, cwd) : sh('git log --format=%s -n 1 HEAD', cwd);
    scope.subjects = subjects.split('\n').map((s) => s.trim()).filter(Boolean);
    scope.hasFeat = scope.subjects.some((s) => /^feat(\([^)]*\))?!?:/i.test(s));
  } catch (err) {
    logger.warn(`[DailyNote] Güncelleme kapsamı okunamadı: ${err.message}`);
  }
  return scope;
}

/** "Çok büyük": yeni bir özellik içeriyor VE geniş (çok dosya veya çok satır). */
function isBigUpdate(scope) {
  return !!scope && scope.hasFeat && (scope.files >= BIG_MIN_FILES || scope.lines >= BIG_MIN_LINES);
}

// ── Kanal geçmişi ────────────────────────────────────────────────────────────

function collectTexts(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (typeof node.content === 'string') out.push(node.content);
  for (const key of ['components']) if (Array.isArray(node[key])) node[key].forEach((c) => collectTexts(c, out));
  return out;
}

/** Botun son Components V2 mesajları (yeniden eskiye): tarih, metinler, varsa commit etiketi. */
async function readBotNotes(channel, botId) {
  try {
    const messages = await channel.messages.fetch({ limit: HISTORY_LIMIT });
    const list = [...(messages.values ? messages.values() : [])]
      .filter((m) => m.author && m.author.id === botId && m.flags && m.flags.has(MessageFlags.IsComponentsV2))
      .sort((a, b) => (b.createdTimestamp || +b.createdAt || 0) - (a.createdTimestamp || +a.createdAt || 0));
    return list.map((m) => {
      const json = JSON.parse(JSON.stringify(m.components || []));
      const texts = collectTexts({ components: json });
      const tag = /`([0-9a-f]{7,40})`/i.exec(texts.join('\n'));
      const created = m.createdAt || new Date(m.createdTimestamp);
      return { dateKey: trDateKey(created), texts, hash: tag ? tag[1] : null };
    });
  } catch (_) {
    return [];
  }
}

// ── Metin üretimi ────────────────────────────────────────────────────────────

/** Model çıktısını temizler; güvenli değilse null döner. Küçük günde "bir şey geliyor" ipuçları da reddedilir. */
function cleanNote(raw, { big = true } = {}) {
  if (!raw || typeof raw !== 'string') return null;
  let t = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/[*_~>#]/g, '').replace(/["“”«»]/g, '').trim();
  t = t.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 2).join(' ');
  if (t.length < 12 || t.length > MAX_NOTE_LENGTH) return null;
  if (FORBIDDEN.some((re) => re.test(t))) return null;
  if (!big && TEASER.test(t)) return null; // sıradan günde yeni bir şey geliyormuş izlenimi verme
  return t;
}

const SYSTEM_PROMPT =
  'Sen Sentara adlı Discord topluluğunun samimi, sıcak, esprili sesisin. Arkadaşına yazar gibi, kısa ve doğal Türkçe yazarsın. ' +
  'Asla teknik terim, kod, komut, dosya adı, özellik adı, kanal adı veya ayrıntı vermezsin. Sürüm/commit/deploy gibi kelimeleri kullanmazsın. ' +
  'Abartılı, dramatik ya da film fragmanı gibi bir ton kullanmazsın; bir arkadaşın göz kırpması kadar hafif ve sıcaksın. ' +
  'Ne zaman bir şey olacağına dair söz vermezsin ("bu gece", "yarın", "gece yarısı" gibi zaman ifadeleri yok).';

function buildPrompt({ big, subjects, recentNotes }) {
  const avoid = recentNotes.length ? `\nŞu cümlelere benzeme, farklı bir açı ve farklı kelimeler seç:\n- ${recentNotes.join('\n- ')}` : '';
  if (big) {
    const hint = subjects.slice(0, 6).map((s) => s.replace(/^[a-z]+(\([^)]*\))?!?:\s*/i, '')).join('; ');
    return (
      'Topluluğa gerçekten büyük bir yenilik geliyor. Bunu bir "sneak peek" gibi, tek kısa ve sıcak cümleyle ima et: hafifçe merak uyandır ' +
      'ama NE olduğunu, adını veya ayrıntısını ASLA söyleme, ne zaman geleceğini de söyleme. Sadece küçük, samimi bir göz kırpma olsun. Bir emoji yeter.\n' +
      `(Yalnızca senin bağlamın için, yazma: ${hint})${avoid}\n` +
      `Sadece mesajı yaz, en fazla ${MAX_NOTE_LENGTH} karakter.`
    );
  }
  return (
    'Bugün Sentara\'da yalnızca küçük iyileştirmeler oldu. Bunu hiç ayrıntı vermeden, tek kısa ve sıcak bir cümleyle, ' +
    'adeta "ortalık biraz daha pürüzsüz" havasında söyle. "Güncelleme" gibi resmi bir dil kullanma. ' +
    'Yeni bir şey geleceği, sürpriz veya "yakında" gibi bir izlenim VERME; sadece şu anki hoş hissi anlat. Bir emoji olabilir.' +
    `${avoid}\nSadece mesajı yaz, en fazla 120 karakter.`
  );
}

/**
 * @param {{big:boolean, subjects:string[], recentNotes:string[], chat?:Function, dateKey:string}} o
 * @returns {Promise<{text:string, source:'ai'|'fallback'}>}
 */
async function generateFriendlyNote({ big, subjects = [], recentNotes = [], chat, dateKey }) {
  try {
    const ask = chat || require('./aiService').chatWithAI;
    const raw = await ask([{ role: 'user', content: buildPrompt({ big, subjects, recentNotes }) }], SYSTEM_PROMPT, 'ticket', { max_tokens: 160, temperature: 0.95 });
    const note = cleanNote(raw, { big });
    const repeated = note && recentNotes.some((r) => r.trim().toLowerCase() === note.toLowerCase());
    if (note && !repeated) return { text: note, source: 'ai' };
    logger.warn('[DailyNote] AI notu filtreden geçmedi veya tekrar etti, hazır cümle kullanılıyor.');
  } catch (err) {
    logger.warn(`[DailyNote] AI notu üretilemedi, hazır cümle kullanılıyor: ${err.message}`);
  }
  let text = pickFallbackNote(big, dateKey);
  if (recentNotes.includes(text)) {
    const pool = big ? FALLBACK_BIG : FALLBACK_SMALL;
    text = pool.find((p) => !recentNotes.includes(p)) || text;
  }
  return { text, source: 'fallback' };
}

function buildNotePayload({ note, version, commitHash, now = Date.now() }) {
  const unix = Math.floor(now / 1000);
  return {
    flags: ComponentsV2Factory.FLAGS,
    components: [
      ComponentsV2Factory.container([
        ComponentsV2Factory.text(note),
        ComponentsV2Factory.text(`-# v${version} • \`${commitHash}\` • <t:${unix}:R>`)
      ])
    ]
  };
}

// ── Günde bir kez ────────────────────────────────────────────────────────────

/**
 * Günün notunu, bugün zaten atılmadıysa gönderir.
 * Tekrar önleme: (1) kanal geçmişinde botun bugünkü V2 mesajı var mı, (2) aynı makinedeki
 * eşzamanlı süreçler için günlük atomik kilit dosyası. Gönderim başarısız olursa kilit bırakılır.
 * @returns {Promise<{posted:boolean, reason?:string, note?:string, big?:boolean, source?:string}>}
 */
async function postDailyFriendlyNote({ channel, botId, gitMeta, chat, now = new Date(), lockDir = os.tmpdir(), cwd = process.cwd() }) {
  const dateKey = trDateKey(now);
  const history = await readBotNotes(channel, botId);

  if (history.some((h) => h.dateKey === dateKey)) return { posted: false, reason: 'bugün zaten atıldı' };

  const lockFile = path.join(lockDir, `sentara-daily-note-${dateKey}.lock`);
  let locked = false;
  try {
    fs.writeFileSync(lockFile, String(process.pid), { flag: 'wx' });
    locked = true;
  } catch (err) {
    if (err.code === 'EEXIST') return { posted: false, reason: 'başka süreç gönderiyor' };
    // kilit yazılamıyorsa kanal geçmişi kontrolüne güven
  }

  try {
    const prevHash = (history.find((h) => h.hash) || {}).hash || null;
    const scope = getUpdateScope({ prevHash, cwd });
    const big = isBigUpdate(scope);
    const recentNotes = history.slice(0, 6).map((h) => h.texts[0]).filter(Boolean);
    const { text, source } = await generateFriendlyNote({ big, subjects: scope.subjects, recentNotes, chat, dateKey });

    await channel.send(buildNotePayload({ note: text, version: gitMeta.version, commitHash: gitMeta.commitHash, now: now.getTime() }));
    logger.success(`[DailyNote] Günün notu gönderildi (${big ? 'büyük güncelleme ipucu' : 'genel'}, kaynak: ${source}).`);
    return { posted: true, note: text, big, source };
  } catch (err) {
    if (locked) { try { fs.unlinkSync(lockFile); } catch (_) { /* yoksay */ } }
    logger.warn(`[DailyNote] Not gönderilemedi: ${err.message}`);
    return { posted: false, reason: `hata: ${err.message}` };
  }
}

module.exports = {
  postDailyFriendlyNote, generateFriendlyNote, getUpdateScope, isBigUpdate, cleanNote, pickFallbackNote,
  buildNotePayload, readBotNotes, trDateKey, FALLBACK_SMALL, FALLBACK_BIG
};
