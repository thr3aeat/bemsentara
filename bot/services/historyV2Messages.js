'use strict';

/**
 * historyV2Messages.js
 *
 * EkoYıldız "Tarihte Bugün / Atatürk" sisteminin Components V2 mesajları:
 *  - günlük paylaşım (accent renkli container, günün fotoğrafı, buton satırları)
 *  - butonlara basılınca açılan detay cevapları (aynı mesajda gezinme butonlarıyla)
 *
 * Saf fonksiyonlardır: Discord'a göndermezler, yalnızca { components, flags } döndürürler.
 */

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

// Mevcut butonların customId'leriyle uyumlu kalır (eski mesajlardaki butonlar da çalışır).
const VIEWS = {
  ataturk: {
    action: 'detail_ataturk', emoji: '🏛️', label: 'Atatürk & Zaferler', hint: 'Bugünün askerî ve siyasi hikâyesi', color: 0xdc143c, style: ButtonStyle.Primary,
    title: (d) => `🏛️ Gazi Mustafa Kemal Atatürk & Zaferler — ${d}`,
    prompt: (d) => `Tarih: ${d}. Gazi Mustafa Kemal Atatürk'ün bu tarihte (veya o dönemin bu günlerinde) aldığı askeri, siyasi kararlar, vizyoner stratejisi ve Türk milletine kazandırdığı devrimci mirası anlatan çok detaylı, akıcı, zengin 2 paragraf üret.`
  },
  science: {
    action: 'detail_science', emoji: '🔬', label: 'Bilim & Keşifler', hint: 'Bilim, uzay ve teknoloji tarihi', color: 0x3b82f6, style: ButtonStyle.Secondary,
    title: (d) => `🔬 Bilim, Uzay & Keşif Tarihi — ${d}`,
    prompt: (d) => `Tarih: ${d}. Tarihte bugün dünya çapında gerçekleşmiş bilimsel buluşlar, uzay keşifleri, teknolojik icatlar ve tıp/sanat alanındaki çığır açan gelişmeleri detaylı ve akıcı bir şekilde anlatan zengin 2 paragraf yaz.`
  },
  trivia: {
    action: 'detail_trivia', emoji: '💡', label: 'Tarihi Trivia', hint: 'Az bilinen şaşırtıcı anekdotlar', color: 0xf59e0b, style: ButtonStyle.Secondary,
    title: (d) => `💡 Şaşırtıcı Tarihi Trivia & Anekdotlar — ${d}`,
    prompt: (d) => `Tarih: ${d}. Tarihte bugün yaşanmış veya bu döneme ait, çok az kişinin bildiği, son derece ilginç, şaşırtıcı ve merak uyandıran 3 adet tarihi anekdot/trivia bilgisi paylaş.`
  },
  quote: {
    action: 'random_quote', emoji: '📜', label: 'Tarihi Vecize', hint: 'Günün ilham veren sözü', color: 0x8b5cf6, style: ButtonStyle.Secondary,
    title: (d) => `📜 Tarihi Vecize ve Günün İlhamı — ${d}`,
    prompt: (d) => `Tarih: ${d}. Gazi Mustafa Kemal Atatürk ve tarihe yön vermiş büyük düşünürlerden, bugünün tarihsel anlamına ve milli mücadeleye uygun, derin anlamlı tarihi sözler ve kısa bir felsefi analiz paylaş.`
  }
};
const VIEW_ORDER = ['ataturk', 'science', 'trivia', 'quote'];

const DAILY_FOOTER = "EkoYıldız Tarih & Kültür Sistemi • Gazi Mustafa Kemal Atatürk'ün İzinde";
const DETAIL_FOOTER = 'EkoYıldız Tarihte Bugün İnteraktif Rehberi';

const ID_PATTERN = /^(tb|tbn)_(detail_ataturk|detail_science|detail_trivia|random_quote)_(\d{1,2})_(\d{1,2})$/;

/**
 * Buton kimliğini çözer. `tb_` = günlük mesajdaki buton (yeni geçici cevap açar),
 * `tbn_` = detay cevabındaki gezinme butonu (aynı mesajı günceller).
 * Geçersiz gün/ay (elle üretilmiş kimlik) null döner.
 */
function parseHistoryButtonId(customId) {
  const m = ID_PATTERN.exec(String(customId || ''));
  if (!m) return null;
  const day = Number(m[3]);
  const month = Number(m[4]);
  if (day < 1 || day > 31 || month < 0 || month > 11) return null;
  const viewKey = VIEW_ORDER.find((k) => VIEWS[k].action === m[2]);
  return { nav: m[1] === 'tbn', viewKey, day, month };
}

const dateLabel = (day, month) => `${day} ${MONTHS[month]}`;

// Components V2'de tüm metin bileşenleri toplamı 4000 karakteri aşamaz.
function capText(text, max) {
  const s = String(text || '').trim();
  return s.length > max ? `${s.slice(0, max - 20).trimEnd()}…\n*(devamı kısaltıldı)*` : s;
}

const v2 = (container) => ({ components: [container], flags: MessageFlags.IsComponentsV2 });
const text = (container, content) => container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
const divider = (container, spacing = SeparatorSpacingSize.Small) =>
  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(spacing).setDivider(true));

/**
 * Günlük paylaşım.
 * @param {{title:string, color:number, content:string, specialField?:{name:string,value:string}|null,
 *          photo?:{url:string,title?:string,source?:string}|null, day:number, month:number}} o
 */
function buildDailyPayload({ title, color, content, specialField = null, photo = null, day, month }) {
  const container = new ContainerBuilder().setAccentColor(color);

  if (photo && photo.url) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(photo.url).setDescription(photo.title || 'Mustafa Kemal Atatürk')
      )
    );
  }

  text(container, `## ${title}`);
  text(container, capText(content, 2900));

  if (specialField) {
    divider(container);
    text(container, capText(`### ${specialField.name}\n${specialField.value}`, 700));
  }

  divider(container);
  text(container, '**Daha fazlası için bir başlık seç**');
  for (const key of VIEW_ORDER) {
    const v = VIEWS[key];
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${v.emoji} ${v.label}**\n${v.hint}`))
        .setButtonAccessory(
          new ButtonBuilder().setCustomId(`tb_${v.action}_${day}_${month}`).setLabel('Aç').setStyle(v.style)
        )
    );
  }

  const source = photo && photo.source ? ` • Fotoğraf: ${photo.source}` : '';
  text(container, `-# ${DAILY_FOOTER}${source}`);
  return v2(container);
}

function navRow(activeKey, day, month, { disableAll = false } = {}) {
  return new ActionRowBuilder().addComponents(
    VIEW_ORDER.map((key) => {
      const v = VIEWS[key];
      const active = key === activeKey;
      return new ButtonBuilder()
        .setCustomId(`tbn_${v.action}_${day}_${month}`)
        .setLabel(v.label)
        .setEmoji(v.emoji)
        .setStyle(active ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(disableAll || active);
    })
  );
}

/** Buton cevabı: içerik + aynı mesajda gezinme butonları. */
function buildDetailPayload({ viewKey, day, month, body }) {
  const v = VIEWS[viewKey];
  const container = new ContainerBuilder().setAccentColor(v.color);
  text(container, `## ${v.title(dateLabel(day, month))}`);
  text(container, capText(body, 3400));
  divider(container);
  container.addActionRowComponents(navRow(viewKey, day, month));
  text(container, `-# ${DETAIL_FOOTER}`);
  return v2(container);
}

/** Yapay zeka yanıtı beklenirken gösterilen geçici durum. */
function buildLoadingPayload({ viewKey, day, month }) {
  const v = VIEWS[viewKey];
  const container = new ContainerBuilder().setAccentColor(v.color);
  text(container, `## ${v.title(dateLabel(day, month))}`);
  text(container, '⏳ Hazırlanıyor, birkaç saniye sürebilir…');
  container.addActionRowComponents(navRow(viewKey, day, month, { disableAll: true }));
  return v2(container);
}

/** Yapay zeka alınamadığında: hata + başka başlıklara geçiş / yeniden deneme. */
function buildErrorPayload({ viewKey, day, month }) {
  const v = VIEWS[viewKey];
  const container = new ContainerBuilder().setAccentColor(0xef4444);
  text(container, `## ${v.title(dateLabel(day, month))}`);
  text(container, 'Bu bilgi şu anda hazırlanamadı. Birkaç saniye sonra aşağıdan yeniden deneyebilirsin.');
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      VIEW_ORDER.map((key) => {
        const k = VIEWS[key];
        return new ButtonBuilder()
          .setCustomId(`tbn_${k.action}_${day}_${month}`)
          .setLabel(key === viewKey ? 'Yeniden dene' : k.label)
          .setEmoji(key === viewKey ? '🔄' : k.emoji)
          .setStyle(key === viewKey ? ButtonStyle.Primary : ButtonStyle.Secondary);
      })
    )
  );
  return v2(container);
}

module.exports = {
  MONTHS, VIEWS, VIEW_ORDER, parseHistoryButtonId, dateLabel, capText,
  buildDailyPayload, buildDetailPayload, buildLoadingPayload, buildErrorPayload
};
