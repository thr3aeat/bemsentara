/**
 * componentsV2Factory.js
 * 
 * Discord Components V2 Yapı Blokları ve Hazır Şablonlar
 */

const { ComponentType, ButtonStyle, MessageFlags } = require("discord.js");

// ComponentType sabitleri (Discord API v10 / Components V2)
const TYPE_CONTAINER     = ComponentType.Container || 17;
const TYPE_SECTION       = ComponentType.Section || 9;
const TYPE_TEXT_DISPLAY  = ComponentType.TextDisplay || 10;
const TYPE_THUMBNAIL     = ComponentType.Thumbnail || 11;
const TYPE_MEDIA_GALLERY = ComponentType.MediaGallery || 12;
const TYPE_SEPARATOR     = ComponentType.Separator || 14;
const TYPE_ACTION_ROW    = ComponentType.ActionRow || 1;
const TYPE_BUTTON        = ComponentType.Button || 2;

// MessageFlags.IsComponentsV2 (1 << 13 = 8192)
const FLAGS_V2 = MessageFlags.IsComponentsV2 || (1 << 13);

class ComponentsV2Factory {
  static get FLAGS() {
    return FLAGS_V2;
  }

  /**
   * Bağımsız Metin Ekranı (TextDisplay) bileşeni oluşturur
   * @param {string} content - Markdown destekli metin
   */
  static text(content) {
    return {
      type: TYPE_TEXT_DISPLAY,
      content: content,
    };
  }

  /**
   * Ayırıcı Çizgi (Separator) bileşeni oluşturur
   * @param {boolean} divider - Görünür çizgi olsun mu?
   */
  static separator(divider = true) {
    return {
      type: TYPE_SEPARATOR,
      divider: divider,
    };
  }

  /**
   * Bölüm (Section) bileşeni oluşturur (İsteğe bağlı sağ aksesuar/thumbnail ile)
   * @param {string|object} textContent - Metin string veya TextDisplay objesi
   * @param {string|null} imageUrl - Sağ tarafta duracak aksesuar görsel URL'si
   */
  static section(textContent, imageUrl = null) {
    const sec = {
      type: TYPE_SECTION,
      text: typeof textContent === "string" ? this.text(textContent) : textContent,
    };
    if (imageUrl) {
      sec.accessory = {
        type: TYPE_THUMBNAIL,
        media: { url: imageUrl },
      };
    }
    return sec;
  }

  /**
   * Medya Galerisi (MediaGallery) grid bileşeni oluşturur
   * @param {string[]} imageUrls - Görsel URL listesi
   */
  static mediaGallery(imageUrls = []) {
    return {
      type: TYPE_MEDIA_GALLERY,
      items: imageUrls.map((url) => ({ media: { url } })),
    };
  }

  /**
   * Thumbnail aksesuarlı Section oluşturur
   */
  static sectionWithThumbnail(title, description, thumbnailUrl) {
    return {
      type: TYPE_SECTION,
      text: {
        type: TYPE_TEXT_DISPLAY,
        content: `### ${title}\n${description}`,
      },
      accessory: {
        type: TYPE_THUMBNAIL,
        media: { url: thumbnailUrl },
      },
    };
  }

  /**
   * Başlık bloğu ve altında ayırıcı çizgi oluşturur
   */
  static headerBlock(title, iconEmoji = "🚀") {
    return [
      {
        type: TYPE_TEXT_DISPLAY,
        content: `## ${iconEmoji} ${title}`,
      },
      { type: TYPE_SEPARATOR, divider: true },
    ];
  }

  /**
   * ActionRow ve Buton listesi oluşturur
   */
  static actionRow(buttons = []) {
    return {
      type: TYPE_ACTION_ROW,
      components: buttons.map((btn) => ({
        type: TYPE_BUTTON,
        style: btn.style || ButtonStyle.Primary,
        label: btn.label,
        custom_id: btn.custom_id || btn.customId,
        url: btn.url,
        disabled: btn.disabled || false,
        emoji: btn.emoji,
      })),
    };
  }

  /**
   * Ana Kapsayıcı Konteyner (Container) oluşturur
   * @param {Array} innerComponents - Konteyner içi bileşenler listesi
   */
  static container(innerComponents = []) {
    return {
      type: TYPE_CONTAINER,
      components: innerComponents,
    };
  }

  /**
   * Eksiksiz interaction.reply / send payload'ı üretir
   * @param {Array} innerComponents - Konteyner içi bileşenler
   */
  static buildPayload(innerComponents = []) {
    return {
      flags: FLAGS_V2,
      components: [this.container(innerComponents)],
    };
  }

  /**
   * Dynamic Canvas (Attachment) görsellerini V2 Container MediaGallery içinde yayınlamak için yanıt üretir
   * @param {string} attachmentName - Örn: "attachment://levelup.png"
   * @param {string} title - Kart Başlığı
   * @param {string} description - Açıklama metni
   * @param {Array} files - AttachmentBuilder listesi
   */
  static buildCanvasAttachmentContainer(attachmentName, title, description = '', files = []) {
    const mediaUrl = attachmentName.startsWith("attachment://") ? attachmentName : `attachment://${attachmentName}`;

    return {
      flags: FLAGS_V2,
      files: files,
      components: [
        this.container([
          ...this.headerBlock(title, "🎉"),
          ...(description ? [this.text(description), this.separator(false)] : []),
          this.mediaGallery([mediaUrl]),
          this.separator(false),
          this.text(`-# Sentara Canvas Service • <t:${Math.floor(Date.now() / 1000)}:R>`)
        ])
      ]
    };
  }
}

module.exports = ComponentsV2Factory;

