const http = require('http');
const assert = require('assert');
const { app, startServer, setMailTransporter } = require('../server');

function onceListening(server) {
  return new Promise((resolve) => {
    if (server.listening) return resolve();
    server.on('listening', resolve);
  });
}

function postJson(port, path, body, token) {
  const data = JSON.stringify(body);
  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, method: 'POST', headers }, (res) => {
      let b = '';
      res.on('data', (c) => b += c);
      res.on('end', () => {
        try {
          const parsed = b ? JSON.parse(b) : null;
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function fetchJson(port, path, token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, method: 'GET', headers }, (res) => {
      let b = '';
      res.on('data', (c) => b += c);
      res.on('end', () => {
        try {
          const parsed = b ? JSON.parse(b) : null;
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('admin.test.js: starting');
  setMailTransporter({ sendMail: async () => ({}) });

  const server = http.createServer(app);
  server.listen(0, '127.0.0.1');
  await onceListening(server);
  const port = server.address().port;

  // login as hardcoded admin
  const login = await postJson(port, '/api/login', { username: 'admin', password: 'admin123' });
  assert.strictEqual(login.status, 200, 'admin login should succeed');
  const token = login.body && login.body.token;
  assert.ok(token, 'token returned');

  // GET /api/admin/users without token -> 401
  const noAuth = await fetchJson(port, '/api/admin/users');
  assert.strictEqual(noAuth.status, 401);

  // GET with token -> 200 and array
  const usersRes = await fetchJson(port, '/api/admin/users', token);
  assert.strictEqual(usersRes.status, 200);
  assert.ok(Array.isArray(usersRes.body));

  // POST create a new user
  const email = `testuser+${Date.now()}@example.com`;
  const createRes = await postJson(port, '/api/admin/users', { username: `t${Date.now()}`, email, password: 'pw1234', role: 'normal' }, token);
  assert.strictEqual(createRes.status, 201);
  const created = createRes.body;
  assert.ok(created && created.id, 'created returns id');

  // PUT update user role
  const putData = JSON.stringify({ role: 'admin' });
  const put = await new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: `/api/admin/users/${created.id}`, method: 'PUT', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(putData), Authorization: `Bearer ${token}` } }, (res) => {
      let b = '';
      res.on('data', (c) => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b ? JSON.parse(b) : null }));
    });
    req.on('error', reject);
    req.write(putData);
    req.end();
  });
  assert.strictEqual(put.status, 200);
  assert.strictEqual(put.body.role, 'admin');

  // DELETE the new user
  const del = await new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: `/api/admin/users/${created.id}`, method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }, (res) => {
      let b = '';
      res.on('data', (c) => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b ? JSON.parse(b) : null }));
    });
    req.on('error', reject);
    req.end();
  });
  assert.strictEqual(del.status, 200);

  server.close();
  console.log('admin.test.js: ok');
}

if (require.main === module) {
  run().catch((err) => {
    console.error('admin.test.js: failed', err);
    process.exit(1);
  });
}

module.exports = run;
