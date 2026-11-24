const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { app, uniqueEmail } = require('./helpers');

test('register: creates a user, a household, and starts a session', async () => {
  const agent = request.agent(app);
  const email = uniqueEmail('register');

  const res = await agent.post('/api/auth/register').send({ email, password: 'password123' });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.email, email);

  // Registering should log the user in immediately
  const me = await agent.get('/api/auth/me');
  assert.strictEqual(me.status, 200);
  assert.strictEqual(me.body.email, email);
});

test('register: rejects an invalid email', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'not-an-email', password: 'password123' });
  assert.strictEqual(res.status, 400);
});

test('register: rejects a password under 8 characters', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: uniqueEmail('shortpw'), password: 'short' });
  assert.strictEqual(res.status, 400);
});

test('register: rejects a second sign-up with the same email', async () => {
  const email = uniqueEmail('dup');
  await request(app).post('/api/auth/register').send({ email, password: 'password123' });

  const res = await request(app).post('/api/auth/register').send({ email, password: 'password123' });
  assert.strictEqual(res.status, 409);
});

test('login: succeeds with the right credentials and starts a session', async () => {
  const email = uniqueEmail('login');
  await request(app).post('/api/auth/register').send({ email, password: 'password123' });

  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password: 'password123' });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.email, email);

  const me = await agent.get('/api/auth/me');
  assert.strictEqual(me.status, 200);
  assert.strictEqual(me.body.email, email);
});

test('login: rejects a wrong password without revealing which field was wrong', async () => {
  const email = uniqueEmail('wrongpw');
  await request(app).post('/api/auth/register').send({ email, password: 'password123' });

  const res = await request(app).post('/api/auth/login').send({ email, password: 'wrongpassword' });
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error, 'Invalid email or password');
});

test('login: rejects an email that was never registered, with the same generic error', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: uniqueEmail('nobody'), password: 'password123' });
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error, 'Invalid email or password');
});

test('logout: clears the session so /me becomes unauthorized again', async () => {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send({ email: uniqueEmail('logout'), password: 'password123' });

  const logoutRes = await agent.post('/api/auth/logout');
  assert.strictEqual(logoutRes.status, 200);

  const me = await agent.get('/api/auth/me');
  assert.strictEqual(me.status, 401);
});

test('protected routes reject requests with no session at all', async () => {
  const res = await request(app).get('/api/paychecks');
  assert.strictEqual(res.status, 401);
});
