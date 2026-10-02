'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function testCustomErrorHtml() {
  console.log('--- Testing scripts/custom_error.html ---');
  const filePath = path.join(__dirname, '../scripts/custom_error.html');
  assert(fs.existsSync(filePath), 'custom_error.html must exist');

  const content = fs.readFileSync(filePath, 'utf-8');

  // Verify old aggressive copy is GONE
  assert(!content.includes('<h1>Sistemlerimiz Yeniden Başlatılıyor</h1>'), 'Old aggressive title should be gone');
  assert(!content.includes('EkoYıldız teknik ve donanım altyapısında anlık bir sistem güncellemesi ve servis senkronizasyonu yürütülüyor'), 'Old dramatic paragraph should be gone');

  // Verify new staged copy
  assert(content.includes('Bağlantı yenileniyor…'), 'Stage 1 banner text must be present');
  assert(content.includes('İşleminiz korunuyor'), 'Reassurance label must be present');
  assert(content.includes('Kısa bir bağlantı sorunu oluştu'), 'Stage 2 title must be present');
  assert(content.includes('Tekrar bağlanılıyor…'), 'Stage 2 loading status must be present');
  assert(content.includes('Bağlantı beklenenden uzun sürüyor'), 'Stage 3 title must be present');
  assert(content.includes('Beklerken küçük bir oyun oynayabilirsiniz'), 'Mini game invitation must be present');

  // Verify Mini Dino runner game
  assert(content.includes('id="gameCanvas"'), 'Canvas element for mini game must exist');
  assert(content.includes('id="gameScore"'), 'Score element must exist');
  assert(content.includes('id="gameBest"'), 'Best score element must exist');
  assert(content.includes('Space'), 'Space key shortcut must be mentioned');
  assert(content.includes('Tekrar Dene'), 'Retry button must exist');
  assert(content.includes('/api/health'), 'Health check endpoint must be probed');
  assert(content.includes('Bağlantı yeniden kuruldu'), 'Recovery notification must exist');

  console.log('✅ scripts/custom_error.html verified successfully.');
}

function testConnectionRecoveryModule() {
  console.log('--- Testing server/views/connectionRecovery.js ---');
  const {
    connectionRecoveryStyles,
    renderConnectionRecoveryMarkup,
    connectionRecoveryScript
  } = require('../server/views/connectionRecovery');

  const styles = connectionRecoveryStyles();
  assert(styles.includes('--cr-bg'), 'Styles must define root variables');
  assert(styles.includes('prefers-reduced-motion'), 'Styles must support reduced motion');
  assert(styles.includes('#crStatusBanner'), 'Styles must style status banner');
  assert(styles.includes('#crReconnectPanel'), 'Styles must style reconnect panel');
  assert(styles.includes('#crRecoveryScreen'), 'Styles must style recovery screen');
  assert(styles.includes('#crGameCanvas'), 'Styles must style canvas');

  const markup = renderConnectionRecoveryMarkup();
  assert(markup.includes('id="crStatusBanner"'), 'Markup must contain banner');
  assert(markup.includes('id="crReconnectPanel"'), 'Markup must contain reconnect panel');
  assert(markup.includes('id="crRecoveryScreen"'), 'Markup must contain recovery screen');
  assert(markup.includes('id="crGameCanvas"'), 'Markup must contain game canvas');
  assert(markup.includes('id="crBtnRetry"'), 'Markup must contain retry button');
  assert(markup.includes('İşleminiz korunuyor'), 'Markup must contain draft preservation label');

  const script = connectionRecoveryScript();
  assert(script.includes('ekoyildiz_draft_'), 'Script must handle draft preservation in sessionStorage');
  assert(script.includes('probeHealth'), 'Script must probe health');
  assert(script.includes('/api/health'), 'Script must check /api/health');
  assert(script.includes('initGameIfNeeded'), 'Script must initialize mini runner game');
  assert(script.includes('jump'), 'Game logic must have jump physics');

  console.log('✅ server/views/connectionRecovery.js verified successfully.');
}

function testPlatformChromeIntegration() {
  console.log('--- Testing platformChrome.js integration ---');
  const {
    platformChromeStyles,
    renderPlatformFooter,
    platformChromeScript
  } = require('../server/views/platformChrome');

  const styles = platformChromeStyles('dark');
  assert(styles.includes('#crRecoveryRoot'), 'Platform styles must include recovery root styling');

  const footer = renderPlatformFooter({ theme: 'dark' });
  assert(footer.includes('id="crRecoveryRoot"'), 'Platform footer must include recovery markup');
  assert(footer.includes('id="crStatusBanner"'), 'Platform footer must include status banner');

  const script = platformChromeScript();
  assert(script.includes('__ekoyildizRecoveryInitialized'), 'Platform script must include recovery controller');
  assert(script.includes('probeHealth'), 'Platform script must probe health');

  console.log('✅ platformChrome.js integration verified successfully.');
}

function runAll() {
  testCustomErrorHtml();
  testConnectionRecoveryModule();
  testPlatformChromeIntegration();
  console.log('\n🎉 ALL CONNECTION RECOVERY TESTS PASSED!');
}

runAll();
