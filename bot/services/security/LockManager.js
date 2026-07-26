'use strict';

/**
 * LockManager — Interaction Lock & Atomic Mutex Engine
 * Prevents double-spend, button spam, and concurrent race condition exploits.
 */
class LockManager {
  constructor() {
    this.locks = new Map(); // key -> timestamp
    this.defaultTTL = 5000; // 5 seconds default TTL
  }

  /**
   * Generates a unique lock key for a user action
   */
  _getLockKey(userId, action = 'global') {
    return `${userId}:${action}`;
  }

  /**
   * Attempts to acquire an atomic lock for a user action.
   * Returns true if lock acquired successfully, false if already locked.
   */
  acquireLock(userId, action = 'global', ttlMs = this.defaultTTL) {
    if (!userId) return true;
    const key = this._getLockKey(userId, action);
    const now = Date.now();

    if (this.locks.has(key)) {
      const lockTime = this.locks.get(key);
      if (now - lockTime < ttlMs) {
        return false; // Lock is still active
      }
    }

    this.locks.set(key, now);

    // Auto cleanup after TTL
    setTimeout(() => {
      if (this.locks.get(key) === now) {
        this.locks.delete(key);
      }
    }, ttlMs);

    return true;
  }

  /**
   * Releases an acquired lock
   */
  releaseLock(userId, action = 'global') {
    if (!userId) return;
    const key = this._getLockKey(userId, action);
    this.locks.delete(key);
  }

  /**
   * Checks if an action is currently locked for a user
   */
  isLocked(userId, action = 'global', ttlMs = this.defaultTTL) {
    if (!userId) return false;
    const key = this._getLockKey(userId, action);
    const lockTime = this.locks.get(key);
    if (!lockTime) return false;
    return (Date.now() - lockTime < ttlMs);
  }
}

module.exports = new LockManager();
