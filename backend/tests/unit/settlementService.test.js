const { calculateBalances, minimizeTransactions } = require('../../src/services/settlementService');

// ── Helpers ───────────────────────────────────────────────
const makeGroup = ({ expenses = [], settlements = [], memberIds = [] } = {}) => ({
  members: memberIds.map((id) => ({ user: { id, name: `User-${id}` } })),
  expenses,
  settlements,
});

const member = (id) => ({ user: { id, name: `User-${id}` } });
const split = (userId, amount) => ({ userId, amount });
const expense = (paidById, amount, splits) => ({ paidById, amount, splits });
const settlement = (fromUserId, toUserId, amount) => ({ fromUserId, toUserId, amount });

// ── calculateBalances ─────────────────────────────────────
describe('calculateBalances', () => {
  it('returns zero balances when no expenses', () => {
    const group = { members: [member('a'), member('b')], expenses: [], settlements: [] };
    const balances = calculateBalances(group);
    expect(balances.find((b) => b.userId === 'a').balance).toBe(0);
    expect(balances.find((b) => b.userId === 'b').balance).toBe(0);
  });

  it('credits payer and debits split members', () => {
    const group = {
      members: [member('a'), member('b')],
      expenses: [expense('a', 100, [split('a', 50), split('b', 50)])],
      settlements: [],
    };
    const balances = calculateBalances(group);
    // a paid 100, owes 50 → net +50
    expect(balances.find((b) => b.userId === 'a').balance).toBe(50);
    // b owes 50, paid 0 → net -50
    expect(balances.find((b) => b.userId === 'b').balance).toBe(-50);
  });

  it('handles multiple expenses', () => {
    const group = {
      members: [member('a'), member('b'), member('c')],
      expenses: [
        expense('a', 90, [split('a', 30), split('b', 30), split('c', 30)]),
        expense('b', 60, [split('a', 20), split('b', 20), split('c', 20)]),
      ],
      settlements: [],
    };
    const balances = calculateBalances(group);
    const sum = balances.reduce((s, b) => s + b.balance, 0);
    expect(Math.abs(sum)).toBeLessThan(0.01); // balances must sum to 0
  });

  it('applies settlements correctly', () => {
    const group = {
      members: [member('a'), member('b')],
      expenses: [expense('a', 100, [split('a', 50), split('b', 50)])],
      settlements: [settlement('b', 'a', 50)],
    };
    const balances = calculateBalances(group);
    expect(balances.find((b) => b.userId === 'a').balance).toBe(0);
    expect(balances.find((b) => b.userId === 'b').balance).toBe(0);
  });
});

// ── minimizeTransactions ─────────────────────────────────
describe('minimizeTransactions', () => {
  it('returns empty array when all balances are zero', () => {
    const balances = [
      { userId: 'a', name: 'A', balance: 0 },
      { userId: 'b', name: 'B', balance: 0 },
    ];
    expect(minimizeTransactions(balances)).toHaveLength(0);
  });

  it('generates one transaction for a simple two-person debt', () => {
    const balances = [
      { userId: 'a', name: 'A', balance: 50 },
      { userId: 'b', name: 'B', balance: -50 },
    ];
    const txns = minimizeTransactions(balances);
    expect(txns).toHaveLength(1);
    expect(txns[0].from.userId).toBe('b');
    expect(txns[0].to.userId).toBe('a');
    expect(txns[0].amount).toBe(50);
  });

  it('minimizes transactions for 3-person scenario', () => {
    // A paid, B and C owe
    const balances = [
      { userId: 'a', name: 'A', balance: 60 },  // owed 60
      { userId: 'b', name: 'B', balance: -30 }, // owes 30
      { userId: 'c', name: 'C', balance: -30 }, // owes 30
    ];
    const txns = minimizeTransactions(balances);
    expect(txns).toHaveLength(2);
    const totalTransferred = txns.reduce((s, t) => s + t.amount, 0);
    expect(Math.abs(totalTransferred - 60)).toBeLessThan(0.01);
  });

  it('does not mutate input balances', () => {
    const balances = [
      { userId: 'a', name: 'A', balance: 100 },
      { userId: 'b', name: 'B', balance: -100 },
    ];
    const original = JSON.stringify(balances);
    minimizeTransactions(balances);
    expect(JSON.stringify(balances)).toBe(original);
  });

  it('handles balances that sum to zero', () => {
    const balances = [
      { userId: 'a', name: 'A', balance: 50 },
      { userId: 'b', name: 'B', balance: -20 },
      { userId: 'c', name: 'C', balance: -30 },
    ];
    const txns = minimizeTransactions(balances);
    // Verify total paid = total owed
    const totalAmount = txns.reduce((s, t) => s + t.amount, 0);
    expect(Math.abs(totalAmount - 50)).toBeLessThan(0.01);
  });
});
