'use strict';

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTicketChatPage(user, ticket) {
  const isClosed = ticket.status === 'closed';
  const staffJoined = !!ticket.staffJoined;

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#000000">
  <title>Bilet #${esc(ticket.ticketId)} — EkoYıldız Canlı Destek</title>
  <style>
    :root {
      --bg: #000000;
      --surface: #161617;
      --elevated: #1d1d1f;
      --border: rgba(255, 255, 255, 0.1);
      --text: #f5f5f7;
      --sub: #a1a1a6;
      --muted: #86868b;
      --blue: #0071e3;
      --link: #2997ff;
      --green: #30d158;
      --orange: #ff9f0a;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(ellipse 80% 45% at 50% -10%, rgba(0, 113, 227, 0.14), transparent 65%), var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
    }
    a { color: inherit; text-decoration: none; }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      border-bottom: 1px solid var(--border);
    }
    .topbar-inner {
      max-width: 960px;
      margin: 0 auto;
      padding: 0 20px;
      height: 62px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .btn-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 980px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: var(--text);
      font-size: 0.86rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 160ms ease;
    }
    .btn-pill:hover { background: rgba(255, 255, 255, 0.15); }
    .btn-pill.primary { background: var(--blue); border-color: transparent; }
    .btn-pill.primary:hover { background: #0077ed; }

    .chat-shell {
      max-width: 960px;
      width: 100%;
      margin: 22px auto 28px;
      padding: 0 20px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .ticket-meta-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 18px 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 14px;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 5px 12px;
      border-radius: 980px;
      font-size: 0.78rem;
      font-weight: 600;
      background: rgba(255, 159, 10, 0.14);
      color: var(--orange);
      border: 1px solid rgba(255, 159, 10, 0.3);
    }
    .status-pill.joined {
      background: rgba(48, 209, 88, 0.14);
      color: var(--green);
      border-color: rgba(48, 209, 88, 0.3);
    }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }

    .chat-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 28px;
      display: flex;
      flex-direction: column;
      height: 62vh;
      min-height: 440px;
      overflow: hidden;
    }
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .msg-row {
      display: flex;
      flex-direction: column;
      max-width: 78%;
    }
    .msg-row.user { align-self: flex-end; align-items: flex-end; }
    .msg-row.staff, .msg-row.ekoai { align-self: flex-start; align-items: flex-start; }
    .msg-sender {
      font-size: 0.74rem;
      color: var(--muted);
      margin-bottom: 4px;
      padding: 0 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .sender-tag {
      padding: 1px 7px;
      border-radius: 980px;
      font-size: 0.68rem;
      font-weight: 700;
      background: rgba(41, 151, 255, 0.18);
      color: var(--link);
    }
    .sender-tag.real {
      background: rgba(48, 209, 88, 0.18);
      color: var(--green);
    }
    .msg-bubble {
      padding: 12px 16px;
      border-radius: 20px;
      font-size: 0.94rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .msg-row.user .msg-bubble {
      background: var(--blue);
      color: #ffffff;
      border-bottom-right-radius: 6px;
    }
    .msg-row.staff .msg-bubble, .msg-row.ekoai .msg-bubble {
      background: var(--elevated);
      color: var(--text);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-bottom-left-radius: 6px;
    }
    .msg-time {
      font-size: 0.7rem;
      color: var(--muted);
      margin-top: 4px;
      padding: 0 6px;
    }

    .quick-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      padding: 10px 18px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .chip-btn {
      padding: 6px 12px;
      border-radius: 980px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.05);
      color: var(--sub);
      font-size: 0.78rem;
      cursor: pointer;
      transition: all 150ms ease;
    }
    .chip-btn:hover { color: #fff; border-color: var(--link); background: rgba(41, 151, 255, 0.12); }

    .chat-input-bar {
      display: flex;
      gap: 10px;
      padding: 14px 18px;
      background: rgba(0, 0, 0, 0.28);
      align-items: center;
    }
    .chat-input {
      flex: 1;
      background: var(--elevated);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 980px;
      padding: 11px 18px;
      color: var(--text);
      font-size: 0.94rem;
      font-family: inherit;
      outline: none;
    }
    .chat-input:focus { border-color: var(--link); }
    .send-btn {
      padding: 11px 22px;
      border-radius: 980px;
      border: none;
      background: var(--blue);
      color: #fff;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <a class="btn-pill" href="/tickets">← Biletlerime Dön</a>
      <div style="font-weight:700;font-size:0.96rem;">Bilet #${esc(ticket.ticketId)}</div>
      <button type="button" class="btn-pill primary" id="btnCallEko" onclick="callEko()">🔔 Eko'yu Çağır</button>
    </div>
  </header>

  <main class="chat-shell">
    <section class="ticket-meta-card">
      <div>
        <div style="font-size:1.12rem;font-weight:700;margin-bottom:4px;">${esc(ticket.subject || 'Destek Talebi')}</div>
        <div style="font-size:0.84rem;color:var(--sub);">
          Kategori: <strong>${esc(ticket.category || 'Genel')}</strong>
          ${ticket.channelId ? ' • <span style="color:var(--green);">Discord Kanalı Açık</span>' : ' • <span>Web & Discord Senkron</span>'}
        </div>
      </div>
      <div class="status-pill ${staffJoined ? 'joined' : ''}" id="staffStatusPill">
        <span class="status-dot"></span>
        <span id="staffStatusText">${staffJoined ? 'Eko / Yetkili Bilette' : 'Eko Bekleniyor • Yetkili Temsilci Aktif'}</span>
      </div>
    </section>

    <section class="chat-box">
      <div class="chat-messages" id="chatMessages">
        <div style="text-align:center;color:var(--muted);padding:32px 0;">Mesajlar yükleniyor...</div>
      </div>

      ${isClosed ? `<div style="padding:16px;text-align:center;color:var(--muted);border-top:1px solid var(--border);">Bu bilet kapatılmıştır.</div>` : `
      <div class="quick-chips">
        <button type="button" class="chip-btn" onclick="sendQuick('İtemSatış linkini ne zaman alabilirim?')">İtemSatış linki ne zaman gelir?</button>
        <button type="button" class="chip-btn" onclick="sendQuick('Robux (2x) ile ödeme nasıl işliyor?')">Robux (2x) ile ödeyebilir miyim?</button>
        <button type="button" class="chip-btn" onclick="sendQuick('Paket kapsamı ve yayın tarihi hakkında bilgi alabilir miyim?')">Paket detaylarını konuşalım</button>
      </div>
      <form class="chat-input-bar" onsubmit="handleSend(event)">
        <input type="text" id="msgInput" class="chat-input" placeholder="Mesajınızı yazın (Eko gelene kadar yetkili yanıtlayacaktır)..." autocomplete="off" maxlength="1500">
        <button type="submit" id="sendBtn" class="send-btn">Gönder</button>
      </form>
      `}
    </section>
  </main>

  <script>
    const TICKET_ID = ${JSON.stringify(ticket.ticketId)};
    let isSending = false;

    function escHtml(s) {
      return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function renderMessages(messages, staffJoined) {
      const box = document.getElementById('chatMessages');
      const pill = document.getElementById('staffStatusPill');
      const statusTxt = document.getElementById('staffStatusText');
      if (pill && statusTxt) {
        pill.classList.toggle('joined', !!staffJoined);
        statusTxt.textContent = staffJoined ? 'Eko / Yetkili Bilette' : 'Eko Bekleniyor • Yetkili Temsilci Aktif';
      }

      if (!messages || !messages.length) {
        box.innerHTML = '<div style="text-align:center;color:var(--muted);padding:32px 0;">Henüz mesaj yok. Aşağıdan yazabilirsiniz.</div>';
        return;
      }

      const wasAtBottom = (box.scrollHeight - box.scrollTop - box.clientHeight) < 80;
      box.innerHTML = messages.map((m) => {
        const cls = m.sender === 'user' ? 'user' : (m.sender === 'staff' ? 'staff' : 'ekoai');
        const badge = m.sender === 'staff'
          ? '<span class="sender-tag real">Eko / Yetkili</span>'
          : (m.sender === 'ekoai' ? '<span class="sender-tag">Yetkili Masası</span>' : '');
        const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';
        return '<div class="msg-row ' + cls + '">'
          + '<div class="msg-sender"><span>' + escHtml(m.senderName || (cls === 'user' ? 'Siz' : 'Yetkili')) + '</span>' + badge + '</div>'
          + '<div class="msg-bubble">' + escHtml(m.content) + '</div>'
          + (time ? '<div class="msg-time">' + time + '</div>' : '')
          + '</div>';
      }).join('');

      if (wasAtBottom) box.scrollTop = box.scrollHeight;
    }

    async function loadMessages() {
      try {
        const res = await fetch('/api/tickets/' + encodeURIComponent(TICKET_ID) + '/messages');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) renderMessages(data.messages, data.staffJoined);
      } catch (_) {}
    }

    async function sendText(text) {
      if (!text || isSending) return;
      isSending = true;
      const btn = document.getElementById('sendBtn');
      const input = document.getElementById('msgInput');
      if (btn) { btn.disabled = true; btn.textContent = 'Yazıyor...'; }
      try {
        const res = await fetch('/api/tickets/' + encodeURIComponent(TICKET_ID) + '/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (input) input.value = '';
          renderMessages(data.messages, data.staffJoined);
          const box = document.getElementById('chatMessages');
          box.scrollTop = box.scrollHeight;
        }
      } finally {
        isSending = false;
        if (btn) { btn.disabled = false; btn.textContent = 'Gönder'; }
      }
    }

    function handleSend(e) {
      e.preventDefault();
      const input = document.getElementById('msgInput');
      const val = input ? input.value.trim() : '';
      if (val) sendText(val);
    }

    function sendQuick(text) {
      sendText(text);
    }

    async function callEko() {
      const btn = document.getElementById('btnCallEko');
      if (btn) { btn.disabled = true; btn.textContent = 'Bildiriliyor...'; }
      try {
        const res = await fetch('/api/tickets/' + encodeURIComponent(TICKET_ID) + '/call-eko', { method: 'POST' });
        if (res.ok) {
          if (btn) btn.textContent = '✓ Eko Çağrıldı';
          loadMessages();
        } else if (btn) {
          btn.disabled = false; btn.textContent = '🔔 Eko\\'yu Çağır';
        }
      } catch (_) {
        if (btn) { btn.disabled = false; btn.textContent = '🔔 Eko\\'yu Çağır'; }
      }
    }

    loadMessages();
    setInterval(loadMessages, 3000);
  </script>
</body>
</html>`;
}

module.exports = { renderTicketChatPage };
