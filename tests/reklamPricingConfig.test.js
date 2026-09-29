'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  BASE_DISCORD_ANNOUNCEMENT_PRICE,
  PRESET_PACKAGES,
  getDiscordAddonForPackage,
  calculateCustomPackagePrice
} = require('../server/services/reklamPricingConfig');

test('Shorts package strictly forbids Discord announcement add-on', () => {
  const shortsPkg = PRESET_PACKAGES.find(p => p.id === 'shorts');
  assert.equal(shortsPkg.allowsDiscordAddon, false);
  assert.equal(getDiscordAddonForPackage('shorts'), null);
});

test('Discord announcement price decreases as video package gets more expensive', () => {
  const standartAddon = getDiscordAddonForPackage('standart');
  const midrollAddon = getDiscordAddonForPackage('midroll');
  const goldAddon = getDiscordAddonForPackage('gold');
  const megaAddon = getDiscordAddonForPackage('mega');
  const vipAddon = getDiscordAddonForPackage('vip');

  assert.ok(standartAddon && midrollAddon && goldAddon && megaAddon && vipAddon);

  // Fiyatlar kademeli olarak kesinlikle AZALMALI:
  // Standart (110) > Midroll (80) > Gold (50) > Mega (30) > VIP (20)
  assert.equal(standartAddon.addonPrice, 110);
  assert.equal(midrollAddon.addonPrice, 80);
  assert.equal(goldAddon.addonPrice, 50);
  assert.equal(megaAddon.addonPrice, 30);
  assert.equal(vipAddon.addonPrice, 20);

  assert.ok(standartAddon.addonPrice > midrollAddon.addonPrice);
  assert.ok(midrollAddon.addonPrice > goldAddon.addonPrice);
  assert.ok(goldAddon.addonPrice > megaAddon.addonPrice);
  assert.ok(megaAddon.addonPrice > vipAddon.addonPrice);

  // İndirim açıklaması net ve dark pattern içermez
  assert.match(midrollAddon.advantageNote, /avantaj/i);
  assert.equal(midrollAddon.discountAmount, BASE_DISCORD_ANNOUNCEMENT_PRICE - 80);
});

test('calculateCustomPackagePrice applies intelligent bundle discounts and dynamic Discord pricing', () => {
  // Hiçbir şey seçilmediğinde
  const empty = calculateCustomPackagePrice({});
  assert.equal(empty.total, 0);
  assert.equal(empty.isValid, false);

  // Tek hizmet
  const single = calculateCustomPackagePrice({
    formatId: 'fmt_shorts'
  });
  assert.equal(single.subtotal, 30);
  assert.equal(single.discount, 0);
  assert.equal(single.total, 30);
  assert.equal(single.isValid, true);

  // Mid-roll ile birlikte Discord duyurusu seçildiğinde dinamik fiyat 80 TL olmalı
  const midrollWithDiscord = calculateCustomPackagePrice({
    formatId: 'fmt_video_midroll',
    pacingId: 'pacing_standard',
    addonIds: ['addon_discord_announcement']
  });
  // 100 TL (midroll) + 80 TL (dinamik discord) = 180 TL
  assert.equal(midrollWithDiscord.subtotal, 180);

  // 4 hizmet seçildiğinde %15 akıllı paket avantajı uygulanır
  const fourItems = calculateCustomPackagePrice({
    formatId: 'fmt_video_midroll', // 100 TL
    pacingId: 'pacing_extended',   // 45 TL
    addonIds: ['addon_discord_announcement', 'addon_pinned_comment'] // 80 TL + 20 TL = 100 TL
  });
  // Ara toplam = 100 + 45 + 80 + 20 = 245 TL
  // İndirim = %15 of 245 = 37 TL
  // Toplam = 208 TL
  assert.equal(fourItems.subtotal, 245);
  assert.equal(fourItems.discount, 37);
  assert.equal(fourItems.total, 208);
  assert.equal(fourItems.isValid, true);
});
