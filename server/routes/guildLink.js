"use strict";

// TMT ve BEM için tek sayfalık bağlama / rol güncelleme akışı.
// Kullanıcı linke girer: Discord bağlı değilse Discord'u, Roblox bağlı değilse Roblox'u bağlatır,
// ikisi de bağlıysa rollerini otomatik günceller.

const express = require("express");
const router = express.Router();
const User = require("../../models/User");

const GUILDS = {
  tmt: { name: "TMT | Turkish Armed Forces", configKey: "TMT_GUILD_ID" },
  bem: { name: "BEM | Bursa Emniyet Müdürlüğü", configKey: "TARGET_GUILD_ID" },
};

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function isDiscordLinked(user) {
  return Boolean(user?.discordId) && !String(user.discordId).startsWith("portal_");
}

async function syncGuildRoles(key, user) {
  const config = require("../../config");
  const { getDiscordClient } = require("../../bot/discordClient");
  const client = getDiscordClient();
  if (!client?.isReady()) throw new Error("Bot şu an hazır değil, birkaç saniye sonra tekrar dene.");

  const guild = await client.guilds.fetch(config[GUILDS[key].configKey]).catch(() => null);
  if (!guild) throw new Error("Bot bu sunucuya erişemiyor.");
  const member = await guild.members.fetch(user.discordId).catch(() => null);
  if (!member) throw new Error(`Önce ${GUILDS[key].name} Discord sunucusuna katılman gerekiyor.`);

  let result;
  if (key === "tmt") {
    const { syncTMTRoles } = require("../../bot/services/tmtRoleSyncService");
    result = await syncTMTRoles(client, user.discordId, user.robloxId, member);
  } else {
    const { syncMemberRoles } = require("../../bot/services/roleSyncService");
    result = await syncMemberRoles(guild, member, parseInt(user.robloxId, 10), user.robloxUsername);
  }
  if (result && result.success === false) throw new Error(result.message || "Roller güncellenemedi.");

  const names = (list) => (Array.isArray(list) ? list : []).map((r) => r?.name || guild.roles.cache.get(r?.id || r)?.name).filter(Boolean);
  return { added: names(result?.added), removed: names(result?.removed), nickname: result?.nickname || null, tier: result?.tier || null };
}

router.post("/api/baglan/:guild/sync", async (req, res) => {
  const key = req.params.guild;
  if (!GUILDS[key]) return res.status(404).json({ error: "Bilinmeyen sunucu." });
  if (!req.user) return res.status(401).json({ error: "Giriş yapmalısın." });
  const user = await User.findById(req.user._id).catch(() => null) || req.user;
  if (!isDiscordLinked(user)) return res.status(400).json({ error: "Discord hesabın bağlı değil." });
  if (!user.robloxId) return res.status(400).json({ error: "Roblox hesabın bağlı değil." });
  try {
    res.json({ success: true, ...(await syncGuildRoles(key, user)) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/baglan/:guild", async (req, res) => {
  const key = req.params.guild;
  if (!GUILDS[key]) return res.redirect("/baglan/bem");
  const here = `/baglan/${key}`;

  const user = req.user ? (await User.findById(req.user._id).catch(() => null) || req.user) : null;
  const discordOk = isDiscordLinked(user);
  const robloxOk = Boolean(user?.robloxId);
  const g = GUILDS[key];

  const step = (ok, title, okText, body) => `
    <section class="step ${ok ? "ok" : ""}">
      <div class="step-head"><span class="dot">${ok ? "✓" : "!"}</span><b>${title}</b></div>
      ${ok ? `<p class="muted">${okText}</p>` : body}
    </section>`;

  const discordBody = `<p>Discord hesabın bağlı değil?</p>
    <a class="btn primary" href="/auth/discord?next=${encodeURIComponent(here)}">Discord ile BAĞLA</a>`;

  const robloxBody = !discordOk
    ? `<p class="muted">Önce Discord hesabını bağla.</p>`
    : `<p>Roblox hesabın bağlı değil? Bir yöntem seç:</p>
    <a class="btn primary" href="/auth/roblox?next=${encodeURIComponent(here)}">◆ Roblox ile giriş yaparak BAĞLA</a>
    <details><summary>👥 Roblox arkadaşlık isteği ile doğrula</summary>
      <input id="fr-user" placeholder="Roblox kullanıcı adın"><button class="btn" id="fr-start">İstek gönder</button>
      <div id="fr-step2" hidden><p>Botun isteğini Roblox'ta kabul et: <a id="fr-bot" target="_blank" rel="noopener">bot profili</a></p><button class="btn" id="fr-verify">Kabul ettim, doğrula</button></div>
    </details>
    <details><summary>📝 Profil açıklaması kodu ile doğrula</summary>
      <input id="pc-user" placeholder="Roblox kullanıcı adın"><button class="btn" id="pc-start">Kod oluştur</button>
      <div id="pc-step2" hidden><p>Bu kodu Roblox profil açıklamana yaz ve kaydet: <code id="pc-code"></code></p><button class="btn" id="pc-verify">Yazdım, doğrula</button></div>
    </details>`;

  const syncBody = `<p class="muted">Discord ve Roblox bağlanınca rollerin burada otomatik güncellenir.</p>`;

  res.send(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(g.name)} · Hesap Bağlama</title>
<style>
  :root{--bg:#0b0d12;--card:#141821;--line:#262c38;--text:#e8ebf1;--muted:#98a1b3;--ok:#22c55e;--warn:#f59e0b;--btn:#5865f2}
  *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}
  main{max-width:560px;margin:0 auto;padding:32px 16px}h1{font-size:22px;margin:0 0 4px}.muted{color:var(--muted)}
  .step{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-top:14px}
  .step-head{display:flex;gap:10px;align-items:center}.dot{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:var(--warn);color:#000;font-weight:700}
  .ok .dot{background:var(--ok)}.btn{display:inline-block;border:0;border-radius:10px;padding:10px 14px;margin:6px 6px 0 0;background:#2a3040;color:var(--text);text-decoration:none;font:inherit;cursor:pointer}
  .btn.primary{background:var(--btn);color:#fff}details{margin-top:10px;border-top:1px solid var(--line);padding-top:10px}summary{cursor:pointer}
  input{width:100%;margin-top:8px;padding:10px;border-radius:10px;border:1px solid var(--line);background:#0f1219;color:var(--text);font:inherit}
  code{background:#0f1219;padding:2px 6px;border-radius:6px}#msg{margin-top:14px;padding:12px;border-radius:10px;display:none}
  #msg.ok{display:block;background:rgba(34,197,94,.12)}#msg.err{display:block;background:rgba(239,68,68,.14)}
</style></head><body><main>
<h1>${esc(g.name)}</h1>
<p class="muted">${user ? `Merhaba <b>${esc(user.discordUsername || user.username)}</b>.` : "Hesabını bağla, rollerin otomatik verilsin."}</p>
${step(discordOk, "1. Discord hesabı", `Bağlı: ${esc(user?.discordUsername || user?.username || "")}`, discordBody)}
${step(robloxOk, "2. Roblox hesabı", `Bağlı: ${esc(user?.robloxUsername || user?.robloxId || "")}`, robloxBody)}
${step(false, "3. Rol güncelleme", "", discordOk && robloxOk ? `<p class="muted" id="sync-state">Rollerin güncelleniyor…</p><button class="btn primary" id="sync-btn">Tekrar güncelle</button>` : syncBody)}
<div id="msg"></div>
</main><script>
const msg=document.getElementById('msg');
function show(t,ok){msg.textContent=t;msg.className=ok?'ok':'err'}
async function post(url,body){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});const d=await r.json().catch(()=>({}));if(!r.ok||d.success===false)throw new Error(d.error||'İşlem başarısız.');return d}
const on=(id,fn)=>{const el=document.getElementById(id);if(el)el.addEventListener('click',fn)};
let fr=null;
on('fr-start',async()=>{try{const username=document.getElementById('fr-user').value.trim();fr=await post('/api/auth/roblox/friend-request',{username});fr.username=username;document.getElementById('fr-bot').href=fr.botProfileUrl;document.getElementById('fr-step2').hidden=false;show('Arkadaşlık isteği gönderildi.',true)}catch(e){show(e.message)}});
on('fr-verify',async()=>{try{await post('/api/auth/roblox/friend-verify',{robloxId:fr&&fr.robloxId,username:fr&&fr.username});location.reload()}catch(e){show(e.message)}});
on('pc-start',async()=>{try{const d=await post('/api/auth/roblox/profile-code/start',{username:document.getElementById('pc-user').value.trim()});document.getElementById('pc-code').textContent=d.code;document.getElementById('pc-step2').hidden=false}catch(e){show(e.message)}});
on('pc-verify',async()=>{try{await post('/api/auth/roblox/profile-code/verify');location.reload()}catch(e){show(e.message)}});
async function sync(){const st=document.getElementById('sync-state');try{const d=await post('/api/baglan/${key}/sync');const parts=[];if(d.added.length)parts.push('Eklenen: '+d.added.join(', '));if(d.removed.length)parts.push('Kaldırılan: '+d.removed.join(', '));st.textContent='✓ Rollerin güncellendi.';show(parts.join(' · ')||'Rollerin zaten güncel.',true)}catch(e){st.textContent='Güncelleme başarısız.';show(e.message)}}
if(document.getElementById('sync-btn')){on('sync-btn',sync);sync()}
</script></body></html>`);
});

module.exports = router;
