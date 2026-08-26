process.env.ROBLOX_OAUTH_CLIENT_ID = 'test';
process.env.ROBLOX_OAUTH_CLIENT_SECRET = 'test';

const express = require('express');
const authRouter = require('../server/routes/auth');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  req.login = (user, cb) => {
    req.user = user;
    cb(null);
  };
  next();
});
app.use('/', authRouter);

const server = app.listen(0, async () => {
  const port = server.address().port;
  const axios = require('axios');

  try {
    const res = await axios.post(`http://127.0.0.1:${port}/api/auth/site-login`, {
      username: 'bugrupyönetimikullaniciadi',
      password: 'bugrupyönetimisifresi'
    });
    console.log("TEST SUCCESS RESULT:", res.data);
  } catch (err) {
    console.error("TEST ERROR RESULT:", err.response?.data || err.message);
  } finally {
    server.close();
  }
});
