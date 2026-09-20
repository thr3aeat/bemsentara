'use strict';

const express = require('express');
const { isSiteAdmin } = require('../../utils/adminCheck');
const { createAdminControlCenterService } = require('../services/adminControlCenterService');
const { users: userStore, tickets: ticketStore, collections } = require('../../models/Store');
const FormSubmission = require('../../models/FormSubmission');
const StaffProgress = require('../../models/StaffProgress');
const { getActiveUsers } = require('../services/activityTracker');
const { getSystemTelemetry } = require('../services/systemStatusService');

function buildAdminControlCenterHandler({ service, isAdmin = isSiteAdmin }) {
  return async function adminControlCenterHandler(req, res) {
    if (!req.user || !isAdmin(req.user)) {
      return res.status(403).json({ success: false, error: 'Bu alan için yönetici yetkisi gerekli.' });
    }
    try {
      const snapshot = await service.getSnapshot();
      return res.json({ success: true, ...snapshot });
    } catch (error) {
      console.error('[AdminControlCenter] snapshot error:', error.message);
      return res.status(500).json({ success: false, error: 'Kontrol merkezi verileri yüklenemedi.' });
    }
  };
}

const router = express.Router();
router.get('/api/admin/control-center', buildAdminControlCenterHandler({
  service: createAdminControlCenterService({
    listUsers: async () => (typeof userStore?.find === 'function' ? userStore.find({}) : []),
    listTickets: async () => (typeof ticketStore?.find === 'function' ? ticketStore.find({}) : []),
    listSubmissions: () => (typeof FormSubmission?.findAll === 'function' ? FormSubmission.findAll() : []),
    listStaff: () => (typeof StaffProgress?.find === 'function' ? StaffProgress.find({}).lean() : []),
    listActivityLogs: async () => (collections?.userActivityLogs && typeof collections.userActivityLogs.find === 'function' ? collections.userActivityLogs.find({}) : []),
    getLiveUsers: () => (typeof getActiveUsers === 'function' ? getActiveUsers() : []),
    getSystemTelemetry: () => (typeof getSystemTelemetry === 'function' ? getSystemTelemetry() : null),
  }),
}));

module.exports = { router, buildAdminControlCenterHandler };
