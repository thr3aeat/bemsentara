'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildAgeVerificationPanelPayload,
  createWavHeader,
  convertStereo48kToMono24k,
  handleAgeVerificationInteraction,
  openAgeVerificationTicket,
  checkAndNotifyWaitingTickets,
  DESIGNATED_STAFF_ID,
  TEKERLEMELER,
  AGE_VERIFY_PANEL_CHANNEL_ID,
  SENSITIVE_ROLE_ID,
  SENSITIVE_CATEGORY_ID,
  STAFF_LOG_CHANNEL_ID
} = require('../bot/services/robloxLandAgeVerificationService');

test('buildAgeVerificationPanelPayload tags designated staff 1497600770634289194', () => {
  const payload = buildAgeVerificationPanelPayload();
  assert.ok(payload);
  assert.ok(Array.isArray(payload.components));
  assert.equal(payload.components[0].type, 17); // Container
  assert.equal(payload.components[0].accent_color, undefined); // Accent colorsuz
  assert.ok(payload.components[0].components.some(c => c.type === 14 && c.divider === true)); // Çizgili ayrıcı
  const textContent = payload.components[0].components[0].content;
  assert.match(textContent, new RegExp(DESIGNATED_STAFF_ID));
});

test('createWavHeader generates a valid 44-byte WAV header', () => {
  const pcmLength = 48000;
  const header = createWavHeader(pcmLength, 24000, 1, 16);

  assert.equal(header.length, 44);
  assert.equal(header.toString('ascii', 0, 4), 'RIFF');
  assert.equal(header.toString('ascii', 8, 12), 'WAVE');
  assert.equal(header.toString('ascii', 12, 16), 'fmt ');
  assert.equal(header.toString('ascii', 36, 40), 'data');
  assert.equal(header.readUInt32LE(40), pcmLength);
});

test('convertStereo48kToMono24k compresses 48k stereo PCM to 24k mono PCM by 4x factor', () => {
  // 48000 samples * 4 bytes/stereo sample = 192,000 bytes (1 second of 48k stereo)
  const inputBuffer = Buffer.alloc(192000);
  for (let i = 0; i < inputBuffer.length; i += 2) {
    inputBuffer.writeInt16LE(500, i);
  }

  const outBuffer = convertStereo48kToMono24k(inputBuffer);
  // Expected output: 24000 samples * 2 bytes/mono sample = 48,000 bytes (4x reduction!)
  assert.equal(outBuffer.length, 48000);
  assert.equal(outBuffer.readInt16LE(0), 500);
});

test('openAgeVerificationTicket tags 1497600770634289194 and informs candidate if staff is offline', async () => {
  let createdChannels = [];
  let sentMessages = [];
  let replyMessage = '';

  const mockGuild = {
    id: '1537407325290237973',
    members: {
      cache: new Map([
        [DESIGNATED_STAFF_ID, {
          id: DESIGNATED_STAFF_ID,
          presence: { status: 'offline' } // Offline staff
        }]
      ]),
      fetch: async (id) => mockGuild.members.cache.get(id) || null
    },
    channels: {
      create: async (opts) => {
        const ch = {
          id: `chan-${opts.name}`,
          name: opts.name,
          type: opts.type,
          send: async (msg) => { sentMessages.push(msg); }
        };
        createdChannels.push(ch);
        return ch;
      }
    }
  };

  const mockInteraction = {
    guild: mockGuild,
    user: { id: 'cand-user-123', username: 'Candidate', tag: 'Candidate#0001' },
    member: {
      roles: { cache: new Map() }
    },
    client: { user: { id: 'bot-id-123' } },
    deferReply: async () => {},
    editReply: async (msg) => { replyMessage = msg.content; }
  };

  await openAgeVerificationTicket(mockInteraction);

  assert.equal(createdChannels.length, 2); // Text and Voice channels
  assert.ok(replyMessage.includes('Yetkilimiz'));
  assert.ok(replyMessage.includes('aktif değil'));
  assert.ok(replyMessage.includes(DESIGNATED_STAFF_ID));

  const textMsg = sentMessages[0];
  assert.ok(textMsg.content.includes(DESIGNATED_STAFF_ID));
});

test('checkAndNotifyWaitingTickets sends DMs to both staff and candidate when staff comes online', async () => {
  const dmSent = [];

  const mockStaffUser = {
    id: DESIGNATED_STAFF_ID,
    send: async (msg) => dmSent.push({ to: DESIGNATED_STAFF_ID, msg })
  };

  const mockCandidateUser = {
    id: 'cand-user-123',
    send: async (msg) => dmSent.push({ to: 'cand-user-123', msg })
  };

  const mockGuild = {
    id: '1537407325290237973',
    members: {
      cache: new Map([
        [DESIGNATED_STAFF_ID, {
          id: DESIGNATED_STAFF_ID,
          presence: { status: 'online' }, // Now online!
          user: mockStaffUser
        }]
      ]),
      fetch: async (id) => mockGuild.members.cache.get(id) || null
    },
    channels: {
      cache: new Map([
        ['chan-yas-onay-candidate', {
          id: 'chan-yas-onay-candidate',
          isTextBased: () => true,
          send: async () => {}
        }]
      ]),
      fetch: async (id) => mockGuild.channels.cache.get(id) || null
    }
  };

  const mockClient = {
    guilds: {
      cache: new Map([[mockGuild.id, mockGuild]]),
      fetch: async () => mockGuild
    },
    users: {
      fetch: async (id) => {
        if (id === DESIGNATED_STAFF_ID) return mockStaffUser;
        if (id === 'cand-user-123') return mockCandidateUser;
        return null;
      }
    }
  };

  await checkAndNotifyWaitingTickets(mockClient);

  assert.equal(dmSent.length, 2);
  const staffDm = dmSent.find(d => d.to === DESIGNATED_STAFF_ID);
  const candidateDm = dmSent.find(d => d.to === 'cand-user-123');
  assert.ok(staffDm);
  assert.ok(candidateDm);
  assert.match(staffDm.msg.content, /Yaş Doğrulama Talebi Bekliyor/);
  assert.match(candidateDm.msg.content, /Yetkilimiz Aktif Oldu/);
});

test('unauthorized users cannot click ticket management buttons', async () => {
  let replyContent = '';
  let replyEphemeral = false;

  const mockNonStaffInteraction = {
    customId: 'robloxland_age_ask_speak_yas-1234',
    member: {
      id: 'normal-user-1',
      permissions: {
        has: () => false
      },
      roles: {
        cache: new Map()
      }
    },
    reply: async (opts) => {
      replyContent = opts.content;
      replyEphemeral = opts.ephemeral;
    }
  };

  await handleAgeVerificationInteraction(mockNonStaffInteraction);
  assert.ok(replyContent.includes('yalnızca RobloxLand yetkilileri'));
  assert.equal(replyEphemeral, true);
});

test('staff users cannot approve, reject or trigger speak test on their own ticket', async () => {
  const { activeAgeTickets } = require('../bot/services/robloxLandAgeVerificationService');
  const staffUserId = 'staff-user-koray-123';
  const ticketId = 'yas-test-self';

  activeAgeTickets.set(ticketId, {
    ticketId,
    textChannelId: 'txt-1',
    voiceChannelId: 'vc-1',
    userId: staffUserId,
    staffId: DESIGNATED_STAFF_ID,
    isWaitingStaff: false,
    staffNotified: true,
    tekerleme: null,
    audioChunks: [],
    startTime: Date.now()
  });

  const buttons = [
    `robloxland_age_ask_speak_${ticketId}`,
    `robloxland_age_finish_${ticketId}`,
    `robloxland_age_reject_${ticketId}`
  ];

  for (const customId of buttons) {
    let replyContent = '';
    let replyEphemeral = false;

    const mockStaffSelfInteraction = {
      customId,
      user: { id: staffUserId },
      member: {
        id: staffUserId,
        permissions: {
          has: () => true // Has admin/mod perms
        },
        roles: {
          cache: new Map([['admin-role', { name: 'Yönetici' }]])
        }
      },
      reply: async (opts) => {
        replyContent = opts.content;
        replyEphemeral = opts.ephemeral;
      }
    };

    await handleAgeVerificationInteraction(mockStaffSelfInteraction);
    assert.ok(replyContent.includes('Kendi yaş doğrulama talebinizi kendiniz'), `Failed for button ${customId}`);
    assert.equal(replyEphemeral, true);
  }

  activeAgeTickets.delete(ticketId);
});

test('buildAgeVerificationPromptPayload asks microphone and environment availability and reports staff status', () => {
  const { buildAgeVerificationPromptPayload } = require('../bot/services/robloxLandAgeVerificationService');
  
  // 1. Staff offline case
  const offlinePayload = buildAgeVerificationPromptPayload(false, `<@${DESIGNATED_STAFF_ID}>`);
  const offlineText = offlinePayload.components[0].components[0].content;
  assert.match(offlineText, /mikrofonunuz var mı/i);
  assert.match(offlineText, /sesli konuşabilecek/i);
  assert.match(offlineText, /aktif değil/i);
  assert.match(offlineText, /DM üzerinden/i);
  assert.equal(offlinePayload.components[0].components.at(-1).components[0].custom_id, 'robloxland_age_confirm_open');
  assert.equal(offlinePayload.components[0].components.at(-1).components[1].custom_id, 'robloxland_age_cancel_open');

  // 2. Staff online case
  const onlinePayload = buildAgeVerificationPromptPayload(true, `<@${DESIGNATED_STAFF_ID}>`);
  const onlineText = onlinePayload.components[0].components[0].content;
  assert.match(onlineText, /çevrimiçi \/ aktif/i);
});

test('clicking robloxland_open_age_ticket shows pre-confirmation prompt and cancel button cancels', async () => {
  let replyPayload;
  let updateContent;

  const mockGuild = {
    members: {
      cache: new Map(),
      fetch: async () => null
    }
  };

  const mockOpenInteraction = {
    customId: 'robloxland_open_age_ticket',
    guild: mockGuild,
    user: { id: 'new-user-456' },
    member: {
      roles: { cache: new Map() }
    },
    reply: async (payload) => { replyPayload = payload; }
  };

  await handleAgeVerificationInteraction(mockOpenInteraction);
  assert.ok(replyPayload);
  assert.equal(replyPayload.ephemeral, true);
  assert.match(replyPayload.components[0].components[0].content, /Mikrofon & Ortam|Uygunluk/i);

  const mockCancelInteraction = {
    customId: 'robloxland_age_cancel_open',
    update: async (opts) => { updateContent = opts.content; }
  };

  await handleAgeVerificationInteraction(mockCancelInteraction);
  assert.match(updateContent, /iptal edildi/i);
});

