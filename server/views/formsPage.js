'use strict';

const sponsorAdService = require('../services/sponsorAdService');
const {
  renderPlatformHeader,
  renderPlatformFooter,
  renderSearchDialog,
  platformChromeStyles,
  platformChromeScript,
} = require('./platformChrome');
const { FORM_CATALOG, getFields } = require('../forms/catalog');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const formsStyles = `
  :root{--forms-ink:#171719;--forms-muted:#69696f;--forms-line:#e7e7eb;--forms-soft:#f6f6f7;--forms-pink:#ed5b7b;--forms-success:#19724d;--forms-warning:#8b5a12;}
  *{box-sizing:border-box}.forms-page{margin:0;background:#fff;color:var(--forms-ink);font-family:Inter,Arial,sans-serif}.forms-page a{color:inherit}.forms-shell{width:min(1160px,calc(100% - 40px));margin:0 auto;padding:48px 0 16px}.forms-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:28px;align-items:end;padding:34px 0 40px;border-bottom:1px solid var(--forms-line)}.forms-eyebrow,.forms-section-kicker{color:var(--forms-pink);font-size:.72rem;letter-spacing:.12em;font-weight:800;text-transform:uppercase}.forms-title{max-width:700px;margin:12px 0;font-size:clamp(2.55rem,5vw,4.6rem);line-height:.98;letter-spacing:-.07em}.forms-lede{max-width:650px;margin:0;color:var(--forms-muted);font-size:1.03rem;line-height:1.65}.forms-meta{display:flex;flex-wrap:wrap;gap:10px 18px;justify-content:flex-end;color:var(--forms-muted);font-size:.82rem}.forms-meta span{white-space:nowrap}.forms-section{padding:38px 0;border-bottom:1px solid var(--forms-line)}.forms-section:last-of-type{border-bottom:0}.forms-section-head{display:flex;align-items:end;justify-content:space-between;gap:22px;margin-bottom:16px}.forms-section-head h2{margin:0;font-size:1.45rem;letter-spacing:-.05em}.forms-section-head p{max-width:460px;margin:0;color:var(--forms-muted);font-size:.9rem;line-height:1.55}.forms-list{border:1px solid var(--forms-line);border-radius:14px;overflow:hidden}.form-row{display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:16px;align-items:center;padding:20px 22px;background:#fff;border-bottom:1px solid var(--forms-line);text-decoration:none;transition:background .2s ease,transform .2s ease}.form-row:last-child{border-bottom:0}.form-row:hover,.form-row:focus-visible{background:var(--forms-soft);transform:translateY(-1px);outline:none}.form-row:focus-visible{box-shadow:inset 0 0 0 3px rgba(237,91,123,.28)}.form-row--maintenance{cursor:default}.form-row--maintenance:hover{transform:none;background:#fff}.form-row-icon{display:grid;place-items:center;width:32px;height:32px;border:1px solid var(--forms-line);border-radius:9px;color:var(--forms-pink);font-size:1rem}.form-row-copy{min-width:0}.form-row-category{display:block;margin-bottom:5px;color:var(--forms-pink);font-size:.68rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.form-row-title{margin:0;font-size:1rem;letter-spacing:-.025em}.form-row-description{display:block;margin-top:5px;color:var(--forms-muted);font-size:.84rem;line-height:1.45;overflow-wrap:anywhere}.form-row-action{display:flex;align-items:center;gap:12px;color:var(--forms-ink);font-size:.84rem;font-weight:800;white-space:nowrap}.form-row-status{color:var(--forms-success);font-weight:700}.form-row-status--maintenance{color:var(--forms-warning)}.form-row-button,.forms-primary{border:0;border-radius:9px;background:#19191b;color:#fff;cursor:pointer;font:700 .9rem Inter,Arial,sans-serif;min-height:44px;padding:0 17px}.form-row-button:disabled{cursor:not-allowed;background:#e8e8eb;color:#77777d}.forms-link{color:var(--forms-muted);font-size:.88rem;text-underline-offset:4px}.form-detail{width:min(800px,100%);margin:0 auto}.form-detail-head{padding:26px 0 30px;border-bottom:1px solid var(--forms-line)}.form-back{display:inline-block;margin-bottom:25px;color:var(--forms-muted);font-size:.85rem;font-weight:700;text-underline-offset:4px}.form-detail-title{margin:10px 0;font-size:clamp(2rem,4vw,3.3rem);letter-spacing:-.065em;line-height:1.02}.form-detail-summary{max-width:640px;margin:0;color:var(--forms-muted);line-height:1.6}.form-detail-meta{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:20px;color:var(--forms-muted);font-size:.82rem}.form-progress{margin-top:18px;color:var(--forms-ink);font-size:.82rem;font-weight:800}.form-notice{margin:26px 0;padding:14px 16px;border:1px solid var(--forms-line);border-radius:11px;background:var(--forms-soft);color:var(--forms-muted);font-size:.9rem;line-height:1.55}.forms-form{padding:10px 0 36px}.form-section{padding:28px 0;border-bottom:1px solid var(--forms-line)}.form-section h2{margin:0 0 18px;font-size:1.12rem;letter-spacing:-.035em}.field{margin-top:18px}.field:first-child{margin-top:0}.field label,.field legend{display:block;margin-bottom:7px;color:var(--forms-ink);font-size:.9rem;font-weight:800}.field-required{color:var(--forms-pink)}.field-description{display:block;margin:-2px 0 8px;color:var(--forms-muted);font-size:.8rem;line-height:1.45}.field input,.field textarea,.field select{display:block;width:100%;max-width:100%;min-width:0;border:1px solid #d7d7dc;border-radius:9px;background:#fff;color:var(--forms-ink);font:400 .96rem Inter,Arial,sans-serif;padding:12px 13px;outline:none;transition:border-color .18s ease,box-shadow .18s ease}.field textarea{min-height:130px;resize:vertical;line-height:1.5}.field input:focus-visible,.field textarea:focus-visible,.field select:focus-visible{border-color:var(--forms-pink);box-shadow:0 0 0 3px rgba(237,91,123,.16)}.field [aria-invalid="true"]{border-color:#b42345}.field-error{min-height:18px;margin:6px 0 0;color:#b42345;font-size:.8rem;line-height:1.4}.forms-submit-row{display:flex;align-items:center;justify-content:space-between;gap:18px;padding-top:28px}.forms-submit-note{margin:0;color:var(--forms-muted);font-size:.8rem;line-height:1.45}.forms-primary:disabled{opacity:.66;cursor:wait}.form-success{margin:36px 0;padding:30px;border:1px solid var(--forms-line);border-radius:14px;background:var(--forms-soft)}.form-success h2{margin:0 0 8px;font-size:1.7rem;letter-spacing:-.05em}.form-success p{max-width:560px;margin:0;color:var(--forms-muted);line-height:1.6}.form-success code{display:inline-block;margin-top:14px;padding:6px 8px;border-radius:6px;background:#fff;color:var(--forms-ink);font-size:.78rem}.forms-page .sponsor-ad-card-wrapper,.forms-page .sponsor-ad{margin-top:12px}.forms-page .sponsor-ad-card-wrapper{border-color:var(--forms-line);background:var(--forms-soft);color:var(--forms-ink)}.forms-page .sponsor-ad-title{color:var(--forms-ink)}.forms-page .sponsor-ad-cta-btn{border:1px solid var(--forms-line);background:#fff;color:var(--forms-ink)}
  @media(max-width:760px){.forms-shell{width:min(100% - 28px,1160px);padding-top:28px}.forms-hero{grid-template-columns:1fr;gap:20px;padding:24px 0 30px}.forms-meta{justify-content:flex-start}.forms-section-head{align-items:flex-start;flex-direction:column;gap:8px}.form-row{grid-template-columns:32px minmax(0,1fr);padding:18px}.form-row-action{grid-column:1/-1;justify-content:space-between;padding-top:2px}.forms-submit-row{align-items:stretch;flex-direction:column}.forms-primary{width:100%}.form-detail-head{padding-top:18px}.form-detail-meta{gap:7px 13px}}
  @media(prefers-reduced-motion:reduce){.forms-page *{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
`;

function renderIcon(definition) {
  const icons = { staff: '↗', other: '•' };
  return `<span class="form-row-icon" aria-hidden="true">${icons[definition.section] || '•'}</span>`;
}

function renderRow(definition) {
  const content = `${renderIcon(definition)}<span class="form-row-copy"><span class="form-row-category">${escapeHtml(definition.category)}</span><strong class="form-row-title">${escapeHtml(definition.title)}</strong><span class="form-row-description">${escapeHtml(definition.description)}</span></span>`;
  if (definition.status === 'maintenance') {
    return `<article class="form-row form-row--maintenance">${content}<span class="form-row-action"><span class="form-row-status form-row-status--maintenance">Bakımda</span><button class="form-row-button" type="button" disabled>Geçici olarak kapalı</button></span></article>`;
  }
  return `<a class="form-row" href="${escapeHtml(definition.route)}">${content}<span class="form-row-action"><span class="form-row-status">Açık · ${definition.estimatedMinutes} dk</span><span>Forma Git →</span></span></a>`;
}

function renderSection(section, title, description) {
  const forms = FORM_CATALOG.filter((definition) => definition.section === section);
  return `<section class="forms-section"><div class="forms-section-head"><div><span class="forms-section-kicker">${section === 'staff' ? 'Başvurular' : 'Topluluk'}</span><h2>${title}</h2></div><p>${description}</p></div><div class="forms-list">${forms.map(renderRow).join('')}</div></section>`;
}

function renderFormsDocument({ user, activePath, title, body }) {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} — EkoYıldız</title><meta name="theme-color" content="#ffffff"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">${platformChromeStyles('light')}<style>${formsStyles}</style></head><body class="forms-page">${renderPlatformHeader({ user, activePath, theme: 'light' })}<main class="forms-shell">${body}${sponsorAdService.renderSponsorAdHtml()}</main>${renderPlatformFooter({ theme: 'light' })}${renderSearchDialog({ theme: 'light' })}${platformChromeScript()}</body></html>`;
}

function renderFormsHubPage(user) {
  const openCount = FORM_CATALOG.filter((definition) => definition.status === 'open').length;
  const body = `<section class="forms-hero"><div><span class="forms-eyebrow">EkoYıldız topluluğu</span><h1 class="forms-title">Formlar</h1><p class="forms-lede">EkoYıldız topluluğuna katılmak, ekiplere başvurmak veya taleplerini iletmek için sana uygun formu seç.</p></div><div class="forms-meta" aria-label="Forms bilgileri"><span>${openCount} açık form</span><span>Güvenli başvuru sistemi</span><span>Başvurular incelenir</span></div></section>${renderSection('staff', 'Yetkili Alımları', 'Toplulukta sorumluluk almak isteyenler için açık başvurular.')}${renderSection('other', 'Diğer Formlar', 'Destek, içerik, iş birliği ve güvenlik konularında bize doğrudan ulaş.')}`;
  return renderFormsDocument({ user, activePath: '/forms', title: 'Formlar', body });
}

function renderField(definitionField) {
  const id = `field-${definitionField.name}`;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const required = definitionField.required ? '<span class="field-required" aria-hidden="true">*</span><span class="sr-only"> zorunlu</span>' : '';
  const description = definitionField.description ? `<span id="${helpId}" class="field-description">${escapeHtml(definitionField.description)}</span>` : '';
  const describedBy = [definitionField.description ? helpId : '', errorId].filter(Boolean).join(' ');
  const attributes = `id="${id}" name="${escapeHtml(definitionField.name)}" aria-describedby="${describedBy}" aria-invalid="false"${definitionField.required ? ' required' : ''}${definitionField.maxLength ? ` maxlength="${definitionField.maxLength}"` : ''}`;
  let control;
  if (definitionField.type === 'textarea') control = `<textarea ${attributes} placeholder="${escapeHtml(definitionField.placeholder)}"></textarea>`;
  else if (definitionField.type === 'select') control = `<select ${attributes}><option value="">Seçim yap</option>${definitionField.options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('')}</select>`;
  else control = `<input ${attributes} type="${definitionField.type === 'url' ? 'url' : 'text'}" placeholder="${escapeHtml(definitionField.placeholder)}">`;
  return `<div class="field"><label for="${id}">${escapeHtml(definitionField.label)} ${required}</label>${description}${control}<p id="${errorId}" class="field-error" aria-live="polite"></p></div>`;
}

function renderFormPage(user, definition, existingSubmission) {
  const sections = definition.sections || [];
  const fields = getFields(definition);
  const sectionMarkup = sections.map((section, index) => `<section class="form-section" data-form-section="${index + 1}"><h2>${escapeHtml(section.title)}</h2>${section.fields.map(renderField).join('')}</section>`).join('');
  const existingNotice = existingSubmission ? '<div class="form-notice">Bu form için incelenmekte olan bir başvurun bulunuyor. Yeni bir başvuru göndermeden önce değerlendirme sonucunu bekle.</div>' : '';
  const progress = sections.length > 1 ? `<p class="form-progress">1 / ${sections.length} — ${escapeHtml(sections[0].title)}</p>` : '';
  const body = `<article class="form-detail"><header class="form-detail-head"><a class="form-back" href="/forms">← Tüm formlar</a><span class="forms-eyebrow">${escapeHtml(definition.category)}</span><h1 class="form-detail-title">${escapeHtml(definition.title)}</h1><p class="form-detail-summary">${escapeHtml(definition.description)}</p><div class="form-detail-meta"><span>Yaklaşık ${definition.estimatedMinutes} dakika</span><span>Yanıtların inceleme için kullanılır</span></div>${progress}</header>${existingNotice}<form class="forms-form" data-forms-form data-form-slug="${escapeHtml(definition.slug)}" novalidate>${sectionMarkup}<div class="forms-submit-row"><p class="forms-submit-note">Gönderdiğinde başvurun güvenli biçimde kaydedilir. Gerekirse seninle iletişime geçeriz.</p><button class="forms-primary" type="submit"${existingSubmission ? ' disabled' : ''}>Başvuruyu Gönder</button></div><div data-form-live aria-live="polite"></div></form></article><script>${renderFormScript(fields)}</script>`;
  return renderFormsDocument({ user, activePath: '/forms', title: definition.title, body });
}

function renderFormScript(fields) {
  const schema = JSON.stringify(fields.map((item) => ({ name: item.name, required: item.required, type: item.type })));
  return `(function(){const form=document.querySelector('[data-forms-form]');if(!form)return;const fields=${schema};const live=form.querySelector('[data-form-live]');const setError=(input,message)=>{const error=document.getElementById(input.id+'-error');input.setAttribute('aria-invalid',message?'true':'false');if(error)error.textContent=message||''};form.addEventListener('submit',async(event)=>{event.preventDefault();let first=null;let valid=true;for(const spec of fields){const input=form.elements.namedItem(spec.name);if(!input)continue;const value=String(input.value||'').trim();const message=spec.required&&!value?'Bu alanı doldurman gerekiyor.':'';setError(input,message);if(message){valid=false;first=first||input}}if(!valid){first.focus();live.textContent='Lütfen işaretli alanları kontrol et.';return}const button=form.querySelector('button[type="submit"]');button.disabled=true;button.textContent='Gönderiliyor…';live.textContent='Başvurun gönderiliyor…';const payload=Object.fromEntries(new FormData(form).entries());try{const response=await fetch('/api/forms/'+form.dataset.formSlug+'/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await response.json();if(!response.ok||!data.success)throw data;form.innerHTML='<section class="form-success"><h2>Başvurun alındı.</h2><p>Ekibimiz başvurunu inceleyecek. Sonuç veya ek bilgi gerektiğinde sana bildirim gönderilebilir.</p><code>Başvuru ID: '+String(data.submissionId||'—')+'</code></section>'}catch(error){button.disabled=false;button.textContent='Başvuruyu Gönder';live.textContent=error&&error.error?error.error:'Bağlantı kurulamadı. Lütfen tekrar dene.'}})})();`;
}

function renderClosedFormPage(user, definition) {
  const body = `<article class="form-detail"><header class="form-detail-head"><a class="form-back" href="/forms">← Tüm formlar</a><span class="forms-eyebrow">${escapeHtml(definition.category)}</span><h1 class="form-detail-title">${escapeHtml(definition.title)}</h1><p class="form-detail-summary">Başvurular geçici olarak kapalı. Ekip formu yeniden kullanıma açtığında burada duyurulacak.</p></header><section class="form-success"><h2>Bakımda</h2><p>Bu form şu anda yeni başvuru kabul etmiyor. Diğer açık formlardan EkoYıldız ekibine ulaşabilirsin.</p><button class="form-row-button" type="button" disabled>Başvurular geçici olarak kapalı</button></section></article>`;
  return renderFormsDocument({ user, activePath: '/forms', title: definition.title, body });
}

module.exports = {
  renderFormsHubPage,
  renderFormPage,
  renderClosedFormPage,
};
