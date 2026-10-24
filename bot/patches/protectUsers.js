'use strict';

/**
 * Korumalı kullanıcılar (eko) için global ceza kalkanı:
 * Botun herhangi bir yerinden gelen susturma (timeout), atma (kick) ve yasaklama (ban)
 * istekleri Discord'a gönderilmeden engellenir. Susturmayı kaldırmak (null) serbesttir.
 */

function _isProtected(userLike) {
  const id = typeof userLike === 'string' ? userLike : (userLike && (userLike.id || userLike.user?.id));
  if (!id) return false;
  return require('../services/profanityAutomodService').isProtectedUser(id);
}

function _blocked(action, userLike) {
  const id = typeof userLike === 'string' ? userLike : (userLike && (userLike.id || userLike.user?.id));
  console.warn(`[protectUsers] 🛡️ Korumalı kullanıcıya ${action} engellendi: ${id}`);
  return Promise.reject(new Error(`Protected user: ${action} blocked`));
}

module.exports = function applyProtectUsers() {
  const { GuildMember, GuildMemberManager, GuildBanManager, GuildMemberRoleManager } = require('discord.js');

  const origRoleAdd = GuildMemberRoleManager.prototype.add;
  GuildMemberRoleManager.prototype.add = function (roleOrRoles, reason) {
    if (_isProtected(this.member)) {
      const isHapis = (r) => {
        if (!r) return false;
        if (typeof r === 'object' && r.name && r.name.toLowerCase().includes('hapis')) return true;
        const roleObj = this.guild.roles.cache.get(typeof r === 'string' ? r : r.id);
        return roleObj && roleObj.name.toLowerCase().includes('hapis');
      };

      if (Array.isArray(roleOrRoles)) {
        const filtered = roleOrRoles.filter(r => !isHapis(r));
        if (filtered.length === 0) {
          console.warn(`[protectUsers] 🛡️ Korumalı kullanıcıya (${this.member.id}) Hapis rolü eklenmesi engellendi.`);
          return Promise.resolve(this.member);
        }
        return origRoleAdd.call(this, filtered, reason);
      } else if (isHapis(roleOrRoles)) {
        console.warn(`[protectUsers] 🛡️ Korumalı kullanıcıya (${this.member.id}) Hapis rolü eklenmesi engellendi.`);
        return Promise.resolve(this.member);
      }
    }
    return origRoleAdd.call(this, roleOrRoles, reason);
  };

  // Korumalı kullanıcıdan toplu rol alma ve yetkili rol alma engellenir (hapis rolü temizliği serbest)
  const { PermissionFlagsBits } = require('discord.js');
  const STAFF_PERMS = [
    PermissionFlagsBits.Administrator, PermissionFlagsBits.ManageGuild, PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ManageChannels, PermissionFlagsBits.BanMembers, PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.MentionEveryone
  ];
  const resolveRoles = (mgr, roleOrRoles) => {
    const list = roleOrRoles && typeof roleOrRoles.values === 'function' && !Array.isArray(roleOrRoles)
      ? [...roleOrRoles.values()] : (Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles]);
    return list.map(r => mgr.guild.roles.cache.get(typeof r === 'string' ? r : r?.id) || r).filter(Boolean);
  };
  const isHapisRole = (r) => typeof r === 'object' && r.name && r.name.toLowerCase().includes('hapis');

  const origRoleRemove = GuildMemberRoleManager.prototype.remove;
  GuildMemberRoleManager.prototype.remove = function (roleOrRoles, reason) {
    if (_isProtected(this.member)) {
      const roles = resolveRoles(this, roleOrRoles);
      const bulk = roles.filter(r => !isHapisRole(r)).length > 1;
      const allowed = roles.filter(r => isHapisRole(r) ||
        (!bulk && !(r.permissions && STAFF_PERMS.some(p => r.permissions.has(p)))));
      if (allowed.length !== roles.length) {
        console.warn(`[protectUsers] 🛡️ Korumalı kullanıcıdan (${this.member.id}) rol alma engellendi.`);
      }
      if (allowed.length === 0) return Promise.resolve(this.member);
      return origRoleRemove.call(this, allowed, reason);
    }
    return origRoleRemove.call(this, roleOrRoles, reason);
  };

  const origRoleSet = GuildMemberRoleManager.prototype.set;
  GuildMemberRoleManager.prototype.set = function (roles, reason) {
    if (_isProtected(this.member)) {
      const keep = new Set(resolveRoles(this, roles).map(r => r.id));
      const lost = [...this.cache.values()].filter(r => r.id !== this.guild.id && !keep.has(r.id) && !isHapisRole(r));
      if (lost.length > 0) {
        console.warn(`[protectUsers] 🛡️ Korumalı kullanıcının (${this.member.id}) rolleri toplu değiştirilmesi engellendi.`);
        return Promise.resolve(this.member);
      }
    }
    return origRoleSet.call(this, roles, reason);
  };

  const origTimeout = GuildMember.prototype.timeout;
  GuildMember.prototype.timeout = function (timeout, ...rest) {
    if (timeout != null && _isProtected(this)) return _blocked('timeout', this);
    return origTimeout.call(this, timeout, ...rest);
  };

  const origDisable = GuildMember.prototype.disableCommunicationUntil;
  GuildMember.prototype.disableCommunicationUntil = function (until, ...rest) {
    if (until != null && _isProtected(this)) return _blocked('timeout', this);
    return origDisable.call(this, until, ...rest);
  };

  const origMemberKick = GuildMember.prototype.kick;
  GuildMember.prototype.kick = function (...args) {
    if (_isProtected(this)) return _blocked('kick', this);
    return origMemberKick.apply(this, args);
  };

  const origMemberBan = GuildMember.prototype.ban;
  GuildMember.prototype.ban = function (...args) {
    if (_isProtected(this)) return _blocked('ban', this);
    return origMemberBan.apply(this, args);
  };

  const origManagerKick = GuildMemberManager.prototype.kick;
  GuildMemberManager.prototype.kick = function (user, ...rest) {
    if (_isProtected(user)) return _blocked('kick', user);
    return origManagerKick.call(this, user, ...rest);
  };

  const origManagerBan = GuildMemberManager.prototype.ban;
  GuildMemberManager.prototype.ban = function (user, ...rest) {
    if (_isProtected(user)) return _blocked('ban', user);
    return origManagerBan.call(this, user, ...rest);
  };

  const origManagerEdit = GuildMemberManager.prototype.edit;
  GuildMemberManager.prototype.edit = function (user, options, ...rest) {
    const until = options && (options.communicationDisabledUntil ?? null);
    if (until != null && _isProtected(user)) return _blocked('timeout', user);
    return origManagerEdit.call(this, user, options, ...rest);
  };

  const origBanCreate = GuildBanManager.prototype.create;
  GuildBanManager.prototype.create = function (user, ...rest) {
    if (_isProtected(user)) return _blocked('ban', user);
    return origBanCreate.call(this, user, ...rest);
  };
};
