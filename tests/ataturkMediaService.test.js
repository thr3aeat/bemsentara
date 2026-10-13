'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createMediaService } = require('../server/services/ataturkMediaService');

const page = (title, o = {}) => ({
  title: `File:${title}`, index: o.index || 1, imageinfo: [{
    mime: o.mime || 'image/jpeg', width: o.width || 1000, size: o.size || 1000, url: `https://u.test/${encodeURIComponent(title)}`,
    thumburl: `https://t.test/${encodeURIComponent(title)}?utm=x`, descriptionurl: `https://c.test/${title}`,
    extmetadata: { LicenseShortName: { value: o.license || 'Public domain' }, ImageDescription: { value: o.desc || 'Mustafa Kemal Atatürk' } }
  }]
});
const fakeHttp = (handler) => ({ get: async (_u, { params }) => ({ data: { query: { pages: Object.fromEntries(handler(params).map((p, i) => [i, p])) } } }) });

describe('ataturkMediaService', () => {
  it('doğrulanmış dosyaları, sesi ve süzgeçten geçen aranan görselleri/videoyu çözer', async () => {
    const svc = createMediaService({ http: fakeHttp((p) => {
      if (p.titles) return [page('Ataturk13.JPG'), page('Mustafa Kemal harf devriminde.jpg'), page('Atatürk during the 10th Anniversary Speech.jpg'),
        page("Mustafa Kemal's speech at the 10th Anniversary of the Republic of Turkey.ogg", { mime: 'application/ogg' })];
      if (/Dumlup/.test(p.gsrsearch)) return [
        page('Dumlupınar billboard.jpg', { index: 1, desc: 'Atatürk Dumlupınar' }),          // kötü başlık
        page('Dumlupınar kopya.jpg', { index: 2, desc: 'Atatürk Dumlupınar', license: 'CC BY-SA 4.0' }), // serbest değil
        page('Küçük Dumlupınar.jpg', { index: 3, desc: 'Atatürk Dumlupınar', width: 300 }),  // küçük
        page('Dumlupınar 1922.jpg', { index: 4, desc: 'Atatürk Dumlupınar 1922' })           // uygun
      ];
      if (/köylü/.test(p.gsrsearch)) return [page('Atatürk ve manzara.jpg', { desc: 'Atatürk' })]; // konu eşleşmiyor
      if (/video/.test(p.gsrsearch)) return [
        page('Atatürk.ogv', { mime: 'video/ogg', index: 1 }), page('Atatürk.webm', { mime: 'video/webm', index: 2 }),
        page('Atatürk dev.webm', { mime: 'video/webm', size: 900 * 1024 * 1024, index: 3 })
      ];
      return [];
    }) });
    const m = await svc.getMedia();
    assert.deepEqual(Object.keys(m.gallery).sort(), ['photo-1', 'photo-2', 'photo-3', 'photo-4']);
    assert.match(m.gallery['photo-4'].title, /Dumlupınar 1922/);
    assert.equal(m.gallery['photo-1'].thumb, 'https://t.test/Ataturk13.JPG', 'sorgu parametresi temizlenir');
    assert.equal(m.gallery['photo-5'], undefined, 'konu eşleşmediyse yanlış fotoğraf gösterilmez');
    assert.equal(m.gallery['photo-6'], undefined);
    assert.match(m.audio.url, /speech/);
    assert.equal(m.video.mime, 'video/webm', 'webm tercih edilir, çok büyük dosya elenir');
  });

  it('Commons yanıt vermezse boş ama geçerli sonuç döner; başarılı sonuç önbelleğe alınır', async () => {
    let calls = 0; let t = 1000;
    const svc = createMediaService({ now: () => t, http: { get: async () => { calls++; throw new Error('429'); } } });
    assert.deepEqual(await svc.getMedia(), { gallery: {}, audio: null, video: null });
    const before = calls; await svc.getMedia();
    assert.equal(calls, before, 'başarısızlık kısa süre önbellekte tutulur');

    let n = 0;
    const ok = createMediaService({ now: () => t, http: fakeHttp((p) => { n++; return p.titles ? [page('Ataturk13.JPG')] : []; }) });
    await ok.getMedia(); const first = n; await ok.getMedia();
    assert.equal(n, first, 'başarılı sonuç önbellekten gelir');
  });
});
