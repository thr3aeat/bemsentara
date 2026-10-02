'use strict';

const { ButtonStyle, MessageFlags } = require('discord.js');
const ComponentsV2Factory = require('../utils/componentsV2Factory');

function sanitizeBaseUrl(baseUrl) {
  return String(baseUrl || process.env.BASE_URL || 'https://ekoyildiz.duckdns.org').replace(/\/$/, '');
}

function buildApplicationMessage(kind, context = {}) {
  const base = sanitizeBaseUrl(context.baseUrl);
  const name = context.candidateName || 'Aday';
  const role = context.formTitle || 'EkoYıldız Ekip Başvurusu';
  const ref = context.reference || 'EKO-APP';

  const defaultApprovalPath = context.primaryPath || `/applications/${encodeURIComponent(ref)}/approval`;
  const helpUrl = `${base}/yardim`;
  const blogUrl = `${base}/blog`;
  const videoBlogUrl = `${base}/video-blog`;
  const careersUrl = `${base}/ekoyildizda-calis`;
  const formsUrl = `${base}/forms`;

  let title = 'Başvuru Güncellemesi';
  let bodyLines = [];
  let primaryButton = null;
  let secondaryButtons = [
    { label: 'Yardım Merkezi', style: ButtonStyle.Link, url: helpUrl },
    { label: 'EkoYıldız Blog', style: ButtonStyle.Link, url: blogUrl }
  ];

  switch (kind) {
    case 'site-approval':
      title = 'Mülakata Davet Edildiniz';
      bodyLines = [
        `Merhaba **${name}**,`,
        '',
        `**${role}** rolü için oluşturduğunuz \`${ref}\` referans numaralı başvurunuz ön incelemeden geçti. Görüşme öncesi site onayı ve imza adımını tamamlamanızı bekliyoruz.`,
        '',
        '⏱️ **Görüşme Detayı:** Yaklaşık 20–30 dakika • Görüşme Yöntemi: Discord',
        '_Merak etmeyin, kravat zorunlu değil._'
      ];
      primaryButton = {
        label: 'Onay ve İmza Adımına Git',
        style: ButtonStyle.Link,
        url: `${base}${defaultApprovalPath}`
      };
      break;

    case 'approval-complete':
      title = 'Onayınız ve İmzanız Alındı';
      bodyLines = [
        `Merhaba **${name}**,`,
        '',
        `\`${ref}\` numaralı **${role}** başvurunuz için taahhüt ve imza kaydınız başarıyla alındı.`,
        'Ekibimiz belirlenen saatte görüşmeyi başlatmak üzere sizinle Discord üzerinden iletişime geçecektir.'
      ];
      primaryButton = {
        label: 'Aday Merkezini Görüntüle',
        style: ButtonStyle.Link,
        url: `${base}/applications/${encodeURIComponent(ref)}`
      };
      break;

    case 'question':
      title = 'Başvurunuz Hakkında Ek Soru';
      bodyLines = [
        `Merhaba **${name}**,`,
        '',
        `\`${ref}\` referanslı **${role}** başvurunuzu değerlendirirken ekibimizin bir sorusu oldu:`,
        '',
        `> ${context.question || 'Başvurunuzla ilgili ayrıntı istenmektedir.'}`,
        '',
        'Yanıtınızı doğrudan bu mesajı yanıtlayarak veya aday portalından iletebilirsiniz.'
      ];
      primaryButton = {
        label: 'Başvuru Ayrıntılarını Gör',
        style: ButtonStyle.Link,
        url: `${base}/applications/${encodeURIComponent(ref)}`
      };
      break;

    case 'time-approved':
      title = 'Mülakat Zamanınız Onaylandı';
      bodyLines = [
        `Merhaba **${name}**,`,
        '',
        `\`${ref}\` numaralı **${role}** başvurunuz için mülakat saati onaylandı.`,
        '',
        `📅 **Planlanan Zaman:** \`${context.scheduledTime || 'Belirlenen saat'}\``,
        'Görüşme saatinden birkaç dakika önce Discord durumunuzu müsait yapmanız yeterlidir.'
      ];
      primaryButton = {
        label: 'Mülakat Durumunu İncele',
        style: ButtonStyle.Link,
        url: `${base}/applications/${encodeURIComponent(ref)}`
      };
      break;

    case 'accepted':
      title = 'Tebrikler, Ekibe Hoş Geldiniz!';
      bodyLines = [
        `Merhaba **${name}**,`,
        '',
        `\`${ref}\` referans numaralı **${role}** başvurunuz olumlu sonuçlandı. Sizi EkoYıldız ekibinde görmekten büyük mutluluk duyuyoruz.`,
        'Onboarding ve yetkilendirme adımları için ekip koordinatörümüz sizinle bağlantıya geçecektir.'
      ];
      primaryButton = {
        label: 'Ekip Kültürü & Rehber',
        style: ButtonStyle.Link,
        url: careersUrl
      };
      break;

    case 'rejected':
      title = 'Başvuru Değerlendirme Sonucu';
      bodyLines = [
        `Merhaba **${name}**,`,
        '',
        `\`${ref}\` referanslı **${role}** pozisyonu için başvurunuz incelendi.`,
        context.reason
          ? `Gerekçe: ${context.reason}`
          : 'Mevcut dönemdeki yoğunluk ve kontenjan sınırları nedeniyle bu aşamada sürecinizi ilerletemiyoruz.',
        '',
        'Gelecekteki açık pozisyonlarda tekrar görüşmek dileğiyle. Emek ve ilginiz için teşekkür ederiz.'
      ];
      primaryButton = {
        label: 'Diğer Açık Pozisyonlar',
        style: ButtonStyle.Link,
        url: formsUrl
      };
      break;

    case 'interview-finished':
      title = 'Mülakatınız Tamamlandı';
      bodyLines = [
        `Merhaba **${name}**,`,
        '',
        `\`${ref}\` numaralı **${role}** başvurunuz kapsamındaki mülakat görüşmesi tamamlandı.`,
        'Değerlendirme sonuçları People & Community ekibimiz tarafından incelendikten sonra aday merkezinize yansıtılacaktır.'
      ];
      primaryButton = {
        label: 'Aday Merkezini Ziyaret Et',
        style: ButtonStyle.Link,
        url: `${base}/applications/${encodeURIComponent(ref)}`
      };
      break;

    default:
      title = 'Başvuru Bilgilendirmesi';
      bodyLines = [
        `Merhaba **${name}**,`,
        '',
        `\`${ref}\` referanslı **${role}** başvurunuz güncellendi.`
      ];
      primaryButton = {
        label: 'Başvuruyu Görüntüle',
        style: ButtonStyle.Link,
        url: `${base}/applications/${encodeURIComponent(ref)}`
      };
  }

  const buttons = [primaryButton, ...secondaryButtons].filter(Boolean);

  const containerComponents = [
    ...ComponentsV2Factory.headerBlock(title, '✦'),
    ComponentsV2Factory.text(bodyLines.join('\n')),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow(buttons),
    ComponentsV2Factory.separator(false),
    ComponentsV2Factory.text(`-# EkoYıldız People & Community • Başvuru Ref: ${ref}`)
  ];

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [
      ComponentsV2Factory.container(containerComponents)
    ]
  };
}

module.exports = {
  buildApplicationMessage
};
