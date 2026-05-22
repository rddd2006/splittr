const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/database');

let userAToken, userBToken, userAId, userBId;

const registerAndLogin = async (email, name) => {
  const res = await request(app).post('/api/auth/register').send({ email, name, password: 'password123' });
  return { token: res.body.accessToken, userId: res.body.user.id };
};

beforeAll(async () => {
  await prisma.groupMember.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.group.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { contains: '@grouptest.settleup' } } });

  const a = await registerAndLogin('groupa@grouptest.settleup', 'Group User A');
  const b = await registerAndLogin('groupb@grouptest.settleup', 'Group User B');
  userAToken = a.token;
  userBToken = b.token;
  userAId = a.userId;
  userBId = b.userId;
});

afterAll(async () => {
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { contains: '@grouptest.settleup' } } });
  await prisma.$disconnect();
});

describe('POST /api/groups', () => {
  it('creates a group and adds creator as admin', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Trip to Manali', currency: 'INR' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Trip to Manali');
    expect(res.body.members).toHaveLength(1);
    expect(res.body.members[0].role).toBe('ADMIN');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/groups').send({ name: 'No Auth Group' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/groups', () => {
  it('returns only groups the user belongs to', async () => {
    const res = await request(app)
      .get('/api/groups')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((g) => {
      const memberIds = g.members.map((m) => m.user.id);
      expect(memberIds).toContain(userAId);
    });
  });
});

describe('Group members', () => {
  let groupId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Members Test Group' });
    groupId = res.body.id;
  });

  it('adds a member by email', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ email: 'groupb@grouptest.settleup' });

    expect(res.status).toBe(201);
    expect(res.body.user.id).toBe(userBId);
  });

  it('returns 409 when adding an existing member', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ email: 'groupb@grouptest.settleup' });

    expect(res.status).toBe(409);
  });

  it('removes a member', async () => {
    const res = await request(app)
      .delete(`/api/groups/${groupId}/members/${userBId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
  });
});

describe('GET /api/groups/:id/balances', () => {
  let groupId;

  beforeAll(async () => {
    const gRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Balance Test Group' });
    groupId = gRes.body.id;

    await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ email: 'groupb@grouptest.settleup' });
  });

  it('returns balances summing to zero', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/balances`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    const total = res.body.reduce((s, b) => s + b.balance, 0);
    expect(Math.abs(total)).toBeLessThan(0.01);
  });
});
