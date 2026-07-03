const assert = require('assert');
const {
  generateToken,
  getResetPasswordUrl,
  getActivationUrl,
  buildResetPasswordEmailHtml,
  buildActivationEmailHtml,
  makeAttachOptionalUser,
  makeRequireAuth,
  makeRequireAdmin
} = require('../lib/server-utils');

const run = (name, fn) => {
  try {
    fn();
    console.log(`✔ ${name}`);
  } catch (error) {
    console.error(`✖ ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
};

const makeNext = () => {
  let called = false;
  const next = () => { called = true; };
  next.wasCalled = () => called;
  return next;
};

const makeResponse = () => {
  let statusCode = null;
  let jsonBody = null;
  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      jsonBody = body;
      return this;
    },
    get statusCode() {
      return statusCode;
    },
    get jsonBody() {
      return jsonBody;
    }
  };
};

run('generateToken returns a non-empty string', () => {
  const token = generateToken();
  assert.strictEqual(typeof token, 'string');
  assert.ok(token.length > 0);
});

run('generateToken returns unique tokens', () => {
  const tokenA = generateToken();
  const tokenB = generateToken();
  assert.notStrictEqual(tokenA, tokenB);
});

run('getResetPasswordUrl builds an encoded reset URL', () => {
  const url = getResetPasswordUrl({ host: 'https://example.com', token: 'abc 123' });
  assert.strictEqual(url, 'https://example.com/reset-password?token=abc%20123');
});

run('getActivationUrl builds an encoded activation URL', () => {
  const url = getActivationUrl({ host: 'https://example.com', token: 'abc 123' });
  assert.strictEqual(url, 'https://example.com/api/activate?token=abc%20123');
});

run('buildResetPasswordEmailHtml includes username and link', () => {
  const html = buildResetPasswordEmailHtml({ username: 'Ali', resetUrl: 'https://example.com/reset' });
  assert.ok(html.includes('مرحباً Ali'));
  assert.ok(html.includes('https://example.com/reset'));
});

run('buildActivationEmailHtml includes username and link', () => {
  const html = buildActivationEmailHtml({ username: 'Sara', activationUrl: 'https://example.com/activate' });
  assert.ok(html.includes('مرحباً Sara'));
  assert.ok(html.includes('https://example.com/activate'));
});

run('attachOptionalUser adds user to req when token is valid', () => {
  const mockUser = { id: 1, role: 'normal' };
  const getUserFromToken = (token) => (token === 'valid' ? mockUser : null);
  const req = { headers: { authorization: 'Bearer valid' } };
  const res = {};
  const next = makeNext();
  const middleware = makeAttachOptionalUser(getUserFromToken);

  middleware(req, res, next);

  assert.strictEqual(req.user, mockUser);
  assert.ok(next.wasCalled());
});

run('attachOptionalUser sets user to null when no token', () => {
  const mockUser = { id: 1, role: 'normal' };
  const getUserFromToken = (token) => (token === 'valid' ? mockUser : null);
  const req = { headers: {} };
  const res = {};
  const next = makeNext();
  const middleware = makeAttachOptionalUser(getUserFromToken);

  middleware(req, res, next);

  assert.strictEqual(req.user, null);
  assert.ok(next.wasCalled());
});

run('requireAuth returns 401 when user is not authenticated', () => {
  const getUserFromToken = () => null;
  const req = { headers: {} };
  const res = makeResponse();
  const next = makeNext();
  const middleware = makeRequireAuth(getUserFromToken);

  middleware(req, res, next);

  assert.strictEqual(res.statusCode, 401);
  assert.deepStrictEqual(res.jsonBody, { error: 'غير مصرح بالدخول' });
  assert.ok(!next.wasCalled());
});

run('requireAuth calls next for authenticated user', () => {
  const mockUser = { id: 1, role: 'normal' };
  const getUserFromToken = (token) => (token === 'valid' ? mockUser : null);
  const req = { headers: { authorization: 'Bearer valid' } };
  const res = makeResponse();
  const next = makeNext();
  const middleware = makeRequireAuth(getUserFromToken);

  middleware(req, res, next);

  assert.strictEqual(req.user, mockUser);
  assert.ok(next.wasCalled());
});

run('requireAdmin returns 403 for non-admin user', () => {
  const mockUser = { id: 1, role: 'normal' };
  const getUserFromToken = (token) => (token === 'valid' ? mockUser : null);
  const req = { headers: { authorization: 'Bearer valid' } };
  const res = makeResponse();
  const next = makeNext();
  const middleware = makeRequireAdmin(getUserFromToken);

  middleware(req, res, next);

  assert.strictEqual(res.statusCode, 403);
  assert.deepStrictEqual(res.jsonBody, { error: 'صلاحية المدير مطلوبة' });
  assert.ok(!next.wasCalled());
});

run('requireAdmin calls next for admin user', () => {
  const adminUser = { id: 1, role: 'admin' };
  const getUserFromToken = (token) => (token === 'valid-admin' ? adminUser : null);
  const req = { headers: { authorization: 'Bearer valid-admin' } };
  const res = makeResponse();
  const next = makeNext();
  const middleware = makeRequireAdmin(getUserFromToken);

  middleware(req, res, next);

  assert.strictEqual(req.user, adminUser);
  assert.ok(next.wasCalled());
});
