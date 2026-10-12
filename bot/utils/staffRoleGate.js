'use strict';

/**
 * Personel/moderatör DM'leri için Discord rol kapısı.
 *
 * Veritabanında `status: 'active'` kalan ama Discord'da yetkili rolü alınmış kişilere moderatör
 * DM'leri gitmesin diye, toplu DM gönderen her yer alıcıyı burada kontrol eder.
 * Yalnızca DM alıcılarını süzmek içindir; rol VERME akışlarında kullanılmamalı (yeni personelin
 * henüz rolü yokken engellenmesine yol açar).
 */

const { PermissionFlagsBits } = require('discord.js');

const GUILD_ID = process.env.STAFF_GUILD_ID || '1367646464804655104';

// staffSystem.js ROLES ile aynı rütbe rolleri + genel Moderatör rolü
const STAFF_RANK_ROLES = {
  1: process.env.ROLE_STAJYER || '1518692395774906648', // Stajyer Personel
  2: process.env.ROLE_PERSONEL || '1518692394495643830', // Personel
  3: process.env.ROLE_GELISMIS || '1518692393660973186', // Kıdemli Personel
  4: process.env.ROLE_SEKRETER || '1518692392415395971', // Sekreter
  5: '1518709348506013706',                             // Kıdemli Sekreter
  6: '1518692391312298045',                             // Genel Koordinatör
};
const MOD_ROLE_ID = process.env.MOD_ROLE_ID || '1518692389169135666';
const STAFF_ROLE_IDS = [...Object.values(STAFF_RANK_ROLES), MOD_ROLE_ID].filter(Boolean);

function memberHasStaffRole(member) {
  if (!member || !member.roles || !member.roles.cache) return false;
  if (member.permissions && typeof member.permissions.has === 'function' &&
      member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  return STAFF_ROLE_IDS.some((id) => member.roles.cache.has(id));
}

/**
 * Kullanıcı sunucuda hâlâ yetkili rolüne sahip mi?
 * - Sunucuda değilse veya yetkili rolü yoksa: false (DM gönderme).
 * - Discord'a geçici olarak ulaşılamıyorsa: true (kesinti sırasında gerçek personel DM kaçırmasın).
 */
async function hasStaffRoleInGuild(client, userId, guildId = GUILD_ID) {
  if (!userId) return false;
  let guild;
  try {
    guild = await client.guilds.fetch(guildId);
  } catch (_) {
    return true;
  }
  if (!guild) return true;
  try {
    const member = await guild.members.fetch(String(userId));
    return memberHasStaffRole(member);
  } catch (err) {
    if (err && (err.code === 10007 || err.code === 10013 || err.status === 404)) return false; // sunucuda değil
    return true;
  }
}

module.exports = { STAFF_RANK_ROLES, MOD_ROLE_ID, STAFF_ROLE_IDS, memberHasStaffRole, hasStaffRoleInGuild };
