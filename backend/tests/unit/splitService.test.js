const {
  calculateEqualSplit,
  calculatePercentageSplit,
  validateExactSplit,
} = require('../../src/services/splitService');

describe('SplitService', () => {
  // ─── calculateEqualSplit ──────────────────────────────
  describe('calculateEqualSplit', () => {
    it('splits evenly among 3 people', () => {
      const result = calculateEqualSplit(90, ['u1', 'u2', 'u3']);
      expect(result).toHaveLength(3);
      result.forEach((r) => expect(r.amount).toBe(30));
    });

    it('handles remainder — distributes extra pennies correctly', () => {
      // 100 / 3 = 33.33... → two people get 33.34, one gets 33.33
      const result = calculateEqualSplit(100, ['u1', 'u2', 'u3']);
      const total = result.reduce((s, r) => s + r.amount, 0);
      expect(Math.abs(total - 100)).toBeLessThan(0.01);
      expect(result).toHaveLength(3);
    });

    it('splits between 2 people', () => {
      const result = calculateEqualSplit(50, ['u1', 'u2']);
      expect(result[0].amount).toBe(25);
      expect(result[1].amount).toBe(25);
    });

    it('splits with a single person (full amount)', () => {
      const result = calculateEqualSplit(200, ['u1']);
      expect(result[0].amount).toBe(200);
    });

    it('throws when no users provided', () => {
      expect(() => calculateEqualSplit(100, [])).toThrow('At least one user');
    });

    it('throws when amount is zero or negative', () => {
      expect(() => calculateEqualSplit(0, ['u1'])).toThrow('Amount must be positive');
      expect(() => calculateEqualSplit(-50, ['u1'])).toThrow('Amount must be positive');
    });

    it('preserves userId mapping', () => {
      const result = calculateEqualSplit(60, ['alice', 'bob']);
      const ids = result.map((r) => r.userId);
      expect(ids).toContain('alice');
      expect(ids).toContain('bob');
    });
  });

  // ─── calculatePercentageSplit ─────────────────────────
  describe('calculatePercentageSplit', () => {
    it('splits by percentage correctly', () => {
      const splits = [
        { userId: 'u1', percentage: 50 },
        { userId: 'u2', percentage: 30 },
        { userId: 'u3', percentage: 20 },
      ];
      const result = calculatePercentageSplit(100, splits);
      expect(result[0].amount).toBe(50);
      expect(result[1].amount).toBe(30);
      expect(result[2].amount).toBe(20);
    });

    it('throws when percentages do not sum to 100', () => {
      const splits = [
        { userId: 'u1', percentage: 40 },
        { userId: 'u2', percentage: 40 },
      ];
      expect(() => calculatePercentageSplit(100, splits)).toThrow('sum to 100');
    });

    it('throws when splits array is empty', () => {
      expect(() => calculatePercentageSplit(100, [])).toThrow('required');
    });

    it('attaches percentage to each result', () => {
      const splits = [
        { userId: 'u1', percentage: 70 },
        { userId: 'u2', percentage: 30 },
      ];
      const result = calculatePercentageSplit(200, splits);
      expect(result[0].percentage).toBe(70);
      expect(result[1].percentage).toBe(30);
    });
  });

  // ─── validateExactSplit ───────────────────────────────
  describe('validateExactSplit', () => {
    it('returns true when splits sum to the total', () => {
      const splits = [{ userId: 'u1', amount: 60 }, { userId: 'u2', amount: 40 }];
      expect(validateExactSplit(100, splits)).toBe(true);
    });

    it('returns false when splits do not sum to the total', () => {
      const splits = [{ userId: 'u1', amount: 60 }, { userId: 'u2', amount: 30 }];
      expect(validateExactSplit(100, splits)).toBe(false);
    });

    it('allows for tiny floating-point discrepancies', () => {
      const splits = [{ userId: 'u1', amount: 33.33 }, { userId: 'u2', amount: 66.67 }];
      expect(validateExactSplit(100, splits)).toBe(true);
    });
  });
});
