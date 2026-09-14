'use strict';

const DEFAULT_SITE_URL = 'https://ekoyildiz.duckdns.org';

const GUIDE_BY_CATEGORY = Object.freeze({
  ban: { slug: 'ceza-ve-itiraz', title: 'Ceza ve itiraz rehberi' },
  report: { slug: 'kullanici-raporlama', title: 'Kullanıcı raporlama rehberi' },
  account: { slug: 'hesabimi-guvene-alma', title: 'Hesabımı güvene alma rehberi' },
  technical: { slug: 'ticket-sorun-giderici', title: 'Ticket hata sihirbazı' },
  billing: { slug: 'ticket-sorun-giderici', title: 'Ödeme ve ticket sorun giderici' },
  reklam: { slug: 'yetkiliyle-iletisim', title: 'Yetkililerle iletişim rehberi' },
  genel: { slug: 'yetkiliyle-iletisim', title: 'Yetkililerle iletişim rehberi' },
  other: { slug: 'yetkiliyle-iletisim', title: 'Yetkililerle iletişim rehberi' }
});

function getPublicSiteUrl() {
  const configured = String(process.env.BASE_URL || '').trim();
  if (!configured || /localhost|127\.0\.0\.1/i.test(configured)) return DEFAULT_SITE_URL;
  return configured.replace(/\/$/, '');
}

function resolveTicketGuide(category) {
  const guide = GUIDE_BY_CATEGORY[String(category || '').toLowerCase()] || GUIDE_BY_CATEGORY.other;
  return { ...guide, url: `${getPublicSiteUrl()}/yardim/${guide.slug}` };
}

module.exports = { GUIDE_BY_CATEGORY, getPublicSiteUrl, resolveTicketGuide };
