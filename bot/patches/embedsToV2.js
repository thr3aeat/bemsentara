'use strict';

/**
 * embedsToV2.js — Botun gönderdiği tüm embed'li mesajları tek bir merkezden Components V2'ye çevirir.
 *
 * 1224 ayrı embed kullanımını tek tek değiştirmek yerine discord.js'in gönderme metotları sarılır:
 *  - kanal/DM/thread send (message.reply ve user.send de buradan geçer)  → her zaman çevrilir
 *  - interaction.reply / followUp                                          → çevrilir
 *  - interaction.update, message.edit                                       → yalnızca hedef mesaj zaten V2 ise
 *  - interaction.editReply                                                  → yalnızca ilk cevap bu yamayla V2 yapıldıysa
 *  (Var olan embed'li mesaj V2'ye düzenlenemez; Discord buna izin vermez.)
 *
 * Güvenlik:
 *  - Discord V2 yükünü reddederse aynı mesaj ORİJİNAL haliyle tekrar gönderilir (mesaj kaybolmaz).
 *  - Çevrilen mesajın asıl embed'i saklanır; botun eski kodu `message.embeds[0]` okumaya devam edebilir
 *    (ceza/itiraz/ticket butonları embed'den veri okuyor).
 *  - EMBED_V2=0 ile tamamen kapatılır; tek bir mesaj için `__keepEmbeds: true` verilebilir.
 */

const fs = require('fs');
const path = require('path');

const V2 = 1 << 15;
const EPHEMERAL = 1 << 6;
const TEXT_BUDGET = 3900; // V2: tüm metinler toplamı 4000
const MAX_COMPONENTS = 40;
const SHADOW_FILE = path.join(__dirname, '../../data/v2_embed_shadow.json');
const SHADOW_MAX = 5000;

const toJSON = (x) => (x && typeof x.toJSON === 'function' ? x.toJSON() : x);

function resolveFlags(opts, discord) {
  let n = 0;
  try {
    if (opts.flags !== undefined && opts.flags !== null) n = Number(new discord.MessageFlagsBitField(opts.flags).bitfield);
  } catch (_) { n = typeof opts.flags === 'number' ? opts.flags : 0; }
  if (opts.ephemeral) n |= EPHEMERAL;
  return n;
}

function countComponents(list) {
  let n = 0;
  for (const c of list || []) {
    n++;
    if (Array.isArray(c.components)) n += countComponents(c.components);
    if (c.accessory) n++;
    if (Array.isArray(c.items)) n += 0; // galeri öğeleri bileşen sayılmaz
  }
  return n;
}

function makeBudget() {
  return {
    remaining: TEXT_BUDGET,
    take(text) {
      let t = String(text || '');
      if (!t.trim() || this.remaining <= 0) return null;
      if (t.length > this.remaining) t = `${t.slice(0, Math.max(0, this.remaining - 1))}…`;
      this.remaining -= t.length;
      return t;
    }
  };
}

function embedToContainer(e, budget) {
  const comps = [];
  const text = (t) => { const v = budget.take(t); if (v) comps.push({ type: 10, content: v }); };

  if (e.author && e.author.name) text(`-# ${e.author.url ? `[${e.author.name}](${e.author.url})` : e.author.name}`);

  const heading = e.title ? (e.url ? `### [${e.title}](${e.url})` : `### ${e.title}`) : null;
  const thumb = e.thumbnail && e.thumbnail.url;
  if (thumb && (heading || e.description)) {
    const inner = [heading, e.description].map((t) => budget.take(t)).filter(Boolean).map((v) => ({ type: 10, content: v }));
    if (inner.length) comps.push({ type: 9, components: inner, accessory: { type: 11, media: { url: thumb } } });
  } else {
    if (heading) text(heading);
    if (e.description) text(e.description);
  }

  if (Array.isArray(e.fields) && e.fields.length) {
    const body = e.fields
      .filter((f) => f && (f.name || f.value))
      .map((f) => `**${String(f.name || '').trim() || '​'}**\n${String(f.value || '').trim() || '​'}`)
      .join('\n\n');
    text(body);
  }

  if (e.image && e.image.url) comps.push({ type: 12, items: [{ media: { url: e.image.url } }] });

  const footer = [e.footer && e.footer.text, e.timestamp && !isNaN(Date.parse(e.timestamp)) ? `<t:${Math.floor(Date.parse(e.timestamp) / 1000)}:f>` : null]
    .filter(Boolean).join(' • ');
  if (footer) text(`-# ${footer}`);

  if (!comps.length) return null;
  const container = { type: 17, components: comps };
  if (typeof e.color === 'number') container.accent_color = e.color;
  return container;
}

/**
 * @returns {{payload: object, embeds: object[]} | null} çevrilemiyorsa/gerekmiyorsa null
 */
function convertPayload(opts, discord = require('discord.js')) {
  if (!opts || typeof opts !== 'object' || Array.isArray(opts)) return null;
  if (discord.MessagePayload && opts instanceof discord.MessagePayload) return null;
  if (opts.__keepEmbeds || opts.poll) return null;
  const embeds = Array.isArray(opts.embeds) ? opts.embeds.map(toJSON).filter(Boolean) : [];
  if (!embeds.length) return null;

  const flags = resolveFlags(opts, discord);
  if (flags & V2) return null;

  const budget = makeBudget();
  const top = [];
  if (typeof opts.content === 'string' && opts.content.trim()) {
    const c = budget.take(opts.content);
    if (c) top.push({ type: 10, content: c });
  }
  for (const e of embeds) {
    const c = embedToContainer(e, budget);
    if (c) top.push(c);
  }
  if (!top.length) return null;

  const existing = (Array.isArray(opts.components) ? opts.components : []).map(toJSON);
  const components = [...top, ...existing];
  if (countComponents(components) > MAX_COMPONENTS) return null;

  const payload = { ...opts, components, flags: flags | V2 };
  delete payload.embeds;
  delete payload.content;
  delete payload.ephemeral;
  return { payload, embeds };
}

// ── Gölge embed deposu (eski kodun message.embeds okuyabilmesi için) ─────────────────────────

const shadow = new Map();
let saveTimer = null;

function loadShadow() {
  try {
    const raw = JSON.parse(fs.readFileSync(SHADOW_FILE, 'utf8'));
    for (const [id, embeds] of Object.entries(raw || {})) shadow.set(id, embeds);
  } catch (_) { /* yoksa boş */ }
}

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(path.dirname(SHADOW_FILE), { recursive: true });
      const tmp = `${SHADOW_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(shadow)), 'utf8');
      fs.renameSync(tmp, SHADOW_FILE);
    } catch (_) { /* en iyi çaba */ }
  }, 2000);
  if (saveTimer.unref) saveTimer.unref();
}

function remember(id, embeds) {
  if (!id) return;
  shadow.delete(id);
  shadow.set(String(id), embeds);
  while (shadow.size > SHADOW_MAX) shadow.delete(shadow.keys().next().value);
  scheduleSave();
}

// ── Kurulum ────────────────────────────────────────────────────────────────────────────────────

const isPayloadError = (err) => !!err && (err.status === 400 || err.code === 50035 || err.code === 50006);

function ownerOf(proto, name) {
  let p = proto;
  while (p && !Object.prototype.hasOwnProperty.call(p, name)) p = Object.getPrototypeOf(p);
  return p;
}

function install(discord = require('discord.js'), { log = (m) => console.warn(`[EmbedsToV2] ${m}`) } = {}) {
  if (process.env.EMBED_V2 === '0') return () => {};
  loadShadow();
  const restores = [];

  function wrap(owner, name, shouldConvert, afterSend) {
    if (!owner || typeof owner[name] !== 'function' || owner[name].__v2wrapped) return;
    const orig = owner[name];
    const wrapped = async function (options, ...rest) {
      let conv = null;
      try { if (shouldConvert(this, options)) conv = convertPayload(options, discord); } catch (_) { conv = null; }
      if (!conv) return orig.call(this, options, ...rest);
      try {
        const res = await orig.call(this, conv.payload, ...rest);
        try { afterSend(this, res, conv.embeds); } catch (_) { /* yoksay */ }
        return res;
      } catch (err) {
        if (!isPayloadError(err)) throw err;
        log(`V2 reddedildi (${err.code || err.status}: ${String(err.message).slice(0, 80)}), orijinal embed ile gönderiliyor.`);
        return orig.call(this, options, ...rest);
      }
    };
    wrapped.__v2wrapped = true;
    owner[name] = wrapped;
    restores.push(() => { owner[name] = orig; });
  }

  const attachEmbeds = (msg, embeds) => {
    if (!msg || !msg.id) return;
    remember(msg.id, embeds);
    try { if (discord.Embed && (!msg.embeds || !msg.embeds.length)) msg.embeds = embeds.map((e) => new discord.Embed(e)); } catch (_) { /* yoksay */ }
  };
  const isV2 = (msg) => !!(msg && msg.flags && typeof msg.flags.has === 'function' && msg.flags.has(V2));

  // Kanallar (send'i tanımlayan gerçek prototipler; message.reply ve user.send de buradan geçer)
  const channelClasses = ['TextChannel', 'NewsChannel', 'DMChannel', 'ThreadChannel', 'VoiceChannel', 'StageChannel', 'PartialGroupDMChannel'];
  const owners = new Set(channelClasses.map((n) => discord[n] && ownerOf(discord[n].prototype, 'send')).filter(Boolean));
  for (const o of owners) wrap(o, 'send', () => true, (_ch, res, embeds) => attachEmbeds(res, embeds));

  // Mesaj düzenleme: yalnızca mesaj zaten V2 ise (embed'li mesaj V2'ye çevrilemez)
  if (discord.Message) wrap(discord.Message.prototype, 'edit', (msg) => isV2(msg), (_m, res, embeds) => attachEmbeds(res, embeds));

  // Etkileşimler
  for (const n of ['CommandInteraction', 'MessageComponentInteraction', 'ModalSubmitInteraction']) {
    const C = discord[n];
    if (!C) continue;
    const proto = C.prototype;
    wrap(ownerOf(proto, 'reply'), 'reply', (i) => !i.deferred && !i.replied, (i, res, embeds) => {
      i.__v2Reply = true;
      if (res && res.id && res.flags) attachEmbeds(res, embeds); // fetchReply/withResponse ile mesaj dönerse
    });
    wrap(ownerOf(proto, 'followUp'), 'followUp', () => true, (_i, res, embeds) => attachEmbeds(res, embeds));
    wrap(ownerOf(proto, 'update'), 'update', (i) => isV2(i.message), (i, _res, embeds) => attachEmbeds(i.message, embeds));
    wrap(ownerOf(proto, 'editReply'), 'editReply', (i, opts) => i.__v2Reply === true && !(opts && opts.message && opts.message !== '@original'),
      (_i, res, embeds) => attachEmbeds(res, embeds));
  }

  // Okuma uyumluluğu: V2 mesaj alınınca gölge embed'i geri koy
  if (discord.Message && discord.Embed) {
    const proto = discord.Message.prototype;
    const origPatch = proto._patch;
    if (typeof origPatch === 'function' && !origPatch.__v2wrapped) {
      const patched = function (data, ...rest) {
        const out = origPatch.call(this, data, ...rest);
        try {
          if ((!this.embeds || !this.embeds.length) && shadow.has(String(this.id))) {
            this.embeds = shadow.get(String(this.id)).map((e) => new discord.Embed(e));
          }
        } catch (_) { /* yoksay */ }
        return out;
      };
      patched.__v2wrapped = true;
      proto._patch = patched;
      restores.push(() => { proto._patch = origPatch; });
    }
  }

  return () => { while (restores.length) restores.pop()(); };
}

module.exports = { install, convertPayload, embedToContainer, shadow, V2 };
