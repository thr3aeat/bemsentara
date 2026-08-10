/**
 * Form Interview Service
 * Handles Discord DM question flows, button interactions, time confirmation,
 * Roblox game link notifications, and consultant reviews.
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const FormSubmission = require("../../models/FormSubmission");
const { getDiscordClient } = require("../discordClient");

/**
 * Send DM payload safely with fallback for embeds/components
 */
async function sendUserDM(client, discordId, payload) {
  if (!discordId) return false;
  try {
    const user = await client.users.fetch(discordId).catch(() => null);
    if (!user) return false;
    await user.send(payload);
    return true;
  } catch (err) {
    console.error(`[formInterviewService] DM send error to ${discordId}:`, err.message);
    return false;
  }
}

/**
 * Start the interview DM flow for a given submission ID
 */
async function startFormInterviewFlow(submissionId) {
  const client = getDiscordClient();
  if (!client || !client.isReady()) {
    console.warn("[formInterviewService] Discord bot not ready, skipping flow start.");
    return false;
  }

  const submission = await FormSubmission.findById(submissionId);
  if (!submission) return false;

  const discordId = submission.discordId || submission.userId;
  if (!discordId || String(discordId).startsWith("guest_")) return false;

  // Initialize interview fields if not set
  submission.interviewState = "SCHEDULE_QUESTION";
  submission.interviewAnswers = submission.interviewAnswers || {};
  await FormSubmission.update(submissionId, {
    interviewState: "SCHEDULE_QUESTION",
    interviewAnswers: submission.interviewAnswers,
  });

  const scheduledTimeStr = submission.interviewScheduledTime || "Henüz belirlenmedi";

  const embed = new EmbedBuilder()
    .setColor(0x818cf8)
    .setTitle("📅 MÜLAKAT SAATİ TEYİDİ")
    .setDescription(
      `Merhaba **${submission.discordUsername || "Aday"}**!\n\n` +
      `Form başvurunuz başarıyla sistemimize ulaştı. Mülakat sürecinizi başlatmak için lütfen aşağıdaki bilgileri doğrulayın.\n\n` +
      `**Planlanan Mülakat Saati:** \`${scheduledTimeStr}\`\n\n` +
      `**O saatte müsait misiniz?**`
    )
    .setFooter({ text: "Sentara Mülakat & Yönetim Sistemi" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`fint_avail_yes_${submissionId}`)
      .setLabel("MÜSAİTİM")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`fint_avail_no_${submissionId}`)
      .setLabel("MÜSAİT DEĞİLİM")
      .setStyle(ButtonStyle.Danger)
  );

  return sendUserDM(client, discordId, { embeds: [embed], components: [row] });
}

/**
 * Ask Microphone question (Question 2)
 */
async function askMicQuestion(client, discordId, submissionId) {
  const embed = new EmbedBuilder()
    .setColor(0x38bdf8)
    .setTitle("🎙️ MİKROFON KONTROLÜ")
    .setDescription("MİKROFONUNUZ VAR MIDIR?")
    .setFooter({ text: "Soru 1 / 6" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`fint_q_mic_yes_${submissionId}`)
      .setLabel("EVET, VAR")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`fint_q_mic_no_${submissionId}`)
      .setLabel("HAYIR, YOK")
      .setStyle(ButtonStyle.Secondary)
  );

  await FormSubmission.update(submissionId, { interviewState: "QUESTION_MIC" });
  return sendUserDM(client, discordId, { embeds: [embed], components: [row] });
}

/**
 * Ask Age Limit question (Question 3)
 */
async function askAgeQuestion(client, discordId, submissionId) {
  const embed = new EmbedBuilder()
    .setColor(0xa855f7)
    .setTitle("🎂 YAŞ SINIRI KONTROLÜ")
    .setDescription("ROBLOX YAŞ SINIRINIZ 21+ MIDIR?")
    .setFooter({ text: "Soru 2 / 6" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`fint_q_age_yes_${submissionId}`)
      .setLabel("EVET")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`fint_q_age_no_${submissionId}`)
      .setLabel("HAYIR")
      .setStyle(ButtonStyle.Danger)
  );

  await FormSubmission.update(submissionId, { interviewState: "QUESTION_AGE" });
  return sendUserDM(client, discordId, { embeds: [embed], components: [row] });
}

/**
 * Ask Roblox 16+ Games question (Question 4)
 */
async function askR16Question(client, discordId, submissionId) {
  const embed = new EmbedBuilder()
    .setColor(0xec4899)
    .setTitle("🎮 OYUN ERİŞİM KONTROLÜ")
    .setDescription("ROBLOX 16+ OYUNLARINA GİRİŞ SAĞLAYABİLİYOR MUSUNUZ?")
    .setFooter({ text: "Soru 3 / 6" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`fint_q_r16_yes_${submissionId}`)
      .setLabel("EVET")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`fint_q_r16_no_${submissionId}`)
      .setLabel("HAYIR")
      .setStyle(ButtonStyle.Danger)
  );

  await FormSubmission.update(submissionId, { interviewState: "QUESTION_R16" });
  return sendUserDM(client, discordId, { embeds: [embed], components: [row] });
}

/**
 * Ask Interview Format question (Question 5)
 */
async function askModeQuestion(client, discordId, submissionId) {
  const embed = new EmbedBuilder()
    .setColor(0xf59e0b)
    .setTitle("💬 MÜLAKAT FORMATI TERCİHİ")
    .setDescription("MÜLAKATI HANGİ ŞEKİLDE İSTİYORSUNUZ?")
    .setFooter({ text: "Soru 4 / 6" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`fint_q_mode_rc_${submissionId}`)
      .setLabel("ROBLOX CHAT")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`fint_q_mode_dc_${submissionId}`)
      .setLabel("DİSCORD CHAT")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`fint_q_mode_ds_${submissionId}`)
      .setLabel("DİSCORD SESLİ")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`fint_q_mode_rs_${submissionId}`)
      .setLabel("ROBLOX SESLİ")
      .setStyle(ButtonStyle.Success)
  );

  await FormSubmission.update(submissionId, { interviewState: "QUESTION_MODE" });
  return sendUserDM(client, discordId, { embeds: [embed], components: [row] });
}

/**
 * Ask Roblox Lag question (Question 6)
 */
async function askLagQuestion(client, discordId, submissionId) {
  const embed = new EmbedBuilder()
    .setColor(0x10b981)
    .setTitle("💻 PERFORMANS KONTROLÜ")
    .setDescription("Mülakat esnasında Roblox oyununa lagsız, kasmayacak şekilde katılım sağlayabilir misiniz?")
    .setFooter({ text: "Soru 5 / 6" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`fint_q_lag_yes_${submissionId}`)
      .setLabel("EVET")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`fint_q_lag_no_${submissionId}`)
      .setLabel("HAYIR")
      .setStyle(ButtonStyle.Danger)
  );

  await FormSubmission.update(submissionId, { interviewState: "QUESTION_LAG" });
  return sendUserDM(client, discordId, { embeds: [embed], components: [row] });
}

/**
 * Ask No Appeal Agreement question (Question 7)
 */
async function askAgreeQuestion(client, discordId, submissionId) {
  const embed = new EmbedBuilder()
    .setColor(0xef4444)
    .setTitle("📜 RESMİ TAAHHÜT")
    .setDescription("Mülakatdan sonra cevap alınmazsa itiraz etmeyeceğinizi ve soru sormayacağınızı kabul eder misiniz?")
    .setFooter({ text: "Soru 6 / 6" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`fint_q_agree_yes_${submissionId}`)
      .setLabel("EVET")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`fint_q_agree_no_${submissionId}`)
      .setLabel("HAYIR")
      .setStyle(ButtonStyle.Danger)
  );

  await FormSubmission.update(submissionId, { interviewState: "QUESTION_AGREE" });
  return sendUserDM(client, discordId, { embeds: [embed], components: [row] });
}

/**
 * Complete Preliminary Questions
 */
async function completePreQuestions(client, discordId, submissionId) {
  await FormSubmission.update(submissionId, { interviewState: "PRE_QUESTIONS_COMPLETED" });

  const embed = new EmbedBuilder()
    .setColor(0x34d399)
    .setTitle("✅ MÜLAKAT ÖN SORULARI TAMAMLANDI")
    .setDescription(
      "Verdiğiniz tüm yanıtlar başarıyla kaydedilmiş ve web sitemizdeki başvuru dosyanıza eklenmiştir.\n\n" +
      "📌 **Sonraki Adımlar:**\n" +
      "• Yetkili ekibimiz mülakat saatinizi ve cevaplarınızı inceleyecektir.\n" +
      "• Mülakat saatinize yakın tarihte (15, 10, 5 ve 1 dk kala) botumuz tarafından bilgilendirme ve RP önerileri alacaksınız.\n" +
      "• Mülakat saatinde Roblox oyun linki tarafınıza iletilecektir.\n\n" +
      "İlginiz için teşekkür ederiz!"
    )
    .setFooter({ text: "Sentara Mülakat & Yönetim Sistemi" });

  return sendUserDM(client, discordId, { embeds: [embed] });
}

/**
 * Send Consultant Review DM when Admin finishes interview
 */
async function sendConsultantReviewDM(client, discordId, submissionId) {
  const embed = new EmbedBuilder()
    .setColor(0xf59e0b)
    .setTitle("🎉 MÜLAKATINIZ TAMAMLANDI!")
    .setDescription(
      "Mülakat süreciniz başarıyla sonlandırılmıştır.\n\n" +
      "⭐ **MÜLAKAT DANIŞMANI HAKKINDA YORUMLARINIZ** ⭐\n" +
      "Lütfen mülakatınızı gerçekleştiren danışmanımız / moderatörümüz hakkındaki deneyiminizi ve performansını değerlendirmek için aşağıdaki yıldız puanını seçiniz."
    )
    .setFooter({ text: "Geri bildiriminiz bizim için değerlidir." });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`fint_rate_1_${submissionId}`).setLabel("⭐ 1").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`fint_rate_2_${submissionId}`).setLabel("⭐⭐ 2").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`fint_rate_3_${submissionId}`).setLabel("⭐⭐⭐ 3").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`fint_rate_4_${submissionId}`).setLabel("⭐⭐⭐⭐ 4").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`fint_rate_5_${submissionId}`).setLabel("⭐⭐⭐⭐⭐ 5").setStyle(ButtonStyle.Success)
  );

  await FormSubmission.update(submissionId, { interviewState: "FEEDBACK_RATING" });
  return sendUserDM(client, discordId, { embeds: [embed], components: [row] });
}

/**
 * Main Interaction Handler for all `fint_` button clicks
 */
async function handleFormInterviewButton(interaction) {
  if (!interaction.isButton() || !interaction.customId.startsWith("fint_")) {
    return false;
  }

  const client = interaction.client;
  const customId = interaction.customId;
  const discordId = interaction.user.id;

  try {
    // ── Availability Response: fint_avail_yes_ID or fint_avail_no_ID ──────────
    if (customId.startsWith("fint_avail_yes_") || customId.startsWith("fint_avail_no_")) {
      const isYes = customId.startsWith("fint_avail_yes_");
      const submissionId = customId.replace(isYes ? "fint_avail_yes_" : "fint_avail_no_", "");

      const submission = await FormSubmission.findById(submissionId);
      if (!submission) {
        return interaction.reply({ content: "❌ Başvuru kaydı bulunamadı.", ephemeral: true });
      }

      submission.interviewAnswers = submission.interviewAnswers || {};
      submission.interviewAnswers.availability = isYes ? "MÜSAİTİM" : "MÜSAİT DEĞİLİM";

      if (isYes) {
        submission.interviewTimeApproved = true;
        await FormSubmission.update(submissionId, {
          interviewAnswers: submission.interviewAnswers,
          interviewTimeApproved: true,
        });

        await interaction.update({
          content: "✅ Mülakat saati onayınız kaydedildi! Şimdi ön hazırlık sorularına geçiliyor...",
          embeds: [],
          components: [],
        }).catch(() => {});

        await askMicQuestion(client, discordId, submissionId);
      } else {
        await FormSubmission.update(submissionId, {
          interviewAnswers: submission.interviewAnswers,
          interviewState: "AWAITING_USER_TIME",
        });

        await interaction.update({
          content: "⏳ **Müsait Değilsiniz.** Lütfen mülakat için müsait olduğunuz gün ve saati belirterek bu mesaja yanıt verin (Yazarak yanıtlayın).",
          embeds: [],
          components: [],
        }).catch(() => {});
      }
      return true;
    }

    // ── Microphone Question: fint_q_mic_yes_ID / fint_q_mic_no_ID ────────────
    if (customId.startsWith("fint_q_mic_yes_") || customId.startsWith("fint_q_mic_no_")) {
      const isYes = customId.startsWith("fint_q_mic_yes_");
      const submissionId = customId.replace(isYes ? "fint_q_mic_yes_" : "fint_q_mic_no_", "");

      const submission = await FormSubmission.findById(submissionId);
      if (submission) {
        submission.interviewAnswers = submission.interviewAnswers || {};
        submission.interviewAnswers.mic = isYes ? "EVET, VAR" : "HAYIR, YOK";
        await FormSubmission.update(submissionId, { interviewAnswers: submission.interviewAnswers });
      }

      await interaction.update({
        content: `✅ Mikrofon durumu kaydedildi: **${isYes ? "EVET, VAR" : "HAYIR, YOK"}**`,
        embeds: [],
        components: [],
      }).catch(() => {});

      await askAgeQuestion(client, discordId, submissionId);
      return true;
    }

    // ── Age Limit Question: fint_q_age_yes_ID / fint_q_age_no_ID ─────────────
    if (customId.startsWith("fint_q_age_yes_") || customId.startsWith("fint_q_age_no_")) {
      const isYes = customId.startsWith("fint_q_age_yes_");
      const submissionId = customId.replace(isYes ? "fint_q_age_yes_" : "fint_q_age_no_", "");

      const submission = await FormSubmission.findById(submissionId);
      if (submission) {
        submission.interviewAnswers = submission.interviewAnswers || {};
        submission.interviewAnswers.age21 = isYes ? "EVET" : "HAYIR";
        await FormSubmission.update(submissionId, { interviewAnswers: submission.interviewAnswers });
      }

      await interaction.update({
        content: `✅ Yaş sınırı yanıtınız kaydedildi: **${isYes ? "EVET" : "HAYIR"}**`,
        embeds: [],
        components: [],
      }).catch(() => {});

      await askR16Question(client, discordId, submissionId);
      return true;
    }

    // ── Roblox 16+ Games Question: fint_q_r16_yes_ID / fint_q_r16_no_ID ──────
    if (customId.startsWith("fint_q_r16_yes_") || customId.startsWith("fint_q_r16_no_")) {
      const isYes = customId.startsWith("fint_q_r16_yes_");
      const submissionId = customId.replace(isYes ? "fint_q_r16_yes_" : "fint_q_r16_no_", "");

      const submission = await FormSubmission.findById(submissionId);
      if (submission) {
        submission.interviewAnswers = submission.interviewAnswers || {};
        submission.interviewAnswers.roblox16 = isYes ? "EVET" : "HAYIR";
        await FormSubmission.update(submissionId, { interviewAnswers: submission.interviewAnswers });
      }

      await interaction.update({
        content: `✅ 16+ Oyun erişim yanıtınız kaydedildi: **${isYes ? "EVET" : "HAYIR"}**`,
        embeds: [],
        components: [],
      }).catch(() => {});

      await askModeQuestion(client, discordId, submissionId);
      return true;
    }

    // ── Interview Mode Question: fint_q_mode_XX_ID ────────────────────────────
    if (customId.startsWith("fint_q_mode_")) {
      const parts = customId.split("_"); // fint, q, mode, code, id
      const code = parts[3]; // rc, dc, ds, rs
      const submissionId = parts.slice(4).join("_");

      const modesMap = {
        rc: "ROBLOX CHAT",
        dc: "DİSCORD CHAT",
        ds: "DİSCORD SESLİ",
        rs: "ROBLOX SESLİ",
      };
      const chosenMode = modesMap[code] || "DİSCORD CHAT";

      const submission = await FormSubmission.findById(submissionId);
      if (submission) {
        submission.interviewAnswers = submission.interviewAnswers || {};
        submission.interviewAnswers.mode = chosenMode;
        await FormSubmission.update(submissionId, { interviewAnswers: submission.interviewAnswers });
      }

      await interaction.update({
        content: `✅ Mülakat türü tercihiniz kaydedildi: **${chosenMode}**`,
        embeds: [],
        components: [],
      }).catch(() => {});

      await askLagQuestion(client, discordId, submissionId);
      return true;
    }

    // ── Roblox Lag Question: fint_q_lag_yes_ID / fint_q_lag_no_ID ────────────
    if (customId.startsWith("fint_q_lag_yes_") || customId.startsWith("fint_q_lag_no_")) {
      const isYes = customId.startsWith("fint_q_lag_yes_");
      const submissionId = customId.replace(isYes ? "fint_q_lag_yes_" : "fint_q_lag_no_", "");

      const submission = await FormSubmission.findById(submissionId);
      if (submission) {
        submission.interviewAnswers = submission.interviewAnswers || {};
        submission.interviewAnswers.noLag = isYes ? "EVET" : "HAYIR";
        await FormSubmission.update(submissionId, { interviewAnswers: submission.interviewAnswers });
      }

      await interaction.update({
        content: `✅ Performans yanıtınız kaydedildi: **${isYes ? "EVET (Lagsız)" : "HAYIR"}**`,
        embeds: [],
        components: [],
      }).catch(() => {});

      await askAgreeQuestion(client, discordId, submissionId);
      return true;
    }

    // ── Agree No Appeal Question: fint_q_agree_yes_ID / fint_q_agree_no_ID ─────
    if (customId.startsWith("fint_q_agree_yes_") || customId.startsWith("fint_q_agree_no_")) {
      const isYes = customId.startsWith("fint_q_agree_yes_");
      const submissionId = customId.replace(isYes ? "fint_q_agree_yes_" : "fint_q_agree_no_", "");

      const submission = await FormSubmission.findById(submissionId);
      if (submission) {
        submission.interviewAnswers = submission.interviewAnswers || {};
        submission.interviewAnswers.agreeNoAppeal = isYes ? "EVET" : "HAYIR";
        await FormSubmission.update(submissionId, { interviewAnswers: submission.interviewAnswers });
      }

      await interaction.update({
        content: `✅ Şart kabul yanıtınız kaydedildi: **${isYes ? "EVET (Kabul Edildi)" : "HAYIR"}**`,
        embeds: [],
        components: [],
      }).catch(() => {});

      await completePreQuestions(client, discordId, submissionId);
      return true;
    }

    // ── Joined Roblox Game Status: fint_joined_yes_ID / fint_joined_no_ID ─────
    if (customId.startsWith("fint_joined_yes_") || customId.startsWith("fint_joined_no_")) {
      const isYes = customId.startsWith("fint_joined_yes_");
      const submissionId = customId.replace(isYes ? "fint_joined_yes_" : "fint_joined_no_", "");

      await FormSubmission.update(submissionId, {
        joinedGameStatus: isYes ? "EVET" : "HAYIR",
        interviewState: isYes ? "JOINED_GAME" : "FAILED_JOIN",
      });

      await interaction.update({
        content: isYes
          ? "🟢 **Oyuna katılım sağladığınız kaydedildi.** Mülakatınız başlatılıyor, başarılar dileriz!"
          : "🔴 **Oyuna katılamadığınız kaydedildi.** Sorun yaşıyorsanız yetkili ile iletişime geçiniz.",
        embeds: [],
        components: [],
      }).catch(() => {});
      return true;
    }

    // ── Consultant Rating: fint_rate_X_ID ─────────────────────────────────────
    if (customId.startsWith("fint_rate_")) {
      const parts = customId.split("_"); // fint, rate, stars, id
      const rating = parseInt(parts[2], 10) || 5;
      const submissionId = parts.slice(3).join("_");

      await FormSubmission.update(submissionId, {
        consultantRating: rating,
        interviewState: "AWAITING_FEEDBACK_COMMENT",
      });

      await interaction.update({
        content: `⭐ **${rating} / 5 Yıldız** puanınız kaydedildi! Lütfen mülakat danışmanı hakkındaki detaylı yorum ve görüşlerinizi yazarak bu mesaja yanıt veriniz.`,
        embeds: [],
        components: [],
      }).catch(() => {});
      return true;
    }

  } catch (err) {
    console.error("[handleFormInterviewButton] Error:", err);
  }
  return false;
}

/**
 * Handle DM Text Reply for user-provided time or consultant review comments
 */
async function handleFormInterviewDMReply(message) {
  if (!message || message.author.bot || !message.channel.isDMBased()) {
    return false;
  }

  const userId = message.author.id;
  const userText = message.content ? message.content.trim() : "";
  if (!userText) return false;

  // Search pending submissions for this user with awaiting state
  const submissions = await FormSubmission.findAll({ userId });
  const pendingTimeSub = submissions.find(s => s.interviewState === "AWAITING_USER_TIME");
  const pendingFeedbackSub = submissions.find(s => s.interviewState === "AWAITING_FEEDBACK_COMMENT");

  const client = message.client;

  // Case 1: User typing alternative available time
  if (pendingTimeSub) {
    pendingTimeSub.interviewAnswers = pendingTimeSub.interviewAnswers || {};
    pendingTimeSub.interviewAnswers.userRequestedTime = userText;

    await FormSubmission.update(pendingTimeSub._id, {
      interviewAnswers: pendingTimeSub.interviewAnswers,
      interviewScheduledTime: userText,
      interviewState: "QUESTION_MIC",
    });

    await message.reply(
      `✅ Müsait olduğunuz saat kaydedildi: **${userText}**.\n` +
      `Sitedeki yetkili onayına sunuldu. Şimdi mülakat ön sorularına geçiyoruz...`
    ).catch(() => {});

    await askMicQuestion(client, userId, pendingTimeSub._id);
    return true;
  }

  // Case 2: User typing feedback comment for consultant
  if (pendingFeedbackSub) {
    await FormSubmission.update(pendingFeedbackSub._id, {
      consultantComment: userText,
      interviewState: "COMPLETED",
    });

    await message.reply(
      "🙏 **Geri bildiriminiz için teşekkür ederiz!**\n" +
      "Mülakat danışmanı hakkındaki yorumlarınız başarıyla kaydedilmiş ve yönetim panelimize iletilmiştir."
    ).catch(() => {});
    return true;
  }

  return false;
}

module.exports = {
  startFormInterviewFlow,
  askMicQuestion,
  askAgeQuestion,
  askR16Question,
  askModeQuestion,
  askLagQuestion,
  askAgreeQuestion,
  completePreQuestions,
  sendConsultantReviewDM,
  handleFormInterviewButton,
  handleFormInterviewDMReply,
};
