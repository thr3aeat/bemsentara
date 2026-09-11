const socialHubService = require('../server/services/socialHubService');

console.log('Testing SocialHubService...');

// 1. Check ads loaded
const ads = socialHubService.getAllAds();
console.log(`Found ${ads.length} social ads.`);
if (ads.length !== 7) {
  console.error('Expected 7 ads, found:', ads.length);
  process.exit(1);
}

const expectedKeys = [
  'youtube-main',
  'instagram-eko',
  'tiktok',
  'kick',
  'twitch',
  'instagram-ege',
  'youtube-second'
];

expectedKeys.forEach(k => {
  const ad = socialHubService.getAdByKey(k);
  if (!ad) {
    console.error(`Missing ad for key: ${k}`);
    process.exit(1);
  }
  console.log(`✓ ${k}: ${ad.accountName} -> ${ad.targetUrl}`);
});

// 2. Test event recording
console.log('Testing event recording...');
socialHubService.recordEvent('youtube-main', 'card_view');
socialHubService.recordEvent('youtube-main', 'interaction_started');
socialHubService.recordEvent('youtube-main', 'interaction_completed');
socialHubService.recordEvent('youtube-main', 'social_link_clicked');

const analytics = socialHubService.getAnalytics();
console.log('Analytics summary:', {
  totalViews: analytics.totalViews,
  totalClicks: analytics.totalClicks,
  totalCompleted: analytics.totalCompleted
});

if (analytics.totalViews < 1 || analytics.totalClicks < 1) {
  console.error('Analytics event recording failed!');
  process.exit(1);
}

// 3. Test HTML Rendering
const html = socialHubService.renderSocialHubHtml();
if (!html || !html.includes('social-bento') || !html.includes('kick.com/ekoyildiz')) {
  console.error('renderSocialHubHtml failed to produce expected markup!');
  process.exit(1);
}
console.log(`✓ HTML rendered successfully (${html.length} chars)`);

console.log('ALL SOCIAL HUB TESTS PASSED SUCCESSFULLY! ✅');
