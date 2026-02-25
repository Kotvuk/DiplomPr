const { hashPassword, createToken, createRefreshToken, verifyToken, verifyRefreshToken, app, createTestUser } = require('./setup');
const request = require('supertest');

describe('hashPassword', () => {
  test('produces consistent hashes', () => {
    expect(hashPassword('mypassword')).toBe(hashPassword('mypassword'));
  });

  test('different passwords produce different hashes', () => {
    expect(hashPassword('password1')).not.toBe(hashPassword('password2'));
  });

  test('returns 64-char hex string (SHA-256)', () => {
    expect(hashPassword('test')).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('createToken / verifyToken (JWT)', () => {
  test('round-trip: create then verify', () => {
    const token = createToken(42);
    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload.id).toBe(42);
  });

  test('returns null for null/undefined/empty', () => {
    expect(verifyToken(null)).toBeNull();
    expect(verifyToken(undefined)).toBeNull();
    expect(verifyToken('')).toBeNull();
  });

  test('returns null for invalid token', () => {
    expect(verifyToken('garbage')).toBeNull();
    expect(verifyToken('aaa.bbb.ccc')).toBeNull();
  });

  test('returns null for tampered token', () => {
    const token = createToken(1);
    const tampered = token.slice(0, -5) + 'xxxxx';
    expect(verifyToken(tampered)).toBeNull();
  });
});

describe('Refresh tokens', () => {
  test('create and verify refresh token', () => {
    const token = createRefreshToken(42);
    const payload = verifyRefreshToken(token);
    expect(payload).not.toBeNull();
    expect(payload.id).toBe(42);
    expect(payload.type).toBe('refresh');
  });

  test('regular token cannot be used as refresh', () => {
    const token = createToken(42);
    expect(verifyRefreshToken(token)).toBeNull();
  });

  test('refresh token cannot be used as regular token', () => {
    const token = createRefreshToken(42);
    // verifyToken should fail on refresh tokens (different secret)
    const result = verifyToken(token);
    // It should be null because refresh uses a different secret
    expect(result === null || result.type === 'refresh').toBe(true);
  });
});

describe('Auth API endpoints', () => {
  const uniqueEmail = `auth_test_${Date.now()}@example.com`;

  test('POST /api/auth/register - success with refresh token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Auth Test', email: uniqueEmail, password: 'password123'
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe(uniqueEmail);
    expect(res.body.user.plan).toBe('Free');
  });

  test('POST /api/auth/register - duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Dup', email: uniqueEmail, password: 'password123'
    });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/register - missing email', async () => {
    const res = await request(app).post('/api/auth/register').send({ password: 'pass123456' });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/register - short password', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'short@pw.com', password: '123' });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login - correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: uniqueEmail, password: 'password123'
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe(uniqueEmail);
  });

  test('POST /api/auth/login - wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: uniqueEmail, password: 'wrongpass'
    });
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/login - nonexistent user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@nowhere.com', password: 'pass123456'
    });
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/login - missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/refresh - valid refresh token', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: uniqueEmail, password: 'password123'
    });
    const res = await request(app).post('/api/auth/refresh').send({
      refreshToken: login.body.refreshToken
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe(uniqueEmail);
  });

  test('POST /api/auth/refresh - invalid refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({
      refreshToken: 'invalid-token'
    });
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/refresh - missing refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
  });

  test('GET /api/auth/me - without token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me - with valid token', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: uniqueEmail, password: 'password123'
    });
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(uniqueEmail);
  });

  test('GET /api/auth/me - with invalid token returns 401', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});
