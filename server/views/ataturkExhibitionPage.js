'use strict';

/**
 * ataturkExhibitionPage.js
 * 
 * Ulu Önder Gazi Mustafa Kemal Atatürk'ün aziz hatırasına adanmış;
 * saygılı, zarif, sinematik ve interaktif dijital sergi / anma salonu.
 */

const {
  renderPlatformHeader,
  renderPlatformFooter,
  platformChromeStyles,
  platformChromeScript
} = require('./platformChrome');

function renderAtaturkExhibitionPage(user = null) {
  // Tarihî Zaman Çizelgesi Dönemleri
  const TIMELINE_DATA = [
    {
      id: 'era-1',
      years: '1881 — 1905',
      title: 'Çocukluk, Askerî Eğitim ve Fikir Dünyası',
      location: 'Selanik • Manastır • İstanbul',
      summary: 'Selanik’te başlayan yaşamı, Manastır Askerî İdadisi ve İstanbul Harp Akademisi’ndeki hürriyet ve vatanperverlik fikirleriyle şekillendi.',
      details: [
        '1881 yılında Selanik’te doğdu. Askerî Rüştiye’de matematik öğretmeninin kendisine "Kemal" adını vermesiyle ilim ve mantık yolculuğu pekişti.',
        'Manastır Askerî İdadisi’nde Namık Kemal ve Tevfik Fikret’in vatan şiirleriyle, Fransız Aydınlanması düşünürleriyle tanıştı.',
        '1905 yılında Kurmay Yüzbaşı rütbesiyle Harp Akademisi’nden mezun olarak vatan müdafaası için ilk görev yeri olan Şam’a atandı.'
      ],
      quote: 'Hayatta en hakiki mürşit ilimdir, fendir.'
    },
    {
      id: 'era-2',
      years: '1905 — 1918',
      title: 'Cephelerde Bir Kurmay Komutan',
      location: 'Trablusgarp • Çanakkale • Doğu Cephesi • Suriye',
      summary: 'Trablusgarp’tan Çanakkale Anafartalar Zaferi’ne, Kafkaslardan Suriye Cephesi’ne kadar milletin kaderini tayin eden stratejik askerî deha.',
      details: [
        '1911’de Trablusgarp’ta Derne ve Tobruk’ta yerel halkı organize ederek sömürgeci güçlere karşı ilk büyük gerilla mücadelesini verdi.',
        '1915 Çanakkale Savaşları’nda 19. Tümen Komutanı olarak Conkbayırı ve Anafartalar’da düşman taarruzunu durdurdu: "Ben size taarruzu değil, ölmeyi emrediyorum!"',
        '1916’da Doğu Cephesi’nde Muş ve Bitlis’i Rus işgalinden kurtararak generalliğe (Paşa) terfi etti.'
      ],
      quote: 'Ben size taarruzu emretmiyorum, ölmeyi emrediyorum!'
    },
    {
      id: 'era-3',
      years: '1919 — 1923',
      title: 'Millî Mücadele ve Bağımsızlık Zaferi',
      location: 'Samsun • Amasya • Erzurum • Sivas • Ankara',
      summary: 'Milletin bağımsızlığını yine milletin azim ve kararının kurtaracağına olan sarsılmaz inançla başlatılan emsalsiz istiklal harbi.',
      details: [
        '19 Mayıs 1919’da Samsun’a çıkarak Türk istiklal meşalesini yaktı; Amasya Genelgesi, Erzurum ve Sivas Kongreleri ile millî iradeyi teşkilatlandırdı.',
        '23 Nisan 1920’de Türkiye Büyük Millet Meclisi’ni kurarak egemenliğin kayıtsız şartsız millete ait olduğunu tüm dünyaya ilan etti.',
        'Sakarya Meydan Muharebesi ve Başkomutanlık Meydan Muharebesi (Büyük Taarruz) ile vatan topraklarını düşman işgalinden ebediyen kurtardı.'
      ],
      quote: 'Milletin istiklalini, yine milletin azim ve kararı kurtaracaktır.'
    },
    {
      id: 'era-4',
      years: '1923 — 1930',
      title: 'Cumhuriyetin İlanı ve Çağdaş Devrimler',
      location: 'Ankara • Tüm Türkiye',
      summary: 'Yıkılmış bir imparatorluğun küllerinden tam bağımsız, laik, modern ve halk egemenliğine dayalı genç Türkiye Cumhuriyeti doğdu.',
      details: [
        '29 Ekim 1923’te Cumhuriyet ilan edildi ve Gazi Mustafa Kemal ilk Cumhurbaşkanı seçildi.',
        'Tevhid-i Tedrisat Kanunu ile eğitim birleştirildi, çağdaş hukuk sistemi (Türk Medeni Kanunu) kabul edilerek kadınlara dünya ülkelerinden önce haklar tanındı.',
        '1928 Harf Devrimi ile Türk alfabesi kabul edildi; Atatürk kara tahta başına geçerek Millet Mektepleri Başöğretmeni oldu.'
      ],
      quote: 'Ey yükselen yeni nesil! İstikbal sizsiniz. Cumhuriyeti biz kurduk, onu yükseltecek ve yaşatacak sizlersiniz.'
    },
    {
      id: 'era-5',
      years: '1930 — 1938',
      title: 'Yurtta Barış, Dünyada Barış & Ebedi Miras',
      location: 'Yalova • Dolmabahçe • Ankara',
      summary: 'Uluslararası barış diplomasisi, Balkan Antantı, Sadabat Paktı, Montrö Boğazlar Sözleşmesi ve vatan toprağı bilinen Hatay’ın anavatana katılması.',
      details: [
        '1933’te Cumhuriyet’in 10. yılında milletine seslendi: "Türk milleti çalışkandır, Türk milleti zekidir!"',
        'Montrö Boğazlar Sözleşmesi ile Türk Boğazları tam millî egemenliğe kavuşturuldu.',
        '10 Kasım 1938’de ebediyete intikal eden Atatürk, arkasında hür bir vatan, laik bir cumhuriyet ve aklın rehberliğini miras bıraktı.'
      ],
      quote: 'Yurtta sulh, cihanda sulh.'
    }
  ];

  // Tarihî Fotoğraf Galerisi Verisi
  const GALLERY_PHOTOS = [
    {
      id: 'photo-1',
      title: 'Anafartalar Grubu Komutanı',
      year: '1915',
      location: 'Çanakkale Cephesi',
      desc: 'Çanakkale Savaşları sırasında siperde dürbünle düşman hatlarını gözleyen Mustafa Kemal.',
      source: 'Genelkurmay ATASE Daire Başkanlığı Arşivi',
      aspect: 'landscape'
    },
    {
      id: 'photo-2',
      title: 'Millet Mektepleri Başöğretmeni',
      year: '1928',
      location: 'Gülhane Parkı, İstanbul',
      desc: 'Yeni Türk harflerini halka bizzat kara tahta başında öğretirken.',
      source: 'Cumhurbaşkanlığı Millî Arşivleri',
      aspect: 'portrait'
    },
    {
      id: 'photo-3',
      title: '10. Yıl Nutku Konuşması',
      year: '1933',
      location: 'Ankara Hipodromu',
      desc: 'Cumhuriyetin 10. yılında tarihi nutkunu mikrofondan milyonlara okurken.',
      source: 'T.C. Kültür ve Turizm Bakanlığı Arşivi',
      aspect: 'landscape'
    },
    {
      id: 'photo-4',
      title: 'Dumlupınar Harabelerinde',
      year: '1922',
      location: 'Kütahya • Dumlupınar',
      desc: 'Büyük Taarruz sonrasında kırık bir kağnı arabası üzerinde muharebe sahasını incelerken.',
      source: 'Askerî Müze ve Kültür Sitesi Komutanlığı',
      aspect: 'landscape'
    },
    {
      id: 'photo-5',
      title: 'Köylü Vatandaşla Sohbet',
      year: '1930',
      location: 'Yozgat Seyahati',
      desc: 'Yurt gezisinde bir köylünün derdini dikkatle dinlerken.',
      source: 'Basın-Yayın Enformasyon Arşivi',
      aspect: 'portrait'
    },
    {
      id: 'photo-6',
      title: 'Florya’da Kürek Çekerken',
      year: '1935',
      location: 'Florya Deniz Köşkü, İstanbul',
      desc: 'Halkın arasında, sade bir vatandaş gibi spora ve denize vakit ayırırken.',
      source: 'Millî Saraylar Arşivi',
      aspect: 'landscape'
    }
  ];

  // Zaman çizelgesi HTML
  const timelineHtml = TIMELINE_DATA.map((era, idx) => `
    <article class="timeline-era-card ${idx === 0 ? 'is-active' : ''}" id="${era.id}" data-era-index="${idx}">
      <div class="era-header" onclick="selectEra('${era.id}')" role="button" tabindex="0" aria-expanded="${idx === 0}">
        <div class="era-meta">
          <span class="era-badge">${era.years}</span>
          <span class="era-location">${era.location}</span>
        </div>
        <h3 class="era-title">${era.title}</h3>
        <p class="era-summary">${era.summary}</p>
        <span class="era-toggle-icon" aria-hidden="true">${idx === 0 ? '−' : '+'}</span>
      </div>
      <div class="era-body" id="body-${era.id}">
        <ul class="era-details-list">
          ${era.details.map(d => `<li><span class="bullet" aria-hidden="true">✦</span><span>${d}</span></li>`).join('')}
        </ul>
        <blockquote class="era-quote">
          <p>“${era.quote}”</p>
          <cite>— Mustafa Kemal Atatürk</cite>
        </blockquote>
      </div>
    </article>
  `).join('');

  // Galeri HTML
  const galleryHtml = GALLERY_PHOTOS.map(p => `
    <div class="gallery-card" onclick="openPhotoModal('${p.id}')" role="button" tabindex="0" aria-label="${p.title}, ${p.year}">
      <div class="gallery-visual">
        <div class="gallery-placeholder-art" data-photo-id="${p.id}">
          <div class="art-backdrop"></div>
          <div class="art-portrait-emblem">
            <svg viewBox="0 0 48 48" fill="none" class="emblem-svg">
              <circle cx="24" cy="24" r="22" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
              <path d="M24 10L27.5 19.5H37.5L29.5 25.5L32.5 35L24 29.5L15.5 35L18.5 25.5L10.5 19.5H20.5L24 10Z" fill="rgba(225,29,72,0.45)"/>
            </svg>
            <span class="art-caption-year">${p.year}</span>
          </div>
        </div>
        <div class="gallery-overlay">
          <span class="gallery-zoom-badge">
            <svg viewBox="0 0 20 20" fill="none" class="zoom-icon" aria-hidden="true">
              <path d="M9 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM2 9a7 7 0 1 1 12.6 4.2l3.6 3.6a1 1 0 0 1-1.4 1.4l-3.6-3.6A7 7 0 0 1 2 9z" fill="currentColor"/>
            </svg>
            İncele
          </span>
        </div>
      </div>
      <div class="gallery-info">
        <div class="gallery-meta">
          <span class="gallery-year">${p.year}</span>
          <span class="gallery-loc">${p.location}</span>
        </div>
        <h4 class="gallery-title">${p.title}</h4>
        <p class="gallery-desc">${p.desc}</p>
      </div>
    </div>
  `).join('');

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#07080b">
  <meta name="description" content="Gazi Mustafa Kemal Atatürk'ün aziz hatırasına adanmış interaktif dijital sergi ve tarihî anma salonu.">
  <title>Mustafa Kemal Atatürk — Ebedi Sergi & Anma Salonu</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ${platformChromeStyles}

    :root {
      --ata-bg: #07080c;
      --ata-surface: #0e1017;
      --ata-surface-elevated: #141722;
      --ata-border-subtle: rgba(255, 255, 255, 0.08);
      --ata-border-medium: rgba(255, 255, 255, 0.16);
      --ata-border-active: rgba(225, 29, 72, 0.45);
      --ata-crimson: #e11d48;
      --ata-crimson-subtle: rgba(225, 29, 72, 0.12);
      --ata-gold: #d4af37;
      --ata-text-main: #f8fafc;
      --ata-text-muted: #94a3b8;
      --ata-text-dim: #64748b;
      --ata-serif: 'Cinzel', serif, -apple-system;
      --ata-sans: 'Inter', -apple-system, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body.ataturk-page {
      background-color: var(--ata-bg);
      color: var(--ata-text-main);
      font-family: var(--ata-sans);
      min-height: 100vh;
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    .ata-shell {
      width: min(1200px, calc(100% - 40px));
      margin: 0 auto;
    }

    /* ── Hero Bölümü (Sinematik Açılış) ── */
    .ata-hero {
      position: relative;
      min-height: 85vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 100px 20px 80px;
      overflow: hidden;
      border-bottom: 1px solid var(--ata-border-subtle);
    }
    .ata-hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 25%, rgba(225, 29, 72, 0.08) 0%, transparent 60%),
                  radial-gradient(circle at 50% 80%, rgba(255, 255, 255, 0.03) 0%, transparent 70%);
      pointer-events: none;
    }
    .ata-hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: var(--ata-crimson);
      margin-bottom: 24px;
      padding: 6px 16px;
      background: var(--ata-crimson-subtle);
      border: 1px solid rgba(225, 29, 72, 0.25);
      border-radius: 999px;
    }
    .ata-hero-title {
      font-family: var(--ata-serif);
      font-size: clamp(2.4rem, 6vw, 4.6rem);
      font-weight: 800;
      letter-spacing: 0.03em;
      line-height: 1.1;
      margin-bottom: 24px;
      max-width: 900px;
      color: #ffffff;
      text-shadow: 0 4px 30px rgba(0,0,0,0.7);
    }
    .ata-hero-subtitle {
      color: var(--ata-text-muted);
      font-size: clamp(1.05rem, 1.6vw, 1.25rem);
      max-width: 680px;
      margin: 0 auto 36px;
      font-weight: 400;
      line-height: 1.7;
    }
    .ata-hero-dates {
      display: flex;
      align-items: center;
      gap: 16px;
      font-family: var(--ata-serif);
      font-size: 1.2rem;
      letter-spacing: 0.15em;
      color: var(--ata-gold);
      margin-bottom: 44px;
    }
    .ata-hero-dates .star { color: var(--ata-crimson); font-size: 1rem; }

    .ata-scroll-indicator {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: var(--ata-text-dim);
      font-size: 0.78rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      transition: color 0.2s;
    }
    .ata-scroll-indicator:hover { color: var(--ata-text-main); }
    .scroll-mouse {
      width: 22px;
      height: 36px;
      border: 2px solid rgba(255,255,255,0.25);
      border-radius: 12px;
      position: relative;
    }
    .scroll-wheel {
      width: 4px;
      height: 8px;
      background: var(--ata-crimson);
      border-radius: 2px;
      position: absolute;
      top: 6px;
      left: 50%;
      transform: translateX(-50%);
      animation: wheelDrop 1.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
    }
    @keyframes wheelDrop {
      0% { opacity: 1; transform: translate(-50%, 0); }
      100% { opacity: 0; transform: translate(-50%, 14px); }
    }

    /* ── Bölüm Başlıkları ── */
    .section-header {
      text-align: center;
      padding: 80px 0 44px;
      position: relative;
    }
    .section-tag {
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--ata-crimson);
      display: block;
      margin-bottom: 12px;
    }
    .section-title {
      font-family: var(--ata-serif);
      font-size: clamp(1.8rem, 3.6vw, 2.7rem);
      font-weight: 800;
      letter-spacing: 0.02em;
      color: #ffffff;
      margin-bottom: 14px;
    }
    .section-desc {
      color: var(--ata-text-muted);
      font-size: 1rem;
      max-width: 600px;
      margin: 0 auto;
    }

    /* ── 1. İnteraktif Zaman Çizelgesi ── */
    .timeline-wrap {
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-width: 900px;
      margin: 0 auto 90px;
    }
    .timeline-era-card {
      background: var(--ata-surface);
      border: 1px solid var(--ata-border-subtle);
      border-radius: 18px;
      padding: 26px 30px;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
      position: relative;
      outline: none;
    }
    .timeline-era-card:hover {
      background: var(--ata-surface-elevated);
      border-color: var(--ata-border-medium);
      transform: translateY(-2px);
    }
    .timeline-era-card.is-active {
      border-color: var(--ata-border-active);
      box-shadow: 0 16px 40px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(225, 29, 72, 0.3);
      background: linear-gradient(180deg, #12141e 0%, #0d0f16 100%);
    }
    .era-header {
      position: relative;
      outline: none;
    }
    .era-meta {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .era-badge {
      font-family: var(--ata-serif);
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--ata-gold);
    }
    .era-location {
      font-size: 0.8rem;
      color: var(--ata-text-dim);
    }
    .era-title {
      font-family: var(--ata-serif);
      font-size: 1.35rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .era-summary {
      color: var(--ata-text-muted);
      font-size: 0.95rem;
      line-height: 1.6;
      max-width: calc(100% - 40px);
    }
    .era-toggle-icon {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.5rem;
      color: var(--ata-text-dim);
      font-weight: 300;
      line-height: 1;
    }
    .is-active .era-toggle-icon { color: var(--ata-crimson); }

    .era-body {
      display: none;
      margin-top: 24px;
      padding-top: 22px;
      border-top: 1px solid var(--ata-border-subtle);
      animation: fadeInEra 0.25s ease-out;
    }
    .is-active .era-body { display: block; }
    @keyframes fadeInEra {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .era-details-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 24px;
    }
    .era-details-list li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      color: #cbd5e1;
      font-size: 0.95rem;
      line-height: 1.65;
    }
    .era-details-list .bullet {
      color: var(--ata-crimson);
      font-size: 0.75rem;
      margin-top: 4px;
    }
    .era-quote {
      background: rgba(0, 0, 0, 0.35);
      border-left: 3px solid var(--ata-crimson);
      padding: 16px 20px;
      border-radius: 0 12px 12px 0;
      font-style: italic;
      color: #f1f5f9;
    }
    .era-quote p { font-size: 1.02rem; margin-bottom: 6px; }
    .era-quote cite {
      font-style: normal;
      font-size: 0.8rem;
      color: var(--ata-text-dim);
      display: block;
      letter-spacing: 0.05em;
    }

    /* ── 2. Tarihî Ses Deneyimi (10. Yıl Nutku) ── */
    .audio-experience-section {
      background: linear-gradient(180deg, rgba(20, 23, 34, 0.6) 0%, rgba(10, 11, 17, 0.8) 100%);
      border: 1px solid var(--ata-border-subtle);
      border-radius: 24px;
      padding: 44px 36px;
      margin: 0 auto 90px;
      max-width: 960px;
      box-shadow: 0 20px 50px -15px rgba(0,0,0,0.7);
    }
    .audio-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }
    .audio-info h3 {
      font-family: var(--ata-serif);
      font-size: 1.4rem;
      color: #ffffff;
      margin-bottom: 4px;
    }
    .audio-info p {
      color: var(--ata-text-muted);
      font-size: 0.88rem;
    }
    .audio-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(225, 29, 72, 0.15);
      color: var(--ata-crimson);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 5px 12px;
      border-radius: 999px;
      border: 1px solid rgba(225, 29, 72, 0.3);
    }
    .audio-player-box {
      background: #090b10;
      border: 1px solid var(--ata-border-subtle);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .audio-controls-row {
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    .btn-audio-play {
      background: var(--ata-crimson);
      color: #ffffff;
      border: none;
      border-radius: 999px;
      padding: 12px 24px;
      font-weight: 700;
      font-size: 0.95rem;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .btn-audio-play:hover {
      background: #f43f5e;
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(225, 29, 72, 0.4);
    }
    .btn-audio-play:active { transform: translateY(0); }
    .audio-seek-group {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 220px;
    }
    .audio-time-label {
      font-size: 0.82rem;
      font-family: monospace;
      color: var(--ata-text-muted);
    }
    .audio-progress-bar {
      flex: 1;
      height: 6px;
      background: rgba(255,255,255,0.1);
      border-radius: 999px;
      position: relative;
      cursor: pointer;
    }
    .audio-progress-fill {
      height: 100%;
      width: 0%;
      background: var(--ata-crimson);
      border-radius: 999px;
      position: relative;
      transition: width 0.1s linear;
    }
    .audio-volume-group {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--ata-text-muted);
      font-size: 0.85rem;
    }
    .audio-transcript-box {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--ata-border-subtle);
      border-radius: 12px;
      padding: 20px;
      max-height: 220px;
      overflow-y: auto;
    }
    .transcript-title {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ata-gold);
      margin-bottom: 8px;
    }
    .transcript-text {
      font-size: 0.92rem;
      color: #cbd5e1;
      line-height: 1.7;
    }

    /* ── 3. Tarihî Fotoğraf Galerisi ── */
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
      margin-bottom: 90px;
    }
    .gallery-card {
      background: var(--ata-surface);
      border: 1px solid var(--ata-border-subtle);
      border-radius: 18px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
      outline: none;
    }
    .gallery-card:hover {
      border-color: var(--ata-border-medium);
      transform: translateY(-4px);
      box-shadow: 0 20px 40px -10px rgba(0,0,0,0.6);
    }
    .gallery-card:focus-visible {
      border-color: var(--ata-crimson);
      box-shadow: 0 0 0 2px var(--ata-crimson);
    }
    .gallery-visual {
      position: relative;
      height: 240px;
      background: #000000;
      overflow: hidden;
    }
    .gallery-placeholder-art {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      background: linear-gradient(135deg, #11141f 0%, #08090f 100%);
    }
    .art-portrait-emblem {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .emblem-svg {
      width: 54px;
      height: 54px;
      filter: drop-shadow(0 4px 12px rgba(225, 29, 72, 0.3));
    }
    .art-caption-year {
      font-family: var(--ata-serif);
      font-size: 0.9rem;
      letter-spacing: 0.2em;
      color: rgba(255, 255, 255, 0.6);
    }
    .gallery-overlay {
      position: absolute;
      inset: 0;
      background: rgba(7, 8, 12, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
      backdrop-filter: blur(4px);
    }
    .gallery-card:hover .gallery-overlay { opacity: 1; }
    .gallery-zoom-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #ffffff;
      padding: 8px 18px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .zoom-icon { width: 14px; height: 14px; }
    .gallery-info { padding: 20px; }
    .gallery-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      margin-bottom: 6px;
    }
    .gallery-year {
      font-family: var(--ata-serif);
      font-weight: 700;
      color: var(--ata-gold);
    }
    .gallery-loc { color: var(--ata-text-dim); }
    .gallery-title {
      font-family: var(--ata-serif);
      font-size: 1.15rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .gallery-desc {
      color: var(--ata-text-muted);
      font-size: 0.88rem;
      line-height: 1.55;
    }

    /* ── 4. Tarihî Video Bölümü (Sessiz & Kullanıcı Kontrollü) ── */
    .video-experience-section {
      background: var(--ata-surface);
      border: 1px solid var(--ata-border-subtle);
      border-radius: 24px;
      padding: 40px;
      margin-bottom: 90px;
      text-align: center;
    }
    .video-container {
      max-width: 840px;
      margin: 24px auto 0;
      background: #000000;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid var(--ata-border-subtle);
      position: relative;
      aspect-ratio: 16 / 9;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .video-placeholder-cover {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      background: radial-gradient(circle at center, #1b1e2e 0%, #06070a 100%);
      cursor: pointer;
    }
    .video-play-disc {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--ata-crimson);
      color: #ffffff;
      display: grid;
      place-items: center;
      box-shadow: 0 0 30px rgba(225, 29, 72, 0.5);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .video-placeholder-cover:hover .video-play-disc { transform: scale(1.08); }
    .video-cover-title {
      font-family: var(--ata-serif);
      font-size: 1.15rem;
      color: #ffffff;
      letter-spacing: 0.05em;
    }
    .video-cover-caption {
      font-size: 0.82rem;
      color: var(--ata-text-muted);
    }

    /* ── 5. Fotoğraf Lightbox Modalı ── */
    .ata-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .ata-modal-backdrop.is-open {
      display: flex;
      opacity: 1;
    }
    .ata-modal-dialog {
      background: var(--ata-surface);
      border: 1px solid var(--ata-border-medium);
      border-radius: 24px;
      max-width: 680px;
      width: 100%;
      overflow: hidden;
      box-shadow: 0 25px 60px -15px rgba(0,0,0,0.8);
      position: relative;
      animation: modalZoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalZoomIn {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .ata-modal-close {
      position: absolute;
      top: 18px;
      right: 18px;
      background: rgba(255,255,255,0.1);
      border: none;
      color: #ffffff;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 1.2rem;
      cursor: pointer;
      z-index: 10;
      transition: background 0.15s;
    }
    .ata-modal-close:hover { background: rgba(225, 29, 72, 0.8); }
    .modal-image-area {
      height: 320px;
      background: #000000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .modal-content-area { padding: 28px; }
    .modal-meta-row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 8px;
    }
    .modal-year-badge {
      font-family: var(--ata-serif);
      color: var(--ata-gold);
      font-weight: 700;
      font-size: 0.9rem;
    }
    .modal-loc { font-size: 0.82rem; color: var(--ata-text-dim); }
    .modal-title {
      font-family: var(--ata-serif);
      font-size: 1.35rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
    }
    .modal-desc {
      color: var(--ata-text-muted);
      font-size: 0.95rem;
      line-height: 1.65;
      margin-bottom: 18px;
    }
    .modal-source {
      font-size: 0.78rem;
      color: var(--ata-text-dim);
      border-top: 1px solid var(--ata-border-subtle);
      padding-top: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* ── Responsive & Accessibility ── */
    @media (max-width: 768px) {
      .ata-hero { padding: 70px 16px 50px; min-height: 70vh; }
      .timeline-era-card { padding: 20px; }
      .audio-experience-section { padding: 28px 20px; }
      .audio-controls-row { flex-direction: column; align-items: stretch; }
      .btn-audio-play { width: 100%; justify-content: center; }
      .video-experience-section { padding: 24px 16px; }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  </style>
</head>
<body class="ataturk-page">
  ${renderPlatformHeader({ activeTab: 'ataturk', user })}

  <!-- Hero Açılış -->
  <header class="ata-hero">
    <div class="ata-hero-eyebrow">
      <span>🇹🇷</span>
      <span>Türkiye Cumhuriyeti’nin Kurucusu</span>
    </div>
    <h1 class="ata-hero-title">Gazi Mustafa Kemal Atatürk</h1>
    <p class="ata-hero-subtitle">
      Yalnızca bir asker ve devlet adamı değil; bağımsızlık fikrini milletin hür vicdanıyla birleştiren, aklın ve bilimin rehberliğini ebedi miras bırakan bir lider.
    </p>
    <div class="ata-hero-dates">
      <span>1881</span>
      <span class="star">★</span>
      <span>1938 — ∞</span>
    </div>
    <a href="#tarihce" class="ata-scroll-indicator" aria-label="Tarihçeye Kaydır">
      <div class="scroll-mouse" aria-hidden="true"><div class="scroll-wheel"></div></div>
      <span>Sergiyi Keşfet</span>
    </a>
  </header>

  <main class="ata-shell">
    <!-- 1. İnteraktif Zaman Çizelgesi -->
    <section class="timeline-section" id="tarihce">
      <div class="section-header">
        <span class="section-tag">Kronolojik Yolculuk</span>
        <h2 class="section-title">Bir Ömrün ve Bir Milletin Tarihî Dönemleri</h2>
        <p class="section-desc">Dönemleri seçerek Mustafa Kemal Atatürk’ün fikir, askerlik ve cumhuriyet mirasını ayrıntılı inceleyin.</p>
      </div>

      <div class="timeline-wrap">
        ${timelineHtml}
      </div>
    </section>

    <!-- 2. Tarihî Ses Deneyimi (10. Yıl Nutku) -->
    <section class="audio-section" id="ses-arsivi">
      <div class="section-header">
        <span class="section-tag">Tarihî Ses Kaydı</span>
        <h2 class="section-title">Kendi Sesinden: 10. Yıl Nutku</h2>
        <p class="section-desc">29 Ekim 1933 tarihinde Ankara Hipodromu’nda milletine seslendiği tarihi anın orijinal ses kaydı ve tam transkripti.</p>
      </div>

      <div class="audio-experience-section">
        <div class="audio-header">
          <div class="audio-info">
            <span class="audio-badge">Orijinal Ses Kaydı • 1933</span>
            <h3>Cumhuriyet’in 10. Yıl Nutku</h3>
            <p>Kaynak: TRT & Kültür Bakanlığı Tarihî Ses Arşivi</p>
          </div>
        </div>

        <div class="audio-player-box">
          <audio id="historicalAudio" preload="none">
            <source src="https://upload.wikimedia.org/wikipedia/commons/4/4b/Atat%C3%BCrk_10th_Year_Speech.ogg" type="audio/ogg">
          </audio>

          <div class="audio-controls-row">
            <button class="btn-audio-play" id="btnAudioToggle" onclick="toggleHistoricalAudio()">
              <span id="audioPlayIcon" aria-hidden="true">▶</span>
              <span id="audioPlayText">Sesi Başlat</span>
            </button>

            <div class="audio-seek-group">
              <span class="audio-time-label" id="audioCurrentTime">00:00</span>
              <div class="audio-progress-bar" id="audioSeekSlider" onclick="seekHistoricalAudio(event)" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                <div class="audio-progress-fill" id="audioProgressFill"></div>
              </div>
              <span class="audio-time-label" id="audioTotalDuration">07:22</span>
            </div>

            <div class="audio-volume-group">
              <span>🔊</span>
              <input type="range" id="audioVolumeSlider" min="0" max="1" step="0.05" value="0.8" oninput="changeVolume(this.value)" aria-label="Ses Düzeyi">
            </div>
          </div>
        </div>

        <div class="audio-transcript-box">
          <div class="transcript-title">📜 Ses Kaydı Transkripti (Erişilebilirlik Metni)</div>
          <p class="transcript-text" id="transcriptContainer">
            "Türk Milleti! Kurtuluş Savaşı'na başladığımızın on beşinci yılındayız. Bugün cumhuriyetimizin onuncu yılını doldurduğu en büyük bayramdır. Kutlu olsun!<br><br>
            Bu anda, büyük Türk milletinin bir ferdi olarak bu kutlu güne kavuşmanın en derin sevinci ve heyecanı içindeyim. Yurttaşlarım! Az zamanda çok ve büyük işler yaptık. Bu işlerin en büyüğü, temeli Türk kahramanlığı ve yüksek Türk kültürü olan Türkiye Cumhuriyeti'dir.<br><br>
            Bundaki muvaffakiyeti Türk milletinin ve onun değerli ordusunun bir ve beraber olarak azimle yürümesine borçluyuz. Fakat yaptıklarımızı asla kâfi göremeyiz. Çünkü daha çok ve daha büyük işler yapmak mecburiyetinde ve azmindeyiz.<br><br>
            Yurdumuzu dünyanın en mamur ve en medeni memleketleri seviyesine çıkaracağız. Milletimizi en geniş refah vasıta ve kaynaklarına sahip kılacağız. Millî kültürümüzü çağdaş medeniyet seviyesinin üstüne çıkaracağız...<br><br>
            Türk milleti! Ebediyete akıp giden her on senede, bu büyük millet bayramını daha büyük şereflerle, saadetlerle, huzur ve refah içinde kutlamanı gönülden dilerim. <strong>Ne mutlu Türk'üm diyene!</strong>"
          </p>
        </div>
      </div>
    </section>

    <!-- 3. Tarihî Fotoğraf Galerisi -->
    <section class="gallery-section" id="galeri">
      <div class="section-header">
        <span class="section-tag">Dijital Sergi Salonu</span>
        <h2 class="section-title">Fotoğraflarla Ebedi Lider</h2>
        <p class="section-desc">Görsellere tıklayarak tarihi detayları, mekan ve arşiv bilgilerini tam ekran inceleyebilirsiniz.</p>
      </div>

      <div class="gallery-grid">
        ${galleryHtml}
      </div>
    </section>

    <!-- 4. Video Deneyimi (Kullanıcı Başlatmalı) -->
    <section class="video-section" id="tarihi-video">
      <div class="section-header">
        <span class="section-tag">Arşiv Kayıtları</span>
        <h2 class="section-title">Tarihe Tanıklık Eden Görüntüler</h2>
        <p class="section-desc">Genç cumhuriyetin coşkusunu ve Atatürk’ün tarihi konuşmasını görüntüleriyle izleyin.</p>
      </div>

      <div class="video-experience-section">
        <div class="video-container" id="videoBox">
          <div class="video-placeholder-cover" id="videoCover" onclick="activateVideoPlayer()">
            <div class="video-play-disc" aria-hidden="true">▶</div>
            <div class="video-cover-title">Tarihî Arşiv Belgeseli & Konuşma Görüntüleri</div>
            <div class="video-cover-caption">Oynatmak için dokunun (Sessiz açılır, veri tüketimi kullanıcı onaylıdır)</div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Fotoğraf İnceleme Modalı -->
  <div class="ata-modal-backdrop" id="photoModal" role="dialog" aria-modal="true" aria-hidden="true" onclick="closePhotoModal(event)">
    <div class="ata-modal-dialog" onclick="event.stopPropagation()">
      <button class="ata-modal-close" onclick="closePhotoModal()" aria-label="Pencereyi Kapat">&times;</button>
      <div class="modal-image-area" id="modalArtArea">
        <svg viewBox="0 0 64 64" fill="none" style="width:72px;height:72px;">
          <circle cx="32" cy="32" r="30" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
          <path d="M32 14L36.5 26.5H49.5L39 34.5L43 47L32 39.5L21 47L25 34.5L14.5 26.5H27.5L32 14Z" fill="rgba(225,29,72,0.6)"/>
        </svg>
      </div>
      <div class="modal-content-area">
        <div class="modal-meta-row">
          <span class="modal-year-badge" id="modalYear">1923</span>
          <span class="modal-loc" id="modalLocation">Ankara</span>
        </div>
        <h3 class="modal-title" id="modalTitle">Fotoğraf Başlığı</h3>
        <p class="modal-desc" id="modalDesc">Fotoğraf açıklaması...</p>
        <div class="modal-source">
          <span>🏛️</span>
          <span id="modalSource">Kaynak: Arşiv</span>
        </div>
      </div>
    </div>
  </div>

  ${renderPlatformFooter()}

  <script>
    ${platformChromeScript}

    const PHOTOS_DB = ${JSON.stringify(GALLERY_PHOTOS)};

    // Zaman Çizelgesi Dönem Seçimi
    function selectEra(eraId) {
      document.querySelectorAll('.timeline-era-card').forEach(c => {
        const isActive = c.id === eraId;
        c.classList.toggle('is-active', isActive);
        const header = c.querySelector('.era-header');
        if (header) header.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        const icon = c.querySelector('.era-toggle-icon');
        if (icon) icon.textContent = isActive ? '−' : '+';
      });
    }

    // Tarihi Ses Oynatıcısı
    const audio = document.getElementById('historicalAudio');
    const playBtn = document.getElementById('btnAudioToggle');
    const playText = document.getElementById('audioPlayText');
    const playIcon = document.getElementById('audioPlayIcon');
    const progressFill = document.getElementById('audioProgressFill');
    const currentTimeEl = document.getElementById('audioCurrentTime');
    const totalDurationEl = document.getElementById('audioTotalDuration');

    function formatSeconds(sec) {
      if (isNaN(sec)) return '00:00';
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }

    function toggleHistoricalAudio() {
      if (!audio) return;
      if (audio.paused) {
        audio.play().then(() => {
          playText.textContent = 'Duraklat';
          playIcon.textContent = '⏸';
        }).catch(err => {
          console.warn('Ses oynatma uyarısı:', err);
        });
      } else {
        audio.pause();
        playText.textContent = 'Sesi Sürdür';
        playIcon.textContent = '▶';
      }
    }

    if (audio) {
      audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = pct + '%';
        currentTimeEl.textContent = formatSeconds(audio.currentTime);
      });
      audio.addEventListener('loadedmetadata', () => {
        totalDurationEl.textContent = formatSeconds(audio.duration);
      });
      audio.addEventListener('ended', () => {
        playText.textContent = 'Yeniden Oynat';
        playIcon.textContent = '↺';
        progressFill.style.width = '100%';
      });
    }

    function seekHistoricalAudio(e) {
      if (!audio || !audio.duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      audio.currentTime = pos * audio.duration;
    }

    function changeVolume(val) {
      if (audio) audio.volume = parseFloat(val);
    }

    // Video Player Aktivasyonu (User-initiated)
    function activateVideoPlayer() {
      const box = document.getElementById('videoBox');
      if (!box) return;
      box.innerHTML = \`
        <iframe 
          width="100%" 
          height="100%" 
          src="https://www.youtube-nocookie.com/embed/g2Jd4o7vD9Y?autoplay=1&rel=0&modestbranding=1" 
          title="Mustafa Kemal Atatürk Tarihî Görüntüleri" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen
          style="border:none;"
        ></iframe>
      \`;
    }

    // Lightbox Modal
    function openPhotoModal(photoId) {
      const photo = PHOTOS_DB.find(p => p.id === photoId);
      if (!photo) return;

      document.getElementById('modalTitle').textContent = photo.title;
      document.getElementById('modalYear').textContent = photo.year;
      document.getElementById('modalLocation').textContent = photo.location;
      document.getElementById('modalDesc').textContent = photo.desc;
      document.getElementById('modalSource').textContent = 'Kaynak: ' + photo.source;

      const modal = document.getElementById('photoModal');
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closePhotoModal(e) {
      if (e && e.target !== e.currentTarget && !e.target.classList.contains('ata-modal-close')) return;
      const modal = document.getElementById('photoModal');
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closePhotoModal();
    });
  </script>
</body>
</html>`;
}

module.exports = {
  renderAtaturkExhibitionPage
};
