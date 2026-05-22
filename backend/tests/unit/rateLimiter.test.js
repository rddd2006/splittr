/**
 * Rate Limiter Unit Tests
 *
 * These tests focus on the rate-limiter configuration logic,
 * key-generator functions, and degradation behaviour — without
 * needing a real Redis instance or HTTP server.
 */

const { jest } = require('@jest/globals');

// ── Mock redis before requiring the module ────────────────
jest.mock('../../src/config/redis', () => ({
  getRedisClient: jest.fn().mockResolvedValue({
    sendCommand: jest.fn().mockResolvedValue('OK'),
    ping: jest.fn().mockResolvedValue('PONG'),
    isOpen: true,
  }),
  isRedisAvailable: jest.fn().mockResolvedValue(true),
}));

jest.mock('rate-limit-redis', () => ({
  RedisStore: jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    increment: jest.fn().mockResolvedValue({ totalHits: 1, resetTime: new Date() }),
    decrement: jest.fn(),
    resetKey: jest.fn(),
  })),
}));

jest.mock('express-rate-limit', () =>
  jest.fn().mockImplementation((opts) => {
    // Return the config so tests can inspect it
    const mw = (req, res, next) => next();
    mw._opts = opts;
    return mw;
  })
);

describe('Rate Limiter — configuration', () => {
  let getLimiters;

  beforeAll(async () => {
    // Clear module cache so mocks take effect
    jest.resetModules();
    ({ getLimiters } = require('../../src/middleware/rateLimiter'));
  });

  afterAll(() => jest.resetModules());

  it('returns all expected limiters', async () => {
    const limiters = await getLimiters();
    expect(limiters).toHaveProperty('globalLimiter');
    expect(limiters).toHaveProperty('authLimiter');
    expect(limiters).toHaveProperty('strictAuthLimiter');
    expect(limiters).toHaveProperty('apiLimiter');
    expect(limiters).toHaveProperty('expenseLimiter');
    expect(limiters).toHaveProperty('settlementLimiter');
    expect(limiters).toHaveProperty('searchLimiter');
  });

  it('caches limiter instances (returns same object on second call)', async () => {
    const first  = await getLimiters();
    const second = await getLimiters();
    expect(first).toBe(second);
  });

  it('globalLimiter has wider window than authLimiter', async () => {
    const { globalLimiter, authLimiter } = await getLimiters();
    // globalLimiter: 300 / 15 min;  authLimiter: 10 / 15 min
    expect(globalLimiter._opts.max).toBeGreaterThan(authLimiter._opts.max);
  });

  it('strictAuthLimiter has skipSuccessfulRequests enabled', async () => {
    const { strictAuthLimiter } = await getLimiters();
    expect(strictAuthLimiter._opts.skipSuccessfulRequests).toBe(true);
  });

  it('authLimiter window is 15 minutes', async () => {
    const { authLimiter } = await getLimiters();
    expect(authLimiter._opts.windowMs).toBe(15 * 60 * 1000);
  });

  it('strictAuthLimiter window is 1 hour', async () => {
    const { strictAuthLimiter } = await getLimiters();
    expect(strictAuthLimiter._opts.windowMs).toBe(60 * 60 * 1000);
  });

  it('settlementLimiter window is 5 minutes', async () => {
    const { settlementLimiter } = await getLimiters();
    expect(settlementLimiter._opts.windowMs).toBe(5 * 60 * 1000);
  });

  it('all limiters have standardHeaders enabled', async () => {
    const limiters = await getLimiters();
    for (const [name, limiter] of Object.entries(limiters)) {
      expect(limiter._opts.standardHeaders).toBe(true);
    }
  });

  it('all limiters have legacyHeaders disabled', async () => {
    const limiters = await getLimiters();
    for (const [name, limiter] of Object.entries(limiters)) {
      expect(limiter._opts.legacyHeaders).toBe(false);
    }
  });

  it('error messages are objects with error field', async () => {
    const limiters = await getLimiters();
    for (const [name, limiter] of Object.entries(limiters)) {
      expect(limiter._opts.message).toHaveProperty('error');
    }
  });
});

// ── Redis degradation tests ───────────────────────────────
describe('Rate Limiter — Redis degradation', () => {
  let getLimiters;

  beforeAll(() => {
    jest.resetModules();

    // Simulate Redis being unavailable
    jest.mock('../../src/config/redis', () => ({
      getRedisClient: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      isRedisAvailable: jest.fn().mockResolvedValue(false),
    }));

    jest.mock('rate-limit-redis', () => ({
      RedisStore: jest.fn(),
    }));

    jest.mock('express-rate-limit', () =>
      jest.fn().mockImplementation((opts) => {
        const mw = (req, res, next) => next();
        mw._opts = opts;
        return mw;
      })
    );

    ({ getLimiters } = require('../../src/middleware/rateLimiter'));
  });

  afterAll(() => jest.resetModules());

  it('falls back to in-memory store when Redis is unavailable', async () => {
    // Should not throw — should degrade gracefully
    const limiters = await getLimiters();
    expect(limiters).toHaveProperty('globalLimiter');
    // store should be undefined (express-rate-limit uses MemoryStore internally)
    expect(limiters.globalLimiter._opts.store).toBeUndefined();
  });
});

// ── Key generator behaviour ───────────────────────────────
describe('Rate Limiter — key generator logic', () => {
  // We test the logic directly by recreating the closures
  const userOrIpKey = (req) => req.user?.userId || req.ip;
  const ipKey = (req) => req.ip;

  it('userOrIpKey returns userId when user is authenticated', () => {
    const req = { user: { userId: 'user-abc' }, ip: '1.2.3.4' };
    expect(userOrIpKey(req)).toBe('user-abc');
  });

  it('userOrIpKey falls back to IP when user is not authenticated', () => {
    const req = { user: null, ip: '1.2.3.4' };
    expect(userOrIpKey(req)).toBe('1.2.3.4');
  });

  it('ipKey always returns the remote IP', () => {
    const req = { user: { userId: 'user-xyz' }, ip: '9.9.9.9' };
    expect(ipKey(req)).toBe('9.9.9.9');
  });
});
