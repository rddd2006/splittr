/**
 * Auth API Integration Tests
 * Requires a running PostgreSQL test database.
 * Set DATABASE_URL to a test DB before running.
 */
const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/database');

beforeAll(async () => {
  // Clean test data
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { contains: '@test.settleup' } } });
});

afterAll(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { contains: '@test.settleup' } } });
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  it('registers a new user and returns tokens', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'newuser@test.settleup',
      name: 'New User',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'newuser@test.settleup', name: 'New User' });
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns 409 when email is already registered', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'duplicate@test.settleup',
      name: 'First',
      password: 'password123',
    });

    const res = await request(app).post('/api/auth/register').send({
      email: 'duplicate@test.settleup',
      name: 'Second',
      password: 'password123',
    });

    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      name: 'Test',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'valid@test.settleup',
      name: 'Test',
      password: '123',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request(app).post('/api/auth/register').send({
      email: 'loginuser@test.settleup',
      name: 'Login User',
      password: 'password123',
    });
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'loginuser@test.settleup',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe('loginuser@test.settleup');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'loginuser@test.settleup',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'unknown@test.settleup',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  let accessToken;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'meuser@test.settleup',
      name: 'Me User',
      password: 'password123',
    });
    accessToken = res.body.accessToken;
  });

  it('returns current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('meuser@test.settleup');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });
});
