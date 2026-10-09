'use strict';

// Güçlü rastgele bir panel şifresi üretir, yalnızca scrypt özetini kaydeder ve şifreyi bir kez ekrana yazar.
// Kullanım: node deploy/vds-admin/set-password.js [/root/.vds_admin_pass]
const fs = require('fs');
const crypto = require('crypto');

const file = process.argv[2] || '/root/.vds_admin_pass';
const password = crypto.randomBytes(24).toString('base64url');
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password, salt, 64);

fs.writeFileSync(file, `scrypt$${salt.toString('hex')}$${hash.toString('hex')}\n`, { mode: 0o600 });
console.log(password);
