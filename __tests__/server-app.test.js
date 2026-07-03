const assert = require('assert');
const http = require('http');
const { app, setMailTransporter } = require('../server');

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

const fetchRootHtml = (port) => {
  return new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port, path: '/', timeout: 5000 }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    }).on('error', reject);
  });
};

const fetchJson = (port, path) => {
  return new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port, path, timeout: 5000 }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
};

const fetchJsonWithToken = (port, path, token) => {
  return new Promise((resolve, reject) => {
    const options = { hostname: '127.0.0.1', port, path, timeout: 5000, headers: {} };
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }
    http.get(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
};

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

(async () => {
  const server = http.createServer(app);

  await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  const port = server.address().port;

  await run('GET / returns 200 and HTML content', async () => {
    const result = await fetchRootHtml(port);
    assert.strictEqual(result.statusCode, 200);
    assert.ok(result.body.includes('<html') || result.body.includes('<!DOCTYPE html>'));
  });

  await run('GET /api/events returns JSON array of events', async () => {
    const result = await fetchJson(port, '/api/events');
    assert.strictEqual(result.statusCode, 200);
    assert.ok(Array.isArray(result.body));
    assert.ok(result.body.length > 0, 'Expected at least one event');
    assert.ok(result.body[0].title || result.body[0].name, 'Expected event object to include a title');
  });

  await run('GET /api/events/:id returns valid event details', async () => {
    const eventsResult = await fetchJson(port, '/api/events');
    const event = eventsResult.body[0];
    const detailResult = await fetchJson(port, `/api/events/${event.id}`);
    assert.strictEqual(detailResult.statusCode, 200);
    assert.strictEqual(detailResult.body.id, event.id);
    assert.strictEqual(detailResult.body.title, event.title);
    assert.ok(Array.isArray(detailResult.body.media), 'Expected event details to include media array');
  });

  await run('POST /api/logout without auth returns 401', async () => {
    const result = await postJson(port, '/api/logout');
    assert.strictEqual(result.statusCode, 401);
    assert.deepStrictEqual(result.body, { error: 'غير مصرح بالدخول' });
  });

  await run('POST /api/logout with valid session token logs out successfully', async () => {
    const { sessions } = require('../server');
    const token = 'test-valid-logout-token';
    sessions.set(token, { id: -1, role: 'normal' });

    const result = await postJson(port, '/api/logout', token);
    assert.strictEqual(result.statusCode, 200);
    assert.deepStrictEqual(result.body, { logout: true });
    assert.strictEqual(sessions.get(token), undefined);
  });

  await run('POST /api/login returns token for hardcoded admin', async () => {
    const result = await postJson(port, '/api/login', null, {
      username: 'admin',
      password: 'admin123'
    });
    assert.strictEqual(result.statusCode, 200);
    assert.ok(result.body.token, 'Expected login response to include a token');
    assert.strictEqual(result.body.username, 'admin');
    assert.strictEqual(result.body.role, 'admin');
  });

  await run('POST /api/register returns 201 and creates a new account', async () => {
    setMailTransporter({ sendMail: async () => ({}) });
    const randomValue = Date.now();
    const result = await postJson(port, '/api/register', null, {
      username: `testuser_${randomValue}`,
      password: 'password123',
      email: `test${randomValue}@example.com`
    });
    assert.strictEqual(result.statusCode, 201);
    assert.strictEqual(result.body.message, 'تم إنشاء الحساب بنجاح. تحقق من بريدك الإلكتروني لتفعيل الحساب.');
  });

  await run('GET /api/events includes average rating data for events', async () => {
    const loginResult = await postJson(port, '/api/login', null, {
      username: 'admin',
      password: 'admin123'
    });
    assert.strictEqual(loginResult.statusCode, 200);
    const token = loginResult.body.token;

    const eventsResult = await fetchJson(port, '/api/events');
    const event = eventsResult.body[0];

    const rsvpResult = await postJson(port, `/api/events/${event.id}/rsvp`, token, { status: 'attending' });
    assert.strictEqual(rsvpResult.statusCode, 200);

    const commentResult = await postJson(port, `/api/events/${event.id}/comments`, token, {
      content: 'اختبار تقييم متوسط',
      rating: 5
    });
    assert.strictEqual(commentResult.statusCode, 201);

    const updatedEventsResult = await fetchJson(port, '/api/events');
    const updatedEvent = updatedEventsResult.body.find((entry) => entry.id === event.id);
    assert.ok(updatedEvent, 'Expected event to be present in the updated list');
    assert.ok(updatedEvent.ratingCount >= 1, 'Expected the event to report at least one rating');
    assert.ok(updatedEvent.averageRating >= 0, 'Expected the event to report an average rating value');
  });

  await run('POST /api/events creates a notification for users', async () => {
    const loginResult = await postJson(port, '/api/login', null, {
      username: 'admin',
      password: 'admin123'
    });
    assert.strictEqual(loginResult.statusCode, 200);
    const token = loginResult.body.token;

    const createEventResult = await postJson(port, '/api/events', token, {
      title: `اختبار فعالية إشعارات ${Date.now()}`,
      description: 'فعالية لاختبار الإشعارات',
      location: 'مركز درعا',
      latitude: 32.6,
      longitude: 36.1,
      date: '2030-07-20',
      category: 'ثقافي',
      district: 'الحي الغربي',
      budgetCents: 5000,
      isHybrid: true,
      streamUrl: 'https://example.com/live',
      virtualPriceCents: 1500
    });
    assert.strictEqual(createEventResult.statusCode, 201);
    assert.ok(createEventResult.body.id);

    const notificationsResult = await fetchJsonWithToken(port, '/api/notifications', token);
    assert.strictEqual(notificationsResult.statusCode, 200);
    assert.ok(Array.isArray(notificationsResult.body));
    assert.ok(notificationsResult.body.some((notification) => notification.title.includes('فعالية جديدة') || notification.body.includes(createEventResult.body.title)));
  });

  server.close();
})();
