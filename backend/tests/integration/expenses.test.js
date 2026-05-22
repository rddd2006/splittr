const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/database');

let tokenA, tokenB, groupId, userAId, userBId;

beforeAll(async () => {
  await prisma.expenseSplit.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { contains: '@exptest.settleup' } } });

  const regA = await request(app).post('/api/auth/register').send({
    email: 'expa@exptest.settleup', name: 'Expense A', password: 'password123',
  });
  const regB = await request(app).post('/api/auth/register').send({
    email: 'expb@exptest.settleup', name: 'Expense B', password: 'password123',
  });

  tokenA = regA.body.accessToken;
  tokenB = regB.body.accessToken;
  userAId = regA.body.user.id;
  userBId = regB.body.user.id;

  const gRes = await request(app).post('/api/groups').set('Authorization', `Bearer ${tokenA}`)
    .send({ name: 'Expense Group' });
  groupId = gRes.body.id;

  await request(app).post(`/api/groups/${groupId}/members`)
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ email: 'expb@exptest.settleup' });
});

afterAll(async () => {
  await prisma.expenseSplit.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { contains: '@exptest.settleup' } } });
  await prisma.$disconnect();
});

describe('POST /api/groups/:id/expenses', () => {
  it('creates an equal-split expense', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/expenses`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Lunch', amount: 200, splitType: 'EQUAL' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Lunch');
    expect(parseFloat(res.body.amount)).toBe(200);
    expect(res.body.splits).toHaveLength(2);

    // Each split should be 100
    res.body.splits.forEach((s) => {
      expect(parseFloat(s.amount)).toBe(100);
    });
  });

  it('returns 403 if user is not a member', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      email: 'outsider@exptest.settleup', name: 'Outsider', password: 'password123',
    });
    const outsiderToken = reg.body.accessToken;

    const res = await request(app)
      .post(`/api/groups/${groupId}/expenses`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ title: 'Sneaky', amount: 100, splitType: 'EQUAL' });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/groups/:id/expenses', () => {
  it('returns paginated expenses', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/expenses?page=1&limit=10`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('expenses');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(Array.isArray(res.body.expenses)).toBe(true);
  });
});

describe('PUT /api/expenses/:id', () => {
  let expenseId;

  beforeAll(async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/expenses`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'To Edit', amount: 300, splitType: 'EQUAL' });
    expenseId = res.body.id;
  });

  it('allows payer to edit their expense', async () => {
    const res = await request(app)
      .put(`/api/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Edited Expense', amount: 300, splitType: 'EQUAL' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Edited Expense');
  });

  it('prevents non-payer from editing', async () => {
    const res = await request(app)
      .put(`/api/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hijacked', amount: 300, splitType: 'EQUAL' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/expenses/:id', () => {
  let expenseId;

  beforeAll(async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/expenses`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'To Delete', amount: 150, splitType: 'EQUAL' });
    expenseId = res.body.id;
  });

  it('allows payer to delete their expense', async () => {
    const res = await request(app)
      .delete(`/api/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
  });
});
