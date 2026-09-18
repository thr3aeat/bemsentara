'use strict';

const { users, economies } = require('../../models/Store');
const { findItem } = require('../../bot/config/shopItems');
const mongoose = require('mongoose');
const StaffProgress = require('../../models/StaffProgress');

const REWARD_POOL = [
  // ── Efsanevi (Legendary - %5) ───────────────────────────────────────────
  { id: 'frame_crown', type: 'frame', name: 'İmparatorluk Tacı Çerçevesi', icon: '👑', rarity: 'legendary', rarityLabel: 'Efsanevi', weight: 3 },
  { id: 'effect_liquid', type: 'effect', name: 'Sıvı Cam (Liquid Glass)', icon: '💧', rarity: 'legendary', rarityLabel: 'Efsanevi', weight: 4 },
  { id: 'coin_1000', type: 'coin', amount: 1000, name: '1.000 EkoCoin Hazine', icon: '💰', rarity: 'legendary', rarityLabel: 'Efsanevi', weight: 4 },
  { id: 'xp_1000', type: 'xp', amount: 1000, name: '+1.000 Görev XP Bonusu', icon: '⚡', rarity: 'legendary', rarityLabel: 'Efsanevi', weight: 4 },

  // ── Epik (Epic - %15) ───────────────────────────────────────────────────
  { id: 'frame_liquid', type: 'frame', name: 'Sıvı Kristal Mercek Çerçevesi', icon: '🔮', rarity: 'epic', rarityLabel: 'Epik', weight: 10 },
  { id: 'frame_cyber', type: 'frame', name: 'Siber Neon Nabız Çerçevesi', icon: '⚡', rarity: 'epic', rarityLabel: 'Epik', weight: 12 },
  { id: 'effect_matrix', type: 'effect', name: 'Matrix Siber Kod Efekti', icon: '💻', rarity: 'epic', rarityLabel: 'Epik', weight: 12 },
  { id: 'effect_cosmic', type: 'effect', name: 'Kozmik Yıldız Tozu', icon: '🌠', rarity: 'epic', rarityLabel: 'Epik', weight: 12 },
  { id: 'coin_500', type: 'coin', amount: 500, name: '500 EkoCoin Kese', icon: '🪙', rarity: 'epic', rarityLabel: 'Epik', weight: 15 },
  { id: 'xp_500', type: 'xp', amount: 500, name: '+500 Görev XP', icon: '✨', rarity: 'epic', rarityLabel: 'Epik', weight: 15 },

  // ── Nadir (Rare - %30) ──────────────────────────────────────────────────
  { id: 'frame_fire', type: 'frame', name: 'Ateş Çerçevesi', icon: '🔥', rarity: 'rare', rarityLabel: 'Nadir', weight: 22 },
  { id: 'frame_gold', type: 'frame', name: 'Altın Çerçeve', icon: '🥇', rarity: 'rare', rarityLabel: 'Nadir', weight: 22 },
  { id: 'effect_fire', type: 'effect', name: 'Ateş Efekti', icon: '🔥', rarity: 'rare', rarityLabel: 'Nadir', weight: 22 },
  { id: 'effect_aurora', type: 'effect', name: 'Aurora Efekti', icon: '🌌', rarity: 'rare', rarityLabel: 'Nadir', weight: 24 },
  { id: 'coin_250', type: 'coin', amount: 250, name: '250 EkoCoin', icon: '💰', rarity: 'rare', rarityLabel: 'Nadir', weight: 25 },
  { id: 'xp_250', type: 'xp', amount: 250, name: '+250 Görev XP', icon: '⚡', rarity: 'rare', rarityLabel: 'Nadir', weight: 25 },

  // ── Yaygın (Common - %50) ───────────────────────────────────────────────
  { id: 'badge_star', type: 'badge', name: 'Yıldız Rozeti', icon: '⭐', rarity: 'common', rarityLabel: 'Yaygın', weight: 40 },
  { id: 'effect_neon', type: 'effect', name: 'Neon Efekti', icon: '💡', rarity: 'common', rarityLabel: 'Yaygın', weight: 40 },
  { id: 'coin_100', type: 'coin', amount: 100, name: '100 EkoCoin', icon: '🪙', rarity: 'common', rarityLabel: 'Yaygın', weight: 45 },
  { id: 'xp_150', type: 'xp', amount: 150, name: '+150 Görev XP', icon: '✨', rarity: 'common', rarityLabel: 'Yaygın', weight: 45 },
];

const WHEEL_SLICES = [
  { index: 0, id: 'coin_250', label: '250 Coin', icon: '💰', color: '#7c6af7' },
  { index: 1, id: 'effect_liquid', label: 'Sıvı Cam', icon: '💧', color: '#00f2fe' },
  { index: 2, id: 'xp_300', label: '300 XP', icon: '⚡', color: '#10b981' },
  { index: 3, id: 'frame_cyber', label: 'Siber Çerçeve', icon: '⚡', color: '#ec4899' },
  { index: 4, id: 'coin_500', label: '500 Coin', icon: '🪙', color: '#f59e0b' },
  { index: 5, id: 'effect_matrix', label: 'Matrix', icon: '💻', color: '#22c55e' },
  { index: 6, id: 'xp_500', label: '500 XP', icon: '✨', color: '#8b5cf6' },
  { index: 7, id: 'frame_crown', label: 'Kraliyet Tacı', icon: '👑', color: '#ffd700' },
];

function pickWeightedReward() {
  const totalWeight = REWARD_POOL.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of REWARD_POOL) {
    if (random < item.weight) return item;
    random -= item.weight;
  }
  return REWARD_POOL[REWARD_POOL.length - 1];
}

async function awardBoxToUser(userId, reason = 'Görev Tamamlama') {
  if (!userId) return false;
  try {
    const Economy = require('../../models/Economy');
    let eco = await Economy.findOne({ userId });
    if (!eco) {
      eco = new Economy({ userId, balance: 0, inventory: [] });
    }
    eco.availableBoxes = (eco.availableBoxes || 0) + 1;
    eco.availableSpins = (eco.availableSpins || 0) + 1;
    await eco.save();
    return true;
  } catch (err) {
    console.warn('[rewardBoxService] awardBoxToUser error:', err.message);
    return false;
  }
}

async function getUserRewardsStatus(userId) {
  if (!userId) {
    return { availableBoxes: 1, availableSpins: 1, isGuest: true };
  }
  try {
    const Economy = require('../../models/Economy');
    const eco = await Economy.findOne({ userId });
    return {
      availableBoxes: eco && typeof eco.availableBoxes === 'number' ? Math.max(0, eco.availableBoxes) : 1,
      availableSpins: eco && typeof eco.availableSpins === 'number' ? Math.max(0, eco.availableSpins) : 1,
      isGuest: false,
    };
  } catch (_) {
    return { availableBoxes: 1, availableSpins: 1, isGuest: false };
  }
}

async function openBoxForUser(userId) {
  const reward = pickWeightedReward();
  let addedToInventory = false;
  let equippedNow = false;

  if (userId) {
    try {
      const Economy = require('../../models/Economy');
      let eco = await Economy.findOne({ userId });
      if (!eco) {
        eco = new Economy({ userId, balance: 0, inventory: [] });
      }

      if (eco.availableBoxes && eco.availableBoxes > 0) {
        eco.availableBoxes -= 1;
      }

      if (reward.type === 'coin') {
        eco.balance = (eco.balance || 0) + reward.amount;
        eco.totalEarned = (eco.totalEarned || 0) + reward.amount;
      } else if (reward.type === 'effect' || reward.type === 'frame' || reward.type === 'badge') {
        const inventory = eco.inventory || [];
        if (!inventory.some(i => i.itemId === reward.id)) {
          inventory.push({
            itemId: reward.id,
            name: reward.name,
            icon: reward.icon,
            type: reward.type,
            purchasedAt: new Date(),
          });
          eco.inventory = inventory;
          addedToInventory = true;
        }

        if (reward.type === 'effect') eco.profileEffect = reward.id;
        if (reward.type === 'frame') eco.profileFrame = reward.id;
        if (reward.type === 'badge') {
          eco.profileBadges = eco.profileBadges || [];
          if (!eco.profileBadges.includes(reward.id)) eco.profileBadges.push(reward.id);
        }
        equippedNow = true;
      }

      await eco.save();
      const { saveStoreNow } = require('../../models/Store');
      saveStoreNow();

      // XP ödülü varsa StaffProgress'e ekle
      if (reward.type === 'xp' && mongoose.connection?.readyState === 1) {
        try {
          let staff = await StaffProgress.findOne({ userId });
          if (staff && staff.gamification) {
            staff.gamification.currentXP = (staff.gamification.currentXP || 0) + reward.amount;
            staff.gamification.totalXP = (staff.gamification.totalXP || 0) + reward.amount;
            await staff.save();
          }
        } catch (_) {}
      }
    } catch (err) {
      console.warn('[rewardBoxService] openBoxForUser save error:', err.message);
    }
  }

  return {
    reward,
    addedToInventory,
    equippedNow,
  };
}

async function spinWheelForUser(userId) {
  const sliceIndex = Math.floor(Math.random() * WHEEL_SLICES.length);
  const slice = WHEEL_SLICES[sliceIndex];

  let addedToInventory = false;
  let equippedNow = false;

  if (userId) {
    try {
      const Economy = require('../../models/Economy');
      let eco = await Economy.findOne({ userId });
      if (!eco) {
        eco = new Economy({ userId, balance: 0, inventory: [] });
      }

      if (eco.availableSpins && eco.availableSpins > 0) {
        eco.availableSpins -= 1;
      }

      if (slice.id.startsWith('coin_')) {
        const amt = parseInt(slice.id.replace('coin_', ''), 10) || 250;
        eco.balance = (eco.balance || 0) + amt;
        eco.totalEarned = (eco.totalEarned || 0) + amt;
      } else if (slice.id.startsWith('effect_') || slice.id.startsWith('frame_')) {
        const type = slice.id.startsWith('effect_') ? 'effect' : 'frame';
        const inventory = eco.inventory || [];
        if (!inventory.some(i => i.itemId === slice.id)) {
          inventory.push({
            itemId: slice.id,
            name: slice.label,
            icon: slice.icon,
            type,
            purchasedAt: new Date(),
          });
          eco.inventory = inventory;
          addedToInventory = true;
        }
        if (type === 'effect') eco.profileEffect = slice.id;
        if (type === 'frame') eco.profileFrame = slice.id;
        equippedNow = true;
      }

      await eco.save();
      const { saveStoreNow } = require('../../models/Store');
      saveStoreNow();

      if (slice.id.startsWith('xp_') && mongoose.connection?.readyState === 1) {
        const amt = parseInt(slice.id.replace('xp_', ''), 10) || 300;
        try {
          let staff = await StaffProgress.findOne({ userId });
          if (staff && staff.gamification) {
            staff.gamification.currentXP = (staff.gamification.currentXP || 0) + amt;
            staff.gamification.totalXP = (staff.gamification.totalXP || 0) + amt;
            await staff.save();
          }
        } catch (_) {}
      }
    } catch (err) {
      console.warn('[rewardBoxService] spinWheel error:', err.message);
    }
  }

  return {
    sliceIndex,
    slice,
    addedToInventory,
    equippedNow,
  };
}

module.exports = {
  REWARD_POOL,
  WHEEL_SLICES,
  awardBoxToUser,
  getUserRewardsStatus,
  openBoxForUser,
  spinWheelForUser,
};
