'use strict';

function createAdminControlCenterService(deps) {
  const now = deps.now || (() => new Date());
  async function safeList(section, reader, errors) {
    try {
      if (typeof reader !== 'function') return [];
      const value = await reader();
      return Array.isArray(value) ? value : [];
    } catch (_) {
      errors.push({ section, message: 'Veri alınamadı' });
      return null;
    }
  }

  function publicLiveUser(item) {
    return {
      userId: String(item.userId || ''),
      username: String(item.username || 'Bilinmiyor').slice(0, 80),
      avatar: String(item.avatar || ''),
      url: String(item.url || '/').slice(0, 180),
      lastSeen: Number(item.lastSeen || 0),
    };
  }

  async function getSnapshot() {
    const errors = [];
    const current = now();
    const sinceMs = current.getTime() - 86400000;
    const [users, tickets, submissions, staff, logs, liveUsers, telemetry] = await Promise.all([
      safeList('users', deps.listUsers, errors),
      safeList('tickets', deps.listTickets, errors),
      safeList('submissions', deps.listSubmissions, errors),
      safeList('staff', deps.listStaff, errors),
      safeList('activity', deps.listActivityLogs, errors),
      safeList('liveUsers', async () => (typeof deps.getLiveUsers === 'function' ? deps.getLiveUsers() : []), errors),
      (async () => {
        try {
          if (typeof deps.getSystemTelemetry !== 'function') return null;
          return await deps.getSystemTelemetry();
        } catch (_) {
          errors.push({ section: 'services', message: 'Veri alınamadı' });
          return null;
        }
      })(),
    ]);

    const activeIds = logs === null ? null : new Set(logs.filter(item => new Date(item.timestamp || item.iso || 0).getTime() >= sinceMs).map(item => String(item.discordId))).size;
    const open = tickets === null ? null : tickets.filter(item => ['open', 'pending_confirmation'].includes(item.status));
    const pending = submissions === null ? null : submissions.filter(item => item.status === 'PENDING');
    const queue = [
      ...(open || []).map(item => ({
        id: String(item.ticketId || item._id),
        type: 'ticket',
        title: String(item.subject || 'İsimsiz ticket'),
        createdAt: item.updatedAt || item.createdAt,
        href: '/tickets',
        priority: item.priority || 'medium',
      })),
      ...(pending || []).map(item => ({
        id: String(item._id),
        type: 'submission',
        title: String(item.formTitle || 'İsimsiz başvuru'),
        createdAt: item.createdAt,
        href: '/admin#adm-submissions',
        priority: 'normal',
      })),
    ].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)).slice(0, 12);

    return {
      generatedAt: current.toISOString(),
      summary: {
        activeUsers24h: activeIds,
        liveUsersNow: liveUsers?.length ?? null,
        openTickets: open?.length ?? null,
        pendingSubmissions: pending?.length ?? null,
        activeBans: users === null ? null : users.filter(item => item.isBanned).length,
        activeStaff: staff === null ? null : staff.filter(item => !['dismissed', 'resigned', 'paused'].includes(item.status)).length,
      },
      liveUsers: (liveUsers || []).map(publicLiveUser),
      queue,
      recentActions: (logs || []).filter(item => ['ban', 'unban', 'mod_action', 'admin_note'].includes(item.activityType)).slice(-12).reverse().map(item => ({
        id: String(item.id || item._id || ''),
        discordId: String(item.discordId || ''),
        type: item.activityType,
        timestamp: item.timestamp || item.iso,
      })),
      services: Array.isArray(telemetry?.services) ? telemetry.services.map(item => ({
        id: item.id,
        name: item.name,
        status: item.status,
        statusLabel: item.statusLabel,
        metrics: item.metrics,
      })) : [],
      errors,
    };
  }

  return { getSnapshot };
}

module.exports = { createAdminControlCenterService };
