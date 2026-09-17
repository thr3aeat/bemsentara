'use strict';

const { posts, topics, safetyGuides } = require('../views/knowledgeCenterData');
const { helpCategories } = require('../views/productHelpCenterPage');
const { videoEntries } = require('../views/videoBlogPage');

function normalize(value) {
  return String(value ?? '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9ğüşöç\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPublicSearchIndex() {
  const help = helpCategories.map((category) => ({
    title: category.title,
    description: category.description,
    category: 'Help Center',
    breadcrumb: `Help Center → ${category.title}`,
    url: `/help#${category.slug}`,
    kind: 'help',
  }));

  const safety = safetyGuides.map((guide) => ({
    title: guide.title,
    description: guide.summary,
    category: guide.category,
    breadcrumb: `Safety Center → ${guide.category}`,
    url: `/yardim/${guide.slug}`,
    kind: 'safety',
  }));

  const topicAliases = topics.map(([title, category, slug]) => ({
    title,
    description: `${category} konusunda EkoYıldız Safety rehberi.`,
    category,
    breadcrumb: `Safety Center → ${category}`,
    url: `/yardim/${slug}`,
    kind: 'safety',
  }));

  const blog = posts.map((post) => ({
    title: post.title,
    description: post.excerpt,
    category: post.category,
    breadcrumb: `Blog → ${post.category}`,
    url: `/blog/${post.slug}`,
    kind: 'blog',
  }));

  const videos = videoEntries.map((video) => ({
    title: video.title,
    description: `${video.views} · ${video.date} · ${video.duration}`,
    category: 'YouTube',
    breadcrumb: `Video Blog → ${video.category}`,
    url: '/video-blog',
    kind: 'video',
  }));

  return [...help, ...safety, ...topicAliases, ...blog, ...videos];
}

function searchPublicContent(query, { limit = 12 } = {}) {
  const needle = normalize(query);
  if (needle.length < 2) return [];

  const scored = buildPublicSearchIndex().map((item, order) => {
    const title = normalize(item.title);
    const category = normalize(item.category);
    const description = normalize(item.description);
    let score = 0;
    if (title === needle) score += 100;
    if (title.startsWith(needle)) score += 50;
    if (title.includes(needle)) score += 30;
    if (category.includes(needle)) score += 14;
    if (description.includes(needle)) score += 8;
    return { item, order, score };
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score || a.order - b.order);

  const seen = new Set();
  const results = [];
  for (const { item } of scored) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    results.push(item);
    if (results.length >= Math.max(1, Math.min(Number(limit) || 12, 12))) break;
  }
  return results;
}

module.exports = { normalize, buildPublicSearchIndex, searchPublicContent };
