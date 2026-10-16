'use strict';

/**
 * interactionClaimService.js
 *
 * Aynı bot token'ıyla iki süreç (örn. VDS + Render) aynı anda açık kalırsa Discord her etkileşimi
 * ikisine de gönderir. İlk yanıt veren kazanır, diğeri "Interaction has already been acknowledged"
 * (40060) ya da sessizce başarısız olan deferReply sonrası "InteractionNotReplied" hatası alır.
 *
 * Bu servis her etkileşimi ortak MongoDB'de interaction.id ile sahiplenir (_id benzersiz olduğundan
 * atomik). Kaydı ilk yazan süreç işler, diğeri etkileşimi sessizce bırakır. MongoDB'ye ulaşılamazsa
 * etkileşim yine işlenir (fail-open): tek süreçli normal çalışmada bot hiçbir zaman susmamalı.
 */

const os = require('os');
const mongoose = require('mongoose');

const COLLECTION = 'interaction_claims';
const TTL_SECONDS = 15 * 60; // Discord etkileşim jetonu 15 dk geçerli; sonrasında kayda gerek yok
const NODE = process.env.HA_NODE_NAME || (process.env.RENDER ? 'render' : os.hostname());

let indexEnsured = false;

/**
 * @param {import('discord.js').Interaction} interaction
 * @returns {Promise<boolean>} true: bu süreç işlemeli; false: başka süreç zaten sahiplendi
 */
async function claimInteraction(interaction) {
  const conn = mongoose.connection;
  if (!interaction?.id || !conn || conn.readyState !== 1 || !conn.db) return true;

  const col = conn.db.collection(COLLECTION);
  if (!indexEnsured) {
    indexEnsured = true;
    col.createIndex({ at: 1 }, { expireAfterSeconds: TTL_SECONDS }).catch(() => { indexEnsured = false; });
  }

  try {
    await col.insertOne({ _id: interaction.id, node: NODE, pid: process.pid, at: new Date() });
    return true;
  } catch (err) {
    if (err && err.code === 11000) return false; // başka süreç zaten işliyor
    return true;
  }
}

module.exports = { claimInteraction };
