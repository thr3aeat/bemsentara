'use strict';

const { getFormDefinitionByType } = require('../forms/catalog');

const LEGACY_SECTION_TITLES = Object.freeze({
  section1: 'Bölüm 1',
  section2: 'Bölüm 2',
  section3: 'Bölüm 3',
  section4: 'Bölüm 4',
  section5: 'Bölüm 5',
  section6: 'Bölüm 6',
  personal: 'Kişisel Bilgiler',
  technical: 'Teknik Bilgiler',
  scenarios: 'Senaryo Cevapları',
  confirmations: 'Onaylar ve Beyanlar',
});

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function humanizeKey(value) {
  const text = String(value || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Bilinmeyen alan';
}

function valueType(value) {
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  if (isPlainObject(value) && (hasOwn(value, 'choice') || hasOwn(value, 'reason'))) return 'choice';
  if (isPlainObject(value)) return 'object';
  return 'text';
}

function answer(id, label, value) {
  return {
    id: String(id),
    label: String(label || humanizeKey(id)),
    value,
    valueType: valueType(value),
    answered: true,
  };
}

function sectionId(section, index) {
  return String(section.id || section.step || `section-${index + 1}`);
}

function normalizeCatalogAnswers(formData, definition) {
  const sections = [];
  const consumed = new Set();

  (definition.sections || []).forEach((section, index) => {
    const answers = [];
    for (const field of section.fields || []) {
      if (!hasOwn(formData, field.name)) continue;
      consumed.add(field.name);
      answers.push(answer(field.name, field.adminLabel || field.label, formData[field.name]));
    }
    if (answers.length) {
      sections.push({
        id: sectionId(section, index),
        title: String(section.title || section.stepTitle || `Bölüm ${index + 1}`),
        legacy: false,
        answers,
      });
    }
  });

  const unknown = Object.keys(formData)
    .filter((key) => !consumed.has(key))
    .map((key) => answer(key, humanizeKey(key), formData[key]));
  if (unknown.length) {
    sections.push({ id: 'legacy', title: 'Eski kayıt', legacy: true, answers: unknown });
  }
  return sections;
}

function normalizeLegacyAnswers(formData) {
  const sections = [];
  const looseAnswers = [];

  for (const [key, value] of Object.entries(formData)) {
    if (isPlainObject(value) && !hasOwn(value, 'choice') && !hasOwn(value, 'reason')) {
      sections.push({
        id: key,
        title: LEGACY_SECTION_TITLES[key] || humanizeKey(key),
        legacy: true,
        answers: Object.entries(value).map(([answerId, answerValue]) => (
          answer(answerId, humanizeKey(answerId), answerValue)
        )),
      });
    } else {
      looseAnswers.push(answer(key, humanizeKey(key), value));
    }
  }

  if (looseAnswers.length) {
    sections.unshift({ id: 'legacy', title: 'Eski kayıt', legacy: true, answers: looseAnswers });
  }
  return sections;
}

function normalizeSubmissionAnswers(submission, definition = undefined) {
  const formData = isPlainObject(submission?.formData) ? submission.formData : {};
  const resolvedDefinition = definition === undefined
    ? getFormDefinitionByType(submission?.formType)
    : definition;

  return {
    sections: resolvedDefinition
      ? normalizeCatalogAnswers(formData, resolvedDefinition)
      : normalizeLegacyAnswers(formData),
  };
}

module.exports = {
  humanizeKey,
  normalizeSubmissionAnswers,
};
