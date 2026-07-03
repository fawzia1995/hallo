const assert = require('assert');
const http = require('http');
const path = require('path');
const { app, setMailTransporter } = require('../server');
const db = require('../db');

const postJson = (port, path, token, bodyData = null) => {
  return new Promise((resolve, reject) => {
    const bodyString = bodyData ? JSON.stringify(bodyData) : '';
    const options = {
      hostname: '127.0.0.1',
      port,
      path,
      method: 'POST',
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyString)
      }
    };
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }
    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: body ? JSON.parse(body) : null });
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.write(bodyString);
    req.end();
  });
};

const run = async (name, fn) => {
  try {
    await fn();
    console.log(`✔ ${name}`);
  } catch (error) {
    console.error(`✖ ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
};

(async () => {
  const server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
  const port = server.address().port;

  await run('POST /api/forgot-password sets reset token and returns success', async () => {
    // ensure mailer is mocked to avoid external sending
    setMailTransporter({ sendMail: async () => ({}) });

    const randomValue = Date.now();
    const username = `fp_user_${randomValue}`;
    const email = `fp${randomValue}@example.com`;
    const password = 'password123';

    // Register user (creates user in DB)
    const reg = await postJson(port, '/api/register', null, { username, password, email });
    assert.strictEqual(reg.statusCode, 201);

    // Call forgot-password
    const res = await postJson(port, '/api/forgot-password', null, { email });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.message, 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');

    // Verify DB has reset token set
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, r) => err ? reject(err) : resolve(r));
    });
    assert.ok(row.resetPasswordToken, 'Expected resetPasswordToken to be set in DB');
  });

  await run('POST /api/reset-password accepts token and updates password', async () => {
    // find the user and token
    const randomEmail = await new Promise((resolve, reject) => {
      db.get('SELECT email, resetPasswordToken FROM users WHERE username LIKE ? ORDER BY id DESC LIMIT 1', [`fp_user_%`], (err, r) => err ? reject(err) : resolve(r));
    });
    const { email: foundEmail, resetPasswordToken } = randomEmail || {};
    if (!resetPasswordToken) throw new Error('No reset token found for test user');

    const newPassword = 'newpass123';
    const res = await postJson(port, '/api/reset-password', null, { token: resetPasswordToken, password: newPassword });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.message, 'تم إعادة تعيين كلمة المرور بنجاح.');

    // verify that the password in DB matches the new password
    const rowAfter = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [foundEmail], (err, r) => err ? reject(err) : resolve(r));
    });
    const bcrypt = require('bcrypt');
    const matches = await bcrypt.compare(newPassword, rowAfter.password);
    assert.ok(matches, 'Expected stored password to match the new password');
  });

  server.close();
})();
