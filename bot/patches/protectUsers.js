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
  const { GuildMember, GuildMemberManager, GuildBanManager } = require('discord.js');

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
