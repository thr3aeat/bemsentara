'use strict';

const assert = require('assert');
const mongoose = require('mongoose');

// 1. Test Model and Case Generation
async function testModelAndCaseNo() {
  console.log('--- Testing OfficialWarning Model & Helpers ---');
  const OfficialWarning = require('../models/OfficialWarning');
  
  const caseNo = await OfficialWarning.generateCaseNo();
  console.log('Generated Case No:', caseNo);
  assert(caseNo.startsWith('NO.'), 'Case number should start with NO.');
  assert(caseNo.length >= 7, 'Case number should have digits, e.g. NO.06546');

  const sampleWarning = new OfficialWarning({
    caseNo: 'NO.06546',
    channelId: '123456789012345678',
    guildId: '1367646464804655104',
    targetUserId: '999888777666555444',
    creatorId: '111222333444555666',
    reason: 'Kural 4 ihlali: Topluluk huzurunu bozma',
    ruleArticle: 'Madde 14 - Topluluk Huzuru',
    customNotes: 'İlk resmi ihtardır.'
  });

  assert.strictEqual(sampleWarning.caseNo, 'NO.06546');
  assert.strictEqual(sampleWarning.founderId, '1031620522406072350', 'Founder Eko ID must default to 1031620522406072350');
  assert(sampleWarning.signToken && sampleWarning.signToken.length >= 24, 'signToken should be auto-generated crypto hex');
  assert.strictEqual(sampleWarning.status, 'PENDING_ACCEPTANCE');
  assert.strictEqual(sampleWarning.currentPage, 1);
  console.log('✅ Model defaults and schema verified successfully.');
}

// 2. Test 3-Page Warning Document Generation
function testWarningPages() {
  console.log('--- Testing 3-Page Warning Document Embeds ---');
  const { 
    buildOfficialWarningPage, 
    buildPageControls, 
    FOUNDER_ID, 
    MODERATION_ROLE_ID 
  } = require('../bot/services/officialWarningService');

  assert.strictEqual(FOUNDER_ID, '1031620522406072350');
  assert.strictEqual(MODERATION_ROLE_ID, '1518692386836971610');

  const fakeWarning = {
    _id: '507f1f77bcf86cd799439011',
    caseNo: 'NO.06546',
    targetUserId: '999888777666555444',
    creatorId: '111222333444555666',
    reason: 'Kural ihlali ve saygısızlık',
    ruleArticle: 'Madde 14 - Topluluk Huzuru',
    customNotes: 'Deliller dosyaya eklendi.',
    status: 'PAGE_REVIEW',
    signToken: 'abcdef1234567890abcdef1234567890',
    createdAt: new Date()
  };

  // Page 1
  const page1Embed = buildOfficialWarningPage(fakeWarning, 1);
  assert(page1Embed.data.title.includes('NO.06546'));
  assert(page1Embed.data.description.includes('SAYFA 1/3: DİSİPLİN TESPİT TUTANAĞI'));
  assert(page1Embed.data.description.includes('1031620522406072350'), 'Founder Eko ID must be in Page 1');
  assert(page1Embed.data.description.includes('Kural ihlali ve saygısızlık'));

  const controls1 = buildPageControls(fakeWarning, 1);
  assert.strictEqual(controls1.components.length, 2, 'Page 1 has Prev and Next buttons');
  assert(controls1.components[0].data.disabled, 'Prev button should be disabled on page 1');
  assert(!controls1.components[1].data.disabled, 'Next button should be enabled on page 1');

  // Page 2
  const page2Embed = buildOfficialWarningPage(fakeWarning, 2);
  assert(page2Embed.data.description.includes('SAYFA 2/3: HUKUKİ YAPTIRIMLAR VE MÜEYYİDELER'));
  assert(page2Embed.data.description.includes('1. KALICI VE DERHAL UZAKLAŞTIRMA (PERMANENT BAN)'));
  assert(page2Embed.data.description.includes('2. SİCİL İŞLENMESİ & KARA LİSTE (BLACKLIST)'));

  // Page 3
  const page3Embed = buildOfficialWarningPage(fakeWarning, 3);
  assert(page3Embed.data.description.includes('SAYFA 3/3: RESMİ TAAHHÜTNAME & E-İMZA MÜHÜRÜ'));
  assert(page3Embed.data.description.includes('Web Üzerinden E-İmza At'));

  const controls3 = buildPageControls(fakeWarning, 3);
  assert.strictEqual(controls3.components.length, 3, 'Page 3 should have Prev, Next, and Web E-Signature Link');
  assert(controls3.components[1].data.disabled, 'Next button should be disabled on page 3');
  assert(controls3.components[2].data.url.includes(fakeWarning.signToken), 'Link button should point to unique token');

  console.log('✅ 3-Page Warning Document generation and controls verified.');
}

// 3. Test Web E-Signature HTML Renderer
function testWebSignPageRender() {
  console.log('--- Testing Web E-Signature HTML Portal ---');
  const { renderOfficialWarningSignPage } = require('../server/views/officialWarningSignPage');

  const fakeWarning = {
    caseNo: 'NO.06546',
    targetUserId: '999888777666555444',
    reason: 'Kural ihlali ve saygısızlık',
    ruleArticle: 'Madde 14 - Topluluk Huzuru',
    signToken: 'abcdef1234567890abcdef1234567890'
  };

  const html = renderOfficialWarningSignPage({
    warning: fakeWarning,
    targetUser: { username: 'testuser', id: fakeWarning.targetUserId },
    isSigned: false,
    error: null
  });

  assert(html.includes('EKOYILDIZ YÜKSEK MAHKEMESİ'), 'HTML should have official court title');
  assert(html.includes('DOSYA NO: NO.06546'), 'HTML should display case number');
  assert(html.includes('id="signaturePad"'), 'HTML should contain signature drawing canvas');
  assert(html.includes('id="btnClear"'), 'HTML should contain clear canvas button');
  assert(html.includes('id="btnUndo"'), 'HTML should contain undo canvas button');
  assert(html.includes('id="btnSubmit"'), 'HTML should contain submit button');
  assert(html.includes('/api/resmi-uyari/imzala'), 'HTML script must submit to official warning API');
  assert(html.includes(fakeWarning.signToken), 'HTML script must contain token');

  // Test already signed view
  const signedHtml = renderOfficialWarningSignPage({
    warning: {
      ...fakeWarning,
      signedAt: new Date(),
      signatureImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    },
    targetUser: { username: 'testuser', id: fakeWarning.targetUserId },
    isSigned: true,
    error: null
  });

  assert(signedHtml.includes('RESMİ UYARI TUTANAĞI MÜHÜRLENMİŞTİR'), 'Signed HTML must display sealed status');
  assert(signedHtml.includes('SİCİLE VE DİSİPLİN ARŞİVİNE İŞLENDİ'), 'Signed HTML must display archive confirmation');
  assert(signedHtml.includes('class="signed-signature-img"'), 'Signed HTML must display the signature');

  console.log('✅ Web E-Signature HTML Portal rendering verified.');
}

// 4. Test Official Warning Close: Channel Archiving & Safe Reply
async function testOfficialWarningCloseArchive() {
  console.log('--- Testing handleOfficialWarningClose: Archiving & Safe Reply ---');
  const { handleOfficialWarningClose } = require('../bot/services/officialWarningService');
  const OfficialWarning = require('../models/OfficialWarning');

  let editReplyCalled = false;
  let replyCalled = false;
  let channelDeleted = false;
  let overwriteCreated = [];
  let channelRenamed = null;
  let parentSet = null;
  let channelMessageSent = null;

  const fakeWarning = {
    _id: '507f1f77bcf86cd799439011',
    caseNo: 'NO.75765',
    targetUserId: '1031620522406072350',
    status: 'PAGE_REVIEW',
    syncEnabled: true,
    save: async function() { return this; }
  };

  // Mock OfficialWarning.findById
  const origFindById = OfficialWarning.findById;
  OfficialWarning.findById = async () => fakeWarning;

  const fakeChannel = {
    id: '1555650176281092139',
    name: '⚖️・resmi-uyarı-75765',
    delete: async () => { channelDeleted = true; },
    setName: async (name) => { channelRenamed = name; },
    setParent: async (parentId) => { parentSet = parentId; },
    permissionOverwrites: {
      create: async (userId, perms) => {
        overwriteCreated.push({ userId, perms });
      }
    },
    send: async (payload) => { channelMessageSent = payload; }
  };

  const fakeGuild = {
    id: '1367646464804655104',
    channels: {
      cache: {
        get: (id) => id === '1523040513626865965' ? { id: '1523040513626865965', name: '📁・ARŞİV' } : null,
        find: () => null
      }
    },
    roles: {
      cache: {
        has: () => true
      }
    }
  };

  const fakeInteraction = {
    user: { id: '1031620522406072350' },
    guild: fakeGuild,
    channel: fakeChannel,
    deferred: true, // Already acknowledged!
    replied: false,
    reply: async () => {
      replyCalled = true;
      const err = new Error('Interaction has already been acknowledged.');
      err.code = 40060;
      throw err;
    },
    editReply: async () => {
      editReplyCalled = true;
    }
  };

  try {
    await handleOfficialWarningClose(fakeInteraction, fakeWarning._id);

    assert(editReplyCalled, 'editReply should be called when interaction is already deferred');
    assert(!replyCalled, 'reply should NOT be called if already deferred');
    assert(!channelDeleted, 'CHANNEL MUST NOT BE DELETED (channel.delete was called!)');
    assert.strictEqual(fakeWarning.status, 'CLOSED', 'Warning status must be CLOSED');
    assert.strictEqual(parentSet, '1523040513626865965', 'Channel must be moved to archive category');
    assert(channelRenamed && channelRenamed.includes('arşiv'), 'Channel name must be updated to archive');
    
    const targetOverwrite = overwriteCreated.find(o => o.userId === fakeWarning.targetUserId);
    assert(targetOverwrite, 'Target user overwrite must be updated');
    assert.strictEqual(targetOverwrite.perms.ViewChannel, false, 'Target user ViewChannel must be set to false');

    console.log('✅ handleOfficialWarningClose correctly archives channel and revokes target user view permission without deleting or throwing 40060.');
  } finally {
    OfficialWarning.findById = origFindById;
  }
}

async function runAll() {
  await testModelAndCaseNo();
  testWarningPages();
  testWebSignPageRender();
  await testOfficialWarningCloseArchive();
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

runAll().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
