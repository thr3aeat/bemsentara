/**
 * typographyHelper.js
 * 
 * Discord Markdown Tipografi ve Stil Yardımcıları
 */

class TypographyHelper {
  /**
   * Büyük Başlık (# Title)
   */
  static h1(text) {
    return `# ${text}`;
  }

  /**
   * Orta Başlık (## Title)
   */
  static h2(text) {
    return `## ${text}`;
  }

  /**
   * Küçük Başlık (### Title)
   */
  static h3(text) {
    return `### ${text}`;
  }

  /**
   * Alt Sönük Metin (-# Subtext)
   * Discord'da gri ve daha küçük görünen dipnot biçimlendirmesidir.
   */
  static subtext(text) {
    return `-# ${text}`;
  }

  /**
   * Tek Satırlık Alıntı (> Quote)
   */
  static quote(text) {
    return `> ${text}`;
  }

  /**
   * Çok Satırlık Alıntı (>>> Multiline Quote)
   */
  static multilineQuote(text) {
    return `>>> ${text}`;
  }

  /**
   * Unix Timestamp Biçimlendirmesi
   * @param {Date|number} dateOrTimestamp - Date objesi veya saniye/milisaniye timestamp
   * @param {string} style - 'R' (Canlı Göreceli "3 dakika önce"), 'F' (Tam Tarih), 't' (Kısa Saat), 'D' (Tarih)
   */
  static timestamp(dateOrTimestamp = new Date(), style = 'R') {
    let unixSec;
    if (dateOrTimestamp instanceof Date) {
      unixSec = Math.floor(dateOrTimestamp.getTime() / 1000);
    } else if (typeof dateOrTimestamp === 'number') {
      unixSec = dateOrTimestamp > 10000000000 ? Math.floor(dateOrTimestamp / 1000) : dateOrTimestamp;
    } else {
      unixSec = Math.floor(Date.now() / 1000);
    }
    return `<t:${unixSec}:${style}>`;
  }

  /**
   * Özel Sunucu Emoji Formatı (<:name:id> veya animated <a:name:id>)
   */
  static emoji(name, id, animated = false) {
    if (!id) return name;
    return animated ? `<a:${name}:${id}>` : `<:${name}:${id}>`;
  }

  /**
   * Kod Bloğu (```lang ... ```)
   */
  static codeBlock(text, lang = '') {
    return `\`\`\`${lang}\n${text}\n\`\`\``;
  }

  /**
   * Satır içi kod (`code`)
   */
  static inlineCode(text) {
    return `\`${text}\``;
  }
}

module.exports = TypographyHelper;
