process.env.ROBLOX_OAUTH_CLIENT_ID = 'test';
process.env.ROBLOX_OAUTH_CLIENT_SECRET = 'test';

const express = require('express');
const { groupAuditLogs, groupAdmins, saveStoreNow } = require('../models/Store');
const apiRouter = require('../server/routes/api');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.user = {
    username: 'bugrupyönetimikullaniciadi',
    discordUsername: 'bugrupyönetimikullaniciadi',
    discordId: '99911517908',
    isGroupAdmin: true
  };
  next();
});
app.use('/', apiRouter);

const server = app.listen(0, async () => {
  const port = server.address().port;
  const axios = require('axios');

  try {
    console.log("1. Creating dummy audit log...");
    const sampleLog = groupAuditLogs.create({
      groupId: "11517908",
      groupName: "TMT Turkish Armed Forces",
      userId: "99911517908",
      userTag: "bugrupyönetimikullaniciadi",
      actionType: "add_admin",
      summary: "testuser kullanıcısı grup yöneticisi olarak eklendi.",
      beforeState: null,
      afterState: { username: "testuser" },
      rolledBack: false,
      createdAt: new Date()
    });
    groupAdmins.create({ username: "testuser", createdAt: new Date() });
    await saveStoreNow();

    console.log("2. Testing GET /api/group-admin/logs...");
    const getRes = await axios.get(`http://127.0.0.1:${port}/api/group-admin/logs`);
    console.log("GET logs count:", getRes.data.count, "Total:", getRes.data.total);

    console.log("3. Testing POST /api/group-admin/rollback/" + sampleLog._id + "...");
    const rollRes = await axios.post(`http://127.0.0.1:${port}/api/group-admin/rollback/${sampleLog._id}`);
    console.log("Rollback result:", rollRes.data);

    console.log("4. Testing POST /api/group-admin/rollback-batch (time-based)...");
    const sampleLog2 = groupAuditLogs.create({
      groupId: "11517908",
      groupName: "TMT Turkish Armed Forces",
      userId: "99911517908",
      userTag: "bugrupyönetimikullaniciadi",
      actionType: "add_admin",
      summary: "testuser2 kullanıcısı eklendi",
      beforeState: null,
      afterState: { username: "testuser2" },
      rolledBack: false,
      createdAt: new Date()
    });
    groupAdmins.create({ username: "testuser2", createdAt: new Date() });
    await saveStoreNow();

    const batchRes = await axios.post(`http://127.0.0.1:${port}/api/group-admin/rollback-batch`, {
      minutesAgo: 5,
      groupId: "11517908"
    });
    console.log("Batch Rollback result:", batchRes.data);

    console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("TEST FAILED:", err.response?.data || err.message);
  } finally {
    server.close();
  }
});
