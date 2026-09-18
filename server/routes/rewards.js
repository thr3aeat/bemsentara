'use strict';

const express = require('express');
const router = express.Router();
const {
  getUserRewardsStatus,
  openBoxForUser,
  spinWheelForUser,
} = require('../services/rewardBoxService');

// ── API: Ödül Durumu (Kutu ve Çark sayısı) ──────────────────────────────────
router.get('/api/rewards/status', async (req, res) => {
  const userId = req.user ? req.user.discordId : null;
  const status = await getUserRewardsStatus(userId);
  res.json({ success: true, ...status });
});

// ── API: Kutu Açma ────────────────────────────────────────────────────────
router.post('/api/rewards/open-box', async (req, res) => {
  const userId = req.user ? req.user.discordId : null;
  const result = await openBoxForUser(userId);
  res.json({ success: true, ...result });
});

// ── API: Şans Çarkı Çevirme ────────────────────────────────────────────────
router.post('/api/rewards/spin-wheel', async (req, res) => {
  const userId = req.user ? req.user.discordId : null;
  const result = await spinWheelForUser(userId);
  res.json({ success: true, ...result });
});

// ── Web Sayfaları: Kutu Açma ve Çark Yönlendirmeleri ────────────────────────
router.get('/kutu-ac', (req, res) => {
  if (req.user) {
    return res.redirect('/profile?tab=rewards&view=box');
  }
  res.redirect('/login?redirect=/profile?tab=rewards');
});

router.get('/cark', (req, res) => {
  if (req.user) {
    return res.redirect('/profile?tab=rewards&view=wheel');
  }
  res.redirect('/login?redirect=/profile?tab=rewards');
});

router.get('/rewards', (req, res) => {
  if (req.user) {
    return res.redirect('/profile?tab=rewards');
  }
  res.redirect('/login?redirect=/profile?tab=rewards');
});

module.exports = router;
